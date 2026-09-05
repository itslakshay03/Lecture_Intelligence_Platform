"""
End-to-end workflow + task-lifecycle tests.

The real process_youtube_video pipeline is executed (real SQLite, real
study-pack parsing, real markdown->HTML), but the three external/expensive
stages -- transcript fetch, Gemini call, Playwright PDF render -- are
substituted with deterministic fakes so the test is fast and offline while
still verifying that:

  * output of each stage is passed to the next,
  * task status transitions pending -> processing -> completed / failed,
  * exceptions in any stage drive the task to 'failed' (never stuck),
  * the structured study pack is retrievable via the content endpoint,
  * concurrent submissions don't corrupt state.
"""
import os
import time
import uuid
import threading

import pytest
from fastapi.testclient import TestClient

import main
from services.task_repository import (
    initialize_database, create_task, update_task, get_task, delete_task,
)

client = TestClient(main.app)

FAKE_MD = """# 📘 Fake Lecture Title

### 📌 Overview
A deterministic overview line for tests.

## ⚙️ First Concept
- First key point about the first concept.
- Second key point about the first concept.

## ⚙️ Second Concept
- A point about the second concept.
"""


@pytest.fixture(autouse=True)
def _db():
    initialize_database()
    yield


@pytest.fixture
def fake_pipeline(monkeypatch, tmp_path):
    """Replace the 3 external stages with deterministic local fakes."""
    seen = {}

    def fake_get_transcript(url):
        seen["transcript_url"] = url
        text = "\n[⏱ 00:00] intro to first concept \n[⏱ 01:30] now the second concept"
        return text, "2-4 pages (Focused Study Guide)", "abcdefghijk", 200.0

    def fake_generate_notes(transcript_text, target_pages, metadata=None):
        seen["notes_input"] = transcript_text
        seen["target_pages"] = target_pages
        # Phase 4 instrumentation: real generate_notes populates `metadata`
        # in-place when given a dict; mirror that here so main.py's new
        # metadata.get(...) calls after this fake see realistic values.
        if metadata is not None:
            metadata["generation_method"] = "gemini"
            metadata["model_name_used"] = "fake-model-for-tests"
        return FAKE_MD

    def fake_generate_pdf(notes, output_path):
        seen["pdf_notes"] = notes
        with open(output_path, "wb") as f:
            f.write(b"%PDF-1.4 fake\n")

    monkeypatch.setattr(main, "get_transcript", fake_get_transcript)
    monkeypatch.setattr(main, "generate_notes", fake_generate_notes)
    monkeypatch.setattr(main, "generate_pdf", fake_generate_pdf)
    # deterministic video id + isolated cache dir
    monkeypatch.setattr("services.transcript.extract_video_id", lambda url: "abcdefghijk")
    monkeypatch.setattr(main, "OUTPUT_DIR", tmp_path)
    return seen


def _run(task_id, url, force_refresh=False):
    main.process_youtube_video(task_id, url, force_refresh)


# --------------------------------------------------------------------------
# Happy path
# --------------------------------------------------------------------------
def test_full_workflow_reaches_completed_and_chains_stages(fake_pipeline):
    tid = str(uuid.uuid4())
    create_task(tid, "pending", "https://youtu.be/abcdefghijk")
    _run(tid, "https://youtu.be/abcdefghijk")

    task = get_task(tid)
    assert task["status"] == "completed"
    assert task["video_id"] == "abcdefghijk"
    assert task["pdf_path"] and os.path.exists(task["pdf_path"])

    # stage chaining: transcript text reached the notes stage;
    # notes markdown reached the pdf stage.
    assert "second concept" in fake_pipeline["notes_input"]
    assert fake_pipeline["pdf_notes"].startswith("# 📘 Fake Lecture Title")

    # structured study pack retrievable and complete
    r = client.get(f"/tasks/{tid}/content")
    assert r.status_code == 200
    pack = r.json()
    for key in ("notes_markdown", "topics", "quiz", "flashcards",
                "revision_plan", "interview_questions", "timestamps",
                "video_duration"):
        assert key in pack
    assert pack["video_duration"] == 200.0
    assert all(0 <= t["sec"] < 200.0 for t in pack["timestamps"])
    delete_task(tid)


