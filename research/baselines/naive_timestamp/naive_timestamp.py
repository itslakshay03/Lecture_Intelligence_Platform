"""
Baseline 3 — Naive equal-interval timestamp assignment (Phase 3 §12, Phase 4 §11).

Purpose: the null/floor comparison condition for RQ1 (Experiment A). If
LectraAI's keyword-overlap method isn't clearly better than this, that is
itself an important, honestly-reportable finding (Phase 3 §5, H1).

Input: a real LectraAI study-pack JSON (the exact shape documented in
Phase 1 §10 and produced by backend/utils/study_pack.py), read READ-ONLY.
Output: one naive timestamp (seconds) per topic, in the same order as
`study_pack["topics"]`.

This script is research-only. It does not import anything from
`backend/services` or `backend/utils` — it only expects a JSON file
already produced by the real, unmodified production pipeline (e.g. one of
the files already cached under `backend/output/`), keeping the research/
and backend/ trees fully decoupled.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "evaluation" / "metrics"))
from timestamp_metrics import naive_equal_interval_timestamps  # noqa: E402


def run_naive_baseline(study_pack: dict) -> list[dict]:
    """
    Given a real study-pack dict (as returned by GET /tasks/{id}/content,
    Phase 1 §10), returns one naive-baseline timestamp record per topic:
        [{"topic_id": ..., "title": ..., "naive_sec": ...}, ...]

    Raises KeyError/ValueError loudly if the expected fields are missing —
    this script must never silently substitute a fabricated duration or
    topic list (NO FAKE DATA rule, Phase 4 §23).
    """
    topics = study_pack["topics"]
    duration = study_pack["video_duration"]
    if not isinstance(duration, (int, float)) or duration <= 0:
        raise ValueError(
            f"video_duration is missing or non-positive ({duration!r}) — "
            "cannot compute a naive baseline without a real duration. DATA REQUIRED."
        )
    naive_secs = naive_equal_interval_timestamps(n_topics=len(topics), duration_sec=float(duration))
    return [
        {"topic_id": t.get("id"), "title": t.get("title"), "naive_sec": naive_secs[i]}
        for i, t in enumerate(topics)
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("study_pack_json", type=Path, help="Path to a real cached study-pack .json file")
    parser.add_argument("--out", type=Path, default=None, help="Optional output JSON path (default: stdout)")
    args = parser.parse_args()

    with open(args.study_pack_json, "r", encoding="utf-8") as f:
        study_pack = json.load(f)

    result = {
        "source_file": str(args.study_pack_json),
        "video_id": study_pack.get("video_id"),
        "video_duration_sec": study_pack.get("video_duration"),
        "n_topics": len(study_pack.get("topics", [])),
        "naive_timestamps": run_naive_baseline(study_pack),
    }

    output = json.dumps(result, indent=2)
    if args.out:
        args.out.write_text(output, encoding="utf-8")
        print(f"Wrote {args.out}")
    else:
        print(output)


if __name__ == "__main__":
    main()
