# Experiment A — Timestamp Accuracy (RQ1)

**Status: DESIGNED, NOT EXECUTED.**

## Conditions
1. LectraAI's real method — read directly from a real study-pack JSON's `topics[].seconds` field (`backend/utils/study_pack.py:_extract_grounded_timestamps`, unmodified).
2. Naive equal-interval baseline — `research/baselines/naive_timestamp/naive_timestamp.py` (implemented, pilot-validated against a real cached lecture).
3. Human reference — `research/annotations/timestamps/` (schema + instructions ready; zero annotations collected yet).

## What a runner script must do (Phase 5)
1. For each lecture in `dataset/manifest.csv` with `experiment_eligibility` including "A" and a non-null duration:
   - Load its real study-pack JSON topics + timestamps.
   - Compute the naive baseline via `naive_timestamp.py`.
   - Load the human reference annotation(s) for that lecture.
2. For each topic, compute `topic_error_seconds()` (strict: vs. primary occurrence only; lenient: vs. nearest valid occurrence) for both LectraAI's method and the naive baseline, using `research/evaluation/metrics/timestamp_metrics.py`.
3. Aggregate with `summarize_errors()` per condition, per scoring mode.
4. Feed the paired per-topic error arrays (LectraAI vs. naive, matched by topic) into `research/evaluation/statistics/paired_analysis.py`.
5. Write output to `results/raw/expA_<date>.json` with full provenance (dataset version, scoring mode, per-topic detail — not just the aggregate).

## Blocking items (DATA REQUIRED)
- Zero human timestamp annotations exist.
- `manifest.csv` currently lists only 7 candidate lectures (one excluded for missing duration) — short of the Phase 3-recommended N=18-20.
