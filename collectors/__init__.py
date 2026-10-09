"""
Collectors Registry for Cluster Review Intelligence.
Provides unified access to all platform collectors.
"""

from collectors.base import BaseCollector
from collectors.google_places import google_collector
from collectors.tripadvisor import tripadvisor_collector
from collectors.booking import booking_collector
from collectors.makemytrip import makemytrip_collector
from collectors.agoda import agoda_collector

COLLECTORS = {
    "google_places": google_collector,
    "tripadvisor": tripadvisor_collector,
    "booking_com": booking_collector,
    "makemytrip": makemytrip_collector,
    "agoda": agoda_collector
}

def get_collector(platform_id: str) -> BaseCollector:
    return COLLECTORS.get(platform_id)
