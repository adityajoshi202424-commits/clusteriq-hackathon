import pandas as pd
import os

def normalize_prices(properties_df, cfg, price_file="data/prices.csv"):
    bands = cfg.get('analysis', {}).get('price_bands', {'budget': 2000, 'midscale': 5000, 'premium': 10000})
    
    if os.path.exists(price_file):
        df_prices = pd.read_csv(price_file)
        med_prices = df_prices.groupby('property_id')['nightly_price_inr'].median().reset_index()
    else:
        # Fallback to price bands
        med_prices = properties_df[['id', 'segment']].copy()
        med_prices.rename(columns={'id': 'property_id'}, inplace=True)
        # Use default if segment not in mapping
        med_prices['nightly_price_inr'] = med_prices['segment'].map(lambda x: bands.get(x.lower(), 5000) if pd.notna(x) else 5000)
        med_prices['using_fallback'] = True
        med_prices.drop(columns=['segment'], inplace=True)
        
    df_merged = properties_df.merge(med_prices, left_on='id', right_on='property_id', how='left')
    
    # Normalise against same hotspot and segment
    peer_medians = df_merged.groupby(['hotspot', 'segment'])['nightly_price_inr'].transform('median')
    df_merged['price_index'] = df_merged['nightly_price_inr'] / peer_medians.replace(0, 1)
    
    # Return minimal columns, keeping using_fallback if it exists
    cols_to_return = ['id', 'price_index', 'nightly_price_inr']
    if 'using_fallback' in med_prices.columns:
        cols_to_return.append('using_fallback')
        
    return df_merged[cols_to_return]
