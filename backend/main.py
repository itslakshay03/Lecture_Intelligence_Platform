import os
import sys
import uuid
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Setup system-wide logger configuration (Server Reloaded)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

# Central config variables
from config import OUTPUT_DIR, BASE_DIR, CORS_ORIGINS
from services.transcript import get_transcript
from services.ai import generate_notes
from services.pdf import generate_pdf
from services.task_repository import (
    initialize_database,
    create_task,
    update_task,
    get_task,
    log_stage_event,  # Phase 4 research instrumentation
    create_user,
    get_user_by_id,
    get_user_by_email,
    list_user_tasks,
    get_task_for_user,
    claim_unowned_tasks,
)
from services.auth_service import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
    get_current_user,
    ensure_demo_user,
)
from prompts.smart import PROMPT_VERSION  # Phase 4 research instrumentation

def is_valid_uuid(val: str) -> bool:
    """
    Validates if a string is a valid UUID format to prevent injection/path traversal attempts.
    """
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

# Startup lifecycle context manager (resolves DB table checks automatically)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up FastAPI application...")
    initialize_database()
    try:
        from services.auth_service import ensure_demo_user
        ensure_demo_user()
    except Exception as e:
        logger.warning(f"Failed ensuring demo user on startup: {e}")
    try:
        from services.task_repository import _get_connection
        with _get_connection() as conn:
            cursor = conn.execute("UPDATE tasks SET status='failed', error='Server restarted while task was processing' WHERE status='processing'")
            conn.commit()
            if cursor.rowcount > 0:
                logger.info(f"Reset {cursor.rowcount} interrupted processing tasks to failed status.")
    except Exception as e:
        logger.warning(f"Failed to reset interrupted tasks on startup: {e}")
    yield
    logger.info("Shutting down FastAPI application...")

app = FastAPI(
    title="Lecture Intelligence Platform API",
    description="Asynchronous API to convert YouTube videos to study notes",
    lifespan=lifespan
)

# CORS middleware configuration.
# allow_credentials must stay False while allow_origins is the "*" wildcard:
# the combination makes Starlette echo any caller's Origin back with
# Access-Control-Allow-Credentials: true. This API uses no cookies/auth, so the
# token-less frontend is unaffected. To use cookie auth later, replace "*" with
# an explicit origin allow-list and set allow_credentials=True.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"Target PDF output directory: {OUTPUT_DIR}")

