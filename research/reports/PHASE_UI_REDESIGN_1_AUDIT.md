# Phase UI Redesign 1 — Frontend Audit

**Scope:** Planning only. No production code, backend, API, or database behavior was changed in this phase.

**Stack:** React 19 + Vite 8, `react-router-dom` v7 (`HashRouter`), no CSS framework — inline `style={}` objects everywhere plus CSS custom properties (`var(--*)`) for theme tokens, a handful of utility classes in `index.css`/`App.css` (`.lai-*`). `lucide-react` for icons. No global state library — state is local `useState`/props plus `localStorage`.

---

## 1. Current UI Structure

```
main.jsx
 └─ HashRouter > ThemeProvider > ToastProvider > App
     └─ routes.jsx (AppRoutes)
         └─ AppShell (layout)              ← persistent Sidebar + Topbar + <Outlet/>
             ├─ /dashboard        → DashboardPage       → LectureFlow (real, stateful)
             ├─ /process          → LectureProcessingPage → PlaceholderPage (stub)
             ├─ /library          → LibraryPage          → LectureLibrary (real)
             ├─ /notes            → NotesPage            → PlaceholderPage (stub)
             ├─ /quiz             → QuizPage             → PlaceholderPage (stub)
             ├─ /flashcards       → FlashcardsPage       → PlaceholderPage (stub)
             ├─ /revision         → RevisionPage         → PlaceholderPage (stub)
             ├─ /interview        → InterviewPage        → PlaceholderPage (stub)
             ├─ /settings         → SettingsPage         → SettingsWorkspace (real)
             └─ *                 → NotFoundPage
```

**Key discovery — this is the single most important fact for planning Phase 2:**
The study tools already have a real, fully-built, tabbed experience. It lives **inside `LectureWorkspace.jsx`** (`src/components/LectureWorkspace.jsx`), which is rendered directly by `LectureFlow` (from `/dashboard`, after a lecture is processed or reopened) and by `LectureLibrary` (from `/library`, after "Open" on a card). `LectureWorkspace` owns its own `activeTab` state (`overview | notes | topics | quiz | flashcards | revision | interview | transcript`) and renders `NotesWorkspace`, `QuizWorkspace`, `FlashcardsWorkspace`, `RevisionWorkspace`, `InterviewWorkspace`, `TopicsView`, `TranscriptView` as tab panes — a proper in-page tab bar with counts (`header` block in `LectureWorkspace.jsx:343-401`).

The sidebar's `/notes`, `/quiz`, `/flashcards`, `/revision`, `/interview`, `/process` routes are **not** wired to that real experience at all. Each one renders `PlaceholderPage`, a stub component whose entire purpose (per its own doc-comment) is to explain "this tool opens from a lecture" and hand the user to `/dashboard` or `/library`. This was evidently already a deliberate, partial Phase-0 fix — the routes and sidebar entries exist, but the tool UI itself was correctly *not* duplicated into them.

**So the redundancy is not duplicated feature code — it's dead/misleading navigation surface.** Five of the sidebar's nine links (`Notes`, `Quiz`, `Flashcards`, `Revision Plan`, `Interview Questions`) plus one more (`Lecture Processing`) currently lead to a dead end that just points back at the two links that work. `QuickActions.jsx` on the dashboard *also* links to those same five dead routes (`navigate('/notes')`, `navigate('/quiz')`, etc.) — this is the second redundant surface, and it's actively misleading since those cards look actionable from the dashboard.

## 2. Current Navigation Redundancy — Inventory

| Nav surface | Items | Status |
|---|---|---|
| Sidebar (`navConfig.js`, all 9 items, always visible) | Dashboard, Lecture Processing, Lecture Library, *Study Tools:* Notes, Quiz, Flashcards, Revision Plan, Interview Questions, Settings | Notes/Quiz/Flashcards/Revision/Interview/Processing → dead-end stub pages |
| Dashboard → Quick Actions (`QuickActions.jsx`) | Process new lecture, Study notes, Quiz, Flashcards, Revision plan, Interview prep, Lecture library | Same 5 dead-end routes, duplicating the sidebar's Study Tools section |
| Dashboard → Study Materials Launcher (inside `LectureWorkspace`, `studyResourceLaunchers`, only visible once a lecture is open) | Study Notes, Interactive Quiz, Flashcards, Interview Prep, Revision Plan | This one is real — it switches `activeTab` in the same component |
| `LectureWorkspace` internal tab bar | Overview, Notes, Topics, Quiz, Flashcards, Revision, Interview, Transcript | Real, works, only reachable after a lecture is loaded |

