"""
Cluster Review Intelligence (CRI)
Root entrypoint for Streamlit Community Cloud and cloud deployments.
"""
import os
import sys

# Ensure root directory is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Execute main UI application
import ui.app
