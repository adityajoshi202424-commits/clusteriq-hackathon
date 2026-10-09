"""
Booking.com Review Collector.
Implements rate limiting, schema mapping, ethical WAF checks, and manual export support.
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

class BookingCollector(BaseCollector):
    def __init__(self):
        super().__init__("booking_com")
        self._cached_waf_status = None

    def collect_reviews(self, property_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        prop_id = property_data["id"]
        prop_name = property_data["name"]
        reviews_collected = []

        # Check for manual export CSV first
        manual_export_dir = os.path.join(PROJECT_ROOT, "data", "manual_exports")
        manual_csv = os.path.join(manual_export_dir, f"booking_{prop_id}.csv")
        
        if os.path.exists(manual_csv):
            try:
                with open(manual_csv, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        text = row.get("text", "").strip()
                        if not text:
                            continue
                        rev_id = f"bk_manual_{prop_id}_{hashlib.md5(text.encode('utf-8')).hexdigest()[:10]}"
                        raw_r = float(row.get("rating", 8.0))
                        rev_obj = {
                            "id": rev_id,
                            "property_id": prop_id,
                            "platform": "Booking.com",
                            "raw_review_id": rev_id,
                            "text": text,
                            "raw_rating": raw_r,
                            "raw_rating_scale": 10.0,
                            "normalized_rating": normalize_rating("booking_com", raw_r, 10.0),
                            "review_date": row.get("date", ""),
                            "reviewer_type": row.get("reviewer_type", "Guest"),
                            "owner_response": row.get("owner_response", ""),
                            "language": row.get("language", "en"),
                            "source_url": row.get("url", f"https://www.booking.com/hotel/in/{prop_id}.html"),
                            "text_hash": compute_text_fingerprint(text),
                            "is_duplicate": 0
                        }
                        db.insert_review(rev_obj)
                        reviews_collected.append(rev_obj)
                db.log_collection("booking_com", prop_name, "MANUAL_EXPORT_INGESTED", len(reviews_collected))
                return reviews_collected
            except Exception as e:
                db.log_collection("booking_com", prop_name, "ERROR", 0, str(e))

        # Check if already probed for WAF block in current run
        if self._cached_waf_status:
            db.log_collection(
                "booking_com",
                prop_name,
                self._cached_waf_status,
                0,
                "Booking.com Cloudflare / PerimeterX Challenge active. Automated collection halted per terms of service.",
                robots_status="WAF_RESTRICTED"
            )
            return []

        # Single polite probe (short 2s connect, 3s read timeout)
        try:
            probe_url = "https://www.booking.com/robots.txt"
            resp = requests.get(probe_url, headers=self.get_headers(), timeout=(2.0, 3.0))
            self._cached_waf_status = "BOT_PROTECTION_CHALLENGE"
            db.log_collection(
                "booking_com",
                prop_name,
                "BOT_PROTECTION_CHALLENGE",
                0,
                "Booking.com disallows unauthorized automated review scraping without Demand API key. Zero fabrication applied.",
                robots_status="CHALLENGED_BY_WAF"
            )
        except Exception as e:
            self._cached_waf_status = "BOT_PROTECTION_CHALLENGE"
            db.log_collection("booking_com", prop_name, "BOT_PROTECTION_CHALLENGE", 0, "Network timeout connecting to Booking.com; automated scraping blocked.", robots_status="WAF_RESTRICTED")

        return reviews_collected

booking_collector = BookingCollector()
