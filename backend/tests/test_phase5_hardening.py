import uuid
import sqlite3
import jwt
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

from main import app
from config import JWT_SECRET_KEY, JWT_ALGORITHM, DB_PATH
from services.task_repository import (
    initialize_database,
    create_task,
    update_task,
    get_task,
    create_user,
    _get_connection,
)
from services.auth_service import hash_password, create_access_token, decode_access_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    initialize_database()


def create_test_user(name="Hardened User", email=None):
    unique_email = email or f"h_user_{uuid.uuid4().hex[:8]}@lectra.ai"
    p_hash, salt = hash_password("ValidPassword123!")
    user = create_user(email=unique_email, name=name, password_hash=p_hash, salt=salt)
    token = create_access_token(user["id"], user["email"], user["name"])
    return user, token, {"Authorization": f"Bearer {token}"}


def test_composite_database_index_exists():
    """Verify that idx_tasks_user_created_at exists on tasks table for query acceleration."""
    with _get_connection() as conn:
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_tasks_user_created_at'"
        )
        row = cursor.fetchone()
        assert row is not None, "idx_tasks_user_created_at index missing from SQLite database"


def test_expired_jwt_token_returns_401():
    """Verify expired token returns 401 Unauthorized via /auth/me and /lectures."""
    user, _, _ = create_test_user(name="Expired Tester")
    
    # Generate an explicitly expired token (expired 2 hours ago)
    past_time = datetime.now(timezone.utc) - timedelta(hours=2)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "iat": int(past_time.timestamp()) - 3600,
        "exp": int(past_time.timestamp()),
    }
    expired_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    headers = {"Authorization": f"Bearer {expired_token}"}

    res_me = client.get("/auth/me", headers=headers)
    assert res_me.status_code == 401
    assert "expired" in res_me.json()["detail"].lower()

    res_lec = client.get("/lectures", headers=headers)
    assert res_lec.status_code == 401


def test_tampered_jwt_signature_returns_401():
    """Verify token signed with wrong key returns 401 Unauthorized."""
    user, _, _ = create_test_user(name="Tamper Tester")
    
    # Sign token with an attacker secret
    attacker_secret = "attacker-unauthorized-secret-key-123"
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=1)).timestamp()),
    }
    tampered_token = jwt.encode(payload, attacker_secret, algorithm=JWT_ALGORITHM)
    headers = {"Authorization": f"Bearer {tampered_token}"}

    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 401


def test_migration_idempotency_preserves_data():
    """Running initialize_database() multiple times causes zero loss or corruption."""
    user, _, _ = create_test_user(name="Preserved User")
    tid = str(uuid.uuid4())
    create_task(tid, status="completed", url="https://youtube.com/watch?v=pers", title="Preserved Lecture", user_id=user["id"])

    # Re-run initialize_database multiple times
    initialize_database()
    initialize_database()

    # Verify task still exists intact
    task = get_task(tid)
    assert task is not None
    assert task["task_id"] == tid
    assert task["user_id"] == user["id"]
    assert task["title"] == "Preserved Lecture"


def test_complete_idor_protection_matrix():
    """Comprehensive check: User A cannot read, list, or download any task owned by User B."""
    user_a, _, headers_a = create_test_user(name="User Alpha")
    user_b, _, headers_b = create_test_user(name="User Beta")

    tid_b = str(uuid.uuid4())
    create_task(tid_b, status="completed", url="https://youtube.com/watch?v=secretB", title="Secret B", user_id=user_b["id"])
    update_task(tid_b, status="completed", video_id="secretB")

    # 1. User A checks User B task status -> 404 (not found / not owned)
    res_status = client.get(f"/tasks/{tid_b}", headers=headers_a)
    assert res_status.status_code == 404

    # 2. User A requests User B task content -> 404
    res_content = client.get(f"/tasks/{tid_b}/content", headers=headers_a)
    assert res_content.status_code == 404

    # 3. User A requests User B PDF download -> 404
    res_dl = client.get(f"/download/{tid_b}", headers=headers_a)
    assert res_dl.status_code == 404

    # 4. User A checks lecture list -> User B task not listed
    res_list = client.get("/lectures", headers=headers_a)
    assert res_list.status_code == 200
    task_ids = [l["task_id"] for l in res_list.json()["lectures"]]
    assert tid_b not in task_ids

    # 5. User B CAN access their own task
    res_b_status = client.get(f"/tasks/{tid_b}", headers=headers_b)
    assert res_b_status.status_code == 200
    assert res_b_status.json()["status"] == "completed"
    assert res_b_status.json()["download_url"] == f"/download/{tid_b}"


def test_task_creation_stamps_authenticated_user_id():
    """User cannot pass an arbitrary user_id to spoof ownership."""
    user, _, headers = create_test_user(name="Spoof Attacker")
    fake_victim_id = str(uuid.uuid4())

    # Even if client attempts to pass user_id in payload, backend ignores it
    res = client.post(
        "/youtube",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "user_id": fake_victim_id},
        headers=headers,
    )
    assert res.status_code == 202
    data = res.json()
    tid = data["task_id"]

    # Verify task is stamped with authenticated user's id, NOT victim id
    task = get_task(tid)
    assert task["user_id"] == user["id"]
    assert task["user_id"] != fake_victim_id
