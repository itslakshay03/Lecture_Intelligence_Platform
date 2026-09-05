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
    Creates the 'tasks' table inside SQLite database if it doesn't exist,
    and (Phase 4) the additive research-instrumentation columns/table.
    """
    try:
        with _get_connection() as conn:
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

def create_task(task_id: str, status: str, url: str) -> None:
    """
    Saves a new background task tracker record.

    Args:
        task_id (str): Generated UUID.
        status (str): Initial task status (e.g. pending).
        url (str): Source YouTube URL.
    """
    now = datetime.now(timezone.utc).isoformat()
    try:
        with _get_connection() as conn:
            conn.execute(
                """
                INSERT INTO tasks (task_id, status, message, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (task_id, status, f"Task created for URL: {url}", now, now)
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
                    generation_method = COALESCE(?, generation_method),
                    model_name_used = COALESCE(?, model_name_used),
                    prompt_version = COALESCE(?, prompt_version),
                    transcript_char_count = COALESCE(?, transcript_char_count),
                    updated_at = ?
                WHERE task_id = ?
                """,
                (
                    status, video_id, pdf_path, error, message,
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
