import os
import sys
import asyncio
from pathlib import Path
from utils.markdown_to_html import convert_markdown_to_html
from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parent.parent

import subprocess

def html_to_pdf(html_content: str, output_path: str):
    """
    Renders HTML string to PDF file using Playwright.
    Executes in a dedicated subprocess via temporary HTML file to prevent
    Windows command-line length limits ([WinError 206]).
    """
    temp_dir = BASE_DIR / "output" / "temp"
    os.makedirs(temp_dir, exist_ok=True)
    
    # Use unique hash/pid to avoid temp file collision
    import uuid
    temp_id = str(uuid.uuid4())
    temp_html_path = temp_dir / f"temp_{temp_id}.html"
    
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    worker_script = f"""
import sys, asyncio
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception:
        pass

html_file = {repr(str(temp_html_path))}
output_path = {repr(str(output_path))}

with open(html_file, "r", encoding="utf-8") as f:
    html_content = f.read()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    try:
        page = browser.new_page()
        page.set_content(html_content, wait_until="domcontentloaded")
        try:
            page.wait_for_function(
                "() => window.MathJax && window.MathJax.startup && window.MathJax.startup.promise !== undefined",
                timeout=5000
            )
            page.evaluate("() => window.MathJax.startup.promise")
        except Exception:
            pass
        page.wait_for_timeout(1500)
        page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={{"top": "20mm", "bottom": "20mm", "left": "15mm", "right": "15mm"}}
        )
    finally:
        browser.close()
"""
    try:
        res = subprocess.run(
            [sys.executable, "-c", worker_script],
            capture_output=True,
            text=True,
            check=True
        )
    finally:
        if os.path.exists(temp_html_path):
            try:
                os.remove(temp_html_path)
            except Exception:
                pass


def generate_pdf(notes, output_path: str):
    """
    Converts markdown notes to HTML template and calls Playwright PDF rendering engine.
    """
    html_notes = convert_markdown_to_html(notes)
    
    # Load Template using an absolute path context
    template_path = BASE_DIR / "templates" / "notes_template.html"
    with open(template_path, "r", encoding="utf-8") as file:
        template = file.read()

    final_html = template.replace("{{content}}", html_notes)
    
    # Ensure parent output directory exists
    dir_name = os.path.dirname(output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    
    html_to_pdf(final_html, output_path)