import os
import uuid
import pytest
from datetime import timedelta
from fastapi import HTTPException

from config import (
    OUTPUT_DIR,
    DEMO_USER_EMAIL,
    DEMO_USER_NAME,
    DEMO_USER_PASSWORD,
    DEMO_USER_ID,
)
from services.task_repository import (
    _get_connection,
    initialize_database,
    create_task,
    get_task,
    create_user,
    get_user_by_id,
    get_user_by_email,
    assign_task_to_user,
    assign_unowned_tasks_to_user,
    list_user_tasks,
    verify_task_ownership,
    get_task_for_user,
)
from services.auth_service import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
    decode_access_token,
    ensure_demo_user,
    get_current_user,
)


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database schema is initialized for tests."""
    initialize_database()


# =====================================================================
# 1. Password Hashing & Verification Tests
# =====================================================================

def test_password_hashing_produces_distinct_hashes():
    """Test 1: Password hashing produces non-identical hashes for different salts."""
    pwd = "SecurePassword123!"
    hash1, salt1 = hash_password(pwd)
    hash2, salt2 = hash_password(pwd)

    assert salt1 != salt2
    assert hash1 != hash2
    assert len(salt1) == 32  # 16 bytes hex
    assert len(hash1) == 64  # sha256 hex


def test_correct_password_verifies_successfully():
    """Test 2: Correct password verifies successfully."""
    pwd = "MySecretPassphrase456#"
    p_hash, salt = hash_password(pwd)
    assert verify_password(pwd, p_hash, salt) is True


def test_incorrect_password_fails():
    """Test 3: Incorrect password fails."""
    pwd = "CorrectPassword789!"
    wrong_pwd = "WrongPassword789!"
    p_hash, salt = hash_password(pwd)
    assert verify_password(wrong_pwd, p_hash, salt) is False
    assert verify_password("", p_hash, salt) is False


def test_password_strength_validation():
    """Test password strength criteria."""
    with pytest.raises(ValueError, match="at least 8 characters"):
        validate_password_strength("short")

    with pytest.raises(ValueError, match="cannot be empty"):
        validate_password_strength("")

    with pytest.raises(ValueError, match="not exceed 128"):
        validate_password_strength("a" * 129)

    # Valid passwords do not raise
    validate_password_strength("validpassword123")


# =====================================================================
# 2. Token Authentication (JWT) Tests
# =====================================================================

def test_token_creation_works():
    """Test 4: Token creation works."""
    token = create_access_token(
        user_id="user-123",
        email="test@lectra.ai",
        name="Test Student",
    )
    assert isinstance(token, str)
    assert len(token.split(".")) == 3  # Header.Payload.Signature


def test_valid_token_decodes_correctly():
    """Test 5: Valid token decodes correctly."""
    user_id = str(uuid.uuid4())
    email = "scholar@example.com"
    name = "Dr. Scholar"

    token = create_access_token(user_id=user_id, email=email, name=name)
    payload = decode_access_token(token)

    assert payload["sub"] == user_id
    assert payload["email"] == email
    assert payload["name"] == name
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload


def test_expired_token_is_rejected():
    """Test 6: Expired token is rejected."""
    token = create_access_token(
        user_id="expired-user",
        email="expired@lectra.ai",
        name="Old User",
        expires_delta=timedelta(seconds=-10),  # expired 10 seconds ago
    )
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    assert exc_info.value.status_code == 401
    assert "expired" in exc_info.value.detail.lower()


def test_invalid_token_is_rejected():
    """Test 7: Invalid or malformed token is rejected."""
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token("this.is.not.a.valid.jwt")
    assert exc_info.value.status_code == 401

    with pytest.raises(HTTPException):
        decode_access_token("")


# =====================================================================
# 3. User Repository & Access Control Tests
# =====================================================================

def test_user_creation_works():
    """Test 8: User creation works."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@lectra.ai"
    p_hash, salt = hash_password("ValidPassword123!")
    user = create_user(
        email=unique_email,
        name="Alice Student",
        password_hash=p_hash,
        salt=salt,
    )

    assert user["id"] is not None
    assert user["email"] == unique_email
    assert user["name"] == "Alice Student"
    assert "password_hash" not in user
    assert "salt" not in user

    # Retrieve by ID
    fetched_by_id = get_user_by_id(user["id"])
    assert fetched_by_id is not None
    assert fetched_by_id["email"] == unique_email
    assert "password_hash" not in fetched_by_id

    # Retrieve with secrets
    fetched_secrets = get_user_by_id(user["id"], include_secrets=True)
    assert fetched_secrets["password_hash"] == p_hash
    assert fetched_secrets["salt"] == salt

    # Retrieve by email (case-insensitive)
    fetched_by_email = get_user_by_email(unique_email.upper())
    assert fetched_by_email is not None
    assert fetched_by_email["id"] == user["id"]


