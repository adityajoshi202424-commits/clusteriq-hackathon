# Cluster Review Intelligence: Lakeside Premium Illusion Detector

## Methodology
The Price-to-Value Disconnect Engine uses Bayesian shrinkage to isolate aspect-based sentiment scores. It calculates haversine distance to lake anchors to classify lakeside tiers. An RLM regression predicts expected quality based on price index.

## Limitations & Assumptions
- **Statistical Signal**: Results are empirical signals, not factual accusations. Flagged properties are labeled as "Risk".
- **Missing Data**: Properties with insufficient data (<5 reviews or <4 active operational aspects) are excluded rather than imputed to avoid synthetic bias. 

## Setup & Execution

### Install Dependencies
```bash
pip install pandas numpy pyyaml scikit-learn streamlit plotly pytest
```

### Run Pipeline
```bash
python scripts/run_engine.py
```

### Run Tests
```bash
pytest tests/test_disconnect_engine.py
```

### Launch App
```bash
streamlit run ui/app.py
```
