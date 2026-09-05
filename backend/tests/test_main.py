import os
import uuid
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from main import app, OUTPUT_DIR
from services.task_repository import (
    initialize_database,
    create_task,
    update_task,
    get_task,
    delete_task,
    DB_PATH
)

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    """
    Ensure the test database matches the required schema structure before running each test.
    """
    initialize_database()
    yield

def test_read_home():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Lecture Intelligence Platform API Running 🚀"}

def test_sqlite_persistence_after_restart():
    """
    Asserts database writes are persisted across server lifecycles (DB reinstantiations).
    """
    task_id = str(uuid.uuid4())
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    # 1. Create the task record
    create_task(task_id, status="pending", url=url)
    
    # 2. Verify state
    task = get_task(task_id)
    assert task is not None
    assert task["status"] == "pending"
    
    # 3. Simulate a server restart by initializing the DB connection again
    initialize_database()
    
    # 4. Verify record still persists
    task_after_restart = get_task(task_id)
    assert task_after_restart is not None
    assert task_after_restart["status"] == "pending"
    
    # Clean up
    delete_task(task_id)

def test_create_task_via_api():
    """
    Asserts the /youtube endpoint properly initiates background jobs.
    """
    response = client.post("/youtube", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
    assert response.status_code == 202
    data = response.json()
    assert "task_id" in data
    assert data["status"] in ("pending", "completed")  # Could be completed if cache hits
    assert "status_url" in data
    
    # Cleanup task entry
    delete_task(data["task_id"])

def test_get_missing_task():
    """
    Asserts GET /tasks/{task_id} returns 404 for valid but non-existent UUIDs.
    """
    random_uuid = str(uuid.uuid4())
    response = client.get(f"/tasks/{random_uuid}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found."

def test_get_invalid_uuid_format():
    """
    Asserts GET /tasks/{task_id} and GET /download/{task_id} return 400 for malformed UUID formats.
    """
    response = client.get("/tasks/not-a-valid-uuid")
    assert response.status_code == 400
    assert "Invalid task ID format" in response.json()["detail"]

    response_dl = client.get("/download/not-a-valid-uuid")
    assert response_dl.status_code == 400
    assert "Invalid task ID format" in response_dl.json()["detail"]

def test_update_task_status():
    """
    Asserts updating task parameters in SQLite functions correctly.
    """
    task_id = str(uuid.uuid4())
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    create_task(task_id, status="pending", url=url)
    
    # Update to processing
    update_task(task_id, status="processing")
    task = get_task(task_id)
    assert task["status"] == "processing"
    
    # Update to completed
    update_task(task_id, status="completed", video_id="dQw4w9WgXcQ", pdf_path="test_notes.pdf")
    task = get_task(task_id)
    assert task["status"] == "completed"
    assert task["video_id"] == "dQw4w9WgXcQ"
    assert task["pdf_path"] == "test_notes.pdf"
    
    # Cleanup
    delete_task(task_id)

def test_task_failure_recording():
    """
    Asserts failure errors are correctly saved and exposed.
    """
    task_id = str(uuid.uuid4())
    create_task(task_id, status="pending", url="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    # Save error state
    update_task(task_id, status="failed", error="Transcript could not be extracted.")
    
    # Query status
    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "failed"
    assert response.json()["error"] == "Transcript could not be extracted."
    
    # Cleanup
    delete_task(task_id)

def test_download_completed_task():
    """
    Asserts download endpoints serve files cleanly.
    """
    task_id = str(uuid.uuid4())
    dummy_pdf_path = Path(__file__).resolve().parent / "test_notes.pdf"
    
    # Write dummy file
    with open(dummy_pdf_path, "w") as f:
        f.write("dummy pdf content")
        
    create_task(task_id, status="completed", url="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    update_task(task_id, status="completed", video_id="dQw4w9WgXcQ", pdf_path=str(dummy_pdf_path))
    
    # Verify download resolves
    response = client.get(f"/download/{task_id}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    
    # Cleanup
    delete_task(task_id)
    if os.path.exists(dummy_pdf_path):
        os.remove(dummy_pdf_path)

def test_download_non_completed_task():
    """
    Asserts downloads fail if the task remains incomplete.
    """
    task_id = str(uuid.uuid4())
    create_task(task_id, status="processing", url="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    response = client.get(f"/download/{task_id}")
    assert response.status_code == 400
    assert response.json()["detail"] == "PDF is not ready or task failed."
    
    # Cleanup
    delete_task(task_id)

def test_cache_hit_and_miss_behavior():
    """
    Verifies that cache-miss processes tasks in background while cache-hits complete immediately.
    """
    video_id = "testcache99"
    cached_pdf_path = OUTPUT_DIR / f"{video_id}.pdf"
    
    # Remove any existing cached files
    if os.path.exists(cached_pdf_path):
        os.remove(cached_pdf_path)
        
    # 1. Miss Scenario (file missing)
    response_miss = client.post("/youtube", json={"url": f"https://www.youtube.com/watch?v={video_id}"})
    assert response_miss.status_code == 202
    data_miss = response_miss.json()
    task_id_miss = data_miss["task_id"]
    assert data_miss["status"] == "pending"
    
    # 2. Write dummy file to mock completed output
    with open(cached_pdf_path, "w") as f:
        f.write("cached pdf notes")
        
    # 3. Hit Scenario (file exists)
    response_hit = client.post("/youtube", json={"url": f"https://www.youtube.com/watch?v={video_id}"})
    assert response_hit.status_code == 202
    data_hit = response_hit.json()
    task_id_hit = data_hit["task_id"]
    
    # Must resolve synchronously to "completed" instantly
    assert data_hit["status"] == "completed"
    
    # Verify download succeeds instantly
    response_download = client.get(f"/download/{task_id_hit}")
    assert response_download.status_code == 200
    
    # Cleanup files and database entries
    delete_task(task_id_miss)
    delete_task(task_id_hit)
    if os.path.exists(cached_pdf_path):
        os.remove(cached_pdf_path)

def test_get_task_content_endpoint():
    """
    Asserts GET /tasks/{task_id}/content returns structured Study Pack JSON.
    """
    task_id = str(uuid.uuid4())
    video_id = "testcontent99"
    cached_pdf_path = OUTPUT_DIR / f"{video_id}.pdf"
    cached_json_path = OUTPUT_DIR / f"{video_id}.json"
    
    with open(cached_pdf_path, "w") as f:
        f.write("dummy pdf")
        
    create_task(task_id, status="completed", url=f"https://www.youtube.com/watch?v={video_id}")
    update_task(task_id, status="completed", video_id=video_id, pdf_path=str(cached_pdf_path))
    
    response = client.get(f"/tasks/{task_id}/content")
    assert response.status_code == 200
    data = response.json()
    assert data["video_id"] == video_id
    assert "notes_markdown" in data
    assert "topics" in data
    assert "quiz" in data
    assert "flashcards" in data
    assert "revision_plan" in data
    assert "interview_questions" in data
    
    # Cleanup
    delete_task(task_id)
    if os.path.exists(cached_pdf_path):
        os.remove(cached_pdf_path)
    if os.path.exists(cached_json_path):
        os.remove(cached_json_path)
