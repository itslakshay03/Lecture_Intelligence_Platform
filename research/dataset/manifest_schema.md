# Dataset Manifest Schema

`manifest.csv` in this directory is the single source of truth for which lectures are in the evaluation dataset, per Phase 3 §7 / Phase 4 §5.

## Columns

| Column | Type | Description |
|---|---|---|
| `lecture_id` | string | Internal identifier (e.g. `L01`). Used everywhere else (annotations, ratings) instead of the raw YouTube ID, to allow blinding. |
| `youtube_video_id` | string | Real YouTube video ID. Kept in this file only — never shown to reviewers during blinded rating. |
| `lecture_title` | string | Real title, as known from the source video or the cached study pack. |
| `subject_domain` | string | e.g. "Operating Systems", "DBMS", "Computer Networks", "AI". Researcher-assigned from watching/reading, independent of what LectraAI itself later classifies. |
| `topic_category` | string | One of LectraAI's own lecture-type labels for cross-reference: THEORY / COMPARISON / ALGORITHM / CODING / NUMERICAL / ARCHITECTURE (Phase 1 §7) — assigned by the researcher, not copied from LectraAI's output. |
| `duration_seconds` | float | Real video duration. `DATA REQUIRED` if unknown/null (see known issue below). |
| `duration_band` | string | Short (≤15 min) / Medium (15-45 min) / Long (>45 min), derived from `duration_seconds`. |
| `transcript_source` | string | `manual_captions` / `auto_captions` / `unknown`. Requires checking yt-dlp's `manual_subs`/`auto_subs` metadata (Phase 1 §8) — not currently recorded anywhere for the 7 pre-existing cached lectures. |
| `transcript_language` | string | e.g. `en`. |
| `transcript_char_count` | integer | Length of the transcript text actually sent to the model. For lectures processed before Phase 4's instrumentation, this is NOT recorded in the database and must be recomputed from the cached JSON/transcript if available, or marked DATA REQUIRED. |
| `n_topics_lectraai` | integer | Number of topics in LectraAI's own generated study pack (real, read from the cached JSON) — NOT the same as the number of topics a human annotator will independently identify. |
| `generation_method` | string | `gemini` / `offline_fallback` / `unknown`. **Critical** (Phase 3 §12 confound): a lecture generated via the offline fallback must be EXCLUDED from Experiments B/C, since its "notes" were never produced by the LLM at all. Unknown for any task predating the Phase 4 instrumentation (§ Instrumentation Changes) — must be re-verified before inclusion. |
| `annotation_status` | string | `not_started` / `in_progress` / `complete`. |
| `experiment_eligibility` | string | Comma-separated subset of `A,B,C,D` — which experiments this lecture may be used in, given the constraints above. |
| `notes` | string | Free text — anything unusual (missing duration, mixed language, multiple speakers, etc.). |

## Known data-quality issue discovered during Phase 4 (not fabricated — found while building this manifest)
`ZtVw2iuFI2w` (one of the 7 lectures already cached in `backend/output/` from prior development/testing) has `video_duration: null` in its cached study-pack JSON. Per `research/baselines/naive_timestamp/naive_timestamp.py`'s explicit guard, a lecture with no positive duration **cannot** be used for Experiment A (the naive baseline has nothing to space topics across). Root cause not yet investigated — flagged here as `DATA REQUIRED` / follow-up item for Phase 5, not silently worked around.
