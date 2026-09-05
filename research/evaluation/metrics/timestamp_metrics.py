"""
Timestamp-grounding accuracy metrics (Experiment A / RQ1).

Research-only module. Not imported by, and does not import from, any
`backend/` production module except indirectly via the data it consumes
(the study-pack JSON shape documented in Phase 1 §10). Safe to run with
no network access and no API keys.

Reference (per-topic) error definition, per Phase 3 §8 / Phase 4 §7:

  For a topic with a human-annotated tolerance window [t_start, t_end]:
    - if the assigned timestamp `t_pred` falls inside the window -> error = 0
    - otherwise -> error = distance from t_pred to the NEARER edge of the
      window: min(|t_pred - t_start|, |t_pred - t_end|)

This module does not decide *which* window to score a prediction against
when a topic has multiple annotated occurrences (strict vs. lenient
scoring, Phase 3 §8) -- that selection is the caller's responsibility;
this module only computes the arithmetic once the correct reference
window has been chosen.
"""
from __future__ import annotations

from dataclasses import dataclass
from statistics import median
from typing import Sequence


@dataclass(frozen=True)
class ReferenceWindow:
    """A human-annotated tolerance window for one topic (Phase 4 §annotations)."""
    start_sec: float
    end_sec: float

    def __post_init__(self):
        if self.end_sec < self.start_sec:
            raise ValueError(
                f"ReferenceWindow end ({self.end_sec}) is before start ({self.start_sec})"
            )


def topic_error_seconds(predicted_sec: float, window: ReferenceWindow) -> float:
    """
    Per-topic temporal error, in seconds, per the definition above.
    Returns 0.0 if predicted_sec falls inside [window.start_sec, window.end_sec].
    """
    if window.start_sec <= predicted_sec <= window.end_sec:
        return 0.0
    return min(abs(predicted_sec - window.start_sec), abs(predicted_sec - window.end_sec))


def mean_absolute_error(errors_sec: Sequence[float]) -> float:
    """Mean of the per-topic error values. Raises ValueError on an empty sequence
    (an empty sample must never silently report 0.0 error — see NO FAKE DATA rule)."""
    if not errors_sec:
        raise ValueError("mean_absolute_error: empty error list — DATA REQUIRED, not zero.")
    return sum(errors_sec) / len(errors_sec)


def median_absolute_error(errors_sec: Sequence[float]) -> float:
    """Median of the per-topic error values."""
    if not errors_sec:
        raise ValueError("median_absolute_error: empty error list — DATA REQUIRED, not zero.")
    return median(errors_sec)


def percent_within_threshold(errors_sec: Sequence[float], threshold_sec: float) -> float:
    """
    Percentage (0-100) of topics whose error is <= threshold_sec.
    threshold_sec is inclusive, matching Phase 3's "% within ±Ns" definition.
    """
    if not errors_sec:
        raise ValueError("percent_within_threshold: empty error list — DATA REQUIRED, not zero.")
    within = sum(1 for e in errors_sec if e <= threshold_sec)
    return 100.0 * within / len(errors_sec)


def summarize_errors(errors_sec: Sequence[float]) -> dict:
    """
    Convenience wrapper producing the full metric set defined in Phase 3
    §10 / §16 for one condition (e.g., LectraAI method, or naive baseline).

    Returns a plain dict — the caller is responsible for attaching the
    provenance metadata (lecture set, condition name, scoring mode
    strict/lenient, computation timestamp) required by Phase 4 §22
    (Data Integrity) before persisting this to results/.
    """
    return {
        "n_topics": len(errors_sec),
        "mae_sec": mean_absolute_error(errors_sec),
        "median_ae_sec": median_absolute_error(errors_sec),
        "pct_within_5s": percent_within_threshold(errors_sec, 5),
        "pct_within_10s": percent_within_threshold(errors_sec, 10),
        "pct_within_30s": percent_within_threshold(errors_sec, 30),
    }


# ---------------------------------------------------------------------------
# Naive equal-interval baseline (Baseline 3, Phase 4 §11)
# ---------------------------------------------------------------------------

def naive_equal_interval_timestamps(n_topics: int, duration_sec: float) -> list[float]:
    """
    Baseline 3: assigns topics evenly spaced across the video duration,
    ignoring all content. This is the null/floor comparison for RQ1/H1
    (Phase 3 §5, §12).

    Uses the exact same two inputs (topic count, duration) that LectraAI's
    real method also has access to — no informational advantage either
    way (Phase 3 §12 "why fair").

    Placement convention: topic i (0-indexed) of n is placed at the start
    of its 1/n-th slice of the video: i * duration / n. This mirrors how a
    naive "just divide the video into N equal chunks" assignment would
    actually be built, and is documented here so the exact placement rule
    is reproducible rather than implicit.
    """
    if n_topics <= 0:
        return []
    if duration_sec < 0:
        raise ValueError("naive_equal_interval_timestamps: duration_sec must be >= 0")
    return [i * duration_sec / n_topics for i in range(n_topics)]