# Mount static frontend build at /app if present
from fastapi.staticfiles import StaticFiles
frontend_dist = (BASE_DIR.parent / "frontend" / "dist").resolve()
if frontend_dist.exists():
    logger.info(f"Mounting production frontend build from: {frontend_dist}")
    app.mount("/app", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

class YouTubeRequest(BaseModel):
    url: str
    force_refresh: bool = False

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ClaimLocalRequest(BaseModel):
    task_ids: List[str]

def process_youtube_video(task_id: str, url: str, force_refresh: bool = False, user_id: Optional[str] = None):
    """
    Worker pipeline executed inside a background thread pool.
    Guarantees task reaches terminal state and exposes step-by-step progress.
    Preserves task ownership by user_id.
    """
    logger.info(f"Starting background processing for task: {task_id} (force_refresh={force_refresh}, user_id={user_id})")
    try:
        try:
            update_task(task_id, status="processing", message="Initializing task processing...", user_id=user_id)
        except Exception as db_err:
            logger.error(f"Failed to set task {task_id} to processing: {db_err}")
            return  # Exit early since state cannot be tracked

        # 1. Extract video ID to check local file caches
        from services.transcript import extract_video_id
        try:
            video_id = extract_video_id(url)
        except ValueError as ve:
            logger.warning(f"Validation failure for task {task_id}: {ve}")
            update_task(task_id, status="failed", error=str(ve), message="Invalid YouTube URL.", user_id=user_id)
            return

        cached_pdf_path = OUTPUT_DIR / f"{video_id}.pdf"
        
        # Check Caching Block
        if not force_refresh and cached_pdf_path.exists():
            logger.info(f"Cache Hit! Serving cached PDF: {video_id}.pdf")
            update_task(
                task_id,
                status="completed",
                message="PDF found in cache! Ready for download.",
                video_id=video_id,
                pdf_path=str(cached_pdf_path),
                user_id=user_id,
            )
            return

        # 2. Cache Miss -> Execute main pipeline
        logger.info(f"Cache Miss. Fetching video transcript: {video_id}")
        update_task(task_id, status="processing", message="Fetching video transcript (Step 1/3)...", user_id=user_id)
        log_stage_event(task_id, "transcript_fetch", "start")  # Phase 4 instrumentation
        transcript_res = get_transcript(url)
        log_stage_event(task_id, "transcript_fetch", "end")  # Phase 4 instrumentation
        if len(transcript_res) >= 4:
            transcript_text, target_pages, _, video_duration = transcript_res[:4]
        else:
            transcript_text, target_pages, _ = transcript_res[:3]
            video_duration = 0.0

        # Phase 4 instrumentation: record transcript size now, independent of
        # whether the AI/PDF stages below succeed or fail.
        update_task(
            task_id,
            status="processing",
            transcript_char_count=len(transcript_text) if transcript_text else 0,
            user_id=user_id,
        )

        logger.info(f"Generating AI study notes for video: {video_id} (Duration: {video_duration:.0f}s)")
        update_task(task_id, status="processing", message="Generating study notes with AI (Step 2/3)...", user_id=user_id)
        log_stage_event(task_id, "ai_generation", "start")  # Phase 4 instrumentation
        generation_metadata: dict = {}  # Phase 4 instrumentation
        notes = generate_notes(transcript_text, target_pages, metadata=generation_metadata)
        log_stage_event(task_id, "ai_generation", "end")  # Phase 4 instrumentation
        update_task(
            task_id,
            status="processing",
            generation_method=generation_metadata.get("generation_method"),
            model_name_used=generation_metadata.get("model_name_used"),
            prompt_version=PROMPT_VERSION,
            user_id=user_id,
        )

        # Save structured study pack JSON alongside PDF
        log_stage_event(task_id, "transformation", "start")  # Phase 4 instrumentation
        lecture_title = None
        try:
            import json
            from utils.study_pack import parse_notes_to_study_pack
            study_pack = parse_notes_to_study_pack(notes, video_id, duration=video_duration, transcript_text=transcript_text)
            lecture_title = study_pack.get("title")
            cached_json_path = OUTPUT_DIR / f"{video_id}.json"
            with open(cached_json_path, "w", encoding="utf-8") as f:
                json.dump(study_pack, f, indent=2)
            logger.info(f"Saved study pack JSON: {cached_json_path}")
        except Exception as json_err:
            logger.warning(f"Failed caching study pack JSON for {video_id}: {json_err}")
        log_stage_event(task_id, "transformation", "end")  # Phase 4 instrumentation

        logger.info(f"Rendering HTML notes to PDF file: {cached_pdf_path}")
        update_task(task_id, status="processing", message="Rendering PDF document (Step 3/3)...", user_id=user_id)
        log_stage_event(task_id, "pdf_render", "start")  # Phase 4 instrumentation
        generate_pdf(notes, str(cached_pdf_path))
        log_stage_event(task_id, "pdf_render", "end")  # Phase 4 instrumentation

        update_task(
            task_id,
            status="completed",
            message="Study notes PDF successfully generated!",
            video_id=video_id,
            pdf_path=str(cached_pdf_path),
            title=lecture_title,
            user_id=user_id,
        )
        logger.info(f"Task {task_id} successfully completed.")

    except ValueError as ve:
        logger.warning(f"Business logic validation failure for task {task_id}: {ve}")
        try:
            update_task(task_id, status="failed", error=str(ve), message="Task processing failed.", user_id=user_id)
        except Exception as e:
            logger.error(f"Double fault: failed updating state to failed: {e}")
    except Exception as e:
        logger.error(f"Unexpected execution exception on task {task_id}: {e}", exc_info=True)
        try:
            update_task(task_id, status="failed", error=f"Task execution failed: {type(e).__name__}: {str(e)}", message="Task execution error.", user_id=user_id)
        except Exception as db_ex:
            logger.error(f"Double fault: failed updating state to failed: {db_ex}")

@app.get("/")
def home():
    return {"message": "Lecture Intelligence Platform API Running 🚀"}


# --------------------------------------------------------------------------
# Authentication Endpoints (Phase 2)
# --------------------------------------------------------------------------

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(request: RegisterRequest):
    """
    Registers a new user account and returns an access token with safe profile.
    """
    name = request.name.strip()
    email = request.email.strip().lower()
    password = request.password

    if not name or len(name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must be at least 2 characters long."
        )
    
    if not email or "@" not in email or "." not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required."
        )

    try:
        validate_password_strength(password)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    existing = get_user_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists."
        )

    p_hash, salt = hash_password(password)
    try:
        user = create_user(email=email, name=name, password_hash=p_hash, salt=salt)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ve))

    token = create_access_token(user["id"], user["email"], user["name"])
    return {
        "token": token,
        "token_type": "bearer",
        "user": user,
    }


