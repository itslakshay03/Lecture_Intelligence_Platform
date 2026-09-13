import os
import uuid
import pytest
from fastapi.testclient import TestClient

from main import app, OUTPUT_DIR
from services.task_repository import (
    initialize_database,
    create_task,
    update_task,
    get_task,
    delete_task,
    create_user,
)
from services.auth_service import hash_password, create_access_token

# Unauthenticated client (no default headers)
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    initialize_database()


def create_test_user_and_token(name="Test User", email=None, password="ValidPassword123!"):
    unique_email = email or f"user_{uuid.uuid4().hex[:8]}@lectra.ai"
    p_hash, salt = hash_password(password)
    user = create_user(email=unique_email, name=name, password_hash=p_hash, salt=salt)
    token = create_access_token(user["id"], user["email"], user["name"])
    return user, token, {"Authorization": f"Bearer {token}"}


# =====================================================================
# 1. /auth Routes Testing
# =====================================================================

def test_register_successful():
    """Test 1: User registration succeeds and returns token and safe profile."""
    email = f"student_{uuid.uuid4().hex[:8]}@lectra.ai"
    res = client.post("/auth/register", json={
        "name": "Jane Student",
        "email": email,
        "password": "SecurePassword123!"
    })
    assert res.status_code == 201
    data = res.json()
    assert "token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == email.lower()
    assert data["user"]["name"] == "Jane Student"
    assert "password_hash" not in data["user"]
    assert "salt" not in data["user"]


def test_register_duplicate_email():
    """Test 2: Duplicate email registration returns 409 Conflict."""
    email = f"dup_{uuid.uuid4().hex[:8]}@lectra.ai"
    client.post("/auth/register", json={
        "name": "First User",
        "email": email,
        "password": "SecurePassword123!"
    })
    res_dup = client.post("/auth/register", json={
        "name": "Second User",
        "email": email.upper(),  # Case-insensitive duplicate check
        "password": "SecurePassword123!"
    })
    assert res_dup.status_code == 409
    assert "already exists" in res_dup.json()["detail"]


def test_register_weak_password():
    """Test 3: Weak/short password returns 400 Bad Request."""
    email = f"weak_{uuid.uuid4().hex[:8]}@lectra.ai"
    res = client.post("/auth/register", json={
        "name": "Weak Pwd",
        "email": email,
        "password": "short"
    })
    assert res.status_code == 400
    assert "8 characters" in res.json()["detail"]


