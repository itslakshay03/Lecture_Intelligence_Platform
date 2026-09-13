import os
from pathlib import Path
from dotenv import load_dotenv

# Load environmental variables from .env
load_dotenv()

# Project root path resolving
BASE_DIR = Path(__file__).resolve().parent

# PDF Caching Output Directory
env_output_path = os.getenv("OUTPUT_DIR_PATH")
if env_output_path:
    OUTPUT_DIR = Path(env_output_path).resolve()
else:
    OUTPUT_DIR = BASE_DIR / "output"

# Database path resolving
env_db_path = os.getenv("DATABASE_URL")
if env_db_path:
    DB_PATH = Path(env_db_path).resolve()
else:
    DB_PATH = BASE_DIR / "data" / "tasks.db"

DB_DIR = DB_PATH.parent

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Authentication Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "lectraai-dev-secret-key-change-in-production-min-32-chars")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))

# Legacy / Demo User Configuration
DEMO_USER_EMAIL = os.getenv("DEMO_USER_EMAIL", "demo@lectra.ai").strip().lower()
DEMO_USER_NAME = os.getenv("DEMO_USER_NAME", "Demo Student")
DEMO_USER_PASSWORD = os.getenv("DEMO_USER_PASSWORD", "DemoPass123!")
DEMO_USER_ID = os.getenv("DEMO_USER_ID", "00000000-0000-4000-8000-000000000001")
AUTO_MIGRATE_LEGACY_TASKS = os.getenv("AUTO_MIGRATE_LEGACY_TASKS", "true").lower() in ("true", "1", "yes")
