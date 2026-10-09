"""
Honesty Smoke Test.
Verifies Rule 1: NOTHING IS HARD-CODED.
Scans computational modules to guarantee that no property names, sample reviews,
or synthetic ratings are embedded in production code.
"""

import os
import re
import unittest

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Modules that must strictly contain zero hard-coded properties or review texts
PROTECTED_DIRS = ["normalise", "extract", "benchmark", "trends", "destination"]

FORBIDDEN_PROPERTY_KEYWORDS = [
    "welcomhotel_savoy",
    "the savoy",
    "jw marriott",
    "jaypee residency",
    "hotel vishnu palace",
    "fortune resort grace",
    "hotel sungrace",
    "claridges nabha"
]

FORBIDDEN_REVIEW_STRINGS = [
    "sharmila naam ka staff",
    "geyser paani thanda de raha tha",
    "kachhi dhaani evening tea",
    "royal afghan dinner was divine"
]

class TestSmokeHonesty(unittest.TestCase):
    def test_no_hardcoded_properties_in_core_modules(self):
        violations = []
        for d in PROTECTED_DIRS:
            dir_path = os.path.join(PROJECT_ROOT, d)
            if not os.path.exists(dir_path):
                continue
            for root, _, files in os.walk(dir_path):
                for f in files:
                    if f.endswith(".py"):
                        file_path = os.path.join(root, f)
                        with open(file_path, "r", encoding="utf-8") as py_file:
                            content = py_file.read().lower()
                            for kw in FORBIDDEN_PROPERTY_KEYWORDS:
                                if kw in content:
                                    violations.append(f"{file_path}: Contains hard-coded property '{kw}'")
                            for rev in FORBIDDEN_REVIEW_STRINGS:
                                if rev in content:
                                    violations.append(f"{file_path}: Contains hard-coded review snippet '{rev}'")

        self.assertEqual(len(violations), 0, f"Violations found:\n" + "\n".join(violations))

if __name__ == "__main__":
    unittest.main()
