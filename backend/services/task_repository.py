import os
import sqlite3
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from config import DB_PATH, DB_DIR

# Setup structured logger
logger = logging.getLogger("task_repository")
logger.setLevel(logging.INFO)

def _get_connection() -> sqlite3.Connection:
    """
    Creates a new SQLite connection context.
    Provides thread-safe connections for FastAPI BackgroundTasks.
    """
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row  # Enables access by column name dict keys
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    return conn

# Phase 4 research instrumentation columns, added additively to the
# existing `tasks` table (never remove/redefine an existing column).
# Populated by services/ai.py (generation_method, model_name_used),
# prompts/smart.PROMPT_VERSION (prompt_version), and main.py
# (transcript_char_count). All nullable; absent on any row written before
# this migration, and simply left NULL for calls that don't supply them.
_RESEARCH_COLUMNS = {
    "generation_method": "TEXT",     # 'gemini' | 'offline_fallback'
    "model_name_used": "TEXT",       # e.g. one of FALLBACK_MODELS; NULL on offline fallback
    "prompt_version": "TEXT",        # e.g. 'SMART_PROMPT_v1'
    "transcript_char_count": "INTEGER",
}

# Phase 1 authentication and tenant-isolation columns, added additively
# to the existing `tasks` table. All nullable to preserve legacy tasks.
_AUTH_COLUMNS = {
    "user_id": "TEXT",
    "title": "TEXT",
}


def _ensure_columns(conn: sqlite3.Connection, table: str, columns: dict) -> None:
    """
    Idempotently adds any missing columns to `table`. SQLite has no
    "ADD COLUMN IF NOT EXISTS", so existing columns are checked first via
    PRAGMA table_info before attempting to add each missing one.
    """
    existing = {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    for col, col_type in columns.items():
        if col not in existing:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")


def initialize_database() -> None:
    """
    Creates the 'users' and 'tasks' tables inside SQLite database if they don't exist,
    applies additive column migrations for research & authentication, and sets up indexes.
    """
    try:
        with _get_connection() as conn:
            # Users table (Phase 1 authentication foundation)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

            # Tasks table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    task_id TEXT PRIMARY KEY,
                    video_id TEXT,
                    status TEXT,
                    message TEXT,
                    pdf_path TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    error TEXT
                );
            """)
            _ensure_columns(conn, "tasks", _RESEARCH_COLUMNS)
            _ensure_columns(conn, "tasks", _AUTH_COLUMNS)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_user_created_at ON tasks(user_id, created_at DESC);")

            # Phase 4 research instrumentation: stage-level start/end
            # timestamps for latency analysis (RQ4). Kept as a separate
            # table (rather than widening `tasks` further) since a task
            # has many stage events, not one.
            conn.execute("""
                CREATE TABLE IF NOT EXISTS task_stage_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    event TEXT NOT NULL,
                    ts TEXT NOT NULL
                );
            """)
            conn.commit()
            logger.info("SQLite database initialized successfully.")
    except sqlite3.Error as e:
        logger.error(f"Failed to initialize SQLite database: {e}")
        raise

def create_task(
    task_id: str,
    status: str,
    url: str,
    user_id: Optional[str] = None,
    title: Optional[str] = None,
) -> None:
    """
    Saves a new background task tracker record.

    Args:
        task_id (str): Generated UUID.
        status (str): Initial task status (e.g. pending).
        url (str): Source YouTube URL.
        user_id (str, optional): Authenticated owner user ID.
        title (str, optional): Lecture or video title.
    """
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            conn.execute(
                """
                INSERT INTO tasks (task_id, status, message, user_id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (task_id, status, f"Task created for URL: {url}", user_id, title, now, now)
            )
            conn.commit()
            logger.info(f"Task {task_id} successfully created in SQLite.")
    except sqlite3.Error as e:
        logger.error(f"Error creating task {task_id}: {e}")
        raise

