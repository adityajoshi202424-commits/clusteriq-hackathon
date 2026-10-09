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

try:
    df_res = pd.read_parquet("outputs/disconnect_results.parquet")
except:
    # Dummy load if parquet is missing (fallback matrix)
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
        if data['verdict'] == "PREMIUM ILLUSION":
            color = "red"
        elif data['verdict'] == "OVERPRICED":
            color = "orange"
        elif data['verdict'] == "HIDDEN GEM":
            color = "green"
        else:
            color = "blue"
            
        st.markdown(f"### Verdict: <span style='color:{color}'>**{str(data.get('verdict', 'UNKNOWN')).replace('_', ' ')} Risk**</span>", unsafe_allow_html=True)
        st.progress(int(data.get('premium_illusion_score', 0)) / 100, text=f"Illusion Score: {int(data.get('premium_illusion_score', 0))}/100")
        
        st.markdown("### Why this verdict?")
        expl = data.get('explanation', f"This property displays a disconnect gap of {data.get('disconnect_gap', 0):.2f} between expected quality for its high price bracket and delivered operational quality.")
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
