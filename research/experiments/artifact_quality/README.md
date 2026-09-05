# Experiment B — Educational Artifact Quality (RQ2)

**Status: DESIGNED, NOT EXECUTED.**

## Conditions
- **Condition A (product):** LectraAI's real deterministic quiz/flashcards/interview questions — `backend/utils/study_pack.py:_build_quiz_questions / _build_flashcards / _build_interview_questions`, unmodified, invoked read-only against a real study pack's `notes_markdown`.
- **Condition B (experiment-only):** `research/baselines/direct_llm_artifacts/generate_artifacts.py` — NOT part of the product. Makes a real Gemini call per artifact type, given the SAME notes markdown as Condition A (so notes quality cannot confound the comparison — Phase 3 §12).

Revision plan is explicitly OUT of scope for this experiment (Phase 3 §7 Gap 3) — it would need longitudinal learner-performance data to compare meaningfully, not a one-shot LLM alternative.

## What a runner script must do (Phase 5)
1. For each eligible lecture (10-12 recommended, per Phase 3 §7), confirm `generation_method == "gemini"` (via the Phase 4 instrumentation) before including it — an offline-fallback-generated lecture's notes are not a fair basis for comparison.
2. Generate Condition B artifacts via `generate_artifacts.py` (real API cost — not yet run).
3. Normalize formatting and assign blinded "System A"/"System B" labels per `annotations/ratings/blinding_protocol.md`, randomized per lecture.
4. Collect ratings from 2 reviewers per `annotations/ratings/rubrics.md` (schema: `rating_schema.json`).
5. Reveal the true mapping only after all ratings are collected; compute paired comparisons per dimension via `evaluation/statistics/paired_analysis.py`.

## Blocking items (DATA REQUIRED)
- Zero Condition-B artifacts generated (would cost real Gemini API quota — not run in Phase 4).
- Zero human ratings collected.
- Reviewer panel not yet recruited.
