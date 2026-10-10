"""
Cluster Review Intelligence (CRI) - Benchmarking & Three-Way Verdict Engine
pipeline/benchmark.py

Implements:
1. Empirical Bayesian Shrinkage: s = (n*m + k*C_a) / (n + k), k=5
2. Display score conversion: (s + 1) * 50 -> [0, 100]
3. Cross-cluster z-score standardization
4. Mention rate computation: n / total_reviews_p
5. Three-way verdict categorization:
   - Leads (z >= +1, n >= 8)
   - Property-specific weakness (z <= -1, n >= 8, C_a >= 0.2)
   - Market-wide condition (C_a < 0.2, |z| < 0.5)
   - Cluster opportunity (C_a < 0.2, mention_rate >= 15%, no property s > 0.4)
   - Insufficient data (n < 8)
6. Evidence quote extraction (2 positive, 2 negative per aspect)
7. Rating-in-context ranking vs cluster baseline
"""

import os
import sys
import sqlite3
import yaml
import numpy as np
from typing import Dict, Any, List

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DB_PATH = os.path.join(PROJECT_ROOT, "data", "reviews.db")
THRESHOLDS_PATH = os.path.join(PROJECT_ROOT, "config", "thresholds.yaml")
CLUSTER_YAML_PATH = os.path.join(PROJECT_ROOT, "config", "cluster.yaml")


