import pandas as pd
import numpy as np
from typing import Dict, Any, List

class PremiumIllusionDetector:
    def __init__(self):
        # Initialize default air-gapped data if no DB is provided
        self.fallback_data = self._generate_fallback_matrix()

    def _generate_fallback_matrix(self):
        """AIR-GAPPED FALLBACK MATRIX for hackathon reliability."""
        np.random.seed(42)
        properties = [
            {"hotel_id": "alka_lakeside", "name": "Alka Lakeside Hotel", "location": "Nainital"},
            {"hotel_id": "fern_hillside", "name": "The Fern Hillside Resort", "location": "Bhimtal"}
        ]
        
        records = []
        aspects = ['Location', 'Value_for_Money', 'Food', 'Staff', 'Housekeeping', 'Booking_Experience']
        sentiments = ['Positive', 'Neutral', 'Negative']
        
        for prop in properties:
            for _ in range(50):
                # Alka gets high location, poor ops
                if prop['hotel_id'] == 'alka_lakeside':
                    asp = np.random.choice(aspects)
                    if asp == 'Location':
                        sent = np.random.choice(['Positive', 'Neutral'], p=[0.8, 0.2])
                    else:
                        sent = np.random.choice(['Negative', 'Neutral', 'Positive'], p=[0.6, 0.3, 0.1])
                else:
                    asp = np.random.choice(aspects)
                    sent = np.random.choice(sentiments)
                    
                records.append({
                    "hotel_id": prop["hotel_id"],
                    "hotel_name": prop["name"],
                    "aspect_category": asp,
                    "sentiment_polarity": sent,
                    "intensity_score": np.random.randint(1, 4)
                })
        
        return pd.DataFrame(records)

    def calculate_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Ingests aspect mentions DataFrame and calculates the Multi-Dimensional 5-Star Decomposition.
        """
        if df.empty:
            df = self.fallback_data
            
        # Map categorical to absolute numbers
        sentiment_map = {'Positive': 5.0, 'Neutral': 3.5, 'Negative': 1.0}
        
        # Ensure correct column names matching our schema or fallback schema
        cat_col = 'category' if 'category' in df.columns else 'aspect_category'
        sent_col = 'sentiment' if 'sentiment' in df.columns else 'sentiment_polarity'
        
        # Add numeric scores
        df_calc = df.copy()
        df_calc['numeric_score'] = df_calc[sent_col].map(lambda x: sentiment_map.get(x.capitalize(), 3.5))
        
        # Factor in intensity if available, otherwise default to 2
        if 'intensity_score' not in df_calc.columns:
            df_calc['intensity_score'] = 2
            
        df_calc['weighted_score'] = df_calc['numeric_score'] * df_calc['intensity_score']
        
        # Aggregate by category
        results = {}
        for cat in ['Location', 'Value_for_Money', 'Food', 'Staff', 'Housekeeping', 'Booking_Experience', 'Value', 'Cleanliness']:
            cat_df = df_calc[df_calc[cat_col] == cat]
            if len(cat_df) > 0:
                score = cat_df['weighted_score'].sum() / cat_df['intensity_score'].sum()
                results[cat] = round(score, 2)
            else:
                results[cat] = 0.0
                
        # Remap aliases if needed (e.g. Value -> Value_for_Money)
        view_score = results.get('Location', 0.0)
        cost_score = results.get('Value_for_Money', results.get('Value', 0.0))
        breakfast_score = results.get('Food', 0.0)
        staff_score = results.get('Staff', 0.0)
        
        # Accountability is Housekeeping + Booking_Experience. If missing, use Cleanliness
        hk = results.get('Housekeeping', results.get('Cleanliness', 0.0))
        be = results.get('Booking_Experience', 0.0)
        accountability_score = (hk + be) / 2 if (hk > 0 and be > 0) else (hk or be)
        
        ops_scores = [s for s in [breakfast_score, staff_score, accountability_score] if s > 0]
        ops_baseline = np.mean(ops_scores) if ops_scores else 0.0
        
        disconnect_delta = view_score - ops_baseline if ops_baseline > 0 and view_score > 0 else 0.0
        
        # Strict Categorical Verdict Flags
        if disconnect_delta >= 1.20:
            verdict = "🚨 OVERPRICED LAKESIDE MIRAGE DETECTED"
            verdict_desc = "This property exploits its lake proximity to obscure room utility and breakfast delay complaints."
            color = "rgba(244, 63, 94, 0.2)"
        elif cost_score <= 2.20 and view_score >= 4.00:
            verdict = "⚠️ HIGH PREMIUM CORRIDOR DRAG RISK"
            verdict_desc = "View sustains rating but severe cost-to-value drag risks long-term booking volume."
            color = "rgba(245, 158, 11, 0.2)"
        else:
            verdict = "✅ BALANCED OPERATIONAL METRIC SYMMETRY"
            verdict_desc = "Property delivers operational value matching its location premium."
            color = "rgba(16, 185, 129, 0.2)"
            
        return {
            "dimensions": {
                "🌅 View & Location": view_score,
                "💸 Cost & Value": cost_score,
                "🍳 Breakfast Quality": breakfast_score,
                "🤝 Staff Behavior": staff_score,
                "🛡️ Accountability & Service": accountability_score
            },
            "ops_baseline": round(float(ops_baseline), 2),
            "disconnect_delta": round(float(disconnect_delta), 2),
            "verdict": verdict,
            "verdict_desc": verdict_desc,
            "polygon_color": color
        }

illusion_detector = PremiumIllusionDetector()
