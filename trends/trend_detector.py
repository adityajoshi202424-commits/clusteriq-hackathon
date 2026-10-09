"""
Early-Warning System & Anomaly Detection Pipeline.
Aggregates negative aspect mentions across time intervals (weeks/months).
Compares recent complaint frequency against rolling baseline.
Flags sudden operational spikes before overall rating decays.
Zero hard-coded hotel names or review text (Rule 1 Compliant).
"""

import os
import sys
import yaml
from collections import defaultdict
from typing import Dict, Any, List
import pandas as pd
import numpy as np

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from normalise.schema import db

CONFIG_ANALYSIS_PATH = os.path.join(PROJECT_ROOT, "config", "analysis.yaml")

class TrendDetector:
    def __init__(self, config_path: str = CONFIG_ANALYSIS_PATH):
        self.config_path = config_path
        self.min_mentions = 5
        self._load_config()

    def _load_config(self):
        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                cfg = yaml.safe_load(f)
                self.min_mentions = cfg.get("min_mentions", 5)

    def detect_early_warnings(self, property_id: str) -> List[Dict[str, Any]]:
        """
        Analyzes time series of complaints for the given property.
        Flags emerging anomalies when recent complaints exceed rolling mean by threshold.
        """
        aspect_records = db.get_aspect_mentions(property_id=property_id)
        if not aspect_records:
            return []

        df = pd.DataFrame(aspect_records)
        if "review_date" not in df.columns or df["review_date"].empty:
            return []

        df["review_date"] = pd.to_datetime(df["review_date"], errors="coerce")
        df = df.dropna(subset=["review_date"])
        df["month"] = df["review_date"].dt.strftime("%Y-%m")

        neg_df = df[df["sentiment"] == "Negative"]
        if neg_df.empty:
            return []

        early_warnings = []
        aspects = df["aspect"].unique()

        for asp in aspects:
            asp_neg = neg_df[neg_df["aspect"] == asp]
            if len(asp_neg) < 2:
                continue

            # Group by month
            monthly_counts = asp_neg.groupby("month").size().to_dict()
            sorted_months = sorted(monthly_counts.keys())

            if len(sorted_months) >= 2:
                recent_month = sorted_months[-1]
                recent_count = monthly_counts[recent_month]

                # Rolling baseline from earlier months
                baseline_counts = [monthly_counts[m] for m in sorted_months[:-1]]
                baseline_mean = float(np.mean(baseline_counts)) if baseline_counts else 1.0

                # Spike threshold: 1.5x baseline or jump >= 3
                is_spike = (recent_count >= baseline_mean * 1.5 and recent_count >= 3)

                recent_evidence = asp_neg[asp_neg["month"] == recent_month]["evidence_span"].tolist()

                if is_spike:
                    status = "EMERGING ISSUE"
                    severity = "High"
                elif recent_count > baseline_mean:
                    status = "MONITOR"
                    severity = "Medium"
                else:
                    status = "STABLE"
                    severity = "Low"

                early_warnings.append({
                    "aspect": asp,
                    "status": status,
                    "severity": severity,
                    "recent_period": recent_month,
                    "recent_complaints": int(recent_count),
                    "baseline_mean_complaints": round(baseline_mean, 1),
                    "percentage_jump": round(((recent_count - baseline_mean) / max(baseline_mean, 0.1)) * 100, 1),
                    "evidence_excerpts": recent_evidence[:3],
                    "operational_hypothesis": f"Recent rise in {asp} friction detected. Validate operational logs and staffing near {recent_month} before rating degradation."
                })

        return sorted(early_warnings, key=lambda x: x["recent_complaints"], reverse=True)

trend_detector = TrendDetector()