@app.post("/auth/login")
def login_user(request: LoginRequest):
    """
    Authenticates user credentials and returns an access token with safe profile.
    """
    email = request.email.strip().lower()
    password = request.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_email(email, include_secrets=True)
    if not user or not verify_password(password, user.get("password_hash", ""), user.get("salt", "")):
        logger.warning(f"Login failed for email '{email}'.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    safe_user = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"],
        "updated_at": user.get("updated_at"),
    }
    token = create_access_token(user["id"], user["email"], user["name"])
    return {
        "token": token,
        "token_type": "bearer",
        "user": safe_user,
    }


@app.get("/auth/me")
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns the currently authenticated user's safe profile.
    """
    return {"user": current_user}


@app.post("/auth/logout")
def logout_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Stateless JWT logout acknowledgment. Client removes local token.
    """
    return {"message": "Logged out successfully."}


# --------------------------------------------------------------------------
# Lecture History & Tenant Data Management (Phase 2)
# --------------------------------------------------------------------------

@app.get("/lectures")
def list_user_lectures(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns all lectures and tasks owned by the authenticated user.
    Strictly isolated: does not return tasks belonging to other users.
    """
    tasks = list_user_tasks(current_user["id"], limit=200)
    lectures = []
    for t in tasks:
        vid = t.get("video_id")
        title = t.get("title")
        if not title:
            title = f"Lecture Study Guide ({vid})" if vid else "Lecture Study Guide"
        
        pdf_exists = bool(t.get("pdf_path") and os.path.exists(t["pdf_path"]))
        lectures.append({
            "task_id": t["task_id"],
            "video_id": vid,
            "title": title,
            "status": t["status"],
            "message": t.get("message"),
            "created_at": t["created_at"],
            "updated_at": t.get("updated_at"),
            "has_pdf": pdf_exists,
            "resources": ["notes", "quiz", "flashcards", "revision", "interview"] if t["status"] == "completed" else []
        })

    return {"lectures": lectures, "count": len(lectures)}


@app.post("/lectures/claim-local")
def claim_local_lectures(
    request: ClaimLocalRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Associates unowned tasks (user_id IS NULL) with the authenticated user.
    Enforces that already-owned tasks cannot be stolen or overwritten.
    """
    valid_task_ids = [tid for tid in request.task_ids if is_valid_uuid(tid)]
    if not valid_task_ids:
        return {"claimed_count": 0, "claimed_task_ids": []}

    claimed = claim_unowned_tasks(valid_task_ids, current_user["id"])
    logger.info(f"User {current_user['id']} claimed {len(claimed)} tasks out of {len(valid_task_ids)} submitted.")
    return {
        "claimed_count": len(claimed),
        "claimed_task_ids": claimed,
    }


# --------------------------------------------------------------------------
# Task Processing & Retrieval Endpoints (Protected with get_current_user)
# --------------------------------------------------------------------------

@app.post("/youtube", status_code=202)
def start_notes_generation(
    request: YouTubeRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Endpoint that accepts YouTube URL requests and initializes background execution.
    Returns task tracker ID immediately to prevent request timeouts.
    Requires authentication; task is associated with current_user.
    """
    task_id = str(uuid.uuid4())
    logger.info(f"Received request for URL: {request.url} from user {current_user['id']}. Created task: {task_id}")
    
    try:
        create_task(task_id, status="pending", url=request.url, user_id=current_user["id"])
    except Exception as e:
        logger.error(f"Failed to create task entry in database: {e}")
        raise HTTPException(status_code=500, detail="Database write failure.")

    # Synchronous cache check pre-flight optimization
    try:
        from services.transcript import extract_video_id
        video_id = extract_video_id(request.url)
        cached_pdf_path = OUTPUT_DIR / f"{video_id}.pdf"
        
        if not request.force_refresh and cached_pdf_path.exists():
            logger.info(f"Sync Cache Hit! Video {video_id} already cached. Completing task immediately.")
            update_task(
                task_id,
                status="completed",
                message="PDF found in cache! Ready for download.",
                video_id=video_id,
                pdf_path=str(cached_pdf_path),
                user_id=current_user["id"],
            )
            return {
                "task_id": task_id,
                "status": "completed",
                "message": "PDF found in cache! Ready for download.",
                "status_url": f"/tasks/{task_id}"
            }
    except Exception as ce:
        # Ignore check exceptions (malformed URLs will be validated in background worker)
        logger.debug(f"Pre-flight cache check skipped: {ce}")

    # Launch background worker in a detached daemon thread so POST /youtube returns instantly (2ms)
    # without tying execution to Starlette/AnyIO request lifecycle
    import threading
    thread = threading.Thread(
        target=process_youtube_video,
        args=(task_id, request.url, request.force_refresh, current_user["id"]),
        daemon=True
    )
    thread.start()
    
    return {
        "task_id": task_id,
        "status": "pending",
        "message": "Task queued for processing...",
        "status_url": f"/tasks/{task_id}"
    }

@app.get("/tasks/{task_id}")
def get_task_status(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Status polling endpoint checking SQLite database records.
    Verifies that the requested task belongs to the authenticated user.
    """
    if not is_valid_uuid(task_id):
        logger.warning(f"Status check rejected: Invalid UUID format '{task_id}'")
        raise HTTPException(status_code=400, detail="Invalid task ID format. Must be a valid UUID.")

    logger.info(f"Fetching status details for task: {task_id} by user {current_user['id']}")
    try:
        task = get_task_for_user(task_id, current_user["id"])
    except Exception as e:
        logger.error(f"Error querying task status for {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch task status.")

    if not task:
        logger.warning(f"Task {task_id} not found or not owned by user {current_user['id']}.")
        raise HTTPException(status_code=404, detail="Task not found.")
    
    response = {
        "status": task["status"],
        "message": task.get("message")
    }
    if task["status"] == "completed":
        response["download_url"] = f"/download/{task_id}"
    elif task["status"] == "failed":
        response["error"] = task.get("error")
        
    return response

@app.get("/download/{task_id}")
def download_pdf(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Downloads the completed PDF notes.
    Verifies task ownership before accessing file storage.
    """
    if not is_valid_uuid(task_id):
        logger.warning(f"Download request rejected: Invalid UUID format '{task_id}'")
        raise HTTPException(status_code=400, detail="Invalid task ID format. Must be a valid UUID.")

    logger.info(f"File download request for task: {task_id} by user {current_user['id']}")
    try:
        task = get_task_for_user(task_id, current_user["id"])
    except Exception as e:
        logger.error(f"Error querying task file path for {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch download details.")

    if not task:
        logger.warning(f"Download task {task_id} not found or not owned by user {current_user['id']}.")
        raise HTTPException(status_code=404, detail="Task not found.")
        
    if task["status"] != "completed":
        logger.warning(f"Download requested for non-completed task {task_id}. Status: {task['status']}")
        raise HTTPException(status_code=400, detail="PDF is not ready or task failed.")
    
    pdf_path = task.get("pdf_path")
    if not pdf_path or not os.path.exists(pdf_path):
        logger.error(f"Target PDF file missing from filesystem: {pdf_path}")
        raise HTTPException(status_code=404, detail="PDF output file is missing on storage.")
        
    return FileResponse(
        path=pdf_path,
        filename="study_notes.pdf",
        media_type="application/pdf"
    )

@app.get("/tasks/{task_id}/content")
def get_task_content(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns the complete structured Study Pack JSON (notes, topics, quiz, flashcards, revision plan, interview questions).
    Verifies task ownership before returning study pack content.
    """
    if not is_valid_uuid(task_id):
        logger.warning(f"Content request rejected: Invalid UUID format '{task_id}'")
        raise HTTPException(status_code=400, detail="Invalid task ID format. Must be a valid UUID.")

    task = get_task_for_user(task_id, current_user["id"])
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="Study pack is not ready or task failed.")

    video_id = task.get("video_id")
    if not video_id:
        raise HTTPException(status_code=404, detail="Video ID missing for task.")

    cached_json_path = OUTPUT_DIR / f"{video_id}.json"
    cached_pdf_path = OUTPUT_DIR / f"{video_id}.pdf"

    import json
    if not cached_json_path.exists():
        if cached_pdf_path.exists():
            from utils.study_pack import parse_notes_to_study_pack
            fallback_md = f"# 📘 Lecture Study Guide ({video_id})\n\n### 📌 Overview\nStudy notes generated for video {video_id}.\n\n## ⚙️ Core Concepts\n- **Key Fact**: Complete study guide notes ready."
            study_pack = parse_notes_to_study_pack(fallback_md, video_id)
            with open(cached_json_path, "w", encoding="utf-8") as f:
                json.dump(study_pack, f, indent=2)
        else:
            raise HTTPException(status_code=404, detail="Study pack data file missing on storage.")

    with open(cached_json_path, "r", encoding="utf-8") as f:
        return json.load(f)