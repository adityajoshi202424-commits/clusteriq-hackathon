"""
Review Deduplication & Cross-Platform Matching
Identifies cross-posted or duplicate reviews based on text fingerprints.
"""

import hashlib
import re

def compute_text_fingerprint(text: str) -> str:
    """Computes a normalized hash of review text for fast duplicate detection."""
    if not text:
        return ""
    # Normalize by lowercase, stripping whitespace, numbers, and punctuation
    cleaned = re.sub(r"[^\w\s]", "", text.lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

def is_duplicate(fingerprint: str, existing_fingerprints: set) -> bool:
    """Checks if review text fingerprint has already been recorded."""
    return fingerprint in existing_fingerprints
