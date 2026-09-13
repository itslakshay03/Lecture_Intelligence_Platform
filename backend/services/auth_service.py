import os
import hmac
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_DAYS,
    DEMO_USER_EMAIL,
    DEMO_USER_NAME,
    DEMO_USER_PASSWORD,
    DEMO_USER_ID,
    AUTO_MIGRATE_LEGACY_TASKS,
)
from services.task_repository import (
    get_user_by_id,
    create_or_update_legacy_demo_user,
    assign_unowned_tasks_to_user,
)

logger = logging.getLogger("auth_service")
logger.setLevel(logging.INFO)

# Security scheme for FastAPI OpenAPI docs and Bearer token parsing
http_bearer = HTTPBearer(auto_error=True)
optional_http_bearer = HTTPBearer(auto_error=False)

# PBKDF2 parameters per OWASP recommendation
PBKDF2_ITERATIONS = 600_000
HASH_NAME = "sha256"


# =====================================================================
# 1. Password Hashing & Verification
# =====================================================================

def validate_password_strength(password: str) -> None:
    """
    Validates basic password criteria.
    Raises ValueError if criteria are not met.
    """
    if not password:
        raise ValueError("Password cannot be empty.")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(password) > 128:
        raise ValueError("Password must not exceed 128 characters.")


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """
    Computes a salted PBKDF2-HMAC-SHA256 password hash.

    Args:
        password: Raw plaintext password.
        salt: Optional 32-character hex salt. If None, a new cryptographically secure salt is generated.

    Returns:
        Tuple of (hash_hex, salt_hex).
    """
    if not salt:
        salt_bytes = os.urandom(16)
        salt_hex = salt_bytes.hex()
    else:
        salt_hex = salt
        salt_bytes = bytes.fromhex(salt_hex)

    derived = hashlib.pbkdf2_hmac(
        HASH_NAME,
        password.encode("utf-8"),
        salt_bytes,
        PBKDF2_ITERATIONS,
    )
    return derived.hex(), salt_hex


def verify_password(password: str, stored_hash: str, stored_salt: str) -> bool:
    """
    Verifies a plaintext password against a stored hash and salt using constant-time comparison.
    """
    if not password or not stored_hash or not stored_salt:
        return False
    try:
        salt_bytes = bytes.fromhex(stored_salt)
        derived = hashlib.pbkdf2_hmac(
            HASH_NAME,
            password.encode("utf-8"),
            salt_bytes,
            PBKDF2_ITERATIONS,
        )
        return hmac.compare_digest(stored_hash, derived.hex())
    except (ValueError, TypeError):
        return False


# =====================================================================
# 2. Token Authentication (JWT)
# =====================================================================

def create_access_token(
    user_id: str,
    email: str,
    name: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generates a signed JWT access token.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "email": email.strip().lower(),
        "name": name.strip(),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    encoded = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT access token.
    Raises HTTPException(401) on expired, malformed, or invalid tokens.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    expired_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat"]},
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token verification failed: signature expired.")
        raise expired_exception
    except jwt.PyJWTError as e:
        logger.warning(f"Token verification failed: {e}")
        raise credentials_exception


# =====================================================================
# 3. Current User Dependency
# =====================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
) -> Dict[str, Any]:
    """
    FastAPI dependency that validates the Bearer token in the Authorization header
    and retrieves the corresponding user record from SQLite.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")

    user = get_user_by_id(user_id, include_secrets=False)
    if not user:
        logger.warning(f"Authentication rejected: User {user_id} not found in database.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_http_bearer),
) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency for optional authentication.
    Returns the authenticated user dict if a valid token is provided, else None.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id:
            return get_user_by_id(user_id, include_secrets=False)
    except HTTPException:
        return None
    return None


# =====================================================================
# 4. Legacy Data Preservation & Demo User Seeding
# =====================================================================

def ensure_demo_user() -> Dict[str, Any]:
    """
    Idempotently ensures that the configured legacy/demo user exists in SQLite.
    If AUTO_MIGRATE_LEGACY_TASKS is enabled, assigns existing unowned historical
    tasks (user_id IS NULL) to the demo user so they remain accessible.
    """
    try:
        # Generate deterministic or salted hash for demo user
        p_hash, salt = hash_password(DEMO_USER_PASSWORD)
        user = create_or_update_legacy_demo_user(
            email=DEMO_USER_EMAIL,
            name=DEMO_USER_NAME,
            password_hash=p_hash,
            salt=salt,
            user_id=DEMO_USER_ID,
        )

        if AUTO_MIGRATE_LEGACY_TASKS:
            migrated_count = assign_unowned_tasks_to_user(user["id"])
            if migrated_count > 0:
                logger.info(f"Preserved {migrated_count} legacy tasks under demo user {DEMO_USER_EMAIL}.")

        return user
    except Exception as e:
        logger.error(f"Error during legacy demo user initialization: {e}")
        raise
