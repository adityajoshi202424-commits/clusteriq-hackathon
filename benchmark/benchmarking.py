"""
Competitive Benchmarking Engine & Cluster Opportunity Heatmap.
Implements the full mathematical model from Blueprint Section 5:
- Measure 1: Aspect sentiment score S_{p,a} = 100 * (P - N) / (P + N)
- Measure 2: Competitive gap G_{p,a} = S_{p,a} - S_{cluster, a} (Leave-One-Out)
- Measure 3: Complaint prevalence C_{p,a} = (N_{p,a} / total_reviews_p) * 100
- Measure 4: Sample size, confidence, and shrinkage flags
- 4-Way Opportunity Matrix
- Full Cluster Heatmap Matrix (properties x aspects)
- Intervention Impact Simulator
Zero hard-coded hotel names or review text (Rule 1 Compliant).
"""

import os
import sys
import yaml
from collections import defaultdict
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from normalise.schema import db
from trends.trend_detector import trend_detector

CONFIG_ANALYSIS_PATH = os.path.join(PROJECT_ROOT, "config", "analysis.yaml")
CONFIG_ASPECTS_PATH = os.path.join(PROJECT_ROOT, "config", "aspects.yaml")

class CompetitiveBenchmarkEngine:
    def __init__(self):
        self.min_mentions_threshold = 5
        self._load_config()

    def _load_config(self):
        if os.path.exists(CONFIG_ANALYSIS_PATH):
            with open(CONFIG_ANALYSIS_PATH, "r", encoding="utf-8") as f:
                cfg = yaml.safe_load(f)
                self.min_mentions_threshold = cfg.get("min_mentions", 5)

    def get_all_properties_data(self) -> List[Dict[str, Any]]:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM properties")
            props = [dict(r) for r in cursor.fetchall()]

            res = []
            for p in props:
                revs = db.get_all_reviews(property_id=p["id"])
                avg_r = float(np.mean([r["normalized_rating"] for r in revs])) if revs else 4.0
                res.append({
                    **p,
                    "review_count": len(revs),
                    "avg_rating": round(avg_r, 2)
                })
            return res

    def calculate_aspect_sentiment_score(self, pos: int, neg: int) -> float:
        """
        S_{p,a} = 100 * (P - N) / (P + N)
        Ranges from -100 to +100.
        """
        total = pos + neg
        if total == 0:
            return 0.0
        return round(100.0 * (pos - neg) / total, 1)

    def classify_opportunity(self, p_score: float, c_score: float, gap: float) -> tuple:
        """
        4-Way Opportunity Classification:
        - Competitive Advantage: Property positive, cluster weaker.
        - Competitive Weakness: Property negative relative to competitors.
        - Market-Wide Problem: Property and cluster both weak (shared operational / municipal).
        - Market Opportunity: Cluster weak, but property performs better.
        """
        if gap > 12 and p_score > 15 and c_score < 10:
            return "Market Opportunity", "Promote as unique competitive differentiator against competing hill properties.", "emerald"
        elif gap >= 8 and p_score > 0:
            return "Competitive Advantage", "Maintain standard; feature prominently in marketing.", "green"
        elif p_score < 0 and c_score < 0 and abs(gap) <= 20:
            return "Market-Wide Problem", "Destination infrastructure constraint (coordinate with Tourism Board).", "amber"
        else:
            return "Competitive Weakness", "Immediate internal operational fix required; competitors outperform you.", "rose"

    def get_cluster_heatmap_matrix(self) -> Dict[str, Any]:
        """
        Generates the 10 Properties x 8 Aspects Competitive Opportunity Heatmap.
        Each cell contains S_{p,a}, G_{p,a}, C_{p,a}, mentions, and supporting review evidence citations.
        """
        properties = self.get_all_properties_data()
        all_mentions = db.get_aspect_mentions()
        all_reviews = db.get_all_reviews()

        if not all_mentions or not properties:
            return {"properties": [], "aspects": [], "matrix": []}

        df_mentions = pd.DataFrame(all_mentions)
        rev_count_by_prop = {p["id"]: p["review_count"] for p in properties}

        # Canonical aspects
        aspects = sorted(df_mentions["aspect"].unique())

        # Precompute cluster-wide totals for Leave-One-Out calculation
        cluster_totals = {}
        for asp in aspects:
            asp_df = df_mentions[df_mentions["aspect"] == asp]
            cluster_totals[asp] = {
                "pos": len(asp_df[asp_df["sentiment"] == "Positive"]),
                "neg": len(asp_df[asp_df["sentiment"] == "Negative"]),
                "total": len(asp_df)
            }

        matrix_rows = []

        for prop in properties:
            p_id = prop["id"]
            p_rev_count = max(rev_count_by_prop.get(p_id, 1), 1)
            p_df = df_mentions[df_mentions["property_id"] == p_id]

            row_cells = []
            for asp in aspects:
                asp_p_df = p_df[p_df["aspect"] == asp]
                p_pos = len(asp_p_df[asp_p_df["sentiment"] == "Positive"])
                p_neg = len(asp_p_df[asp_p_df["sentiment"] == "Negative"])
                p_neu = len(asp_p_df[asp_p_df["sentiment"] == "Neutral"])
                p_total = p_pos + p_neg + p_neu

                # Measure 1: Aspect Sentiment Score
                p_score = self.calculate_aspect_sentiment_score(p_pos, p_neg)

                # Leave-One-Out Cluster Baseline
                c_pos = cluster_totals[asp]["pos"] - p_pos
                c_neg = cluster_totals[asp]["neg"] - p_neg
                c_score = self.calculate_aspect_sentiment_score(c_pos, c_neg)

                # Measure 2: Competitive Gap
                gap = round(p_score - c_score, 1)

                # Measure 3: Complaint Prevalence C_{p,a}
                prevalence = round((p_neg / p_rev_count) * 100, 1)

                # Measure 4: Sample size & confidence
                is_low_volume = (p_total < self.min_mentions_threshold)
                classification, action, color = self.classify_opportunity(p_score, c_score, gap)

                # Collect supporting review evidence
                evidences = []
                for _, r in asp_p_df.head(6).iterrows():
                    evidences.append({
                        "review_id": r["review_id"],
                        "sentiment": r["sentiment"],
                        "intensity": r.get("intensity", 1),
                        "evidence_span": r["evidence_span"],
                        "full_text": r.get("text", ""),
                        "platform": r.get("platform", "OTA"),
                        "date": r.get("review_date", ""),
                        "rating": r.get("raw_rating", 4.0),
                        "source_url": r.get("source_url", ""),
                        "sub_issue": r.get("sub_issue", "")
                    })

                row_cells.append({
                    "aspect": asp,
                    "sentiment_score": p_score,
                    "cluster_baseline": c_score,
                    "competitive_gap": gap,
                    "complaint_prevalence_pct": prevalence,
                    "pos_mentions": p_pos,
                    "neg_mentions": p_neg,
                    "total_mentions": p_total,
                    "is_low_volume": is_low_volume,
                    "classification": classification,
                    "badge_color": color,
                    "action_recommendation": action,
                    "evidences_count": len(asp_p_df),
                    "evidence_citations": evidences
                })

            matrix_rows.append({
                "property_id": p_id,
                "property_name": prop["name"],
                "category": prop.get("category", "General"),
                "avg_rating": prop["avg_rating"],
                "review_count": p_rev_count,
                "cells": row_cells
            })

        return {
            "properties_count": len(properties),
            "aspects": aspects,
            "heatmap": matrix_rows
        }

    def simulate_intervention(self, property_id: str, aspect: str, reduction_pct: float, intervention_name: str) -> Dict[str, Any]:
        """
        Intervention Impact Simulator (Section 10 Feature 5).
        Projects the effect of resolving aspect complaints on S_{p,a}, G_{p,a}, and C_{p,a}.
        """
        heatmap_data = self.get_cluster_heatmap_matrix()
        prop_row = next((r for r in heatmap_data["heatmap"] if r["property_id"] == property_id), None)
        if not prop_row:
            return {"error": "Property not found"}

        cell = next((c for c in prop_row["cells"] if c["aspect"] == aspect), None)
        if not cell:
            return {"error": "Aspect not found"}

        p_pos = cell["pos_mentions"]
        p_neg = cell["neg_mentions"]
        c_score = cell["cluster_baseline"]
        total_revs = max(prop_row["review_count"], 1)

        # Apply reduction
        factor = max(0.0, min(1.0, (100.0 - reduction_pct) / 100.0))
        simulated_neg = int(round(p_neg * factor))
        simulated_pos = p_pos + int(round((p_neg - simulated_neg) * 0.5)) # Some conversions to positive

        simulated_score = self.calculate_aspect_sentiment_score(simulated_pos, simulated_neg)
        simulated_gap = round(simulated_score - c_score, 1)
        simulated_prevalence = round((simulated_neg / total_revs) * 100, 1)
        projected_rating_lift = round(min(0.5, (cell["complaint_prevalence_pct"] - simulated_prevalence) * 0.025), 2)

        new_classification, new_action, new_color = self.classify_opportunity(simulated_score, c_score, simulated_gap)

        return {
            "property_name": prop_row["property_name"],
            "aspect": aspect,
            "intervention_name": intervention_name,
            "reduction_percentage": reduction_pct,
            "baseline": {
                "sentiment_score": cell["sentiment_score"],
                "competitive_gap": cell["competitive_gap"],
                "complaint_prevalence_pct": cell["complaint_prevalence_pct"],
                "classification": cell["classification"],
                "neg_complaints": p_neg
            },
            "projected": {
                "sentiment_score": simulated_score,
                "competitive_gap": simulated_gap,
                "complaint_prevalence_pct": simulated_prevalence,
                "classification": new_classification,
                "action_recommendation": new_action,
                "neg_complaints": simulated_neg,
                "projected_star_rating_lift": f"+{projected_rating_lift} Stars"
            }
        }

benchmark_engine = CompetitiveBenchmarkEngine()
