import pandas as pd
import yaml
import time
import os
import sys

# Add project root to sys path to import core modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.aspect_scoring import compute_aspect_scores
from core.pricing import normalize_prices
from core.proximity import compute_proximity
from core.disconnect_engine import score_properties

if __name__ == "__main__":
    print("Starting Lakeside Luxury Premium Illusion pipeline...")
    t0 = time.perf_counter()
    
    with open("config/cluster.yaml") as f: 
        cfg = yaml.safe_load(f)
    
    # Mock data load for pipeline execution (replace with parquet read in prod)
    df_reviews = pd.DataFrame([
        {'property_id': ' Alka Lakeside', 'date': '2023-01-01', 'text': 'great view but terrible breakfast', 'sentiment': 'mixed'}
    ])
    df_props = pd.DataFrame([
        {'id': ' Alka Lakeside', 'hotspot': 'Nainital', 'segment': 'premium', 'lat': 29.3800, 'lon': 79.4600}
    ])
    
    print("Computing aspect scores...")
    asp = compute_aspect_scores(df_reviews, cfg)
    
    print("Normalizing pricing data...")
    prc = normalize_prices(df_props, cfg)
    
    print("Computing proximity to lake anchors...")
    prx = compute_proximity(df_props, cfg)
    
    print("Executing Disconnect Engine logic...")
    res = score_properties(asp, prc, prx, cfg)
    
    os.makedirs("outputs", exist_ok=True)
    res.to_parquet("outputs/disconnect_results.parquet")
    print(f"Pipeline executed in {time.perf_counter() - t0:.2f}s")
    print("Saved results to outputs/disconnect_results.parquet")