def test_login_successful():
    """Test 4: Login with correct credentials returns token and safe profile."""
    email = f"login_{uuid.uuid4().hex[:8]}@lectra.ai"
    pwd = "MySecretPassword123!"
    client.post("/auth/register", json={
        "name": "Login User",
        "email": email,
        "password": pwd
    })

    res = client.post("/auth/login", json={
        "email": email,
        "password": pwd
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == email.lower()
    assert "password_hash" not in data["user"]


def test_login_incorrect_password():
    """Test 5: Login with wrong password returns generic 401."""
    email = f"wrong_pwd_{uuid.uuid4().hex[:8]}@lectra.ai"
    client.post("/auth/register", json={
        "name": "User",
        "email": email,
        "password": "CorrectPassword123!"
    })

    res = client.post("/auth/login", json={
        "email": email,
        "password": "WrongPassword123!"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_login_unknown_email():
    """Test 6: Login with unregistered email returns generic 401."""
    res = client.post("/auth/login", json={
        "email": "doesnotexist@lectra.ai",
        "password": "SomePassword123!"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_auth_me_valid_token():
    """Test 7: /auth/me returns the currently authenticated user profile."""
    user, _, headers = create_test_user_and_token(name="Auth Me User")
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["id"] == user["id"]
    assert data["user"]["email"] == user["email"]
    assert data["user"]["name"] == "Auth Me User"


def test_auth_me_missing_token():
    """Test 8: /auth/me without token returns 401 or 403."""
    res = client.get("/auth/me")
    assert res.status_code in (401, 403)


def test_auth_me_invalid_token():
    """Test 9: /auth/me with garbage or malformed token returns 401."""
    res = client.get("/auth/me", headers={"Authorization": "Bearer not.a.valid.jwt"})
    assert res.status_code == 401


def test_logout_endpoint():
    """Test 10: /auth/logout returns clean acknowledgment."""
    _, _, headers = create_test_user_and_token()
    res = client.post("/auth/logout", headers=headers)
    assert res.status_code == 200
    assert "Logged out successfully" in res.json()["message"]


# =====================================================================
# 2. /lectures Route & Tenant Isolation Testing
# =====================================================================

def test_lectures_authenticated_returns_user_tasks():
    """Test 11: Authenticated /lectures returns user's tasks."""
    user, _, headers = create_test_user_and_token(name="Lectures User")
    tid1 = str(uuid.uuid4())
    tid2 = str(uuid.uuid4())
    create_task(tid1, status="completed", url="https://youtube.com/watch?v=v1", user_id=user["id"], title="Lecture 1")
    create_task(tid2, status="pending", url="https://youtube.com/watch?v=v2", user_id=user["id"], title="Lecture 2")

    res = client.get("/lectures", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 2
    task_ids = [l["task_id"] for l in data["lectures"]]
    assert tid1 in task_ids
    assert tid2 in task_ids


def test_lectures_unauthenticated_rejected():
    """Test 12: /lectures without authentication is rejected (401/403)."""
    res = client.get("/lectures")
    assert res.status_code in (401, 403)


def test_lectures_tenant_isolation():
    """Test 13: User A cannot see User B's lectures."""
    user_a, _, headers_a = create_test_user_and_token(name="User A")
    user_b, _, headers_b = create_test_user_and_token(name="User B")

    tid_a = str(uuid.uuid4())
    tid_b = str(uuid.uuid4())
    create_task(tid_a, status="completed", url="https://youtube.com/watch?v=a", user_id=user_a["id"], title="Lecture A")
    create_task(tid_b, status="completed", url="https://youtube.com/watch?v=b", user_id=user_b["id"], title="Lecture B")

    res_a = client.get("/lectures", headers=headers_a).json()
    res_b = client.get("/lectures", headers=headers_b).json()

    a_task_ids = [l["task_id"] for l in res_a["lectures"]]
    b_task_ids = [l["task_id"] for l in res_b["lectures"]]

    assert tid_a in a_task_ids
    assert tid_b not in a_task_ids

    assert tid_b in b_task_ids
    assert tid_a not in b_task_ids


# =====================================================================
# 3. /youtube Route Authentication & Ownership Testing
# =====================================================================

def test_youtube_unauthenticated_rejected():
    """Test 14: Unauthenticated POST /youtube is rejected."""
    res = client.post("/youtube", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
    assert res.status_code in (401, 403)


def test_youtube_authenticated_assigns_user_id(monkeypatch):
    """Test 15: Authenticated POST /youtube creates task owned by current user."""
    import main
    monkeypatch.setattr(main, "process_youtube_video", lambda *a, **k: None)

    user, _, headers = create_test_user_and_token(name="Creator User")
    res = client.post("/youtube", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}, headers=headers)
    assert res.status_code == 202
    data = res.json()
    task_id = data["task_id"]

    task = get_task(task_id)
    assert task is not None
    assert task["user_id"] == user["id"]
    delete_task(task_id)


# =====================================================================
# 4. Task Access & IDOR Protection Testing
# =====================================================================

def test_user_can_access_own_task():
    """Test 16: User can access own task status."""
    user, _, headers = create_test_user_and_token()
    tid = str(uuid.uuid4())
    create_task(tid, status="completed", url="https://youtube.com/watch?v=own", user_id=user["id"])

    res = client.get(f"/tasks/{tid}", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "completed"


def test_user_cannot_access_another_user_task_idor():
    """Test 17: User A cannot access User B's task status (IDOR returns 404)."""
    user_a, _, headers_a = create_test_user_and_token(name="User A")
    user_b, _, headers_b = create_test_user_and_token(name="User B")

    tid_b = str(uuid.uuid4())
    create_task(tid_b, status="completed", url="https://youtube.com/watch?v=private", user_id=user_b["id"])

    # User B can access
    res_b = client.get(f"/tasks/{tid_b}", headers=headers_b)
    assert res_b.status_code == 200

    # User A is denied with 404 (does not leak existence)
    res_a = client.get(f"/tasks/{tid_b}", headers=headers_a)
    assert res_a.status_code == 404
    assert res_a.json()["detail"] == "Task not found."


def test_user_cannot_access_another_user_task_content_idor():
    """Test 18: User A cannot retrieve User B's study pack content."""
    user_a, _, headers_a = create_test_user_and_token(name="User A")
    user_b, _, headers_b = create_test_user_and_token(name="User B")

    tid_b = str(uuid.uuid4())
    create_task(tid_b, status="completed", url="https://youtube.com/watch?v=secretB", user_id=user_b["id"])
    update_task(tid_b, status="completed", video_id="secretB")

    # User A tries to read User B's study pack
    res_a = client.get(f"/tasks/{tid_b}/content", headers=headers_a)
    assert res_a.status_code == 404
    assert res_a.json()["detail"] == "Task not found."


def test_user_cannot_download_another_user_pdf_idor():
    """Test 19: User A cannot download User B's PDF."""
    user_a, _, headers_a = create_test_user_and_token(name="User A")
    user_b, _, headers_b = create_test_user_and_token(name="User B")

    tid_b = str(uuid.uuid4())
    create_task(tid_b, status="completed", url="https://youtube.com/watch?v=secretB", user_id=user_b["id"])
    dummy_pdf = OUTPUT_DIR / "dummy_test.pdf"
    dummy_pdf.write_bytes(b"%PDF-1.4 test content")
    update_task(tid_b, status="completed", pdf_path=str(dummy_pdf))

    try:
        # User A tries to download User B's PDF
        res_a = client.get(f"/download/{tid_b}", headers=headers_a)
        assert res_a.status_code == 404
        assert res_a.json()["detail"] == "Task not found."
    finally:
        if dummy_pdf.exists():
            dummy_pdf.unlink()


# =====================================================================
# 5. Local Data Claim Testing
# =====================================================================

def test_user_can_claim_unowned_task():
    """Test 20: User can claim unowned legacy tasks."""
    user, _, headers = create_test_user_and_token()
    tid = str(uuid.uuid4())
    create_task(tid, status="completed", url="https://youtube.com/watch?v=unowned")

    res = client.post("/lectures/claim-local", json={"task_ids": [tid]}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["claimed_count"] == 1
    assert tid in data["claimed_task_ids"]

    # Verify task is now owned by user
    task = get_task(tid)
    assert task["user_id"] == user["id"]


def test_user_cannot_claim_another_users_task():
    """Test 21: User A cannot steal or claim User B's task."""
    user_a, _, headers_a = create_test_user_and_token(name="User A")
    user_b, _, headers_b = create_test_user_and_token(name="User B")

    tid_b = str(uuid.uuid4())
    create_task(tid_b, status="completed", url="https://youtube.com/watch?v=owned_by_b", user_id=user_b["id"])

    # User A attempts to claim User B's task
    res_a = client.post("/lectures/claim-local", json={"task_ids": [tid_b]}, headers=headers_a)
    assert res_a.status_code == 200
    data = res_a.json()
    assert data["claimed_count"] == 0
    assert tid_b not in data["claimed_task_ids"]

    # Verify ownership remains with User B
    task = get_task(tid_b)
    assert task["user_id"] == user_b["id"]


def test_claim_operation_is_idempotent():
    """Test 22: Re-running claim on already owned tasks succeeds idempotently without error."""
    user, _, headers = create_test_user_and_token()
    tid = str(uuid.uuid4())
    create_task(tid, status="completed", url="https://youtube.com/watch?v=idem")

    res1 = client.post("/lectures/claim-local", json={"task_ids": [tid]}, headers=headers)
    assert res1.json()["claimed_count"] == 1

    res2 = client.post("/lectures/claim-local", json={"task_ids": [tid]}, headers=headers)
    assert res2.json()["claimed_count"] == 1
    assert res2.json()["claimed_task_ids"] == [tid]
