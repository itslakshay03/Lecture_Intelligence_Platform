"""
API contract / validation tests for the LectraAI backend.

These exercise the real FastAPI app (via TestClient) with valid, invalid,
malformed, oversized and unexpected input and assert on status codes and
response shape. No external network calls are made: the background worker
is monkeypatched so /youtube returns immediately without touching YouTube
or Gemini.
"""
import uuid
import pytest
from fastapi.testclient import TestClient

import main
from services.task_repository import initialize_database, get_task, delete_task
from services.auth_service import ensure_demo_user, create_access_token

initialize_database()
_demo = ensure_demo_user()
_demo_token = create_access_token(_demo["id"], _demo["email"], _demo["name"])
client = TestClient(main.app, headers={"Authorization": f"Bearer {_demo_token}"})


@pytest.fixture(autouse=True)
def _db():
    initialize_database()
    yield


@pytest.fixture
def no_background(monkeypatch):
    """Stop the background thread from doing real work during API tests.

    The synchronous pre-flight in start_notes_generation only parses the URL
    (no network) and checks the local PDF cache, so it is safe to leave running.
    """
    monkeypatch.setattr(main, "process_youtube_video", lambda *a, **k: None)
    yield


# --------------------------------------------------------------------------
# GET /
# --------------------------------------------------------------------------
def test_home_ok():
    r = client.get("/")
    assert r.status_code == 200
    assert "message" in r.json()


# --------------------------------------------------------------------------
# POST /youtube  -- validation matrix
# --------------------------------------------------------------------------
def test_youtube_valid_returns_202_and_task(no_background):
    r = client.post("/youtube", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
    assert r.status_code == 202
    body = r.json()
    assert set(["task_id", "status", "message", "status_url"]).issubset(body)
    assert body["status"] in ("pending", "completed")
    assert get_task(body["task_id"]) is not None
    delete_task(body["task_id"])


def test_youtube_missing_url_field_422(no_background):
    r = client.post("/youtube", json={})
    assert r.status_code == 422


def test_youtube_wrong_type_url_422(no_background):
    r = client.post("/youtube", json={"url": 12345})
    assert r.status_code == 422


def test_youtube_null_url_422(no_background):
    r = client.post("/youtube", json={"url": None})
    assert r.status_code == 422


def test_youtube_non_json_body_422(no_background):
    r = client.post("/youtube", content="not json",
                    headers={"content-type": "application/json"})
    assert r.status_code == 422


def test_youtube_array_body_422(no_background):
    r = client.post("/youtube", json=["a", "b"])
    assert r.status_code == 422


def test_youtube_empty_url_string_is_accepted_then_fails_async(no_background):
    # Empty string is a valid *string*, so the request is accepted (202) and the
    # background worker is responsible for marking it failed.
    r = client.post("/youtube", json={"url": ""})
    assert r.status_code == 202
    delete_task(r.json()["task_id"])


def test_youtube_extremely_long_url_does_not_crash(no_background):
    long_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&x=" + "a" * 300_000
    r = client.post("/youtube", json={"url": long_url})
    assert r.status_code in (202, 413, 422)
    if r.status_code == 202:
        delete_task(r.json()["task_id"])


def test_youtube_duplicate_submissions_get_unique_task_ids(no_background):
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ids = [client.post("/youtube", json={"url": url}).json()["task_id"] for _ in range(6)]
    assert len(set(ids)) == 6
    for i in ids:
        delete_task(i)


# --------------------------------------------------------------------------
# GET /tasks/{id}
# --------------------------------------------------------------------------
@pytest.mark.parametrize("bad", [
    "not-a-uuid",
    "1' OR '1'='1",
    "../../etc/passwd",
    "12345",
    "%00",
])
def test_tasks_invalid_id_400(bad):
    r = client.get(f"/tasks/{bad}")
    assert r.status_code in (400, 404)
    if r.status_code == 400:
        assert "Invalid task ID format" in r.json()["detail"]


def test_tasks_valid_but_unknown_uuid_404():
    r = client.get(f"/tasks/{uuid.uuid4()}")
    assert r.status_code == 404
    assert r.json()["detail"] == "Task not found."


# --------------------------------------------------------------------------
# GET /download/{id}  and  GET /tasks/{id}/content
# --------------------------------------------------------------------------
def test_download_invalid_id_400():
    assert client.get("/download/not-a-uuid").status_code == 400


def test_download_unknown_uuid_404():
    assert client.get(f"/download/{uuid.uuid4()}").status_code == 404


def test_content_invalid_id_400():
    assert client.get("/tasks/not-a-uuid/content").status_code == 400


def test_content_unknown_uuid_404():
    assert client.get(f"/tasks/{uuid.uuid4()}/content").status_code == 404


# --------------------------------------------------------------------------
# Method / route negatives
# --------------------------------------------------------------------------
@pytest.mark.parametrize("method,path", [
    ("GET", "/youtube"),
    ("DELETE", "/youtube"),
    ("PUT", "/tasks/" + str(uuid.uuid4())),
    ("POST", "/tasks/" + str(uuid.uuid4())),
])
def test_method_not_allowed_405(method, path):
    assert client.request(method, path).status_code == 405


def test_unknown_route_404():
    assert client.get("/definitely/not/here").status_code == 404


# --------------------------------------------------------------------------
# CORS: wildcard origin must NOT be paired with credentials
# --------------------------------------------------------------------------
def test_cors_wildcard_without_credentials():
    r = client.get("/", headers={"Origin": "https://some-frontend.example"})
    # Wildcard is fine; credentials must not be advertised alongside it.
    assert r.headers.get("access-control-allow-credentials") != "true"
