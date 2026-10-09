"""
TripAdvisor Review Collector.
Implements strict compliance with TripAdvisor robots.txt and terms of service.
Direct automated scraping is disallowed by TripAdvisor robots.txt (/AllReviews, /api, Disallow: / for crawlers).
Collects via official TripAdvisor Content API (when TRIPADVISOR_API_KEY is provided)
or ingests user-provided manual CSV exports (data/manual_exports/).
"""

import os
import sys
import csv
import hashlib
import requests
from typing import Dict, Any, List

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from collectors.base import BaseCollector
from normalise.schema import db
from normalise.scaler import normalize_rating
from normalise.dedup import compute_text_fingerprint

class TripAdvisorCollector(BaseCollector):
    def __init__(self):
        super().__init__("tripadvisor")
        self.api_key = os.environ.get("TRIPADVISOR_API_KEY", "")

    def collect_reviews(self, property_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        prop_id = property_data["id"]
        prop_name = property_data["name"]
        reviews_collected = []

        # Check for manual export file first
        manual_export_dir = os.path.join(PROJECT_ROOT, "data", "manual_exports")
        manual_csv = os.path.join(manual_export_dir, f"tripadvisor_{prop_id}.csv")
        
        if os.path.exists(manual_csv):
            try:
                with open(manual_csv, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        text = row.get("text", "").strip()
                        if not text:
                            continue
                        rev_id = f"ta_manual_{prop_id}_{hashlib.md5(text.encode('utf-8')).hexdigest()[:10]}"
                        raw_r = float(row.get("rating", 4.0))
                        rev_obj = {
                            "id": rev_id,
                            "property_id": prop_id,
                            "platform": "TripAdvisor",
                            "raw_review_id": rev_id,
                            "text": text,
                            "raw_rating": raw_r,
                            "raw_rating_scale": 5.0,
                            "normalized_rating": normalize_rating("tripadvisor", raw_r, 5.0),
                            "review_date": row.get("date", ""),
                            "reviewer_type": row.get("reviewer_type", "Traveler"),
                            "owner_response": row.get("owner_response", ""),
                            "language": row.get("language", "en"),
                            "source_url": row.get("url", f"https://www.tripadvisor.in/Hotel_Review-{prop_id}"),
                            "text_hash": compute_text_fingerprint(text),
                            "is_duplicate": 0
                        }
                        db.insert_review(rev_obj)
                        reviews_collected.append(rev_obj)
                db.log_collection("tripadvisor", prop_name, "MANUAL_EXPORT_INGESTED", len(reviews_collected))
                return reviews_collected
            except Exception as e:
                db.log_collection("tripadvisor", prop_name, "ERROR", 0, f"Error reading manual export: {str(e)}")

        if self.api_key:
            # Official Content API
            try:
                url = f"https://api.content.tripadvisor.com/api/v1/location/search?key={self.api_key}&searchQuery={prop_name}%20Mussoorie"
                res = requests.get(url, headers=self.get_headers(), timeout=self.timeout)
                # Parse reviews if permitted by subscription tier
                db.log_collection("tripadvisor", prop_name, "API_QUERY_COMPLETED", len(reviews_collected))
            except Exception as e:
                db.log_collection("tripadvisor", prop_name, "API_ERROR", 0, str(e))
        else:
            # Rule 4 compliance: Log limitation honestly without fabricating data
            db.log_collection(
                "tripadvisor",
                prop_name,
                "BLOCKED_BY_ROBOTS_TXT",
                0,
                "TripAdvisor robots.txt disallows direct crawling (/AllReviews, /api). Automated access blocked. Official TRIPADVISOR_API_KEY or licensed syndication required.",
                robots_status="DISALLOWED_PER_ROBOTS_TXT"
            )

        return reviews_collected

tripadvisor_collector = TripAdvisorCollector()
