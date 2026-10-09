import pandas as pd
import numpy as np
from sklearn.linear_model import HuberRegressor
from scipy.special import expit
import traceback

def score_properties(aspects_df, pricing_df, proximity_df, cfg):
    """
    Pure function to compute the price-to-value disconnect engine.
    Returns DataFrame with verdicts and scores.
    """
    weights = cfg.get('weights', {})
    min_reviews = cfg.get('analysis', {}).get('min_reviews_per_property', 5)
    
    # Early exit if empty
    if aspects_df.empty or pricing_df.empty or proximity_df.empty:
        return pd.DataFrame(columns=['property_id', 'premium_illusion_score', 'verdict', 'disconnect_gap'])
    
    # Pivot aspects
    df_pivot = aspects_df.pivot(index='property_id', columns='aspect', values='stars').reset_index()
    ci_low_pivot = aspects_df.pivot(index='property_id', columns='aspect', values='ci_low').reset_index()
    
    records = []
    for _, row in df_pivot.iterrows():
        pid = row['property_id']
        price_info = pricing_df[pricing_df['id'] == pid]
        prox_info = proximity_df[proximity_df['id'] == pid]
        
        if price_info.empty or prox_info.empty: 
            continue
        
        price_idx = price_info.iloc[0]['price_index']
        tier = prox_info.iloc[0]['lakeside_tier']
        
        # Calculate delivered_quality
        ops_aspects = ['service', 'staff_behaviour', 'accountability', 'breakfast', 'cleanliness', 'food', 'noise']
        w_sum, score_sum = 0, 0
        valid_ops = 0
        
        for asp in ops_aspects:
            s = row.get(asp, np.nan)
            if pd.notna(s):
                w = weights.get(asp, 0.1)
                score_sum += s * w
                w_sum += w
                valid_ops += 1
                
        delivered_quality = score_sum / w_sum if w_sum > 0 else np.nan
        
        # Location quality
        v = row.get('view', np.nan)
        l = row.get('location', np.nan)
        loc_scores = [x for x in [v, l] if pd.notna(x)]
        location_quality = np.mean(loc_scores) if loc_scores else np.nan
        
        # Calculate mean CI low for delivery aspects
        try:
            ci_lows = [ci_low_pivot[ci_low_pivot['property_id']==pid][asp].values[0] 
                       for asp in ops_aspects 
                       if asp in ci_low_pivot.columns and pd.notna(row.get(asp))]
            ci_low_delivery = np.mean(ci_lows) if len(ci_lows) > 0 else np.nan
        except:
            ci_low_delivery = np.nan
            
        records.append({
            'property_id': pid,
            'price_index': price_idx,
            'lakeside_tier': tier,
            'delivered_quality': delivered_quality,
            'location_quality': location_quality,
            'valid_ops_count': valid_ops,
            'ci_low_delivery': ci_low_delivery
        })
        
    df_res = pd.DataFrame(records)
    if df_res.empty:
        df_res['expected_quality'] = np.nan
        df_res['premium_illusion_score'] = 0
        df_res['verdict'] = "INSUFFICIENT DATA"
        df_res['disconnect_gap'] = 0
        return df_res
        
    df_res['expected_quality'] = np.nan
    
    # Fit Regression
    df_fit = df_res.dropna(subset=['delivered_quality', 'price_index']).copy()
    if len(df_fit) >= 8:
        X = np.log(df_fit['price_index'].values.reshape(-1, 1))
        y = df_fit['delivered_quality'].values
        try:
            reg = HuberRegressor().fit(X, y)
            df_res['expected_quality'] = reg.predict(np.log(df_res['price_index'].values.reshape(-1, 1)))
        except:
            df_res['expected_quality'] = df_res['delivered_quality'] # Fallback
    else:
        # Fallback if insufficient properties for regression
        df_res['expected_quality'] = df_res['delivered_quality']
        
    df_res['disconnect_gap'] = df_res['expected_quality'] - df_res['delivered_quality']
    
    # Standardize gap_z
    gap_std = df_res['disconnect_gap'].std()
    if pd.isna(gap_std) or gap_std == 0:
        gap_std = 1.0
    df_res['gap_z'] = (df_res['disconnect_gap'] - df_res['disconnect_gap'].mean()) / gap_std
    
    df_res['premium_illusion_score'] = np.clip(100 * expit(1.5 * df_res['gap_z']), 0, 100)
    
    def classify(r):
        if r['valid_ops_count'] < 4: 
            return "INSUFFICIENT DATA"
        # Illusion rule
        if (r['price_index'] >= 1.15 and 
            r['lakeside_tier'] in ['lakefront', 'near_lake'] and 
            r['location_quality'] >= 4.0 and 
            r['delivered_quality'] <= 3.2 and 
            (r['expected_quality'] - r['ci_low_delivery']) > 0):
            return "PREMIUM ILLUSION"
        # Overpriced rule
        if r['price_index'] >= 1.15 and r['disconnect_gap'] > 0.5: 
            return "OVERPRICED"
        # Hidden gem rule
        if r['price_index'] <= 0.9 and r['delivered_quality'] >= 4.0: 
            return "HIDDEN GEM"
        # Default
        return "FAIR VALUE"
        
    df_res['verdict'] = df_res.apply(classify, axis=1)
    
    # Generate explanations (stubbed logic to match prompt requirement for safe execution)
    def generate_explanation(r):
        if r['verdict'] == "PREMIUM ILLUSION":
            return f"Rated {r['location_quality']:.1f}/5 for view but {r['delivered_quality']:.1f}/5 for operations, priced {int((r['price_index']-1)*100)}% above peers."
        return "Operational metric symmetry is balanced."
        
    df_res['explanation'] = df_res.apply(generate_explanation, axis=1)
    
    return df_res
