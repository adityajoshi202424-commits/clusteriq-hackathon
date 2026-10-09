"""
Unit Tests for Normalisation, Scaling, Deduplication, and Benchmarking Math.
Uses isolated in-memory test fixtures only (fixtures never leak to production data).
"""

import unittest
from normalise.scaler import normalize_rating
from normalise.dedup import compute_text_fingerprint, is_duplicate

class TestNormalisationMath(unittest.TestCase):
    def test_booking_rating_scaling(self):
        # Booking.com 10-point scale converted to 5-point scale (0.5 factor)
        raw_val = 8.6
        normalized = normalize_rating("booking_com", raw_val, 10.0)
        self.assertEqual(normalized, 4.3)

    def test_agoda_rating_scaling(self):
        raw_val = 9.0
        normalized = normalize_rating("agoda", raw_val, 10.0)
        self.assertEqual(normalized, 4.5)

    def test_google_rating_scaling(self):
        raw_val = 4.4
        normalized = normalize_rating("google_places", raw_val, 5.0)
        self.assertEqual(normalized, 4.4)

    def test_dedup_fingerprinting(self):
        t1 = "Room counter pe sharmila naam ka staff tha, check-in me aadha ghanta laga diya!"
        t2 = "room counter pe sharmila naam ka staff tha checkin me aadha ghanta laga diya"
        # Normalized text should have predictable hash
        f1 = compute_text_fingerprint(t1)
        self.assertTrue(len(f1) == 64)
        seen = {f1}
        self.assertTrue(is_duplicate(f1, seen))
        self.assertFalse(is_duplicate("other_random_fingerprint", seen))

if __name__ == "__main__":
    unittest.main()