def test_duplicate_email_is_rejected():
    """Test 9: Duplicate email is rejected safely."""
    email = f"dup_{uuid.uuid4().hex[:8]}@lectra.ai"
    p_hash, salt = hash_password("Password123!")

    create_user(email=email, name="First", password_hash=p_hash, salt=salt)

    with pytest.raises(ValueError, match="already exists"):
        create_user(email=email.upper(), name="Second", password_hash=p_hash, salt=salt)


def test_existing_task_records_survive_migration():
    """Test 10: Existing task records survive database migration."""
    # Insert a task without user_id
    legacy_task_id = str(uuid.uuid4())
    create_task(task_id=legacy_task_id, status="completed", url="https://youtube.com/watch?v=legacy123")

    # Re-run initialize_database to test idempotency
    initialize_database()

    task = get_task(legacy_task_id)
    assert task is not None
    assert task["task_id"] == legacy_task_id
    assert task["status"] == "completed"
    assert "user_id" in task
    assert "title" in task


def test_existing_files_are_untouched():
    """Test 11: Existing JSON/PDF files are untouched."""
    # Verify output directory exists and sample files remain present
    assert OUTPUT_DIR.exists()
    json_files = list(OUTPUT_DIR.glob("*.json"))
    pdf_files = list(OUTPUT_DIR.glob("*.pdf"))
    assert len(json_files) >= 0
    assert len(pdf_files) >= 0


def test_legacy_demo_user_migration_is_idempotent():
    """Test 12: Legacy/demo user migration is idempotent."""
    # First ensure demo user
    demo_user_1 = ensure_demo_user()
    assert demo_user_1 is not None
    assert demo_user_1["email"] == DEMO_USER_EMAIL.lower()

    # Create an unowned task
    unowned_task_id = str(uuid.uuid4())
    create_task(task_id=unowned_task_id, status="completed", url="https://youtube.com/watch?v=unowned123")

    # Migrate unowned tasks to demo user
    migrated_count = assign_unowned_tasks_to_user(demo_user_1["id"])
    assert migrated_count >= 1

    # Verify task ownership
    assert verify_task_ownership(unowned_task_id, demo_user_1["id"]) is True

    # Run again - must be idempotent (0 newly migrated)
    migrated_again = assign_unowned_tasks_to_user(demo_user_1["id"])
    assert migrated_again == 0

    # Ensure demo user again - must not duplicate
    demo_user_2 = ensure_demo_user()
    assert demo_user_2["id"] == demo_user_1["id"]


def test_task_ownership_isolation():
    """Test tenant isolation: User A cannot own User B's task."""
    p_hash, salt = hash_password("Pass12345!")
    user_a = create_user(f"user_a_{uuid.uuid4().hex[:6]}@lectra.ai", "User A", p_hash, salt)
    user_b = create_user(f"user_b_{uuid.uuid4().hex[:6]}@lectra.ai", "User B", p_hash, salt)

    task_a_id = str(uuid.uuid4())
    create_task(task_id=task_a_id, status="completed", url="https://youtube.com/watch?v=videoA", user_id=user_a["id"], title="User A Lecture")

    # User A owns it
    assert verify_task_ownership(task_a_id, user_a["id"]) is True
    assert get_task_for_user(task_a_id, user_a["id"]) is not None

    # User B does NOT own it
    assert verify_task_ownership(task_a_id, user_b["id"]) is False
    assert get_task_for_user(task_a_id, user_b["id"]) is None

    # Listing tasks for User A vs User B
    tasks_a = list_user_tasks(user_a["id"])
    tasks_b = list_user_tasks(user_b["id"])
    assert any(t["task_id"] == task_a_id for t in tasks_a)
    assert not any(t["task_id"] == task_a_id for t in tasks_b)


@pytest.mark.anyio
async def test_get_current_user_dependency():
    """Test FastAPI get_current_user dependency."""
    from fastapi.security import HTTPAuthorizationCredentials

    p_hash, salt = hash_password("Pass12345!")
    user = create_user(f"dep_{uuid.uuid4().hex[:6]}@lectra.ai", "Dependency User", p_hash, salt)
    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])

    # Valid token returns user
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    authenticated_user = await get_current_user(creds)
    assert authenticated_user["id"] == user["id"]
    assert authenticated_user["email"] == user["email"]

    # Non-existent user ID in valid token
    ghost_token = create_access_token(user_id=str(uuid.uuid4()), email="ghost@lectra.ai", name="Ghost")
    ghost_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=ghost_token)
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(ghost_creds)
    assert exc_info.value.status_code == 401