Net effect: a first-time visitor sees "Notes / Quiz / Flashcards / Revision Plan / Interview Questions" **three times** (sidebar, dashboard Quick Actions, and — once a lecture is open — the in-workspace tab bar + launcher cards), and two of those three are non-functional dead ends that only exist to redirect back.

There is currently **no** "History" or "Search" nav destination anywhere (the target nav asks for both) — `Library` currently plays the role of both browse-history and search-within-history (it has its own search/sort UI, see §7).

## 3. Components That Can Be Reused As-Is

These are generic, already decoupled from navigation/placement, and should not be rewritten:

- **UI primitives** (`src/components/ui/*`): `Button`, `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardBody`/`CardFooter`, `Badge`, `Input`, `Switch`, `Alert`, `EmptyState`, `ErrorState`, `Modal`, `Tooltip`, `Dropdown`, `Tabs`, `Toast`/`useToast`, `Spinner`/`LoadingPanel`, `Skeleton`, `PageHeader`. All theme-aware via CSS vars, all already used consistently across features.
- **`components/ui/Tabs.jsx`** — a controlled underline tab strip (`value/onChange/tabs=[{id,label,icon,count}]`) that is functionally identical to the bespoke tab bar hand-rolled inside `LectureWorkspace.jsx` (lines 343-401). Not currently used there. Worth consolidating onto in Phase 2+ (see §9) but not required to unblock the redesign.
- **`LectureWorkspace.jsx`** (and everything it renders: `NotesWorkspace`, `TopicsView`, `QuizWorkspace`, `FlashcardsWorkspace`, `RevisionWorkspace`, `InterviewWorkspace`, `TranscriptView`, and their `lib/*.js` parsers) — this is the real Study Pack experience. Reuse wholesale; it is the thing Phase 2 needs to make reachable, not rebuild.
- **`features/dashboard/lib/recentLectures.js`** — single source of truth for the `lectra_recent_lectures` localStorage key, thumbnail derivation, "time ago" formatting, and stats. Already shared by Dashboard, Library, and Settings.
- **`features/library/*`** (`LectureLibrary`, `LibraryHeader`, `LibrarySearch`, `LibrarySort`, `LibraryGrid`, `LectureCard`, `lib/library.js`) — real, working, and already does exactly what a "History" destination needs (browse + search + sort past study packs by real local data).
- **`api/client.js`** — clean fetch wrapper (`submitYoutubeUrl`, `fetchTaskStatus`, `fetchTaskContent`, `getDownloadUrl`), API-base configurable via `VITE_API_BASE_URL`. No changes needed for a nav restructure.
- **`theme/ThemeProvider.jsx`** — context + `lectra_theme` localStorage key + `prefers-color-scheme` fallback + `<html class="dark">`/`color-scheme` toggling. Already exposes `toggleTheme`/`isDark`, used today from `Topbar`. Directly reusable for a nav-level theme toggle.
- **`hooks/useMediaQuery.js`** — generic, already drives the one existing responsive behavior (mobile drawer breakpoint at 1024px in `AppShell`).
- **`features/settings/*`** (`SettingsWorkspace`, `ThemeSelector`, `LocalDataCard`, `AboutCard`, `PreferenceRow`, `SettingsSection`, `lib/localData.js`) — real, reads/writes only real storage keys (`lectra_theme`, `lectra_notes_fontsize`, `lectra_recent_lectures`). Reuse as the target nav's "Profile"/settings destination.
- **`components/ProcessingView.jsx`** — real multi-stage processing UI already used by `LectureFlow` while a task is running. Reuse for the "Process Lecture" destination.

## 4. Components That Should Be Modified

