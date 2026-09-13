# Authentication and User Data Persistence Audit (LectraAI)

* **Audit Title:** Comprehensive Technical Audit of Authentication, Access Control, and User Data Persistence
* **Date / Time:** 2026-09-13T17:22:10+05:30 (September 13, 2026)
* **Git Branch:** `main`
* **Current Commit Hash:** `cb39825c99c20724b26c36848abd07afdd829464`

---

## 1. Audit Scope

This audit evaluates the current architectural state of LectraAI regarding user identity, authentication, session lifecycle, authorization, and data persistence across the client and server. The primary goals are:
1. Determine why user lecture history and study packs can disappear.
2. Audit the current frontend routing and components for authentication or profile mechanisms.
3. Audit the backend API and SQLite database schema for multi-tenant isolation, user models, and access control.
4. Verify whether existing completed study packs (139 completed tasks, 17 JSON packs, 26 PDFs) and database records can be preserved during migration.
5. Provide an actionable architectural blueprint and phased implementation plan to introduce secure authentication and server-backed persistence without disrupting existing working pipelines (Gemini AI, Playwright PDF rendering, transcript fetching, quizzes, flashcards, revision, and interviews).

---

## 2. Files Inspected

### Backend
* [backend/main.py](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/main.py) — API endpoints, CORS config, lifecycle events, background worker execution.
* [backend/config.py](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/config.py) — Database path, output directory, environment settings.
* [backend/services/task_repository.py](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/services/task_repository.py) — SQLite schema initialization, CRUD queries, research metrics columns.
* [backend/data/tasks.db](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/data/tasks.db) — Active SQLite database (310 tasks total, 139 completed).
* [backend/output/](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/output/) — File storage directory (17 JSON study packs, 26 rendered PDFs).
* [backend/requirements.txt](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/requirements.txt) — Python dependencies.

### Frontend
* [frontend/src/routes.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/routes.jsx) — Application route table.
* [frontend/src/api/client.js](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/api/client.js) — HTTP client and backend API contract.
* [frontend/src/features/dashboard/lib/recentLectures.js](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/dashboard/lib/recentLectures.js) — LocalStorage read/write routines and metric derivation.
* [frontend/src/features/lecture/LectureFlow.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/lecture/LectureFlow.jsx) — Main user interaction flow, task polling, and history storage.
* [frontend/src/features/library/LectureLibrary.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/library/LectureLibrary.jsx) — Library view and study pack loader.
* [frontend/src/features/dashboard/lib/openStudyTool.js](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/dashboard/lib/openStudyTool.js) — Global shortcuts to study pack tools.
* [frontend/src/features/settings/lib/localData.js](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/settings/lib/localData.js) — Local storage history management.
* [frontend/src/features/settings/components/LocalDataCard.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/settings/components/LocalDataCard.jsx) — Settings UI for device storage reset.
* [frontend/src/features/settings/components/AboutCard.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/settings/components/AboutCard.jsx) — Identity card and app metadata.
* [frontend/src/components/layout/TopNav.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/components/layout/TopNav.jsx) — Desktop navigation bar and user profile button.
* [frontend/src/components/layout/Sidebar.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/components/layout/Sidebar.jsx) — Mobile drawer and workspace footer.

---

## 3. Current Implementation Status Matrix

| Component / Subsystem | Status | Details |
|---|---|---|
| **Lecture Processing Pipeline** | **COMPLETE** | YouTube transcript extraction, Gemini structured generation, Playwright PDF render, and caching operate reliably. |
| **Study Pack Tools** | **COMPLETE** | Notes, Topics, Quiz, Flashcards, Spaced Revision, Interview Prep, and Transcript tabs function properly. |
| **Task Status Polling** | **COMPLETE** | `GET /tasks/{task_id}` correctly polls background thread tasks. |
| **User Registration / Login UI** | **NOT IMPLEMENTED** | No forms, modals, or pages exist for signup or login. |
| **Frontend Auth Routing** | **NOT IMPLEMENTED** | Routes `/login`, `/signup`, `/register` do not exist in `routes.jsx`. |
| **Backend Auth API** | **NOT IMPLEMENTED** | No `/auth/login`, `/auth/register`, or `/auth/me` endpoints exist. |
| **Password Hashing & Token Service**| **NOT IMPLEMENTED** | No hashing or token generation logic is configured. |
| **User Data Isolation / Ownership** | **NOT IMPLEMENTED** | Tasks in `tasks.db` have no `user_id`; any user can access any task by UUID. |
| **Backend Lecture History API** | **NOT IMPLEMENTED** | `task_repository.py` has `list_tasks()`, but no endpoint in `main.py` exposes history to the client. |
| **Client Data Persistence** | **PARTIAL / VOLATILE** | History relies solely on browser `window.localStorage['lectra_recent_lectures']`. |
| **Database Schema** | **PARTIAL** | SQLite has `tasks` and `task_stage_events`, but no `users` table or foreign keys. |
| **PostgreSQL Integration** | **NOT IMPLEMENTED** | Zero PostgreSQL code, config, or drivers exist in the project. SQLite is the active engine. |

