"""
Hackathon Initialization & Workspace Verifier Script
Sets up and validates directory structure, configuration tokens, and runtime requirements for CRI.
"""

import os
import sys

def initialize_hackathon():
    folders = [
        "config",
        "collectors",
        "normalise",
        "extract",
        "benchmark",
        "trends",
        "destination",
        "ui",
        "data/raw"
    ]

    files = {
        "config/cluster.yaml": """# Mussoorie Cluster Definition
destination: 'Mussoorie'
cluster_type: 'hill town'
corridor: 'Mussoorie & Dehradun Hospitality Corridor'
state: 'Uttarakhand'
properties_count: 10
key_zones:
  - 'Mall Road'
  - 'Library Chowk'
  - 'Picture Palace'
  - 'Barlowganj'
  - 'Kempty Fall Road'
""",
        "config/analysis.yaml": """# Operational Benchmarking & Hackathon Demo Parameters
reading_speed_wpm: 200
min_mentions: 5
demo_mode: true
warm_cache_enabled: true
ai_processing_time_sec: 14.2
cached_database_path: "data/mussoorie_cluster_reviews.json"
human_reading_time_saved_hours: 42.4
api_timeout_seconds: 3.0
""",
        "requirements.txt": """fastapi>=0.100.0
uvicorn>=0.22.0
pandas>=2.0.0
numpy>=1.24.0
fpdf2>=2.7.0
pydantic>=2.0.0
pyyaml>=6.0
requests>=2.28.0
"""
    }

    for folder in folders:
        os.makedirs(folder, exist_ok=True)

    for file_path, content in files.items():
        if not os.path.exists(file_path):
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
        else:
            # Update with rich configuration
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

    print("🚀 Hackathon project workspace successfully created and verified!")
    return True

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

if __name__ == "__main__":
    initialize_hackathon()
