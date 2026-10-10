"""
Cluster Review Intelligence (CRI) - Normalisation Layer
pipeline/normalise.py

Performs:
- Schema initialization on data/reviews.db
- Property ingestion from config/cluster.yaml
- Cryptographic SHA-1 deduplication
- 10-to-5 point rating normalization
- Within-platform z-score standardization (rating_z)
- Multilingual language tagging (hi_deva, hinglish_roman, en, mixed)
- Text quality filtering (<10 characters excluded)
"""

import os
import sys
import re
import hashlib
import sqlite3
import yaml
import numpy as np
from typing import List, Dict, Any

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from pipeline.collect import collect_all_raw_data

DB_PATH = os.path.join(PROJECT_ROOT, "data", "reviews.db")
CLUSTER_YAML_PATH = os.path.join(PROJECT_ROOT, "config", "cluster.yaml")

DEVANAGARI_REGEX = re.compile(r"[\u0900-\u097F]")
HINGLISH_CUES = re.compile(
    r"\b(tha|thi|the|hai|hain|nahi|na|aur|bhaiya|bohot|bahut|khana|swad|bekaar|ghatiya|"
    r"badhiya|zabardast|paisa vasool|mehnga|gandagi|thanda|garam|paani|dikkat|kharab|"
    r"sasta|ekdum|bilkul|lekin|par|accha|acchi)\b",
    re.IGNORECASE
)


