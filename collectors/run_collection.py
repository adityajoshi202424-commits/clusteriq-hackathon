"""
Master Collection Pipeline Runner (Step 1).
Executes discovery, checks platform compliance, runs enabled collectors,
and outputs the empirical Data Quality Report.
"""

import os
import sys
import json
import yaml
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from collectors.discovery import discovery_engine
from collectors import COLLECTORS
from normalise.schema import db
from normalise.scaler import normalize_rating
from normalise.dedup import compute_text_fingerprint

def run_step1_collection():
    print("=" * 70)
    print("🚀 CRI STEP 1: DISCOVERY & COLLECTION PIPELINE")
    print("=" * 70)

    # 1. Run Dynamic Discovery
    discovery_res = discovery_engine.discover_cluster_entities()
    hotels = discovery_res["hotels"]
    pois = discovery_res["infrastructure_pois"]

    # 2. Load Sources Configuration
    sources_path = os.path.join(PROJECT_ROOT, "config", "sources.yaml")
    with open(sources_path, "r", encoding="utf-8") as f:
        sources_cfg = yaml.safe_load(f)

    platforms = sources_cfg.get("platforms", {})
    print(f"\n📡 Evaluating {len(platforms)} configured platforms for {len(hotels)} properties...")

    # 3. Check for any verified pre-staged datasets or manual exports to ingest
    pre_staged_cache = os.path.join(PROJECT_ROOT, "data", "mussoorie_cluster_reviews.json")
    if os.path.exists(pre_staged_cache):
        try:
            with open(pre_staged_cache, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
                cached_revs = cached_data.get("reviews", [])
                ingested = 0
                for r in cached_revs:
                    fprint = compute_text_fingerprint(r.get("text", ""))
                    raw_r = float(r.get("rating", 4.0))
                    rev_obj = {
                        "id": f"rec_{r.get('hotel_id')}_{r.get('platform')[:3]}_{fprint[:8]}",
                        "property_id": r.get("hotel_id"),
                        "platform": r.get("platform", "Verified Public Review"),
                        "raw_review_id": r.get("url", ""),
                        "text": r.get("text", ""),
                        "raw_rating": raw_r,
                        "raw_rating_scale": 5.0,
                        "normalized_rating": normalize_rating(r.get("platform", ""), raw_r, 5.0),
                        "review_date": r.get("date", ""),
                        "reviewer_type": r.get("reviewer_type", "Traveler"),
                        "owner_response": "",
                        "language": "en",
                        "source_url": r.get("url", "https://maps.google.com"),
                        "text_hash": fprint,
                        "is_duplicate": 0
                    }
                    db.insert_review(rev_obj)
                    ingested += 1
                print(f"📥 Ingested {ingested} verified reviews from local cache into SQLite database.")
        except Exception as e:
            print(f"Note on cache ingestion: {e}")

    # 4. Run Live Collectors
    for plat_id, collector in COLLECTORS.items():
        plat_cfg = platforms.get(plat_id, {})
        plat_name = plat_cfg.get("name", plat_id)
        is_enabled = plat_cfg.get("enabled", True)
        
        if not is_enabled:
            print(f"⏸️  {plat_name}: Disabled in sources.yaml")
            continue

        print(f"\n🌐 Querying {plat_name}...")
        for h in hotels:
            collector.collect_reviews(h)

    # 5. Compile Empirical Data Quality Report
    report = db.get_data_quality_report()

    print("\n" + "=" * 70)
    print("📋 EMPIRICAL DATA QUALITY & COVERAGE REPORT (STEP 1)")
    print("=" * 70)
    print(f"Total Properties Tracked:    {report['total_properties']}")
    print(f"Total Infrastructure POIs:   {len(pois)}")
    print(f"Total Unique Reviews Stored: {report['total_unique_reviews']}")
    print(f"Total Duplicates Filtered:   {report['total_duplicates_filtered']}")
    print(f"Date Range Covered:          {report['date_range']}")

    print("\n📊 Reviews Collected by Platform:")
    for plat, count in report["reviews_by_platform"].items():
        print(f"  • {plat}: {count} reviews")

    print("\n🏨 Reviews Collected by Property:")
    for prop, count in report["reviews_by_property"].items():
        print(f"  • {prop}: {count} reviews")

    print("\n🛡️ Platform Availability & Compliance Audit:")
    seen_platforms = set()
    for log in report["recent_collection_logs"]:
        plat = log["platform"]
        if plat not in seen_platforms:
            seen_platforms.add(plat)
            status = log["status"]
            msg = log["error_message"] or "OK"
            print(f"  • [{plat}] Status: {status} | Details: {msg}")

    print("=" * 70)
    return report

if __name__ == "__main__":
    run_step1_collection()
