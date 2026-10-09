"""
Database Schema & SQLite Storage Manager for Cluster Review Intelligence.
Provides idempotent persistence, traceability of all review metrics, and collection logging.
"""

import os
import sqlite3
import yaml
from datetime import datetime
from typing import Dict, Any, List, Optional

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config")

def get_db_path() -> str:
    analysis_file = os.path.join(CONFIG_DIR, "analysis.yaml")
    if os.path.exists(analysis_file):
        with open(analysis_file, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
            rel_path = cfg.get("storage", {}).get("database_path", "data/cluster_reviews.db")
            root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            return os.path.join(root_dir, rel_path)
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "cluster_reviews.db")

class DatabaseManager:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or get_db_path()
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_tables()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_tables(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Properties table (Discovered dynamically or user configured)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS properties (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT,
                address TEXT,
                latitude REAL,
                longitude REAL,
                discovered_via TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # Destination Infrastructure & Points of Interest (attractions, parking, viewpoints)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS destination_points (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL, -- parking, viewpoint, market, attraction, transport
                address TEXT,
                latitude REAL,
                longitude REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # Raw Reviews table (Traceable to exact source URL, date, and platform)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS raw_reviews (
                id TEXT PRIMARY KEY,
                property_id TEXT NOT NULL,
                platform TEXT NOT NULL,
                raw_review_id TEXT,
                text TEXT NOT NULL,
                raw_rating REAL,
                raw_rating_scale REAL,
                normalized_rating REAL,
                review_date TEXT,
                reviewer_type TEXT,
                owner_response TEXT,
                language TEXT DEFAULT 'en',
                source_url TEXT,
                text_hash TEXT,
                is_duplicate INTEGER DEFAULT 0,
                collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES properties(id)
            )
            """)

            # Aspect-Based Mentions (LLM or Heuristic Extracted)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS aspect_mentions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id TEXT NOT NULL,
                aspect TEXT NOT NULL,
                sentiment TEXT NOT NULL, -- Positive, Negative, Neutral
                intensity INTEGER DEFAULT 1, -- 1 to 3
                evidence_span TEXT NOT NULL,
                sub_issue TEXT,
                english_gloss TEXT,
                confidence REAL DEFAULT 0.9,
                extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (review_id) REFERENCES raw_reviews(id)
            )
            """)

            # Collection Audit Logs (Tracks status, failures, and blockages honestly)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS collection_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                target_name TEXT NOT NULL,
                status TEXT NOT NULL, -- SUCCESS, BLOCKED, NO_DATA, ERROR
                reviews_count INTEGER DEFAULT 0,
                error_message TEXT,
                robots_status TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            conn.commit()

    def insert_property(self, prop: Dict[str, Any]) -> str:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO properties (id, name, category, address, latitude, longitude, discovered_via)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                prop["id"],
                prop["name"],
                prop.get("category", "General"),
                prop.get("address", ""),
                prop.get("latitude", 0.0),
                prop.get("longitude", 0.0),
                prop.get("discovered_via", "web_discovery")
            ))
            conn.commit()
            return prop["id"]

    def insert_destination_point(self, point: Dict[str, Any]) -> str:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO destination_points (id, name, category, address, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                point["id"],
                point["name"],
                point.get("category", "general"),
                point.get("address", ""),
                point.get("latitude", 0.0),
                point.get("longitude", 0.0)
            ))
            conn.commit()
            return point["id"]

    def insert_review(self, review: Dict[str, Any]) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO raw_reviews (
                id, property_id, platform, raw_review_id, text,
                raw_rating, raw_rating_scale, normalized_rating,
                review_date, reviewer_type, owner_response, language,
                source_url, text_hash, is_duplicate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                review["id"],
                review["property_id"],
                review["platform"],
                review.get("raw_review_id", review["id"]),
                review["text"],
                review.get("raw_rating"),
                review.get("raw_rating_scale", 5.0),
                review.get("normalized_rating", review.get("raw_rating")),
                review.get("review_date", ""),
                review.get("reviewer_type", "General"),
                review.get("owner_response", ""),
                review.get("language", "en"),
                review.get("source_url", ""),
                review.get("text_hash", ""),
                review.get("is_duplicate", 0)
            ))
            conn.commit()
            return True

    def insert_aspect_mention(self, mention: Dict[str, Any]) -> int:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO aspect_mentions (
                review_id, aspect, sentiment, intensity, evidence_span, sub_issue, english_gloss, confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                mention["review_id"],
                mention["aspect"],
                mention["sentiment"],
                mention.get("intensity", 1),
                mention["evidence_span"],
                mention.get("sub_issue", ""),
                mention.get("english_gloss", ""),
                mention.get("confidence", 0.9)
            ))
            conn.commit()
            return cursor.lastrowid

    def get_all_reviews(self, property_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if property_id:
                cursor.execute("SELECT * FROM raw_reviews WHERE property_id = ? AND is_duplicate = 0", (property_id,))
            else:
                cursor.execute("SELECT * FROM raw_reviews WHERE is_duplicate = 0")
            return [dict(row) for row in cursor.fetchall()]

    def get_aspect_mentions(self, property_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if property_id:
                cursor.execute("""
                SELECT am.*, rr.property_id, rr.platform, rr.review_date, rr.raw_rating, rr.source_url, rr.text
                FROM aspect_mentions am
                JOIN raw_reviews rr ON am.review_id = rr.id
                WHERE rr.property_id = ? AND rr.is_duplicate = 0
                """, (property_id,))
            else:
                cursor.execute("""
                SELECT am.*, rr.property_id, rr.platform, rr.review_date, rr.raw_rating, rr.source_url, rr.text
                FROM aspect_mentions am
                JOIN raw_reviews rr ON am.review_id = rr.id
                WHERE rr.is_duplicate = 0
                """)
            return [dict(row) for row in cursor.fetchall()]

    def log_collection(self, platform: str, target: str, status: str, count: int, error_msg: str = "", robots_status: str = "COMPLIANT"):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO collection_logs (platform, target_name, status, reviews_count, error_message, robots_status)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (platform, target, status, count, error_msg, robots_status))
            conn.commit()

    def get_data_quality_report(self) -> Dict[str, Any]:
        """Compiles empirical data quality metrics from the SQLite database."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT count(*) as total FROM properties")
            total_properties = cursor.fetchone()["total"]

            cursor.execute("SELECT count(*) as total FROM raw_reviews WHERE is_duplicate = 0")
            total_unique_reviews = cursor.fetchone()["total"]

            cursor.execute("SELECT count(*) as total FROM raw_reviews WHERE is_duplicate = 1")
            total_duplicates = cursor.fetchone()["total"]

            cursor.execute("SELECT platform, count(*) as count FROM raw_reviews WHERE is_duplicate = 0 GROUP BY platform")
            by_platform = {row["platform"]: row["count"] for row in cursor.fetchall()}

            cursor.execute("SELECT property_id, count(*) as count FROM raw_reviews WHERE is_duplicate = 0 GROUP BY property_id")
            by_property = {row["property_id"]: row["count"] for row in cursor.fetchall()}

            cursor.execute("SELECT min(review_date) as min_d, max(review_date) as max_d FROM raw_reviews WHERE review_date != ''")
            dates = cursor.fetchone()
            date_range = f"{dates['min_d']} to {dates['max_d']}" if dates and dates['min_d'] else "Not recorded"

            cursor.execute("SELECT count(*) as total FROM aspect_mentions")
            total_aspect_mentions = cursor.fetchone()["total"]

            cursor.execute("SELECT platform, target_name, status, error_message, robots_status FROM collection_logs ORDER BY id DESC LIMIT 50")
            recent_logs = [dict(row) for row in cursor.fetchall()]

            return {
                "total_properties": total_properties,
                "total_unique_reviews": total_unique_reviews,
                "total_duplicates_filtered": total_duplicates,
                "total_aspect_mentions": total_aspect_mentions,
                "reviews_by_platform": by_platform,
                "reviews_by_property": by_property,
                "date_range": date_range,
                "recent_collection_logs": recent_logs
            }

db = DatabaseManager()