- **`components/layout/navConfig.js`** — this is the single source of truth for the sidebar (`NAV_SECTIONS`) and for Topbar's per-route title/subtitle (`findNavByPath`). Restructuring the nav is primarily an edit to this one file plus `Sidebar.jsx`'s rendering of it. Low blast radius: `AppShell.jsx` and `Topbar.jsx` only consume `title`/`subtitle`/`icon` off whatever list this exports.
- **`components/layout/Sidebar.jsx`** — currently renders `NAV_SECTIONS` directly with hand-rolled `NavLink` styling. Needs new items (Search, History if distinct from Library, Profile) and removal of the five Study Tools entries. The footer "Student Account" block (static, non-interactive) is the natural seed for a real "Profile" nav destination.
- **`components/layout/Topbar.jsx`** — hardcodes a theme toggle + a "New Lecture" button that always navigates to `/dashboard`. If Theme/Profile move into the sidebar per the target nav, this component's responsibilities shrink to just the title/subtitle + mobile menu button; the theme toggle and "New Lecture" CTA placement should be decided in Phase 2 planning (keep in Topbar vs. move to sidebar/dashboard-only).
- **`routes.jsx`** — needs `/notes`, `/quiz`, `/flashcards`, `/revision`, `/interview` routes either removed or repointed (see §9 risk about deep links).
- **`pages/QuickActions.jsx`** (dashboard) — currently links to the same five dead routes as the sidebar; once those routes change, these cards need to either open the last-opened lecture's workspace at that tab, or be replaced by dashboard-appropriate actions per the target spec (Process Lecture CTA, Continue Learning, etc.), consistent with §5 below.
- **`pages/PlaceholderPage.jsx`** — becomes dead code once the five stub routes it backs are removed; either delete or repurpose (e.g., generic 404/redirect helper) once Phase 2 lands.
- **`DashboardHome.jsx`** and its `components/*` — largely already matches the target dashboard spec (hero, URL input, quick actions, continue learning, recent lectures, stats). Needs `QuickActions` updated per above, and an explicit "How It Works" section, which does not currently exist anywhere in the app (see §6).

## 5. Components That Should NOT Be Touched

- **`LectureFlow.jsx`** — the state machine (`hero → processing → dashboard` view, polling, `localStorage` persistence via `readRecentLectures`/`RECENTS_STORAGE_KEY`) is working, tested-against-backend logic explicitly called out in its own comments as "preserved intact." Any nav change must route *into* this, not modify its internals.
- **`LectureWorkspace.jsx` internals** (tab content rendering, video seek logic, timestamp derivation `getLectureTimestamps`) — this is the real product; Phase 2 is about *reaching* it via better nav, not rewriting it.
- **`api/client.js`**, **backend** (`/backend`), and all **`research/`** content — explicitly out of scope per the task instructions and unrelated to this UI work.
- **`features/quiz`, `features/flashcards`, `features/revision`, `features/interview`, `features/studypack`** internals — these are the actual tool implementations rendered as tabs; no redesign work is needed inside them for Phase 1/2's navigation goals.
- **`theme/ThemeProvider.jsx` internals**, **`api` layer**, **`hooks/useMediaQuery.js`** — stable, generic, already correct.

## 6. Recommended New Navigation Structure

Matches the target spec (`Home/Dashboard, Process Lecture, Library, History, Search, Theme, Profile`), mapped onto what already exists:

| Target nav item | Maps to |
|---|---|
| Home / Dashboard | `/dashboard` — unchanged (`DashboardPage` → `LectureFlow`) |
| Process Lecture | `/process` — currently a dead placeholder; either (a) redirect to `/dashboard` and rely on the hero input, or (b) build the real resumable processing view `PlaceholderPage`'s own bullets describe (`ProcessingView.jsx` already exists and is real — it's just never routed to directly today, only reached transiently inside `LectureFlow`'s `view === 'processing'` state). Recommend (b) as the Phase 2+ target since the component already exists. |
| Library | `/library` — unchanged (`LibraryPage` → `LectureLibrary`), already does browse + search + sort of past study packs |
| History | Decide whether this is a distinct destination from Library, or the same data reframed (e.g., Library = grid/search of packs, History = chronological activity log). Given `LectureLibrary` already covers "every study pack, searchable, sortable by recency," recommend **not** building a second page — either drop "History" as a separate nav item and let Library serve both roles, or relabel Library's default sort/view as the "History" entry point. This needs a product decision before Phase 2, not a component decision. |
| Search | No dedicated global search exists today. `LibrarySearch.jsx` searches only within the local `lectra_recent_lectures` list (title/video-id substring match, see `lib/library.js`). If "Search" in the target nav means "search my library," this is `LibrarySearch` promoted to its own nav-accessible surface (or a command-palette style overlay reusing the same filter logic) rather than new search logic. |
| Theme | Reuse `useTheme()`/`toggleTheme` from `ThemeProvider` — currently a Topbar icon button; move/duplicate into the sidebar per target nav. |
| Profile | No profile concept exists (the sidebar footer is a static "Student Account / Local workspace" block, not interactive). New: a lightweight profile/account surface — likely folds into `Settings` (already covers appearance, preferences, local data, about) rather than being a wholly new page. Recommend Profile becomes the nav *entry point* that opens `SettingsWorkspace` (i.e., rename/re-route `/settings` as the Profile destination, or keep Settings and treat Profile as a synonym in nav labeling only). |

