"""
Base Collector Interface & Ethical Web Crawler Compliance
Defines rate limiting, user-agent headers, robots.txt verification, and review collection contract.
"""

import os
import time
import yaml
import requests
import urllib.robotparser
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config")

def load_sources_config() -> Dict[str, Any]:
    src_file = os.path.join(CONFIG_DIR, "sources.yaml")
    if os.path.exists(src_file):
        with open(src_file, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    return {}

SOURCES_CFG = load_sources_config()

class BaseCollector(ABC):
    def __init__(self, platform_id: str):
        self.platform_id = platform_id
        self.cfg = SOURCES_CFG.get("platforms", {}).get(platform_id, {})
        self.user_agent = SOURCES_CFG.get("user_agent", "ClusterReviewIntelligence-Bot/1.0 (Ethical Research; TBI-GEU)")
        self.rate_limit_rpm = self.cfg.get("rate_limit_req_per_min", 30)
        self.delay_between_requests = 60.0 / self.rate_limit_rpm if self.rate_limit_rpm > 0 else 0.5
        self.max_reviews = self.cfg.get("max_reviews_per_property", 100)
        self.timeout = self.cfg.get("timeout_seconds", 5)
        self.last_request_time = 0.0

    def polite_sleep(self, delay: Optional[float] = None):
        """Throttles outbound HTTP calls politely."""
        target_delay = delay if delay is not None else self.delay_between_requests
        if self.last_request_time > 0:
            elapsed = time.time() - self.last_request_time
            if elapsed < target_delay:
                time.sleep(target_delay - elapsed)
        self.last_request_time = time.time()

    def get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,hi;q=0.8"
        }

    def check_robots_txt(self, robots_url: str, target_path: str) -> bool:
        """Inspects remote robots.txt for compliance with our user agent."""
        try:
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            can_fetch = rp.can_fetch(self.user_agent, target_path)
            return can_fetch
        except Exception:
            # Conservative default: assume allowed unless explicitly disallowed
            return True

    @abstractmethod
    def collect_reviews(self, property_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Collects reviews for a given property. Must return empty list and log if blocked."""
        pass