def update_task(
    task_id: str,
    status: str,
    video_id: Optional[str] = None,
    pdf_path: Optional[str] = None,
    error: Optional[str] = None,
    message: Optional[str] = None,
    title: Optional[str] = None,
    user_id: Optional[str] = None,
    # --- Phase 4 research instrumentation (all optional, additive) ---
    generation_method: Optional[str] = None,
    model_name_used: Optional[str] = None,
    prompt_version: Optional[str] = None,
    transcript_char_count: Optional[int] = None,
) -> None:
    """
    Updates the parameters of an existing task tracker.

    Args:
        task_id (str): Task UUID key.
        status (str): Updated status value.
        video_id (str, optional): Derived YouTube Video ID.
        pdf_path (str, optional): Target file path.
        error (str, optional): Stacktrace / error details.
        message (str, optional): Live progress message description.
        title (str, optional): Derived lecture study guide title.
        user_id (str, optional): Owner user ID.
        generation_method (str, optional): Phase 4 instrumentation —
            'gemini' | 'offline_fallback'. See services/ai.generate_notes.
        model_name_used (str, optional): Phase 4 instrumentation — which
            fallback model actually responded (NULL on offline fallback).
        prompt_version (str, optional): Phase 4 instrumentation —
            prompts.smart.PROMPT_VERSION at generation time.
        transcript_char_count (int, optional): Phase 4 instrumentation —
            length of the transcript text actually used.
    """
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            # We use COALESCE to update parameters optionally without overwriting existing data with None
            conn.execute(
                """
                UPDATE tasks
                SET status = ?,
                    video_id = COALESCE(?, video_id),
                    pdf_path = COALESCE(?, pdf_path),
                    error = COALESCE(?, error),
                    message = COALESCE(?, message),
                    title = COALESCE(?, title),
                    user_id = COALESCE(?, user_id),
                    generation_method = COALESCE(?, generation_method),
                    model_name_used = COALESCE(?, model_name_used),
                    prompt_version = COALESCE(?, prompt_version),
                    transcript_char_count = COALESCE(?, transcript_char_count),
                    updated_at = ?
                WHERE task_id = ?
                """,
                (
                    status, video_id, pdf_path, error, message,
                    title, user_id,
                    generation_method, model_name_used, prompt_version, transcript_char_count,
                    now, task_id,
                )
            )
            conn.commit()
            logger.info(f"Task {task_id} updated successfully. Status: {status}")
    except sqlite3.Error as e:
        logger.error(f"Error updating task {task_id}: {e}")
        raise


def log_stage_event(task_id: str, stage: str, event: str) -> None:
    """
    Phase 4 research instrumentation: records a single stage-level
    start/end timestamp for latency analysis (RQ4).

    Deliberately best-effort — unlike every other function in this module,
    a failure here is logged and swallowed rather than raised, because
    instrumentation must never be able to interrupt the real processing
    pipeline (Phase 3 §14 design decision).

    Args:
        task_id (str): Task UUID key.
        stage (str): one of 'transcript_fetch', 'ai_generation',
            'transformation', 'pdf_render' (not enforced, so new stages
            can be added without a migration).
        event (str): 'start' | 'end'.
    """
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            conn.execute(
                "INSERT INTO task_stage_events (task_id, stage, event, ts) VALUES (?, ?, ?, ?)",
                (task_id, stage, event, now)
            )
            conn.commit()
    except sqlite3.Error as e:
        logger.warning(f"Failed to log stage event ({stage}/{event}) for task {task_id}: {e}")


def get_stage_events(task_id: str) -> List[Dict[str, Any]]:
    """
    Phase 4 research instrumentation: returns all recorded stage events
    for a task, ordered chronologically, for latency-analysis scripts.
    """
    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM task_stage_events WHERE task_id = ? ORDER BY id ASC",
                (task_id,)
            )
            return [dict(row) for row in cursor.fetchall()]
    except sqlite3.Error as e:
        logger.error(f"Error fetching stage events for task {task_id}: {e}")
        raise

