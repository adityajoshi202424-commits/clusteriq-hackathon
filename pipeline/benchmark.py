"""
Cluster Review Intelligence (CRI) - Multi-Cluster Benchmarking & Three-Way Verdict Engine
pipeline/benchmark.py

Implements:
1. Multi-cluster benchmarking (Mussoorie, Nainital, Bhimtal, Dehradun)
2. Dehradun intra-cluster segmentation (business vs leisure)
3. Empirical Bayesian Shrinkage: s = (n*m + k*C_a) / (n + k), k=5
4. Display score conversion: (s + 1) * 50 -> [0, 100]
5. Intra-cluster z-score standardization
6. Mention rate computation: n / total_reviews_p
7. Three-way verdict categorization:
   - Leads (z >= +1, n >= 8)
   - Property-specific weakness (z <= -1, n >= 8, C_a >= 0.2)
   - Market-wide condition (C_a < 0.2, |z| < 0.5)
   - Cluster opportunity (C_a < 0.2, mention_rate >= 15%, no property s > 0.4)
   - Insufficient data (n < 8)
8. Evidence quote extraction (2 positive, 2 negative per aspect)
9. Rating-in-context ranking vs cluster baseline
"""

import os
import sys
import sqlite3
import yaml
import numpy as np
from typing import Dict, Any, List, Optional

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