def test_status_endpoint_reports_completed_with_download_url(fake_pipeline):
    tid = str(uuid.uuid4())
    create_task(tid, "pending", "https://youtu.be/abcdefghijk")
    _run(tid, "https://youtu.be/abcdefghijk")
    body = client.get(f"/tasks/{tid}").json()
    assert body["status"] == "completed"
    assert body["download_url"] == f"/download/{tid}"
    dl = client.get(f"/download/{tid}")
    assert dl.status_code == 200
    assert dl.headers["content-type"] == "application/pdf"
    delete_task(tid)


# --------------------------------------------------------------------------
# Failure paths -- every stage failure must land on 'failed', never stuck
# --------------------------------------------------------------------------
def test_invalid_url_marks_failed(fake_pipeline, monkeypatch):
    def boom(url):
        raise ValueError("Could not extract YouTube video ID from the provided URL format.")
    monkeypatch.setattr("services.transcript.extract_video_id", boom)
    tid = str(uuid.uuid4())
    create_task(tid, "pending", "not-a-url")
    _run(tid, "not-a-url")
    task = get_task(tid)
    assert task["status"] == "failed"
    assert "video ID" in task["error"]


def test_transcript_failure_marks_failed(fake_pipeline, monkeypatch):
    def boom(url):
        raise ValueError("Transcripts are disabled for this video")
    monkeypatch.setattr(main, "get_transcript", boom)
    tid = str(uuid.uuid4())
    create_task(tid, "pending", "https://youtu.be/abcdefghijk")
    _run(tid, "https://youtu.be/abcdefghijk")
    assert get_task(tid)["status"] == "failed"


def test_ai_stage_unexpected_exception_marks_failed(fake_pipeline, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("gemini exploded unexpectedly")
    monkeypatch.setattr(main, "generate_notes", boom)
    tid = str(uuid.uuid4())
    create_task(tid, "pending", "https://youtu.be/abcdefghijk")
    _run(tid, "https://youtu.be/abcdefghijk")
    task = get_task(tid)
    assert task["status"] == "failed"
    assert "RuntimeError" in task["error"]


def test_pdf_stage_failure_marks_failed(fake_pipeline, monkeypatch):
    def boom(notes, output_path):
        raise OSError("playwright/chromium not available")
    monkeypatch.setattr(main, "generate_pdf", boom)
    tid = str(uuid.uuid4())
    create_task(tid, "pending", "https://youtu.be/abcdefghijk")
    _run(tid, "https://youtu.be/abcdefghijk")
    assert get_task(tid)["status"] == "failed"


# --------------------------------------------------------------------------
# Concurrency / duplicates
# --------------------------------------------------------------------------
def test_concurrent_workflows_do_not_corrupt_state(fake_pipeline):
    ids = [str(uuid.uuid4()) for _ in range(12)]
    for tid in ids:
        create_task(tid, "pending", "https://youtu.be/abcdefghijk")
    threads = [threading.Thread(target=_run, args=(t, "https://youtu.be/abcdefghijk"))
               for t in ids]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)
    for tid in ids:
        assert get_task(tid)["status"] == "completed"
        delete_task(tid)


def test_no_task_left_in_processing_after_run(fake_pipeline, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("late failure")
    monkeypatch.setattr(main, "generate_pdf", boom)
    tid = str(uuid.uuid4())
    create_task(tid, "pending", "https://youtu.be/abcdefghijk")
    _run(tid, "https://youtu.be/abcdefghijk")
    assert get_task(tid)["status"] in ("failed", "completed")
    delete_task(tid)
