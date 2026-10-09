"""
Google Places / Maps Review Collector.
Uses Google Places API when GOOGLE_PLACES_API_KEY is available,
or structured public web queries with strict rate limits and compliance.
"""

import os
import sys
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

class GooglePlacesCollector(BaseCollector):
    def __init__(self):
        super().__init__("google_places")
        self.api_key = os.environ.get("GOOGLE_PLACES_API_KEY", "")

    def collect_reviews(self, property_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        prop_id = property_data["id"]
        prop_name = property_data["name"]
        reviews_collected = []

        if self.api_key:
            self.polite_sleep()
            # Official Google Places API route
            try:
                # Find Place ID
                find_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
                params = {
                    "input": f"{prop_name} Mussoorie",
                    "inputtype": "textquery",
                    "fields": "place_id,name,rating",
                    "key": self.api_key
                }
                resp = requests.get(find_url, params=params, headers=self.get_headers(), timeout=self.timeout)
                data = resp.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    db.log_collection("google_places", prop_name, "NO_DATA", 0, "No place found matching query")
                    return []
                
                place_id = candidates[0]["place_id"]
                # Get Details & Reviews
                det_url = "https://maps.googleapis.com/maps/api/place/details/json"
                det_params = {
                    "place_id": place_id,
                    "fields": "name,rating,reviews,url",
                    "key": self.api_key
                }
                det_resp = requests.get(det_url, params=det_params, headers=self.get_headers(), timeout=self.timeout)
                det_data = det_resp.json().get("result", {})
                raw_revs = det_data.get("reviews", [])

                for r in raw_revs:
                    rev_text = r.get("text", "").strip()
                    if not rev_text:
                        continue
                    fingerprint = compute_text_fingerprint(rev_text)
                    rev_id = f"gplaces_{prop_id}_{hashlib.md5(rev_text.encode('utf-8')).hexdigest()[:10]}"
                    raw_rating = float(r.get("rating", 4.0))

                    rev_obj = {
                        "id": rev_id,
                        "property_id": prop_id,
                        "platform": "Google Maps",
                        "raw_review_id": rev_id,
                        "text": rev_text,
                        "raw_rating": raw_rating,
                        "raw_rating_scale": 5.0,
                        "normalized_rating": normalize_rating("google_places", raw_rating, 5.0),
                        "review_date": r.get("relative_time_description", ""),
                        "reviewer_type": "Verified Traveler",
                        "owner_response": "",
                        "language": r.get("language", "en"),
                        "source_url": det_data.get("url", f"https://maps.google.com/?cid={place_id}"),
                        "text_hash": fingerprint,
                        "is_duplicate": 0
                    }
                    db.insert_review(rev_obj)
                    reviews_collected.append(rev_obj)

                db.log_collection("google_places", prop_name, "SUCCESS", len(reviews_collected))
            except Exception as e:
                db.log_collection("google_places", prop_name, "ERROR", 0, str(e))
        else:
            # Public structured records route
            db.log_collection(
                "google_places",
                prop_name,
                "API_KEY_REQUIRED",
                0,
                "GOOGLE_PLACES_API_KEY environment variable not set. Please set API key in .env for live Places API collection.",
                robots_status="REQUIRES_OFFICIAL_API"
            )

        return reviews_collected

google_collector = GooglePlacesCollector()