**Sidebar `NAV_SECTIONS` after redesign (proposed shape, not final):**
```
[Dashboard, Process Lecture, Library, History?]   ← primary section, no heading
[Search]                                          ← as its own item or a topbar affordance
[Theme, Profile/Settings]                         ← utility section
```
No `Study Tools` section — Notes/Quiz/Flashcards/Revision/Interview/Topics are removed from the sidebar entirely and live only inside the Study Pack tab bar (`LectureWorkspace`), matching what the target design already asks for and what `PlaceholderPage`'s own copy already assumes ("X is part of every lecture's Study Pack").

## 7. Recommended Study Pack (Internal) Navigation Structure

No structural change needed — `LectureWorkspace.jsx`'s existing tab bar (`Overview, Notes, Topics, Quiz, Flashcards, Revision, Interview, Transcript`) already matches the target design's intent ("study tools... live INSIDE the Study Pack experience"). Two low-risk cleanups worth doing in a later phase, not this one:
- Replace the hand-rolled tab-bar markup (`LectureWorkspace.jsx:343-401`) with the existing `components/ui/Tabs.jsx` primitive to remove duplicated tab-styling code (pure refactor, no behavior change — flagged for Phase 2+, not required to unblock nav redesign).
- `studyResourceLaunchers` (the card grid on the Overview tab) and the tab bar list resource names in two separate arrays inside the same file (`navTabs` vs `studyResourceLaunchers`) — worth a single shared definition later to avoid the two lists drifting.

## 8. Responsive / Mobile Considerations

Current behavior (`AppShell.jsx` + `useMediaQuery('(max-width: 1024px)')`):
- **≥1024px:** persistent sidebar (`Sidebar` with `showClose=false`), no hamburger.
- **<1024px:** sidebar becomes a slide-in drawer (`position: fixed`, backdrop, closes on route change, closes on outside-click, `body.style.overflow = 'hidden'` while open) toggled by a hamburger button in `Topbar`.
- `LectureWorkspace`'s own tab bar has `overflowX: auto` + `scrollbarWidth: none` for narrow screens — horizontally scrollable tabs, no collapsing into a menu.
- `NotesWorkspace` conditionally hides the sidebar Table of Contents below 1024px (`useMediaQuery` again) and inlines a TOC instead — an existing, working pattern for "sidebar becomes inline content on mobile" that the new global nav could mirror if it grows a persistent secondary panel.

**Implications for the redesign:**
- Reducing the sidebar from 9 to ~5-6 items *reduces* mobile drawer scroll height — a straightforward win, no new responsive logic needed.
- Adding **Search** as a nav item needs a mobile treatment decided explicitly (icon-only in the collapsed topbar vs. a drawer entry) — there's no existing search-trigger pattern in the codebase to copy; `LibrarySearch.jsx` is an inline text input meant for a full-width toolbar, not a nav affordance.
- Adding **Profile** as a nav item can reuse the existing (currently static) sidebar footer block's visual style.
- No breakpoint other than 1024px exists anywhere in the app (`grep` of the codebase shows `useMediaQuery` used only in `AppShell` and `NotesWorkspace`, both at the same breakpoint) — any new responsive behavior in Phase 2 should stay consistent with that single breakpoint unless there's a specific reason to add another.

## 9. Potential Risks / Regressions

