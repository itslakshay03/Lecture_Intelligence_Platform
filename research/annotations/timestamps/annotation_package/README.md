# Human Timestamp Annotation Package — READY, `HUMAN_DATA_REQUIRED`

**Status: infrastructure complete; zero annotations collected.** No human annotator was available in this execution environment during Phase 5.5. This package exists so that a real annotator can begin immediately in Phase 6 without any further setup.

## Contents
One file per real lecture: `<lecture_id>_<youtube_video_id>_annotation_package.json`, containing:
- `lecture_title`, `duration_seconds` — real, from the cached study pack.
- `timestamped_transcript` — the REAL transcript, freshly re-fetched in this phase (not the one baked into the study pack), with `[⏱ MM:SS]` cue markers exactly as LectraAI's own pipeline sees them.
- `blank_annotation_form` — a template matching `../schema.json` exactly, ready to be filled in.

## How to use (for the human annotator)
1. Read `../annotation_instructions.md` first.
2. Open one package file. Read the `timestamped_transcript` (or watch the real video at `https://www.youtube.com/watch?v=<youtube_video_id>`) **without** looking at LectraAI's own generated topics/timestamps.
3. Fill in `blank_annotation_form.topics[]` with your independently-identified topics and tolerance windows.
4. Save the completed form as a new file (do not overwrite this template): `<lecture_id>_<annotator_id>_independent_reference.json`, per the naming convention in `annotation_instructions.md`.

## Known real data note
`CAND03` (T4lGm7MjA6Y)'s transcript was re-fetched in this phase and came back at 60,274 characters, vs. 59,821 characters recorded when the study pack was originally generated in Phase 5. This is a real, minor discrepancy (likely due to which of the two transcript-fetch strategies succeeded on each attempt — Phase 1 §8 documents yt-dlp as Strategy 1 and youtube-transcript-api as Strategy 2, with slightly different formatting). Not fabricated, not corrected — both real, disclosed.

## What is still `HUMAN_DATA_REQUIRED`
Everything past step 1 above. This package cannot annotate itself.