---

## 4. Key Findings

1. **Zero Authentication Infrastructure:**
   The application is completely unauthenticated. `TopNav.jsx` displays a static `"Student"` avatar button linking directly to `/settings`. `Sidebar.jsx` displays a static `"Student Account / Local workspace"` footer. `AboutCard.jsx` explicitly documents:
   > *"There's no account or sign-in — this is a single local workspace. Your lecture history and preferences live only in this browser."*

2. **Root Causes of Disappearing Notes and Lectures:**
   * **Cause A (Client-Side Exclusivity):** Frontend components (`DashboardHome`, `LectureLibrary`, stats strip) read exclusively from `localStorage.getItem('lectra_recent_lectures')`. Clearing browser cookies/storage, switching browsers, using private/incognito mode, or switching machines causes all historical lectures to disappear from the UI.
   * **Cause B (Missing History Route):** While SQLite contains 310 task records (139 completed), `backend/main.py` offers no `GET /lectures` or `GET /tasks` endpoint. The frontend never queries the server for existing lectures.
   * **Cause C (Explicit Local History Clearing):** In `LocalDataCard.jsx`, clicking "Clear history" runs `localStorage.removeItem('lectra_recent_lectures')`, detaching the UI from previous lectures.
   * **Cause D (Server Restart Reset):** In `main.py` startup lifespan, any task in `processing` status is marked `failed` on server reload (`UPDATE tasks SET status='failed' WHERE status='processing'`). If a reload happens mid-generation, that lecture never reaches `loadCompletedTask()` and is never added to history.

3. **Insecure Direct Object References (IDOR):**
   * Any client can query `GET /tasks/{task_id}`, `GET /tasks/{task_id}/content`, or `GET /download/{task_id}` without credentials. If a task ID is known, any study pack or PDF can be accessed by anyone.

4. **Data Preservation Feasibility:**
   * **All existing task data and generated study packs can be 100% preserved.**
   * Database: All 310 tasks remain in `backend/data/tasks.db`.
   * Filesystem: 17 JSON study packs and 26 PDFs remain in `backend/output/`.
   * An additive migration (adding a nullable `user_id` column to `tasks`) allows existing rows to remain intact. A default demo user account can own existing legacy records, or users can claim them on first login.

---

## 5. Security & Architectural Risks

1. **Data Volatility:** Users lose their generated study packs whenever browser storage clears or expires.
2. **Lack of Tenant Isolation:** Tasks are globally accessible by UUID.
3. **No Brute-Force or Session Controls:** Without authentication, anyone can spam `POST /youtube` and consume background processing and Gemini API quotas.
4. **CORS Misconfiguration:** Currently configured as `allow_origins=["*"]` with `allow_credentials=False`.

---

## 6. Recommended Solution Architecture

### 6.1 Authentication Mechanism
* **Password Hashing:** Salted PBKDF2-HMAC-SHA256 with 600,000 iterations and a cryptographically secure 16-byte random salt. Uses Python's standard `hashlib` — zero native dependency or compilation risk on Windows, fully NIST and OWASP compliant.
* **Token Model:** Cryptographically signed JSON Web Tokens (JWT) using HMAC-SHA256 (`cryptography` / standard Python crypto).
* **Token Storage:** Frontend stores token in `localStorage` and injects `Authorization: Bearer <token>` into all API requests.
* **Demo / Guest Mode:** Seed an automatic demo user (`demo@lectra.ai` / `DemoStudent123!`) on startup to maintain immediate 1-click evaluation for faculty presentations and testing.

### 6.2 Database Schema (SQLite)
```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,             -- UUIDv4
    email TEXT UNIQUE NOT NULL,       -- Normalized lowercase
    name TEXT NOT NULL,              -- Full display name
    password_hash TEXT NOT NULL,     -- Salted PBKDF2-HMAC-SHA256
    salt TEXT NOT NULL,              -- 16-byte hex salt
    created_at TEXT NOT NULL,        -- ISO-8601 UTC
    updated_at TEXT NOT NULL         -- ISO-8601 UTC
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Tasks Table (Additive Migration)
ALTER TABLE tasks ADD COLUMN user_id TEXT REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN title TEXT;
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
```

### 6.3 API Endpoint Contract

| Method | Route | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Creates new user; returns `{ token, user }`. |
| `POST` | `/auth/login` | No | Validates credentials; returns `{ token, user }`. |
| `GET` | `/auth/me` | Yes | Returns current user profile. |
| `POST` | `/auth/logout` | Yes | Invalidation / acknowledgment. |
| `GET` | `/lectures` | Yes | Returns all lectures owned by `current_user.id`. |
| `POST` | `/lectures/claim-local` | Yes | Attaches pre-auth task IDs from client localStorage to `current_user.id`. |
| `DELETE`| `/lectures/{task_id}` | Yes | Deletes a task owned by `current_user.id`. |
| `POST` | `/youtube` | Yes | Starts background generation, assigning task to `current_user.id`. |
| `GET` | `/tasks/{task_id}` | Yes | Verifies `task.user_id == current_user.id`. |
| `GET` | `/tasks/{task_id}/content` | Yes | Verifies `task.user_id == current_user.id`. |
| `GET` | `/download/{task_id}` | Yes | Verifies `task.user_id == current_user.id`. |

