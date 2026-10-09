"""
Rating Scale Normalizer
Converts platform-specific raw rating scales (e.g. Booking 10-point, Agoda 10-point)
to standard 5.0 scale using mappings from config/analysis.yaml.
"""

import os
import yaml
from typing import Dict, Any

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "analysis.yaml")

def load_scaler_mappings() -> Dict[str, Any]:
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
            return cfg.get("rating_scale_mappings", {})
    return {}

SCALE_MAPPINGS = load_scaler_mappings()

def normalize_rating(platform: str, raw_rating: float, raw_scale: float = 5.0) -> float:
    """Normalizes raw review rating to standard 5.0 scale."""
    if raw_rating is None:
        return 4.0
        
    cfg = SCALE_MAPPINGS.get(platform.lower().replace(".", "_").replace(" ", "_"), {})
    conversion_factor = cfg.get("conversion_factor")
    
    if conversion_factor is not None:
        return round(float(raw_rating * conversion_factor), 2)
        
    if raw_scale > 0 and raw_scale != 5.0:
        return round(float(raw_rating * (5.0 / raw_scale)), 2)
        
    return round(float(raw_rating), 2)