def load_thresholds() -> Dict[str, Any]:
    if os.path.exists(THRESHOLDS_PATH):
        with open(THRESHOLDS_PATH, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
            return cfg.get("benchmark", {})
    return {
        "shrinkage_k": 5,
        "min_mentions_for_verdict": 8,
        "lead_z_threshold": 1.0,
        "weakness_z_threshold": -1.0,
        "market_wide_cluster_mean_threshold": 0.2,
        "cluster_opportunity_mention_rate": 0.15,
        "cluster_opportunity_max_score": 0.4
    }


def compute_benchmarks():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    thresholds = load_thresholds()
    k_shrink = thresholds.get("shrinkage_k", 5)
    min_n = thresholds.get("min_mentions_for_verdict", 8)
    z_lead = thresholds.get("lead_z_threshold", 1.0)
    z_weak = thresholds.get("weakness_z_threshold", -1.0)
    market_ca_thresh = thresholds.get("market_wide_cluster_mean_threshold", 0.2)
    opp_mention_thresh = thresholds.get("cluster_opportunity_mention_rate", 0.15)
    opp_max_score = thresholds.get("cluster_opportunity_max_score", 0.4)

    # 1. Fetch properties
    c.execute("SELECT id, name, area, star_class, price_band FROM properties")
    properties = [
        {"id": r[0], "name": r[1], "area": r[2], "star_class": r[3], "price_band": r[4]}
        for r in c.fetchall()
    ]

    # Total reviews per property
    c.execute("SELECT property_id, count(*), round(avg(rating_norm), 2) FROM reviews GROUP BY property_id")
    prop_review_counts = {r[0]: (r[1], r[2]) for r in c.fetchall()}

    # All aspects in dataset
    c.execute("SELECT DISTINCT aspect FROM aspect_mentions ORDER BY aspect")
    aspect_list = [r[0] for r in c.fetchall()]

    # 2. Cluster mean sentiment C_a and cluster mention rate across all properties
    total_cluster_reviews = sum(v[0] for v in prop_review_counts.values()) or 1
    cluster_means_Ca = {}
    cluster_mention_rates = {}

    for asp in aspect_list:
        c.execute("SELECT count(*), avg(sentiment) FROM aspect_mentions WHERE aspect = ?", (asp,))
        cnt, avg_sent = c.fetchone()
        cluster_means_Ca[asp] = float(avg_sent) if avg_sent is not None else 0.0
        cluster_mention_rates[asp] = cnt / total_cluster_reviews

    # 3. For each property and aspect, calculate raw mean m, count n, shrunk s
    raw_stats = {}  # (prop_id, aspect) -> {m, n, s, display_score, mention_rate}
    for p in properties:
        pid = p["id"]
        total_p_reviews = prop_review_counts.get(pid, (1, 4.0))[0]
        for asp in aspect_list:
            c.execute("""
                SELECT count(*), avg(sentiment)
                FROM aspect_mentions am
                JOIN reviews r ON am.review_id = r.review_id
                WHERE r.property_id = ? AND am.aspect = ?
            """, (pid, asp))
            n, m = c.fetchone()
            n = n or 0
            m = float(m) if m is not None else 0.0
            Ca = cluster_means_Ca[asp]

            # Bayesian shrinkage formula
            s = (n * m + k_shrink * Ca) / (n + k_shrink)
            display_score = round((s + 1.0) * 50.0, 1)
            mention_rate = round(n / max(total_p_reviews, 1), 3)

            raw_stats[(pid, asp)] = {
                "m": round(m, 3),
                "n": n,
                "s": round(s, 3),
                "display_score": display_score,
                "mention_rate": mention_rate
            }

    # 4. Compute cluster z-score per aspect across all properties
    aspect_z_stats = {}
    for asp in aspect_list:
        s_vals = [raw_stats[(p["id"], asp)]["s"] for p in properties]
        arr = np.array(s_vals)
        mean_s = float(np.mean(arr))
        std_s = float(np.std(arr)) if np.std(arr) > 1e-4 else 1.0
        aspect_z_stats[asp] = (mean_s, std_s)

    for (pid, asp), st in raw_stats.items():
        mean_s, std_s = aspect_z_stats[asp]
        st["z"] = round(float((st["s"] - mean_s) / std_s), 2)

    # 5. Determine Three-Way Verdicts & Quotes
    benchmarks_by_property = {}

    for p in properties:
        pid = p["id"]
        p_name = p["name"]
        total_p_reviews, p_avg_rating = prop_review_counts.get(pid, (0, 4.0))

        aspect_results = []
        for asp in aspect_list:
            st = raw_stats[(pid, asp)]
            z = st["z"]
            n = st["n"]
            s = st["s"]
            Ca = cluster_means_Ca[asp]
            mention_rate_cluster = cluster_mention_rates[asp]

            # Highest score across any property for this aspect
            max_s_cluster = max(raw_stats[(other_p["id"], asp)]["s"] for other_p in properties)

            # Verdict evaluation
            if n < min_n:
                verdict = "Insufficient data"
                verdict_category = "insufficient_data"
            elif z >= z_lead and n >= min_n:
                verdict = "Leads"
                verdict_category = "lead"
            elif z <= z_weak and n >= min_n and Ca >= market_ca_thresh:
                verdict = "Property-specific weakness"
                verdict_category = "weakness"
            elif Ca < market_ca_thresh and mention_rate_cluster >= opp_mention_thresh and max_s_cluster <= opp_max_score:
                verdict = "Cluster opportunity"
                verdict_category = "cluster_opportunity"
            elif Ca < market_ca_thresh and abs(z) < 0.5:
                verdict = "Market-wide condition"
                verdict_category = "market_wide"
            else:
                verdict = "On par with cluster"
                verdict_category = "neutral"

            # Top Quotes: 2 positive, 2 negative from verified evidence spans
            c.execute("""
                SELECT am.evidence, am.sentiment
                FROM aspect_mentions am
                JOIN reviews r ON am.review_id = r.review_id
                WHERE r.property_id = ? AND am.aspect = ? AND am.sentiment > 0.1
                ORDER BY length(am.evidence) DESC
                LIMIT 2
            """, (pid, asp))
            pos_quotes = [q[0] for q in c.fetchall()]

            c.execute("""
                SELECT am.evidence, am.sentiment
                FROM aspect_mentions am
                JOIN reviews r ON am.review_id = r.review_id
                WHERE r.property_id = ? AND am.aspect = ? AND am.sentiment < -0.1
                ORDER BY length(am.evidence) DESC
                LIMIT 2
            """, (pid, asp))
            neg_quotes = [q[0] for q in c.fetchall()]

            aspect_results.append({
                "aspect": asp,
                "score": st["display_score"],
                "shrunk_sentiment": st["s"],
                "z": z,
                "n": n,
                "mention_rate": st["mention_rate"],
                "verdict": verdict,
                "verdict_category": verdict_category,
                "top_quotes": {
                    "positive": pos_quotes,
                    "negative": neg_quotes
                }
            })

        # Rating-in-context calculation: rank of property among all cluster properties
        cluster_ratings = [(other_p["id"], prop_review_counts.get(other_p["id"], (0, 4.0))[1]) for other_p in properties]
        cluster_ratings.sort(key=lambda x: x[1], reverse=True)
        rank = next(i + 1 for i, item in enumerate(cluster_ratings) if item[0] == pid)
        cluster_mean_rating = round(float(np.mean([r[1] for r in cluster_ratings])), 2)

        rating_context_str = f"Your {p_avg_rating} vs cluster mean {cluster_mean_rating} (rank {rank} of {len(properties)})"

        benchmarks_by_property[pid] = {
            "property": p,
            "total_reviews": total_p_reviews,
            "avg_rating": p_avg_rating,
            "cluster_rank": rank,
            "cluster_mean_rating": cluster_mean_rating,
            "rating_in_context": rating_context_str,
            "aspects": aspect_results
        }

    conn.close()
    print(f"[benchmark.py] Computed Bayesian shrinkage benchmarks across {len(properties)} properties and {len(aspect_list)} aspects.")
    return benchmarks_by_property


if __name__ == "__main__":
    bm = compute_benchmarks()
    sample_pid = list(bm.keys())[0]
    sample = bm[sample_pid]
    print(f"\nSample Benchmark for {sample['property']['name']}:")
    print(f"Rating in Context: {sample['rating_in_context']}")
    for a in sample["aspects"]:
        print(f"  - {a['aspect']:<12}: Score={a['score']}, z={a['z']:>5}, n={a['n']:>2}, Verdict: '{a['verdict']}'")
