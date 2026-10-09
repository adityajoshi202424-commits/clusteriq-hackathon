import pandas as pd
import numpy as np
import yaml
import os
from datetime import datetime

def load_lexicon(path="config/aspect_lexicon.yaml"):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def assign_aspects(text, lexicon):
    text = str(text).lower()
    found = []
    for aspect, keywords in lexicon.items():
        if any(kw in text for kw in keywords):
            found.append(aspect)
    return found if found else ["none"]

def compute_aspect_scores(df_reviews, cfg, lexicon_path="config/aspect_lexicon.yaml"):
    lexicon = load_lexicon(lexicon_path)
    k = cfg.get("analysis", {}).get("shrinkage_k", 10)
    hl = cfg.get("analysis", {}).get("recency_half_life_days", 180)
    
    records = []
    now = pd.to_datetime('today')
    
    # Process reviews
    for _, row in df_reviews.iterrows():
        aspects = assign_aspects(row['text'], lexicon)
        
        # Simple sentiment fallback (scale -1 to 1)
        sentiment = row.get('sentiment', 0)
        if isinstance(sentiment, str):
            sentiment = 1 if sentiment.lower() == 'positive' else -1 if sentiment.lower() == 'negative' else 0
            
        try:
            age_days = (now - pd.to_datetime(row['date'])).days
        except:
            age_days = 0
            
        weight = 0.5 ** (age_days / hl) if hl > 0 else 1.0
        
        for asp in aspects:
            if asp != "none":
                records.append({
                    'property_id': row['property_id'],
                    'aspect': asp,
                    'sentiment': sentiment,
                    'weight': weight
                })
                
    df_aspects = pd.DataFrame(records)
    if df_aspects.empty:
        return pd.DataFrame(columns=['property_id', 'aspect', 'stars', 'n_mentions', 'ci_low', 'ci_high'])
        
    # Shrinkage
    peer_means = df_aspects.groupby('aspect').apply(lambda x: np.average(x['sentiment'], weights=x['weight'])).to_dict()
    
    results = []
    for (prop_id, asp), group in df_aspects.groupby(['property_id', 'aspect']):
        n = len(group)
        mean_sent = np.average(group['sentiment'], weights=group['weight'])
        peer_mean = peer_means.get(asp, 0)
        
        shrunk_mean = (n * mean_sent + k * peer_mean) / (n + k)
        stars = 1 + 4 * (shrunk_mean + 1) / 2
        
        # Bootstrap CI
        if n >= 5:
            np.random.seed(42)
            boot_means = []
            vals = group['sentiment'].values
            weights = group['weight'].values
            for _ in range(200):
                idx = np.random.randint(0, n, n)
                bm = np.average(vals[idx], weights=weights[idx]) if sum(weights[idx])>0 else 0
                sm = (n * bm + k * peer_mean) / (n + k)
                boot_means.append(1 + 4 * (sm + 1) / 2)
            ci_low, ci_high = np.percentile(boot_means, [5, 95])
        else:
            ci_low, ci_high = stars, stars
            
        results.append({
            'property_id': prop_id,
            'aspect': asp,
            'stars': stars,
            'n_mentions': n,
            'ci_low': ci_low,
            'ci_high': ci_high
        })
        
    res_df = pd.DataFrame(results)
    res_df.loc[res_df['n_mentions'] < 5, 'stars'] = np.nan # Mark insufficient
    return res_df