def init_db(conn: sqlite3.Connection):
    """Initializes the canonical SQLite schema as specified in Section 2.3."""
    c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS properties(
      id TEXT PRIMARY KEY,
      name TEXT,
      city TEXT,
      area TEXT,
      star_class TEXT,
      price_band TEXT,
      lat REAL,
      lng REAL
    );

    CREATE TABLE IF NOT EXISTS reviews(
      review_id TEXT PRIMARY KEY,
      property_id TEXT,
      platform TEXT,
      review_date DATE,
      rating_raw REAL,
      rating_scale REAL,
      rating_norm REAL,
      rating_z REAL,
      text TEXT,
      lang_tag TEXT,
      owner_reply INT,
      reviewer_trip_type TEXT,
      FOREIGN KEY(property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS aspect_mentions(
      review_id TEXT,
      aspect TEXT,
      sentiment REAL,
      evidence TEXT,
      model TEXT,
      prompt_ver TEXT,
      PRIMARY KEY(review_id, aspect),
      FOREIGN KEY(review_id) REFERENCES reviews(review_id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform);
    CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(review_date);
    CREATE INDEX IF NOT EXISTS idx_aspects_aspect ON aspect_mentions(aspect);
    """)
    conn.commit()


def seed_properties(conn: sqlite3.Connection):
    """Syncs the 12 cluster properties from config/cluster.yaml into reviews.db."""
    if not os.path.exists(CLUSTER_YAML_PATH):
        return
    with open(CLUSTER_YAML_PATH, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    props = cfg.get("properties", [])
    c = conn.cursor()
    for p in props:
        c.execute("""
            INSERT OR REPLACE INTO properties(id, name, city, area, star_class, price_band, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["id"],
            p["name"],
            cfg.get("state", "Mussoorie"),
            p.get("area", "Mussoorie"),
            p.get("star_class", "4-Star"),
            p.get("price_band", "mid"),
            float(p.get("lat", 30.45)),
            float(p.get("lng", 78.07))
        ))
    conn.commit()
    print(f"[normalise.py] Seeded {len(props)} properties into properties table.")


def compute_sha1_id(property_id: str, platform: str, date: str, text: str) -> str:
    """Computes sha1(property_id|platform|date|text[:80])."""
    payload = f"{property_id}|{platform}|{date}|{text[:80]}"
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()


def detect_language(text: str) -> str:
    """
    Detects language tag:
    - hi_deva if Devanagari characters present
    - hinglish_roman if Romanized Hindi cues present
    - mixed if English text mixes with occasional Hindi tokens
    - en if standard English
    """
    if DEVANAGARI_REGEX.search(text):
        return "hi_deva"
    
    matches = HINGLISH_CUES.findall(text)
    token_count = len(text.split())
    if len(matches) >= 2 or (token_count > 0 and len(matches) / token_count > 0.15):
        return "hinglish_roman"
    elif len(matches) == 1:
        return "mixed"
    return "en"


def normalise_and_ingest():
    """Runs end-to-end collection, normalisation, and database storage."""
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    seed_properties(conn)

    raw_records = collect_all_raw_data()
    if not raw_records:
        print("[normalise.py] Warning: No raw reviews collected.")
        conn.close()
        return

    # 1. Preliminary cleansing & deduplication
    deduped = {}
    for r in raw_records:
        text = (r.get("text") or "").strip()
        if len(text) < 10:
            continue  # Exclude under-10-character texts from aspect processing per brief

        raw_pid = r.get("property_id") or "welcomhotel_savoy"
        id_alias_map = {
            "jw_marriott": "jw_marriott_walnut_grove",
            "jaypee_residency": "jaypee_residency_manor",
            "claridges_nabha": "claridges_nabha_residence",
            "tulip_inn": "tulip_inn_green_castle",
            "tripadvisor_kasmanda_palace": "kasmanda_palace",
            "tripadvisor_rokeby_manor": "rokeby_manor"
        }
        prop_id = id_alias_map.get(raw_pid, raw_pid)
        platform = r.get("platform") or "Google Maps"
        date_str = str(r.get("review_date") or "2025-06-15")[:10]
        
        rid = compute_sha1_id(prop_id, platform, date_str, text)
        if rid in deduped:
            continue

        raw_rating = float(r.get("rating_raw") or 4.0)
        scale = float(r.get("rating_scale") or (10.0 if raw_rating > 5.0 else 5.0))
        norm_rating = (raw_rating / scale) * 5.0

        deduped[rid] = {
            "review_id": rid,
            "property_id": prop_id,
            "platform": platform,
            "review_date": date_str,
            "rating_raw": raw_rating,
            "rating_scale": scale,
            "rating_norm": round(norm_rating, 2),
            "text": text,
            "lang_tag": detect_language(text),
            "owner_reply": int(r.get("owner_reply", 0)),
            "reviewer_trip_type": r.get("reviewer_trip_type", "General")
        }

    # 2. Compute within-platform z-scores (rating_z)
    platform_ratings = {}
    for item in deduped.values():
        p = item["platform"]
        platform_ratings.setdefault(p, []).append(item["rating_norm"])

    platform_stats = {}
    for p, vals in platform_ratings.items():
        arr = np.array(vals)
        mean_val = float(np.mean(arr))
        std_val = float(np.std(arr)) if np.std(arr) > 1e-4 else 1.0
        platform_stats[p] = (mean_val, std_val)

    for item in deduped.values():
        mean_p, std_p = platform_stats[item["platform"]]
        item["rating_z"] = round(float((item["rating_norm"] - mean_p) / std_p), 3)

    # 3. Ingest into reviews table
    c = conn.cursor()
    c.execute("BEGIN TRANSACTION")
    for it in deduped.values():
        c.execute("""
            INSERT OR REPLACE INTO reviews(
                review_id, property_id, platform, review_date,
                rating_raw, rating_scale, rating_norm, rating_z,
                text, lang_tag, owner_reply, reviewer_trip_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            it["review_id"], it["property_id"], it["platform"], it["review_date"],
            it["rating_raw"], it["rating_scale"], it["rating_norm"], it["rating_z"],
            it["text"], it["lang_tag"], it["owner_reply"], it["reviewer_trip_type"]
        ))
    conn.commit()

    c.execute("SELECT count(*), count(DISTINCT property_id), count(DISTINCT platform) FROM reviews")
    total_rev, total_prop, total_plat = c.fetchone()
    print(f"[normalise.py] Successfully stored {total_rev} clean reviews across {total_prop} properties and {total_plat} platforms in {DB_PATH}.")
    
    # Language distribution
    c.execute("SELECT lang_tag, count(*) FROM reviews GROUP BY lang_tag")
    print("[normalise.py] Language distribution:", dict(c.fetchall()))
    conn.close()


if __name__ == "__main__":
    normalise_and_ingest()
