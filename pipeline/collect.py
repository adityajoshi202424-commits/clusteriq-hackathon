"""
Cluster Review Intelligence (CRI) - Data Collection Layer
pipeline/collect.py

Contains dedicated loaders per platform:
- Google Maps (reviews export / actor)
- TripAdvisor (reviews export / actor)
- Booking.com (liked/disliked structured reviews)
- MakeMyTrip / Goibibo / Agoda (vernacular sample loaders)
- Fallback/Corpus loader from existing verified Mussoorie dataset
"""

import os
import sys
import json
import csv
import glob
from typing import List, Dict, Any, Optional

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

RAW_DATA_DIR = os.path.join(PROJECT_ROOT, "data", "raw")


def load_google_reviews(file_path: str, property_id: str) -> List[Dict[str, Any]]:
    """Loads raw Google Maps reviews JSON export."""
    if not os.path.exists(file_path):
        return []
    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data if isinstance(data, list) else data.get("reviews", [])
    for it in items:
        rows.append({
            "property_id": property_id,
            "platform": "Google Maps",
            "review_date": it.get("publishedAtDate") or it.get("date") or "2025-06-15",
            "rating_raw": float(it.get("stars") or it.get("rating") or 4.0),
            "rating_scale": 5.0,
            "text": (it.get("text") or it.get("snippet") or "").strip(),
            "owner_reply": 1 if it.get("responseFromOwnerText") else 0,
            "reviewer_trip_type": it.get("tripType") or "General"
        })
    return rows


def load_tripadvisor_reviews(file_path: str, property_id: str) -> List[Dict[str, Any]]:
    """Loads TripAdvisor structured export."""
    if not os.path.exists(file_path):
        return []
    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data if isinstance(data, list) else data.get("reviews", [])
    for it in items:
        rows.append({
            "property_id": property_id,
            "platform": "TripAdvisor",
            "review_date": it.get("date") or it.get("stay_date") or "2025-07-20",
            "rating_raw": float(it.get("rating") or 4.0),
            "rating_scale": 5.0,
            "text": (it.get("text") or it.get("review_text") or "").strip(),
            "owner_reply": 1 if it.get("has_owner_response") else 0,
            "reviewer_trip_type": it.get("trip_type") or "Family"
        })
    return rows


def load_booking_reviews(file_path: str, property_id: str) -> List[Dict[str, Any]]:
    """Loads Booking.com review exports (supporting liked + disliked text combinations)."""
    if not os.path.exists(file_path):
        return []
    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data if isinstance(data, list) else data.get("reviews", [])
    for it in items:
        liked = it.get("liked_text") or ""
        disliked = it.get("disliked_text") or ""
        full_text = f"{liked}. {disliked}".strip(". ") if (liked or disliked) else (it.get("text") or "")
        rows.append({
            "property_id": property_id,
            "platform": "Booking.com",
            "review_date": it.get("date") or "2025-05-10",
            "rating_raw": float(it.get("score") or it.get("rating") or 8.5),
            "rating_scale": 10.0,
            "text": full_text.strip(),
            "owner_reply": 1 if it.get("owner_response") else 0,
            "reviewer_trip_type": it.get("stay_type") or "Couple"
        })
    return rows


def load_manual_csv(file_path: str, property_id: str, platform: str) -> List[Dict[str, Any]]:
    """Loads manual CSV exports (columns: date,rating,text)."""
    if not os.path.exists(file_path):
        return []
    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            raw_rating = float(r.get("rating", 4.0))
            scale = 10.0 if raw_rating > 5.0 else 5.0
            rows.append({
                "property_id": property_id,
                "platform": platform,
                "review_date": r.get("date", "2025-08-01"),
                "rating_raw": raw_rating,
                "rating_scale": scale,
                "text": (r.get("text") or "").strip(),
                "owner_reply": int(r.get("owner_reply", 0)),
                "reviewer_trip_type": r.get("trip_type", "General")
            })
    return rows


