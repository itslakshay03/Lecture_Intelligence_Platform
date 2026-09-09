# LectraAI — Lecture Intelligence Platform

LectraAI is an AI-powered lecture intelligence platform that converts long YouTube computer science lectures into structured, interactive study packs with verified timestamp grounding, practice materials, and printable A4 study guides.

---

## Key Features

- **Reliable Transcript Extraction**: Dual-method caption retrieval (yt-dlp with YouTube Transcript API fallback) with automatic spoken filler cleanup and timestamp cue markers.
- **Single-Call Grounded AI Notes**: Generates complete, highly structured study notes (overview, core concepts, diagrams, comparison tables, and mathematical formulas) using a single Gemini API call with strict transcript-grounding constraints.
- **Duration-Bounded Timestamps**: Associates lecture topics with valid timestamps bounded strictly within the video duration, allowing students to navigate directly to relevant lecture segments.
- **Automated Study Material Generation**: Builds interactive quizzes, active-recall flashcards, a 5-stage spaced-repetition revision timeline, and interview preparation questions directly from the generated notes without additional LLM calls.
- **Modern Interactive Dashboard**: Responsive React 19 frontend featuring light and dark themes, dedicated study tool workspaces, embedded lecture player, and search library.
- **Printable A4 PDF Export**: High-fidelity PDF compilation powered by headless Chromium (Playwright) for offline revision.
- **Empirical Research Backing**: Benchmarked across 7 real CS university lectures (Operating Systems, Computer Networks, DBMS, and AI) with an accompanying 6-page IEEE-format research paper.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Mermaid.js, KaTeX |
| **Backend** | FastAPI, Python 3.10+, Uvicorn, SQLite3, Pydantic, httpx |
| **AI Model** | Google Gemini API (`gemini-3.6-flash`) |
| **PDF Compiler** | Playwright (Headless Chromium) |
| **Testing** | Pytest (92 automated unit and API contract tests) |

---

## Repository Structure

```text
lecture-intelligence-platform/
├── backend/                  # FastAPI backend server
│   ├── api/                  # API routers (tasks, download, content)
│   ├── core/                 # Processing pipeline orchestrator
│   ├── database/             # SQLite task persistence layer
│   ├── services/             # Transcript extraction, AI, timestamps, PDF
│   ├── tests/                # 92 Pytest automated test cases
│   ├── output/               # Benchmark study packs (.json) and PDF scratch
│   └── main.py               # Application entry point
├── frontend/                 # React 19 + Vite web dashboard
│   ├── src/
│   │   ├── components/       # Layout, top navigation, modals
│   │   ├── features/         # Dashboard, lecture flow, library
│   │   └── pages/            # Page routing and views
│   └── package.json
├── research/                 # Research artifacts and empirical evaluation
│   ├── baselines/            # Baseline implementations (equal-interval, direct-LLM)
│   ├── dataset/              # 7 CS lecture metadata and transcripts
│   ├── paper/                # IEEE research paper (PDF, DOCX, LaTeX, figures)
│   └── results/              # Raw and processed experiment evaluation data
├── .env.example              # Root environment variable template
├── .gitignore                # Root gitignore rules
└── README.md                 # Project documentation
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Google Gemini API Key** (obtain free from [Google AI Studio](https://aistudio.google.com/app/apikey))

---

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies and Playwright Chromium:
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Start the backend development server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend will be available at `http://127.0.0.1:8000`. API documentation is accessible at `http://127.0.0.1:8000/docs`.

---

### Frontend Setup

1. In a new terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://127.0.0.1:5173`.

---

## Running Automated Tests

Run the full backend test suite (92 tests covering API contracts, timestamp bounding, URL parsing, and task state machines):

```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests/ -v
```

To build the frontend bundle:

```bash
cd frontend
npm run build
```

---

## Research & Evaluation Note

LectraAI was evaluated on a benchmark corpus of 7 Computer Science university lectures spanning 6.5 to 61.7 minutes (mean: 19.4 min). Key empirical findings:

- **Latency & Reliability (RQ4):** Mean end-to-end processing latency was **39.21 seconds** with a 0% failure rate ($N=7$). Latency strongly correlated with transcript length (Pearson $r = 0.98, p < 0.001$).
- **Timestamp Coverage (RQ1):** The keyword-overlap heuristic achieved **56.0% topic coverage** across the dataset; human accuracy validation remains an ongoing evaluation phase.
- **Artifact Quality (RQ2 & RQ3):** Deterministic distractor extraction produced 44.4% unique options compared to 100% for unconstrained LLM generation, confirming a measurable trade-off between strict grounding and lexical variety.

The complete 6-page research paper and reproduction scripts are located in `research/paper/`.

---

## Academic Context

Developed as a Major Project (Course: **BCS 753**, Session: **2026-27**) by students of the **Department of Computer Science & Engineering / Information Technology**, ABES Engineering College, Ghaziabad, under the guidance of **Ms. Shivani Garg** (Assistant Professor, Department of CE/IT).
