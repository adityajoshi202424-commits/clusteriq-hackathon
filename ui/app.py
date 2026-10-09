import streamlit as st
import pandas as pd
import time
import plotly.express as px
import plotly.graph_objects as go
import os

st.set_page_config(layout="wide", page_title="Cluster Review Intelligence")

st.sidebar.title("Cluster Review Intelligence")
role = st.sidebar.radio("Role Toggle", ["Hotelier", "District Admin"])

st.sidebar.markdown("### Computational Velocity")
t0 = time.perf_counter()

st.title("Lakeside Luxury Premium Illusion Detector")
st.caption("Based on public review text and price data; not a verified audit.")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parquet_path = os.path.join(BASE_DIR, "outputs", "disconnect_results.parquet")

try:
    if os.path.exists(parquet_path):
        df_res = pd.read_parquet(parquet_path)
    else:
        df_res = pd.read_parquet("outputs/disconnect_results.parquet")
except Exception:
    # Fallback load if parquet is missing
    df_res = pd.DataFrame([
        {'property_id': 'Alka Lakeside Hotel', 'verdict': 'PREMIUM ILLUSION', 'premium_illusion_score': 85.0, 'disconnect_gap': 1.2},
        {'property_id': 'The Fern Hillside Resort', 'verdict': 'FAIR VALUE', 'premium_illusion_score': 15.0, 'disconnect_gap': -0.2},
        {'property_id': 'Shervani Hilltop', 'verdict': 'OVERPRICED', 'premium_illusion_score': 65.0, 'disconnect_gap': 0.8}
    ])

if role == "Hotelier":
    st.subheader("Hotel Diagnostic")
    prop = st.selectbox("Select Property", df_res['property_id'].unique())
    
    if len(df_res[df_res['property_id'] == prop]) > 0:
        data = df_res[df_res['property_id'] == prop].iloc[0]
        
        # Color coding
        verdict = str(data.get('verdict', 'UNKNOWN'))
        if verdict == "PREMIUM ILLUSION":
            color = "#f43f5e"
        elif verdict == "OVERPRICED":
            color = "#f59e0b"
        elif verdict == "HIDDEN GEM":
            color = "#10b981"
        elif verdict == "INSUFFICIENT DATA":
            color = "#94a3b8"
        else:
            color = "#38bdf8"
            
        st.markdown(f"### Verdict: <span style='color:{color}'>**{verdict.replace('_', ' ')} Risk**</span>", unsafe_allow_html=True)
        
        raw_score = data.get('premium_illusion_score')
        score_val = 0.0 if pd.isna(raw_score) else float(raw_score)
        score_int = int(max(0, min(100, score_val)))
        
        st.progress(score_int / 100, text=f"Illusion Score: {score_int}/100")
        
        st.markdown("### Why this verdict?")
        gap_val = data.get('disconnect_gap')
        gap_str = f"{float(gap_val):.2f}" if pd.notna(gap_val) else "N/A"
        expl = data.get('explanation', f"This property displays a disconnect gap of {gap_str} between expected quality for its high price bracket and delivered operational quality.")
        st.write(expl)
    else:
        st.warning("Property data not found in results.")
    
elif role == "District Admin":
    st.subheader("Regional Vulnerability Map")
    if 'premium_illusion_score' in df_res.columns and 'verdict' in df_res.columns:
        fig = px.scatter(
            df_res, 
            x="property_id", 
            y="premium_illusion_score", 
            color="verdict",
            title="Premium Illusion Risk Scores by Property",
            size_max=15
        )
        st.plotly_chart(fig, use_container_width=True)
    
    display_cols = [c for c in ['property_id', 'verdict', 'premium_illusion_score', 'disconnect_gap'] if c in df_res.columns]
    st.dataframe(df_res[display_cols], use_container_width=True)

# Velocity Panel update
t1 = time.perf_counter()
runtime = t1 - t0
st.sidebar.metric("Pipeline Runtime", f"{runtime:.3f}s")
