import pandas as pd
import numpy as np

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in meters between two points 
    on the earth (specified in decimal degrees).
    """
    R = 6371000  # radius of Earth in meters
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return R * c

def compute_proximity(properties_df, cfg):
    anchors = cfg.get('lake_anchors', {})
    t_lakefront = cfg.get('lakeside_thresholds', {}).get('lakefront', 150)
    t_near = cfg.get('lakeside_thresholds', {}).get('near_lake', 500)
    
    results = []
    for _, prop in properties_df.iterrows():
        min_dist = float('inf')
        for loc in anchors.values():
            d = haversine(prop['lat'], prop['lon'], loc['lat'], loc['lng'])
            if d < min_dist: 
                min_dist = d
            
        if min_dist <= t_lakefront:
            tier = "lakefront"
        elif min_dist <= t_near:
            tier = "near_lake"
        else:
            tier = "inland"
            
        results.append({
            'id': prop['id'], 
            'distance_to_lake_m': min_dist, 
            'lakeside_tier': tier
        })
        
    return pd.DataFrame(results)
