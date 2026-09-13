import uuid
import pytest
from fastapi.testclient import TestClient

from main import app
from services.task_repository import (
    initialize_database,
    create_task,
    update_task,
    get_task,
    create_user,
)
from services.auth_service import hash_password, create_access_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    initialize_database()


def create_test_user(name="User", email=None, password="ValidPassword123!"):
    unique_email = email or f"user_{uuid.uuid4().hex[:8]}@lectra.ai"
    p_hash, salt = hash_password(password)
    user = create_user(email=unique_email, name=name, password_hash=p_hash, salt=salt)
    token = create_access_token(user["id"], user["email"], user["name"])
    return user, token, {"Authorization": f"Bearer {token}"}


def test_lectures_endpoint_requires_auth():
    """Unauthenticated request to /lectures must return 401 or 403."""
    res = client.get("/lectures")
    assert res.status_code in (401, 403)


def test_claim_local_requires_auth():
    """Unauthenticated request to /lectures/claim-local must return 401 or 403."""
    res = client.post("/lectures/claim-local", json={"task_ids": ["dummy-id"]})
    assert res.status_code in (401, 403)


def test_empty_lectures_list_for_new_user():
    """A new registered user with no tasks should get empty list."""
    _, _, headers = create_test_user(name="Brand New User")
    res = client.get("/lectures", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "lectures" in data
    assert isinstance(data["lectures"], list)
    assert len(data["lectures"]) == 0
    assert data["count"] == 0


def test_server_backed_lecture_retrieval_and_fields():
    """User tasks are returned with proper metadata and fields."""
    user, _, headers = create_test_user(name="Lecture Student")
    tid = str(uuid.uuid4())
    create_task(
        tid,
        status="completed",
        url="https://youtube.com/watch?v=vid123",
        title="Intro to Neural Networks",
        user_id=user["id"]
    )
    update_task(tid, status="completed", video_id="vid123", pdf_path="dummy.pdf")

    res = client.get("/lectures", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 1
    items = data["lectures"]
    assert len(items) == 1
    lec = items[0]
    assert lec["task_id"] == tid
    assert lec["video_id"] == "vid123"
    assert lec["title"] == "Intro to Neural Networks"
    assert lec["status"] == "completed"
    assert "created_at" in lec


def test_multi_user_strict_isolation():
    """User A cannot see User B's lectures, and vice versa."""
    user_a, _, headers_a = create_test_user(name="User A")
    user_b, _, headers_b = create_test_user(name="User B")

    # Create 2 lectures for User A
    tid_a1 = str(uuid.uuid4())
    tid_a2 = str(uuid.uuid4())
    create_task(tid_a1, status="completed", url="https://youtube.com/watch?v=a1", title="Lecture A1", user_id=user_a["id"])
    create_task(tid_a2, status="processing", url="https://youtube.com/watch?v=a2", title="Lecture A2", user_id=user_a["id"])

    # Create 1 lecture for User B
    tid_b1 = str(uuid.uuid4())
    create_task(tid_b1, status="completed", url="https://youtube.com/watch?v=b1", title="Lecture B1", user_id=user_b["id"])

    # Query as User A
    res_a = client.get("/lectures", headers=headers_a)
    assert res_a.status_code == 200
    lectures_a = res_a.json()["lectures"]
    assert len(lectures_a) == 2
    task_ids_a = {l["task_id"] for l in lectures_a}
    assert task_ids_a == {tid_a1, tid_a2}
    assert tid_b1 not in task_ids_a

    # Query as User B
    res_b = client.get("/lectures", headers=headers_b)
    assert res_b.status_code == 200
    lectures_b = res_b.json()["lectures"]
    assert len(lectures_b) == 1
    assert lectures_b[0]["task_id"] == tid_b1


def test_localstorage_migration_and_claim_flow():
    """
    Simulates migration of unowned localStorage tasks into an authenticated user's account.
    """
    user, _, headers = create_test_user(name="Migrating User")

    # Create 2 legacy unowned tasks (simulating previous anonymous visits)
    tid_unowned_1 = str(uuid.uuid4())
    tid_unowned_2 = str(uuid.uuid4())
    create_task(tid_unowned_1, status="completed", url="https://youtube.com/watch?v=legacy1", title="Legacy Lecture 1")
    create_task(tid_unowned_2, status="completed", url="https://youtube.com/watch?v=legacy2", title="Legacy Lecture 2")

    # Call claim-local with the task IDs
    res_claim = client.post("/lectures/claim-local", json={"task_ids": [tid_unowned_1, tid_unowned_2]}, headers=headers)
    assert res_claim.status_code == 200
    claim_data = res_claim.json()
    assert claim_data["claimed_count"] == 2
    assert set(claim_data["claimed_task_ids"]) == {tid_unowned_1, tid_unowned_2}

    # Now GET /lectures must contain both claimed lectures
    res_lectures = client.get("/lectures", headers=headers)
    assert res_lectures.status_code == 200
    lec_list = res_lectures.json()["lectures"]
    assert len(lec_list) == 2
    lec_ids = {l["task_id"] for l in lec_list}
    assert lec_ids == {tid_unowned_1, tid_unowned_2}


def test_claim_cannot_steal_foreign_owned_tasks():
    """
    Malicious or accidental attempt to claim tasks owned by another user must be rejected.
    """
    victim, _, _ = create_test_user(name="Victim")
    attacker, _, headers_attacker = create_test_user(name="Attacker")

    tid_victim = str(uuid.uuid4())
    create_task(tid_victim, status="completed", url="https://youtube.com/watch?v=victim", title="Victim Private Data", user_id=victim["id"])

    # Attacker tries to claim victim's task
    res_claim = client.post("/lectures/claim-local", json={"task_ids": [tid_victim]}, headers=headers_attacker)
    assert res_claim.status_code == 200
    assert res_claim.json()["claimed_count"] == 0
    assert tid_victim not in res_claim.json()["claimed_task_ids"]

    # Verify task ownership did NOT change
    task = get_task(tid_victim)
    assert task["user_id"] == victim["id"]

    # Attacker's lecture list remains empty
    res_attacker = client.get("/lectures", headers=headers_attacker)
    assert len(res_attacker.json()["lectures"]) == 0


def test_logout_and_login_preserves_lectures():
    """
    Logging in with credentials across sessions preserves all tasks in SQLite.
    """
    email = f"persist_{uuid.uuid4().hex[:8]}@lectra.ai"
    pwd = "PersistentPass123!"

    # 1. Register
    reg_res = client.post("/auth/register", json={"name": "Session Tester", "email": email, "password": pwd})
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user"]["id"]
    token1 = reg_res.json()["token"]

    # 2. Add lecture to user
    tid = str(uuid.uuid4())
    create_task(tid, status="completed", url="https://youtube.com/watch?v=persist", title="Permanent Class", user_id=user_id)

    # 3. Verify lecture is returned
    r1 = client.get("/lectures", headers={"Authorization": f"Bearer {token1}"})
    assert len(r1.json()["lectures"]) == 1

    # 4. "Logout" (drop token1) and "Login" (get new token2)
    login_res = client.post("/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    token2 = login_res.json()["token"]

    # 5. Verify lecture is STILL present with new session token
    r2 = client.get("/lectures", headers={"Authorization": f"Bearer {token2}"})
    assert r2.status_code == 200
    assert len(r2.json()["lectures"]) == 1
    assert r2.json()["lectures"][0]["task_id"] == tid
    assert r2.json()["lectures"][0]["title"] == "Permanent Class"