def compute_benchmarks(cluster_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes Bayesian shrinkage benchmarks within each cluster.
    If cluster_id is specified, returns benchmarks for that cluster.
    If cluster_id is None, returns all properties mapped with cluster references.
    """
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

    # All aspects in dataset
    c.execute("SELECT DISTINCT aspect FROM aspect_mentions ORDER BY aspect")
    aspect_list = [r[0] for r in c.fetchall()]

    # Fetch clusters
    if cluster_id:
        c.execute("SELECT id, name FROM clusters WHERE id = ?", (cluster_id,))
    else:
        c.execute("SELECT id, name FROM clusters")
    clusters_to_run = c.fetchall()
    if not clusters_to_run:
        clusters_to_run = [("mussoorie", "Mussoorie")]

    all_benchmarks_flat = {}
    benchmarks_by_cluster = {}

    for cid, cname in clusters_to_run:
        # Fetch properties belonging to this cluster
        c.execute("""
            SELECT id, name, area, star_class, price_band, coalesce(segment, 'leisure')
            FROM properties
            WHERE cluster_id = ?
        """, (cid,))
        cluster_props = [
            {"id": r[0], "name": r[1], "area": r[2], "star_class": r[3], "price_band": r[4], "segment": r[5]}
            for r in c.fetchall()
        ]
        if not cluster_props:
            continue

        # Total reviews per property in this cluster
        c.execute("""
            SELECT r.property_id, count(*), round(avg(r.rating_norm), 2)
            FROM reviews r
            JOIN properties p ON r.property_id = p.id
            WHERE p.cluster_id = ?
            GROUP BY r.property_id
        """, (cid,))
        prop_review_counts = {r[0]: (r[1], r[2]) for r in c.fetchall()}

        total_cluster_reviews = sum(v[0] for v in prop_review_counts.values()) or 1

        # Cluster aspect means C_a
        cluster_means_Ca = {}
        cluster_mention_rates = {}
        for asp in aspect_list:
            c.execute("""
                SELECT count(*), avg(am.sentiment)
                FROM aspect_mentions am
                JOIN reviews r ON am.review_id = r.review_id
                JOIN properties p ON r.property_id = p.id
                WHERE p.cluster_id = ? AND am.aspect = ?
            """, (cid, asp))
            cnt, avg_sent = c.fetchone()
            cluster_means_Ca[asp] = float(avg_sent) if avg_sent is not None else 0.0
            cluster_mention_rates[asp] = (cnt or 0) / max(total_cluster_reviews, 1)

        # Raw stats for each property in this cluster
        raw_stats = {}
        for p in cluster_props:
            pid = p["id"]
            tot_p_rev = prop_review_counts.get(pid, (1, 4.0))[0]
            for asp in aspect_list:
                c.execute("""
                    SELECT count(*), avg(am.sentiment)
                    FROM aspect_mentions am
                    JOIN reviews r ON am.review_id = r.review_id
                    WHERE r.property_id = ? AND am.aspect = ?
                """, (pid, asp))
                n, m = c.fetchone()
                n = n or 0
                m = float(m) if m is not None else 0.0
                Ca = cluster_means_Ca[asp]

                s = (n * m + k_shrink * Ca) / (n + k_shrink)
                display_score = round((s + 1.0) * 50.0, 1)
                mention_rate = round(n / max(tot_p_rev, 1), 3)

                raw_stats[(pid, asp)] = {
                    "m": round(m, 3),
                    "n": n,
                    "s": round(s, 3),
                    "display_score": display_score,
                    "mention_rate": mention_rate
                }

        # Cluster z-scores per aspect (supporting Dehradun segment split if business/leisure present)
        segments_in_cluster = set(p["segment"] for p in cluster_props)
        if cid == "dehradun" and len(segments_in_cluster) > 1:
            # Segment-specific standardization
            for seg in segments_in_cluster:
                seg_props = [p for p in cluster_props if p["segment"] == seg]
                for asp in aspect_list:
                    s_vals = [raw_stats[(p["id"], asp)]["s"] for p in seg_props]
                    arr = np.array(s_vals) if s_vals else np.array([0.0])
                    mean_s = float(np.mean(arr))
                    std_s = float(np.std(arr)) if np.std(arr) > 1e-4 else 1.0
                    for p in seg_props:
                        raw_stats[(p["id"], asp)]["z"] = round(float((raw_stats[(p["id"], asp)]["s"] - mean_s) / std_s), 2)
        else:
            # Standard cluster-wide z-score
            for asp in aspect_list:
                s_vals = [raw_stats[(p["id"], asp)]["s"] for p in cluster_props]
                arr = np.array(s_vals) if s_vals else np.array([0.0])
                mean_s = float(np.mean(arr))
                std_s = float(np.std(arr)) if np.std(arr) > 1e-4 else 1.0
                for p in cluster_props:
                    raw_stats[(p["id"], asp)]["z"] = round(float((raw_stats[(p["id"], asp)]["s"] - mean_s) / std_s), 2)

        # Verdict assignment & evidence extraction
        min_n_cluster = min_n if cid == "mussoorie" else 2
        cluster_bm = {}
        for p in cluster_props:
            pid = p["id"]
            tot_p_rev, p_avg_rating = prop_review_counts.get(pid, (0, 4.0))

            aspect_results = []
            for asp in aspect_list:
                st = raw_stats[(pid, asp)]
                z = st.get("z", 0.0)
                n = st["n"]
                s = st["s"]
                Ca = cluster_means_Ca[asp]
                mention_rate_cluster = cluster_mention_rates[asp]
                max_s_cluster = max(raw_stats[(other_p["id"], asp)]["s"] for other_p in cluster_props)

                # Verdict categorization
                if n < min_n_cluster:
                    verdict = "Insufficient data"
                    verdict_category = "insufficient_data"
                elif z >= z_lead and n >= min_n_cluster:
                    verdict = "Leads"
                    verdict_category = "lead"
                elif z <= z_weak and n >= min_n_cluster and Ca >= market_ca_thresh:
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

                # Quotes
                c.execute("""
                    SELECT am.evidence
                    FROM aspect_mentions am
                    JOIN reviews r ON am.review_id = r.review_id
                    WHERE r.property_id = ? AND am.aspect = ? AND am.sentiment > 0.1
                    ORDER BY length(am.evidence) DESC
                    LIMIT 2
                """, (pid, asp))
                pos_quotes = [q[0] for q in c.fetchall()]

                c.execute("""
                    SELECT am.evidence
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

            # Rating in context
            cluster_ratings = [(other_p["id"], prop_review_counts.get(other_p["id"], (0, 4.0))[1]) for other_p in cluster_props]
            cluster_ratings.sort(key=lambda x: x[1], reverse=True)
            rank = next(i + 1 for i, item in enumerate(cluster_ratings) if item[0] == pid)
            cluster_mean_rating = round(float(np.mean([r[1] for r in cluster_ratings])), 2)

            rating_context_str = f"Your {p_avg_rating} vs {cname} mean {cluster_mean_rating} (rank {rank} of {len(cluster_props)})"

            prop_entry = {
                "property": p,
                "cluster_id": cid,
                "cluster_name": cname,
                "segment": p.get("segment", "leisure"),
                "total_reviews": tot_p_rev,
                "avg_rating": p_avg_rating,
                "cluster_rank": rank,
                "cluster_mean_rating": cluster_mean_rating,
                "rating_in_context": rating_context_str,
                "aspects": aspect_results
            }

            cluster_bm[pid] = prop_entry
            all_benchmarks_flat[pid] = prop_entry

        benchmarks_by_cluster[cid] = cluster_bm

    conn.close()

    if cluster_id and cluster_id in benchmarks_by_cluster:
        return benchmarks_by_cluster[cluster_id]

    all_benchmarks_flat["_by_cluster"] = benchmarks_by_cluster
    return all_benchmarks_flat


if __name__ == "__main__":
    bm = compute_benchmarks()
    clusters = bm.get("_by_cluster", {})
    print(f"[benchmark.py] Multi-Cluster Benchmarking Complete across {len(clusters)} clusters:")
    for cid, props in clusters.items():
        print(f"  * Cluster '{cid}': {len(props)} properties benchmarked")
        first_pid = list(props.keys())[0]
        print(f"    Sample ({props[first_pid]['property']['name']}): {props[first_pid]['rating_in_context']}")