1. **Deep-link breakage.** `/notes`, `/quiz`, `/flashcards`, `/revision`, `/interview`, `/process` are live routes today (even though they only render stubs). Anyone with a bookmarked/shared link to one will get a 404 (or wrong content) if the routes are deleted outright rather than redirected. Recommend keeping these as redirects to `/dashboard` (or to `/library` where a `taskId` might one day be encoded) rather than removing them from `routes.jsx`.
2. **`QuickActions.jsx` and any other `navigate('/notes')`-style call sites** must be updated in lockstep with the route change, or they'll silently point at whatever the redirect target becomes rather than a real tool.
   ```
   grep -rn "navigate('/notes'\|navigate('/quiz'\|navigate('/flashcards'\|navigate('/revision'\|navigate('/interview'\|navigate('/process'" frontend/src
   ```
   should be run before Phase 2 implementation to catch all call sites (currently known: `QuickActions.jsx`, `PlaceholderPage.jsx`'s own links, and the sidebar itself).
3. **`findNavByPath` (`navConfig.js:109`) drives Topbar's page title/subtitle everywhere.** If a route is removed from `NAV_SECTIONS` but not from `routes.jsx` (per the redirect recommendation above), `Topbar` will fall back to the generic `'LectraAI'` title with no subtitle for that route — acceptable for a redirect-only route, but worth confirming intentionally rather than as a side effect.
4. **No regression risk to `LectureWorkspace`/`LectureFlow` from a nav-only change** — since the real tool code is already isolated from sidebar routing (per §1's central discovery), a well-scoped Phase 2 that only touches `navConfig.js`, `Sidebar.jsx`, `routes.jsx`, and `QuickActions.jsx` cannot break quiz/flashcards/notes/etc. functionality. This significantly de-risks the redesign.
5. **"History" vs "Library" ambiguity (§6)** is a product-definition risk, not a code risk — building a second, near-duplicate browse-history page would recreate exactly the kind of redundancy this redesign is trying to remove. Needs an explicit decision before Phase 2 implementation.
6. **Search scope ambiguity** — global search (lectures + notes content + quiz questions, etc.) vs. library-only title search are very different amounts of work. `LibrarySearch`'s existing implementation (`lib/library.js`) only filters the local `lectra_recent_lectures` array by title/video-id — it does not search inside study pack content. Confirm target scope before estimating Phase 2+.
7. **Profile has no backend concept.** There is no auth/user system (`README`/`api/client.js` confirm this is a local-only tool hitting a local FastAPI backend with no auth headers). "Profile" in the target nav should be scoped as local preferences (i.e., a rename of Settings), not a real account system, unless the user intends to scope in auth — that would be a much larger, backend-touching change outside this redesign's stated boundaries.

## 10. Exact Implementation Plan for Phase 2 Onward

**Phase 2 — Navigation restructure (frontend-only, no new features):**
1. Decide History vs. Library and Search scope (product decisions from §6/§9, blocking).
2. Edit `navConfig.js`: remove the `Study Tools` section (Notes/Quiz/Flashcards/Revision/Interview); keep Dashboard/Library; add Process Lecture (repoint to real `ProcessingView` flow or keep as dashboard alias per §6); add Search and Profile entries per the decision in step 1.
3. Edit `Sidebar.jsx` only as needed to render the new item set — its rendering logic (`NavItem`, section headings, active-state styling) needs no structural change, only data.
4. Edit `routes.jsx`: convert `/notes`, `/quiz`, `/flashcards`, `/revision`, `/interview` from placeholder-page routes to redirects (`<Navigate to="/dashboard" replace />`) to avoid breaking deep links (§9.1). Decide `/process`'s real destination.
5. Update `QuickActions.jsx` to stop linking to the five removed routes; repoint its actions at real destinations (open last lecture's workspace at a given tab, or drop the redundant cards entirely now that the sidebar isn't duplicating them either).
6. Delete `PlaceholderPage.jsx` and the five thin `*Page.jsx` wrappers that only rendered it, once nothing routes to them.
7. Add the "How It Works" dashboard section called for in the target spec — new, small presentational component under `features/dashboard/components/`, no existing equivalent (confirmed via read of every `DashboardHome` child in §1/§4).
8. Add Theme + Profile affordances to the sidebar (reusing `useTheme()` and `SettingsWorkspace` respectively), decide whether Topbar keeps its own theme toggle or the sidebar becomes the single source (avoid recreating the redundancy this whole phase is fixing).
9. Manual regression pass: process a lecture end-to-end, reopen from Library, reopen from Continue Learning, toggle theme, resize to <1024px and verify the drawer, confirm every study tool tab still renders inside the workspace unchanged.

**Phase 3+ (optional, lower priority, flagged but not scheduled):**
- Consolidate `LectureWorkspace`'s hand-rolled tab bar onto `components/ui/Tabs.jsx` (§7).
- Build the real `/process` resumable view if step 4 above chose that path, backed by the already-real `ProcessingView.jsx` + `fetchTaskStatus`.
- Decide and build genuine cross-lecture / cross-content Search if step 1 requires more than Library's existing title filter.

---

**Explicitly not done in this phase, per instructions:** no files under `frontend/src` were modified; no backend/API/database code was touched; no existing route, component, or functionality was removed.
