"""
Baseline 1 — Unconstrained LLM notes generation (Experiment C, Condition B).

Purpose: isolate the effect of SMART_PROMPT's explicit "strict negative
constraints" block (anti-hallucination / grounding rules) on note quality,
per Phase 3 §4 Experiment C and Phase 3 §12's confound-control requirement
to "keep everything else in the prompt identical."

Method: rather than hand-writing a second prompt (which would risk silent
drift from the real production prompt over time), this module derives the
unconstrained variant PROGRAMMATICALLY from the real, unmodified
`SMART_PROMPT` by removing exactly the `<strict_negative_constraints>...
</strict_negative_constraints>` block and nothing else. Every other
instruction (role framing, adaptive layout rules, format rules, the
transcript/target-pages slots) is byte-for-byte identical between
conditions.

This module READS `backend/prompts/smart.py` (the real, shipped prompt)
but is never imported BY the production application — it is purely an
experiment-only, read-only consumer of the shipped prompt text, kept
outside `backend/` entirely (Phase 3 §15 / Phase 4 §11).

IMPORTANT: this file does not call any AI API. It only constructs the two
prompt strings. Actually generating notes with them (which does call the
real Gemini API and therefore costs quota/money) is a separate, explicit
step — see `generate_unconstrained_notes()` below, which is NOT invoked
by default when this module is imported or run as a smoke test.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Read-only import of the real, shipped prompt — see module docstring.
_BACKEND_DIR = Path(__file__).resolve().parents[3] / "backend"
sys.path.insert(0, str(_BACKEND_DIR))
from prompts.smart import SMART_PROMPT, PROMPT_VERSION  # noqa: E402

UNCONSTRAINED_PROMPT_VERSION = "SMART_PROMPT_UNCONSTRAINED_v1"

_CONSTRAINT_BLOCK_RE = re.compile(
    r"<strict_negative_constraints>.*?</strict_negative_constraints>\s*",
    re.DOTALL,
)


def build_unconstrained_prompt() -> str:
    """
    Returns SMART_PROMPT with the <strict_negative_constraints> block
    removed and nothing else changed. Raises if the block cannot be found,
    rather than silently returning the unmodified (still-constrained)
    prompt — a silent no-op here would invalidate Experiment C entirely.
    """
    if "<strict_negative_constraints>" not in SMART_PROMPT:
        raise RuntimeError(
            "SMART_PROMPT no longer contains a <strict_negative_constraints> "
            "block — the real production prompt (backend/prompts/smart.py) "
            "has changed shape since this baseline was written. Update "
            "_CONSTRAINT_BLOCK_RE / this module before running Experiment C, "
            "and bump UNCONSTRAINED_PROMPT_VERSION."
        )
    unconstrained, n_subs = _CONSTRAINT_BLOCK_RE.subn("", SMART_PROMPT)
    if n_subs != 1:
        raise RuntimeError(
            f"Expected exactly 1 <strict_negative_constraints> block, found {n_subs}. "
            "Refusing to proceed — Experiment C requires a well-defined single removal."
        )
    return unconstrained


def diff_summary() -> dict:
    """
    A machine-checkable record of exactly what differs between the two
    conditions, for the experiment's config/provenance record (Phase 4
    §15 Reproducibility Configuration). Does not call any API.
    """
    constrained = SMART_PROMPT
    unconstrained = build_unconstrained_prompt()
    return {
        "constrained_prompt_version": PROMPT_VERSION,
        "unconstrained_prompt_version": UNCONSTRAINED_PROMPT_VERSION,
        "constrained_char_count": len(constrained),
        "unconstrained_char_count": len(unconstrained),
        "chars_removed": len(constrained) - len(unconstrained),
        "only_difference_is_constraint_block": (
            constrained.replace(
                _CONSTRAINT_BLOCK_RE.search(constrained).group(0), ""
            )
            == unconstrained
        ),
    }


def generate_unconstrained_notes(transcript_text: str, target_pages: str) -> tuple[str, dict]:
    """
    Actually calls the real Gemini API (same model/key-fallback mechanism
    as production, via backend/services/ai.py's internal helpers) with the
    unconstrained prompt. NOT called automatically by this module — the
    caller (a Phase 5 experiment runner) must invoke this explicitly, once
    a GEMINI_API_KEY is confirmed configured, and must record the returned
    metadata alongside the output for reproducibility (Phase 4 §15/§22).

    Returns (notes_text, metadata) where metadata includes
    'model_name_used' and 'prompt_version' = UNCONSTRAINED_PROMPT_VERSION.
    Reuses backend's OWN model-fallback loop (`_generate_with_fallback`)
    rather than reimplementing retry/timeout logic — this is a read-only,
    unmodified reuse of shipped logic, not a research modification of it.
    """
    from services.ai import _generate_with_fallback, _validate_generated_notes  # noqa: E402

    prompt = build_unconstrained_prompt().replace("{lecture_json}", "{}").replace(
        "{transcript}", transcript_text
    ).replace("{target_pages}", target_pages)

    metadata: dict = {"prompt_version": UNCONSTRAINED_PROMPT_VERSION}
    raw_notes = _generate_with_fallback(prompt, metadata=metadata)
    return _validate_generated_notes(raw_notes), metadata


if __name__ == "__main__":
    # Smoke test: prove the prompt derivation is correct. Makes NO network call.
    import json
    print(json.dumps(diff_summary(), indent=2))
