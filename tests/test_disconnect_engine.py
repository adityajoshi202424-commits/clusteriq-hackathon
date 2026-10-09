import pandas as pd
import pytest
from core.disconnect_engine import score_properties

def test_illusion_classification():
    cfg = {'weights': {'service': 0.5, 'breakfast': 0.5}, 'analysis': {'min_reviews_per_property': 5}}
    
    aspects = pd.DataFrame([
        {'property_id': 'p1', 'aspect': 'view', 'stars': 4.8, 'ci_low': 4.5},
        {'property_id': 'p1', 'aspect': 'service', 'stars': 2.0, 'ci_low': 1.5},
        {'property_id': 'p1', 'aspect': 'breakfast', 'stars': 2.5, 'ci_low': 2.0},
        # Need at least 4 ops aspects for 'valid_ops_count' >= 4
        {'property_id': 'p1', 'aspect': 'cleanliness', 'stars': 2.0, 'ci_low': 1.5},
        {'property_id': 'p1', 'aspect': 'accountability', 'stars': 2.0, 'ci_low': 1.5},
    ])
    
    pricing = pd.DataFrame([{'id': 'p1', 'price_index': 1.3}])
    prox = pd.DataFrame([{'id': 'p1', 'lakeside_tier': 'lakefront'}])
    
    # Add dummy data to ensure HuberRegressor runs (needs >=8 properties)
    for i in range(2, 10):
        aspects = pd.concat([aspects, pd.DataFrame([
            {'property_id': f'p{i}', 'aspect': 'view', 'stars': 3.0, 'ci_low': 3.0},
            {'property_id': f'p{i}', 'aspect': 'service', 'stars': 3.5, 'ci_low': 3.5},
            {'property_id': f'p{i}', 'aspect': 'breakfast', 'stars': 3.5, 'ci_low': 3.5},
            {'property_id': f'p{i}', 'aspect': 'cleanliness', 'stars': 3.5, 'ci_low': 3.5},
            {'property_id': f'p{i}', 'aspect': 'accountability', 'stars': 3.5, 'ci_low': 3.5},
        ])])
        pricing = pd.concat([pricing, pd.DataFrame([{'id': f'p{i}', 'price_index': 1.0}])])
        prox = pd.concat([prox, pd.DataFrame([{'id': f'p{i}', 'lakeside_tier': 'inland'}])])

    res = score_properties(aspects, pricing, prox, cfg)
    
    # Assert p1 gets PREMIUM ILLUSION
    p1_res = res[res['property_id'] == 'p1'].iloc[0]
    assert p1_res['verdict'] == "PREMIUM ILLUSION", f"Expected PREMIUM ILLUSION, got {p1_res['verdict']}"
