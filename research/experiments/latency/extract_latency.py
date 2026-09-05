"""
Experiment D — Processing Efficiency: latency extraction.

Reads REAL rows from the production SQLite database (backend/data/tasks.db
by default, or wherever config.DB_PATH points) via the actual, unmodified
`services.task_repository.get_task` / `get_stage_events` functions —
read-only reuse of shipped code, not a research modification of it
(Phase 3 §15).

IMPORTANT (Phase 4 explicit instruction): this script does NOT treat the
220 pre-existing rows in the database (Phase 1 §9) as latency evidence —
those tasks predate the Phase 4 stage-event instrumentation entirely and
have no `task_stage_events` rows. This script only reports on tasks that
have BOTH a completed/failed status AND at least one stage_events row,
and says so explicitly in its output rather than silently returning an
empty or fabricated result for older tasks.

Usage:
    python extract_latency.py <task_id> [<task_id> ...]
    python extract_latency.py --since 2026-09-05T00:00:00
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parents[3] / "backend"
sys.path.insert(0, str(_BACKEND_DIR))
from services.task_repository import get_task, get_stage_events, list_tasks  # noqa: E402

STAGE_ORDER = ["transcript_fetch", "ai_generation", "transformation", "pdf_render"]


def _parse_iso(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def compute_task_latency(task_id: str) -> dict:
    """
    Returns per-stage and total latency for one task, computed strictly
    from real `task_stage_events` rows -- never estimated or interpolated.
    If a stage has no recorded start/end pair, its duration is reported as
    null with an explicit reason, never silently omitted or zeroed.
    """
    task = get_task(task_id)
    if task is None:
        raise ValueError(f"Task {task_id} not found -- DATA REQUIRED.")

    events = get_stage_events(task_id)
    if not events:
        return {
            "task_id": task_id,
            "status": task["status"],
            "generation_method": task.get("generation_method"),
            "model_name_used": task.get("model_name_used"),
            "transcript_char_count": task.get("transcript_char_count"),
            "stages": {},
            "total_latency_sec": None,
            "note": "DATA REQUIRED -- no task_stage_events rows for this task "
                    "(it predates Phase 4 instrumentation, or logging failed silently).",
        }

    by_stage: dict[str, dict] = {}
    for e in events:
        by_stage.setdefault(e["stage"], {})[e["event"]] = e["ts"]

    stage_durations = {}
    for stage in STAGE_ORDER:
        pair = by_stage.get(stage)
        if pair and "start" in pair and "end" in pair:
            start = _parse_iso(pair["start"])
            end = _parse_iso(pair["end"])
            stage_durations[stage] = (end - start).total_seconds()
        else:
            stage_durations[stage] = None  # DATA REQUIRED for this stage/task

    known_durations = [d for d in stage_durations.values() if d is not None]
    all_ts = [_parse_iso(e["ts"]) for e in events]
    total_latency = (max(all_ts) - min(all_ts)).total_seconds() if all_ts else None

    return {
        "task_id": task_id,
        "status": task["status"],
        "generation_method": task.get("generation_method"),
        "model_name_used": task.get("model_name_used"),
        "transcript_char_count": task.get("transcript_char_count"),
        "stages_sec": stage_durations,
        "n_stages_recorded": len(known_durations),
        "n_stages_expected": len(STAGE_ORDER),
        "total_latency_sec": total_latency,
    }


def find_tasks_with_stage_events(since_iso: str | None = None) -> list[str]:
    """
    Scans real tasks for ones that actually have stage-event data (i.e.,
    were processed after Phase 4's instrumentation was added). Does not
    assume every task qualifies.
    """
    candidates = list_tasks()
    if since_iso:
        cutoff = _parse_iso(since_iso)
        candidates = [t for t in candidates if _parse_iso(t["created_at"]) >= cutoff]
    qualifying = []
    for t in candidates:
        if get_stage_events(t["task_id"]):
            qualifying.append(t["task_id"])
    return qualifying


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("task_ids", nargs="*", help="Specific task IDs to analyze")
    parser.add_argument("--since", type=str, default=None, help="ISO timestamp; auto-discover qualifying tasks created after this time")
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    task_ids = args.task_ids
    if not task_ids:
        task_ids = find_tasks_with_stage_events(since_iso=args.since)
        if not task_ids:
            print(json.dumps({
                "note": "DATA REQUIRED -- no tasks with recorded stage_events found. "
                        "Run at least one real (or fake-pipeline) task through "
                        "main.process_youtube_video after the Phase 4 instrumentation "
                        "was added before this script has anything real to report on."
            }, indent=2))
            return

    results = [compute_task_latency(tid) for tid in task_ids]
    output = json.dumps({
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "n_tasks": len(results),
        "tasks": results,
    }, indent=2)

    if args.out:
        args.out.write_text(output, encoding="utf-8")
        print(f"Wrote {args.out}")
    else:
        print(output)


if __name__ == "__main__":
    main()