---

## 7. Exact Files Requiring Modification

### Backend
1. [backend/config.py](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/config.py) — Add JWT settings (`JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_DAYS`).
2. [backend/services/task_repository.py](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/services/task_repository.py) — Add `users` table creation, additive column migration (`user_id`, `title`), user CRUD functions, and user-scoped task list queries.
3. [backend/services/auth_service.py](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/services/auth_service.py) *(NEW)* — PBKDF2 hashing, JWT signing/decoding, FastAPI dependency `get_current_user`.
4. [backend/main.py](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/backend/main.py) — Register auth & lecture history routes; enforce user ownership on existing endpoints; update CORS.

### Frontend
1. [frontend/src/api/client.js](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/api/client.js) — Add token injection into headers, auth API functions, and lecture history fetchers.
2. [frontend/src/features/auth/AuthContext.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/auth/AuthContext.jsx) *(NEW)* — React Auth Context managing token, user session, login, register, logout, and demo login.
3. [frontend/src/features/auth/LoginPage.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/auth/LoginPage.jsx) *(NEW)* — High-aesthetic login/signup interface with 1-click demo login option.
4. [frontend/src/routes.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/routes.jsx) — Add `/login` route; wrap shell with `AuthProvider`.
5. [frontend/src/components/layout/TopNav.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/components/layout/TopNav.jsx) — Display authenticated user initials, name, and logout action.
6. [frontend/src/components/layout/Sidebar.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/components/layout/Sidebar.jsx) — Display real user information and logout trigger.
7. [frontend/src/features/library/LectureLibrary.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/library/LectureLibrary.jsx) — Load lectures from `GET /lectures` with localStorage fallback.
8. [frontend/src/features/lecture/LectureFlow.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/lecture/LectureFlow.jsx) — Sync completed lectures with the backend.
9. [frontend/src/features/settings/components/AboutCard.jsx](file:///c:/Users/LAKSHAY%20ANAND/OneDrive/Desktop/lecture-intelligence-platform/frontend/src/features/settings/components/AboutCard.jsx) — Update copy to reflect cloud user profile.

---

## 8. Proposed Implementation Plan

### Phase 1: Backend Auth & Database Foundations
* Add JWT configuration to `backend/config.py`.
* Extend `backend/services/task_repository.py` with `users` schema, additive columns on `tasks`, user CRUD, and demo user seeding.
* Implement `backend/services/auth_service.py` with PBKDF2 hashing, JWT signing, and FastAPI `get_current_user` dependency.

### Phase 2: API Endpoints & Access Control
* In `backend/main.py`, implement `/auth/register`, `/auth/login`, `/auth/me`, `/auth/logout`.
* Implement `GET /lectures`, `POST /lectures/claim-local`, `DELETE /lectures/{task_id}`.
* Enforce ownership on `/youtube`, `/tasks/{task_id}`, `/tasks/{task_id}/content`, `/download/{task_id}`.
* Update CORS settings to support headers and credentials.

### Phase 3: Frontend Client & Auth State Management
* Extend `frontend/src/api/client.js` with Bearer token injection and auth/lecture methods.
* Create `frontend/src/features/auth/AuthContext.jsx` with full session lifecycle.
* Build `frontend/src/features/auth/LoginPage.jsx` supporting registration, login, and 1-click demo login.
* Update `frontend/src/routes.jsx` to register `/login` and wrap app in `AuthProvider`.

### Phase 4: UI Integration & Cloud History Sync
* Update `TopNav.jsx` and `Sidebar.jsx` with real user data and logout buttons.
* Update `LectureLibrary.jsx` and `LectureFlow.jsx` to load and sync lectures with `GET /lectures`.
* On first user login, trigger `POST /lectures/claim-local` to automatically claim any existing local storage lectures so zero past work is lost.

### Phase 5: Verification & End-to-End Validation
* Run automated backend unit tests (`pytest`).
* Validate user registration, login, token expiry, and logout.
* Verify cross-user isolation: User A cannot read or download User B's task.
* Verify end-to-end lecture generation, study pack display, and PDF download for authenticated users.
* Run frontend production build (`npm run build`).

---

## 9. Verification & Testing Plan

* **Automated Tests:**
  * Add unit tests for `auth_service.py` (password hashing, verification, token generation, expired token rejection).
  * Add integration tests for `/auth/register`, `/auth/login`, `/auth/me`, and `/lectures`.
  * Add security tests confirming that accessing another user's `task_id` returns 404/403.
  * Execute full suite via `pytest backend/tests`.
* **Manual UI & Data Checks:**
  * Register a new user, log in, process a video, verify it appears in Library.
  * Log out and log in as a different user; verify the first user's lecture is NOT visible in Library.
  * Use Incognito mode, log in as User A; verify all of User A's lectures appear immediately from the server.
  * Verify 1-click Demo Login works seamlessly.
