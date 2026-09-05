"""
Baseline 2 — Direct LLM artifact generator (Experiment B, Condition B).

Purpose: LectraAI's PRODUCT quiz/flashcards/interview-questions are
deterministic/regex/template-derived from the notes markdown (verified in
Phase 1 §7 — services/ai.py contains zero references to quiz/flashcard/
interview/revision; all four are built by
backend/utils/study_pack.py:_build_quiz_questions /
_build_flashcards / _build_interview_questions / _build_revision_plan).

This module is the EXPERIMENTAL COMPARISON CONDITION ONLY. It is not part
of the LectraAI product, is not imported by `backend/`, and generating
artifacts with it must never be described as "what LectraAI does" in any
report — only as "what a direct-LLM alternative produces, for comparison."

Consumes the SAME notes markdown LectraAI already generated for a lecture
(so notes quality cannot differ between conditions — Phase 3 §12 confound
control) and asks the model directly for quiz / flashcards / interview
questions in the SAME JSON shape LectraAI's product uses (Phase 1 §10),
so a blinded reviewer can rate both conditions on equal footing.

Revision-plan generation is deliberately NOT included here: Phase 3 §7
Gap 3 explicitly scoped adaptive revision-plan evaluation OUT of the
current experiment set (it requires longitudinal learner-performance data,
not a one-shot LLM comparison) — see Phase 3 §10 RQ selection. Producing
an LLM-generated revision plan here would invite exactly the kind of
apples-to-oranges comparison Phase 3 warned against.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parents[3] / "backend"
sys.path.insert(0, str(_BACKEND_DIR))

DIRECT_LLM_ARTIFACT_PROMPT_VERSION = "DIRECT_LLM_ARTIFACTS_v1"

_QUIZ_PROMPT = """You are generating a multiple-choice quiz strictly from the study notes below.
Rules:
- Every question, correct answer, and distractor must be traceable to the notes. Do not invent facts.
- Produce at most 10 questions.
- Each question has exactly 4 options and exactly one correct answer.
- Distractors must be plausible (a student who studied but made a reasoning error could pick them) — not absurd or unrelated.
Return ONLY a JSON array matching this shape, no prose:
[{{"id": "q-1", "topic": "...", "question": "...", "options": ["...","...","...","..."], "correct_index": 0, "explanation": "..."}}]

STUDY NOTES:
{notes}
"""

_FLASHCARD_PROMPT = """You are generating flashcards strictly from the study notes below.
Rules:
- Every flashcard's answer must be traceable to the notes. Do not invent facts.
- Produce at most 10 flashcards covering the most important terms/concepts.
- Each flashcard front is a short question; the back is a concise, correct answer.
Return ONLY a JSON array matching this shape, no prose:
[{{"id": "fc-1", "front": "...", "back": "..."}}]

STUDY NOTES:
{notes}
"""

_INTERVIEW_PROMPT = """You are generating technical interview questions strictly from the study notes below.
Rules:
- Every answer must be traceable to the notes. Do not invent facts.
- Classify each question as basic, intermediate, or advanced.
- Produce a reasonable number of questions per level (do not force an exact count).
Return ONLY a JSON object matching this shape, no prose:
{{"basic": [{{"id": "ib-1", "question": "...", "answer": "..."}}],
  "intermediate": [{{"id": "ii-1", "question": "...", "answer": "..."}}],
  "advanced": [{{"id": "ia-1", "question": "...", "answer": "..."}}]}}

STUDY NOTES:
{notes}
"""


def _extract_json(raw_text: str):
    """Reuses the same tolerant JSON-from-LLM-text extraction strategy as
    backend/services/ai.py's (unused-in-production) `_extract_json_block`
    helper (Phase 1 §7), reimplemented here rather than imported, since
    that production function is currently dead code not meant to be
    resurrected as a shared dependency."""
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"(\{.*\}|\[.*\])", raw_text, re.DOTALL)
        if match:
            return json.loads(match.group(1).strip())
        raise


def generate_direct_llm_quiz(notes_markdown: str) -> tuple[list, dict]:
    """Calls the real Gemini fallback chain directly for quiz generation.
    NOT invoked automatically — see module docstring and Phase 5 handoff."""
    from services.ai import _generate_with_fallback  # noqa: E402
    metadata: dict = {"prompt_version": DIRECT_LLM_ARTIFACT_PROMPT_VERSION, "artifact": "quiz"}
    raw = _generate_with_fallback(_QUIZ_PROMPT.format(notes=notes_markdown), metadata=metadata)
    return _extract_json(raw), metadata


def generate_direct_llm_flashcards(notes_markdown: str) -> tuple[list, dict]:
    from services.ai import _generate_with_fallback  # noqa: E402
    metadata: dict = {"prompt_version": DIRECT_LLM_ARTIFACT_PROMPT_VERSION, "artifact": "flashcards"}
    raw = _generate_with_fallback(_FLASHCARD_PROMPT.format(notes=notes_markdown), metadata=metadata)
    return _extract_json(raw), metadata


def generate_direct_llm_interview_questions(notes_markdown: str) -> tuple[dict, dict]:
    from services.ai import _generate_with_fallback  # noqa: E402
    metadata: dict = {"prompt_version": DIRECT_LLM_ARTIFACT_PROMPT_VERSION, "artifact": "interview"}
    raw = _generate_with_fallback(_INTERVIEW_PROMPT.format(notes=notes_markdown), metadata=metadata)
    return _extract_json(raw), metadata


if __name__ == "__main__":
    print(
        "This module makes real Gemini API calls and is not run automatically.\n"
        "Import generate_direct_llm_quiz / _flashcards / _interview_questions "
        "from a Phase 5 experiment runner, after confirming GEMINI_API_KEY is "
        "configured, and persist the returned metadata alongside the output "
        "(Phase 4 §22 Data Integrity)."
    )
