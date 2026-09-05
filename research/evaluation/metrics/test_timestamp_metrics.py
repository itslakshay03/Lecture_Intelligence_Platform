"""
Unit tests for timestamp_metrics.py using synthetic toy numbers.

IMPORTANT — these numbers are NOT lecture data and are NOT a research
result. They exist only to prove the metric arithmetic is implemented
correctly (Phase 4 §21 "validate metric calculations" / §16). No claim
about LectraAI's real accuracy may ever cite this file.

Run with: python -m unittest research/evaluation/metrics/test_timestamp_metrics.py
(or `python test_timestamp_metrics.py` from this directory)
"""
import unittest

from timestamp_metrics import (
    ReferenceWindow,
    topic_error_seconds,
    mean_absolute_error,
    median_absolute_error,
    percent_within_threshold,
    summarize_errors,
    naive_equal_interval_timestamps,
)


class TestTopicErrorSeconds(unittest.TestCase):
    def test_prediction_inside_window_is_zero_error(self):
        w = ReferenceWindow(start_sec=100.0, end_sec=110.0)
        self.assertEqual(topic_error_seconds(105.0, w), 0.0)
        # boundary-inclusive
        self.assertEqual(topic_error_seconds(100.0, w), 0.0)
        self.assertEqual(topic_error_seconds(110.0, w), 0.0)

    def test_prediction_before_window_measures_to_nearer_edge(self):
        w = ReferenceWindow(start_sec=100.0, end_sec=110.0)
        self.assertEqual(topic_error_seconds(90.0, w), 10.0)

    def test_prediction_after_window_measures_to_nearer_edge(self):
        w = ReferenceWindow(start_sec=100.0, end_sec=110.0)
        self.assertEqual(topic_error_seconds(125.0, w), 15.0)

    def test_invalid_window_raises(self):
        with self.assertRaises(ValueError):
            ReferenceWindow(start_sec=50.0, end_sec=40.0)


class TestAggregateMetrics(unittest.TestCase):
    def setUp(self):
        # synthetic toy error values (seconds) -- NOT real annotation data
        self.toy_errors = [0.0, 2.0, 4.0, 6.0, 40.0]

    def test_mean_absolute_error(self):
        self.assertAlmostEqual(mean_absolute_error(self.toy_errors), 10.4)

    def test_median_absolute_error(self):
        self.assertEqual(median_absolute_error(self.toy_errors), 4.0)

    def test_percent_within_threshold(self):
        self.assertAlmostEqual(percent_within_threshold(self.toy_errors, 5), 60.0)
        self.assertAlmostEqual(percent_within_threshold(self.toy_errors, 10), 80.0)
        self.assertAlmostEqual(percent_within_threshold(self.toy_errors, 30), 80.0)

    def test_empty_input_raises_instead_of_returning_zero(self):
        # NO FAKE DATA rule: an empty sample must error, never silently report 0.
        with self.assertRaises(ValueError):
            mean_absolute_error([])
        with self.assertRaises(ValueError):
            median_absolute_error([])
        with self.assertRaises(ValueError):
            percent_within_threshold([], 5)

    def test_summarize_errors_shape(self):
        summary = summarize_errors(self.toy_errors)
        self.assertEqual(
            set(summary.keys()),
            {"n_topics", "mae_sec", "median_ae_sec", "pct_within_5s", "pct_within_10s", "pct_within_30s"},
        )
        self.assertEqual(summary["n_topics"], 5)


class TestNaiveEqualIntervalBaseline(unittest.TestCase):
    def test_even_spacing_over_toy_duration(self):
        # toy inputs: 4 topics over a 400-second (toy) video
        result = naive_equal_interval_timestamps(n_topics=4, duration_sec=400.0)
        self.assertEqual(result, [0.0, 100.0, 200.0, 300.0])

    def test_zero_topics_returns_empty(self):
        self.assertEqual(naive_equal_interval_timestamps(0, 400.0), [])

    def test_negative_duration_raises(self):
        with self.assertRaises(ValueError):
            naive_equal_interval_timestamps(3, -1.0)


if __name__ == "__main__":
    unittest.main()
