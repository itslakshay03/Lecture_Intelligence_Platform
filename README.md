# Lecture Intelligence Platform (Backend)

An AI-powered backend service that converts long YouTube lectures into beautiful, structured study note PDFs in under a minute.

## Features
- **Transcript Extraction**: Fetches and cleans YouTube video transcripts (supports English, Hindi, and mixed languages).
- **AI Processing (Gemini)**: Extracts high-level lecture structures and generates engaging, human-like notes with memory tricks and real-world examples.
- **PDF Generation (Playwright)**: Compiles notes to styled HTML and renders high-quality A4 PDFs.
- **Asynchronous Task Flow**: Long-running requests process in the background to prevent HTTP gateway timeouts.
- **Local Caching**: Instantly serves cached notes for previously requested videos to save time and API quota.

## System Flow
1. `POST /youtube` -> Starts background note generation, returns a `task_id`.
2. `GET /tasks/{task_id}` -> Status tracking endpoint.
3. `GET /download/{task_id}` -> Serves the final PDF file.

## Tech Stack
- **Framework**: FastAPI (Python)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`)
- **PDF Renderer**: Playwright (Headless Chromium)
- **Testing**: PyTest

## Setup & Installation

### Local Run
1. Setup a virtual environment inside the `backend` folder and activate it:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```
3. Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY`.
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Running with Docker
1. Build the image:
   ```bash
   docker build -t lecture-intelligence-backend .
   ```
2. Run the container:
   ```bash
   docker run -p 8000:8000 --env-file .env lecture-intelligence-backend
   ```