def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves task properties by ID as a dictionary.

    Args:
        task_id (str): Task UUID.

    Returns:
        dict, optional: Task record dict if found, else None.
    """
    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM tasks WHERE task_id = ?",
                (task_id,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    except sqlite3.Error as e:
        logger.error(f"Error fetching task {task_id}: {e}")
        raise

def delete_task(task_id: str) -> bool:
    """
    Deletes a task by ID.

    Args:
        task_id (str): Task UUID.

    Returns:
        bool: True if row deleted, else False.
    """
    try:
        with _get_connection() as conn:
            cursor = conn.execute("DELETE FROM tasks WHERE task_id = ?", (task_id,))
            conn.commit()
            deleted = cursor.rowcount > 0
            if deleted:
                logger.info(f"Task {task_id} deleted successfully.")
            return deleted
    except sqlite3.Error as e:
        logger.error(f"Error deleting task {task_id}: {e}")
        raise

def list_tasks() -> List[Dict[str, Any]]:
    """
    Lists all task records ordered by creation date.

    Returns:
        list[dict]: All tasks.
    """
    try:
        with _get_connection() as conn:
            cursor = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]
    except sqlite3.Error as e:
        logger.error(f"Error listing tasks: {e}")
        raise


# =====================================================================
# Phase 1: Authentication & User Data Persistence Repository Functions
# =====================================================================

def create_user(
    email: str,
    name: str,
    password_hash: str,
    salt: str,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a new user record.
    Email is normalized to lowercase.
    Returns the created user record (excluding password_hash and salt for safety).
    Raises ValueError if a user with the given email already exists.
    """
    import uuid
    norm_email = email.strip().lower()
    uid = user_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            conn.execute(
                """
                INSERT INTO users (id, email, name, password_hash, salt, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (uid, norm_email, name.strip(), password_hash, salt, now, now)
            )
            conn.commit()
            logger.info(f"User {uid} ({norm_email}) created successfully.")
            return {
                "id": uid,
                "email": norm_email,
                "name": name.strip(),
                "created_at": now,
                "updated_at": now,
            }
    except sqlite3.IntegrityError as ie:
        logger.warning(f"Failed to create user with email '{norm_email}': integrity constraint violated: {ie}")
        raise ValueError(f"User with email '{norm_email}' already exists.") from ie
    except sqlite3.Error as e:
        logger.error(f"Database error creating user '{norm_email}': {e}")
        raise


def get_user_by_id(user_id: str, include_secrets: bool = False) -> Optional[Dict[str, Any]]:
    """
    Retrieves user record by unique ID.
    By default (include_secrets=False), password_hash and salt are removed.
    """
    try:
        with _get_connection() as conn:
            cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            if not include_secrets:
                data.pop("password_hash", None)
                data.pop("salt", None)
            return data
    except sqlite3.Error as e:
        logger.error(f"Error fetching user by ID {user_id}: {e}")
        raise


def get_user_by_email(email: str, include_secrets: bool = False) -> Optional[Dict[str, Any]]:
    """
    Retrieves user record by normalized lowercase email.
    By default (include_secrets=False), password_hash and salt are removed.
    """
    norm_email = email.strip().lower()
    try:
        with _get_connection() as conn:
            cursor = conn.execute("SELECT * FROM users WHERE email = ?", (norm_email,))
            row = cursor.fetchone()
            if not row:
                return None
            data = dict(row)
            if not include_secrets:
                data.pop("password_hash", None)
                data.pop("salt", None)
            return data
    except sqlite3.Error as e:
        logger.error(f"Error fetching user by email '{norm_email}': {e}")
        raise


def create_or_update_legacy_demo_user(
    email: str,
    name: str,
    password_hash: str,
    salt: str,
    user_id: str,
) -> Dict[str, Any]:
    """
    Idempotently creates or updates the seeded legacy/demo user record.
    Guarantees deterministic demo user existence for evaluations/testing.
    """
    norm_email = email.strip().lower()
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            cursor = conn.execute("SELECT id FROM users WHERE id = ? OR email = ?", (user_id, norm_email))
            existing = cursor.fetchone()
            if existing:
                conn.execute(
                    """
                    UPDATE users
                    SET email = ?, name = ?, password_hash = ?, salt = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (norm_email, name, password_hash, salt, now, existing["id"])
                )
                conn.commit()
                return {"id": existing["id"], "email": norm_email, "name": name, "updated_at": now}
            else:
                conn.execute(
                    """
                    INSERT INTO users (id, email, name, password_hash, salt, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, norm_email, name, password_hash, salt, now, now)
                )
                conn.commit()
                return {"id": user_id, "email": norm_email, "name": name, "created_at": now, "updated_at": now}
    except sqlite3.Error as e:
        logger.error(f"Error creating/updating legacy demo user: {e}")
        raise


def assign_task_to_user(task_id: str, user_id: str) -> bool:
    """
    Assigns an existing task to a specific user.
    """
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                "UPDATE tasks SET user_id = ?, updated_at = ? WHERE task_id = ?",
                (user_id, now, task_id)
            )
            conn.commit()
            return cursor.rowcount > 0
    except sqlite3.Error as e:
        logger.error(f"Error assigning task {task_id} to user {user_id}: {e}")
        raise


def assign_unowned_tasks_to_user(user_id: str) -> int:
    """
    Assigns all legacy tasks with user_id IS NULL to the specified user (e.g. demo/legacy user).
    Idempotent: if all tasks are already assigned, returns 0.
    """
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                "UPDATE tasks SET user_id = ?, updated_at = ? WHERE user_id IS NULL",
                (user_id, now)
            )
            conn.commit()
            if cursor.rowcount > 0:
                logger.info(f"Assigned {cursor.rowcount} legacy unowned tasks to user {user_id}.")
            return cursor.rowcount
    except sqlite3.Error as e:
        logger.error(f"Error assigning unowned tasks to user {user_id}: {e}")
        raise


def list_user_tasks(user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Returns all tasks belonging to a specific user, ordered by creation date descending.
    """
    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT * FROM tasks
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (user_id, limit)
            )
            return [dict(row) for row in cursor.fetchall()]
    except sqlite3.Error as e:
        logger.error(f"Error listing tasks for user {user_id}: {e}")
        raise


