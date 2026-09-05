import os
import sys
from pathlib import Path

# Resolve backend root directory
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.chdir(str(BASE_DIR))

from dotenv import load_dotenv
load_dotenv()

print("=== ENVIRONMENT CHECK ===")
key1 = os.getenv("GEMINI_API_KEY", "")
key2 = os.getenv("GEMINI_API_KEY_2", "")
cookies = os.getenv("YOUTUBE_COOKIES_PATH", "")
print(f"GEMINI_API_KEY       : {'OK (' + str(len(key1)) + ' chars)' if key1 else 'MISSING !!!'}")
print(f"GEMINI_API_KEY_2     : {'OK (' + str(len(key2)) + ' chars)' if key2 else 'MISSING !!!'}")
print(f"YOUTUBE_COOKIES_PATH : {cookies if cookies else 'NOT SET !!!'}")
cookies_exists = os.path.exists(cookies) if cookies else False
print(f"cookies.txt exists   : {'YES' if cookies_exists else 'NO !!!'}")

print()
print("=== CRITICAL FILES CHECK ===")
files = [
    "main.py", "config.py",
    "services/ai.py", "services/transcript.py", "services/pdf.py",
    "services/task_repository.py",
    "prompts/smart.py", "prompts/json_extractor.py",
    "utils/markdown_to_html.py",
    "templates/notes_template.html",
    "requirements.txt", ".env", "cookies.txt"
]
all_ok = True
for f in files:
    exists = os.path.exists(f)
    if not exists:
        all_ok = False
    print(f"  {'OK' if exists else 'MISSING !!!'} - {f}")

print()
print("=== API KEY ROTATION CHECK ===")
from services.ai import _load_api_keys
keys = _load_api_keys()
print(f"  Loaded {len(keys)} API key(s)")
print(f"  Total fallback combinations: {len(keys) * 5} (keys x models)")

print()
print("=== RESULT ===")
if all_ok and key1 and key2 and cookies_exists:
    print("ALL SYSTEMS GREEN. Ready to generate notes!")
else:
    print("Issues found. Review items marked with !!!")