def load_existing_cluster_corpus() -> List[Dict[str, Any]]:
    """
    Loads verified historical review rows from pre-staged cluster files:
    1. data/cluster_reviews.db (raw_reviews table)
    2. data/raw/mussoorie_cluster_reviews_backup.json
    3. data/mussoorie_cluster_reviews.json
    """
    rows = []
    
    # 1. Check existing cluster_reviews.db raw_reviews table
    db_path = os.path.join(PROJECT_ROOT, "data", "cluster_reviews.db")
    if os.path.exists(db_path):
        import sqlite3
        try:
            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            c.execute("""
                SELECT property_id, platform, review_date, raw_rating, raw_rating_scale, text, reviewer_type
                FROM raw_reviews
            """)
            for pid, plat, rdate, rrating, rscale, rtext, rtype in c.fetchall():
                if rtext and len(str(rtext).strip()) >= 10:
                    scale = float(rscale or (10.0 if rrating and float(rrating) > 5.0 else 5.0))
                    rows.append({
                        "property_id": pid or "welcomhotel_savoy",
                        "platform": plat or "Google Maps",
                        "review_date": str(rdate)[:10] if rdate else "2025-04-12",
                        "rating_raw": float(rrating or 4.0),
                        "rating_scale": scale,
                        "text": str(rtext).strip(),
                        "owner_reply": 0,
                        "reviewer_trip_type": rtype or "Verified Guest"
                    })
            conn.close()
        except Exception as e:
            print(f"[collect.py] Notice reading cluster_reviews.db: {e}")

    # 2. Check mussoorie_cluster_reviews_backup.json
    backup_path = os.path.join(PROJECT_ROOT, "data", "raw", "mussoorie_cluster_reviews_backup.json")
    if os.path.exists(backup_path):
        try:
            with open(backup_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            items = data.get("reviews", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
            for it in items:
                rtext = it.get("text") or it.get("review_text") or ""
                if len(rtext.strip()) >= 10:
                    rating = float(it.get("rating") or it.get("raw_rating") or 4.0)
                    rows.append({
                        "property_id": it.get("property_id") or "welcomhotel_savoy",
                        "platform": it.get("platform") or it.get("source") or "TripAdvisor",
                        "review_date": str(it.get("date") or it.get("review_date") or "2025-05-18")[:10],
                        "rating_raw": rating,
                        "rating_scale": 10.0 if rating > 5.0 else 5.0,
                        "text": rtext.strip(),
                        "owner_reply": 1 if it.get("owner_reply") else 0,
                        "reviewer_trip_type": it.get("reviewer_trip_type") or it.get("trip_type") or "General"
                    })
        except Exception as e:
            print(f"[collect.py] Notice reading backup json: {e}")

    # 3. Check mussoorie_cluster_reviews.json
    json_path = os.path.join(PROJECT_ROOT, "data", "mussoorie_cluster_reviews.json")
    if os.path.exists(json_path) and json_path != backup_path:
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            items = data if isinstance(data, list) else data.get("reviews", [])
            for it in items:
                rtext = it.get("review_text") or it.get("text") or ""
                if len(rtext.strip()) >= 10:
                    rating = float(it.get("rating") or 4.0)
                    rows.append({
                        "property_id": it.get("property_id") or "welcomhotel_savoy",
                        "platform": it.get("source") or it.get("platform") or "TripAdvisor",
                        "review_date": str(it.get("review_date") or it.get("date") or "2025-05-18")[:10],
                        "rating_raw": rating,
                        "rating_scale": 10.0 if rating > 5.0 else 5.0,
                        "text": rtext.strip(),
                        "owner_reply": 1 if it.get("owner_reply") else 0,
                        "reviewer_trip_type": it.get("reviewer_trip_type") or "General"
                    })
        except Exception as e:
            print(f"[collect.py] Notice reading json corpus: {e}")

    return rows


def collect_all_raw_data() -> List[Dict[str, Any]]:
    """Aggregates raw records across all loaders."""
    all_rows = []
    
    # Check for raw/*.json files
    if os.path.exists(RAW_DATA_DIR):
        for fpath in glob.glob(os.path.join(RAW_DATA_DIR, "*")):
            fname = os.path.basename(fpath).lower()
            parts = fname.replace(".json", "").replace(".csv", "").split("_")
            platform_prefix = parts[0]
            prop_id = "_".join(parts[1:]) if len(parts) > 1 else "welcomhotel_savoy"

            if "google" in platform_prefix and fpath.endswith(".json"):
                all_rows.extend(load_google_reviews(fpath, prop_id))
            elif "tripadvisor" in platform_prefix and fpath.endswith(".json"):
                all_rows.extend(load_tripadvisor_reviews(fpath, prop_id))
            elif "booking" in platform_prefix and fpath.endswith(".json"):
                all_rows.extend(load_booking_reviews(fpath, prop_id))
            elif fpath.endswith(".csv"):
                plat = "MakeMyTrip" if "mmt" in fname else ("TripAdvisor" if "trip" in fname else "Google Maps")
                all_rows.extend(load_manual_csv(fpath, prop_id, plat))

    # Add verified historical corpus
    all_rows.extend(load_existing_cluster_corpus())
    
    print(f"[collect.py] Harvested {len(all_rows)} raw reviews across platform loaders.")
    return all_rows


if __name__ == "__main__":
    records = collect_all_raw_data()
    print(f"Sample raw record:\n{json.dumps(records[0] if records else {}, indent=2)}")