def verify_task_ownership(task_id: str, user_id: str) -> bool:
    """
    Verifies if a specific task belongs to the given user.
    """
    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                "SELECT 1 FROM tasks WHERE task_id = ? AND user_id = ?",
                (task_id, user_id)
            )
            return cursor.fetchone() is not None
    except sqlite3.Error as e:
        logger.error(f"Error verifying task ownership for task {task_id} and user {user_id}: {e}")
        raise


def get_task_for_user(task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves task properties by ID ensuring it belongs to the given user.
    Returns None if not found or if the task belongs to a different user.
    If the requesting user is the demo user, also allows access to unowned legacy tasks (user_id IS NULL).
    """
    from config import DEMO_USER_ID
    try:
        with _get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT * FROM tasks
                WHERE task_id = ?
                  AND (user_id = ? OR (user_id IS NULL AND ? = ?))
                """,
                (task_id, user_id, user_id, DEMO_USER_ID)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    except sqlite3.Error as e:
        logger.error(f"Error fetching task {task_id} for user {user_id}: {e}")
        raise


def claim_unowned_tasks(task_ids: List[str], user_id: str) -> List[str]:
    """
    Associates unowned tasks (user_id IS NULL) with the authenticated user.
    Never overwrites or steals tasks already owned by another user.
    Returns list of task IDs successfully claimed or already owned by user_id.
    """
    if not task_ids:
        return []

    claimed_ids: List[str] = []
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            for tid in task_ids:
                cursor = conn.execute("SELECT user_id FROM tasks WHERE task_id = ?", (tid,))
                row = cursor.fetchone()
                if not row:
                    continue
                current_owner = row["user_id"]
                if current_owner == user_id:
                    claimed_ids.append(tid)
                elif current_owner is None:
                    conn.execute(
                        "UPDATE tasks SET user_id = ?, updated_at = ? WHERE task_id = ? AND user_id IS NULL",
                        (user_id, now, tid)
                    )
                    claimed_ids.append(tid)
                # Else: owned by another user -> strictly preserved and cannot be claimed
            conn.commit()
            return claimed_ids
    except sqlite3.Error as e:
        logger.error(f"Error claiming unowned tasks for user {user_id}: {e}")
        raise


