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
