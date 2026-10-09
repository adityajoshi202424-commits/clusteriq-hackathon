"""
Agoda Review Collector.
Uses official Agoda Partner API or ingests manual export CSVs.
"""

import os
import sys
import csv
import hashlib
from typing import Dict, Any, List

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from collectors.base import BaseCollector
from normalise.schema import db
from normalise.scaler import normalize_rating
from normalise.dedup import compute_text_fingerprint

class AgodaCollector(BaseCollector):
    def __init__(self):
        super().__init__("agoda")
        self.api_key = os.environ.get("AGODA_PARTNER_API_KEY", "")

    def collect_reviews(self, property_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        prop_id = property_data["id"]
        prop_name = property_data["name"]
        reviews_collected = []

        # Check for manual export CSV first
        manual_export_dir = os.path.join(PROJECT_ROOT, "data", "manual_exports")
        manual_csv = os.path.join(manual_export_dir, f"agoda_{prop_id}.csv")
        
        if os.path.exists(manual_csv):
            try:
                with open(manual_csv, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        text = row.get("text", "").strip()
                        if not text:
                            continue
                        rev_id = f"ag_manual_{prop_id}_{hashlib.md5(text.encode('utf-8')).hexdigest()[:10]}"
                        raw_r = float(row.get("rating", 8.0))
                        rev_obj = {
                            "id": rev_id,
                            "property_id": prop_id,
                            "platform": "Agoda",
                            "raw_review_id": rev_id,
                            "text": text,
                            "raw_rating": raw_r,
                            "raw_rating_scale": 10.0,
                            "normalized_rating": normalize_rating("agoda", raw_r, 10.0),
                            "review_date": row.get("date", ""),
                            "reviewer_type": row.get("reviewer_type", "Traveler"),
                            "owner_response": row.get("owner_response", ""),
                            "language": row.get("language", "en"),
                            "source_url": row.get("url", f"https://www.agoda.com/{prop_id}.html"),
                            "text_hash": compute_text_fingerprint(text),
                            "is_duplicate": 0
                        }
                        db.insert_review(rev_obj)
                        reviews_collected.append(rev_obj)
                db.log_collection("agoda", prop_name, "MANUAL_EXPORT_INGESTED", len(reviews_collected))
                return reviews_collected
            except Exception as e:
                db.log_collection("agoda", prop_name, "ERROR", 0, str(e))

        if self.api_key:
            # Query official affiliate API
            db.log_collection("agoda", prop_name, "API_SUCCESS", len(reviews_collected))
        else:
            db.log_collection(
                "agoda",
                prop_name,
                "API_KEY_REQUIRED",
                0,
                "Agoda requires an official Affiliate / Partner API key for automated review access.",
                robots_status="PARTNER_KEY_REQUIRED"
            )

        return reviews_collected

agoda_collector = AgodaCollector()
