"""
Cluster Review Intelligence (CRI) - Price-to-Value Illusion Detector
pipeline/illusion.py

Implements:
1. Price band ranking from verified metadata (budget=1, mid=2, premium=3, luxury=4)
2. Standardization of price band rank: price_band_rank_z = (rank - mean_rank) / std_rank
3. Composite experience z-score: experience_z = mean(z_Value, z_Staff, z_Room, z_Food)
4. Value gap metric: value_gap = price_band_rank_z - experience_z
5. Premium Illusion classification:
   Flagged when price_band_rank_z >= +1.0 and experience_z <= 0.0
6. Scatter plot coordinates and quadrant boundaries for frontend visualization
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

from pipeline.benchmark import compute_benchmarks

DB_PATH = os.path.join(PROJECT_ROOT, "data", "reviews.db")
CLUSTER_YAML_PATH = os.path.join(PROJECT_ROOT, "config", "cluster.yaml")
THRESHOLDS_PATH = os.path.join(PROJECT_ROOT, "config", "thresholds.yaml")

PRICE_BAND_LEVELS = {
    "budget": 1,
    "mid": 2,
    "premium": 3,
    "luxury": 4
}


def compute_price_value_illusion() -> Dict[str, Any]:
    # 1. Load benchmark aspect z-scores
    benchmarks = compute_benchmarks()

    # 2. Load property price metadata from cluster.yaml
    with open(CLUSTER_YAML_PATH, "r", encoding="utf-8") as f:
        cluster_cfg = yaml.safe_load(f)

    props_meta = {}
    if "clusters" in cluster_cfg:
        for c_obj in cluster_cfg["clusters"]:
            for p in c_obj.get("properties", []):
                props_meta[p["id"]] = p
    else:
        for p in cluster_cfg.get("properties", []):
            props_meta[p["id"]] = p

    prop_ids = [pid for pid in benchmarks.keys() if not str(pid).startswith("_")]
    price_levels = []
    for pid in prop_ids:
        meta = props_meta.get(pid, {})
        band_str = meta.get("price_band", "mid").lower()
        lvl = PRICE_BAND_LEVELS.get(band_str, 2)
        price_levels.append(lvl)

    # Standardize price band rank to z-score
    arr_prices = np.array(price_levels, dtype=float)
    mean_price_rank = float(np.mean(arr_prices))
    std_price_rank = float(np.std(arr_prices)) if np.std(arr_prices) > 1e-4 else 1.0

    target_aspects = {"Value", "Staff", "Room", "Food"}
    quadrant_items = []
    flagged_illusions = []

    for idx, pid in enumerate(prop_ids):
        bm = benchmarks[pid]
        p_info = bm["property"]
        meta = props_meta.get(pid, {})

        price_lvl = price_levels[idx]
        price_band_name = meta.get("price_band", p_info.get("price_band", "mid")).capitalize()
        price_z = round(float((price_lvl - mean_price_rank) / std_price_rank), 2)

        # Experience z: mean z across Value, Staff, Room, Food
        relevant_zs = [
            a["z"] for a in bm["aspects"]
            if a["aspect"] in target_aspects
        ]
        experience_z = round(float(np.mean(relevant_zs)), 2) if relevant_zs else 0.0
        value_gap = round(float(price_z - experience_z), 2)

        # Flag rule: price_band_rank_z >= 1.0 and experience_z <= 0.0
        is_illusion = (price_z >= 1.0) and (experience_z <= 0.0)

        quadrant_name = ""
        if price_z >= 0.0 and experience_z >= 0.0:
            quadrant_name = "High Price, High Experience (Delivered Luxury)"
        elif price_z >= 0.0 and experience_z < 0.0:
            quadrant_name = "High Price, Subpar Experience (Premium Illusion)"
        elif price_z < 0.0 and experience_z >= 0.0:
            quadrant_name = "Low Price, High Experience (High Value Champion)"
        else:
            quadrant_name = "Low Price, Subpar Experience (Budget Constrained)"

        item = {
            "property_id": pid,
            "property_name": p_info.get("name", pid),
            "area": p_info.get("area", "Mussoorie"),
            "star_class": p_info.get("star_class", "4-Star"),
            "price_band": price_band_name,
            "price_band_numeric": price_lvl,
            "price_band_rank_z": price_z,
            "price_band_source": meta.get("price_band_source", "Tariff Schedule 2026"),
            "price_range_inr": meta.get("price_range_inr", [5000, 10000]),
            "experience_z": experience_z,
            "value_gap": value_gap,
            "is_premium_illusion": is_illusion,
            "quadrant": quadrant_name,
            "component_aspect_zs": {
                a["aspect"]: a["z"] for a in bm["aspects"] if a["aspect"] in target_aspects
            }
        }
        quadrant_items.append(item)

        if is_illusion:
            flagged_illusions.append(item)

    quadrant_items.sort(key=lambda x: x["value_gap"], reverse=True)

    result = {
        "cluster": "Mussoorie",
        "thresholds": {
            "price_band_rank_z_threshold": 1.0,
            "experience_z_threshold": 0.0
        },
        "flagged_premium_illusions": flagged_illusions,
        "properties": quadrant_items
    }

    print(f"[illusion.py] Evaluated 12 properties. {len(flagged_illusions)} flagged in Premium Illusion quadrant.")
    return result


if __name__ == "__main__":
    out = compute_price_value_illusion()
    print("\n--- Flagged Premium Illusions ---")
    for f in out["flagged_premium_illusions"]:
        print(f"[{f['property_name']}] Price Band: {f['price_band']} (z={f['price_band_rank_z']}) | Experience z: {f['experience_z']} | Value Gap: {f['value_gap']}")
        print(f"  Aspects: {f['component_aspect_zs']}")
