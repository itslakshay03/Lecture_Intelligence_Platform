# Model Configuration — VERIFIED FROM CODE

Per Phase 4 §14: "Do NOT rely solely on README claims. Inspect the actual code/configuration." This record was produced by re-reading `backend/services/ai.py` and `backend/prompts/smart.py` directly during Phase 4 (2026-09-05), not by trusting documentation.

## Provider
Google Gemini, via the `google-generativeai` Python SDK (`backend/requirements.txt`: `google-generativeai==0.7.2`).

## Model name(s) — VERIFIED FROM CODE
`backend/services/ai.py`, `FALLBACK_MODELS` list (tried in this exact order, each against every configured API key, capped at `MAX_TOTAL_FALLBACK_ATTEMPTS = 3` total attempts across the whole nested loop):

```python
FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-pro-latest",
]
```

## ⚠️ Discrepancy vs. documentation (flagged, not silently resolved)
`backend/README.md` states: *"AI Engine: Google Gemini API (`gemini-2.5-flash`)"* — this model name **does not appear anywhere** in `FALLBACK_MODELS`. This is the same discrepancy already flagged in Phase 1 §7 and Phase 2; Phase 4 re-confirms it is still present in the current code as of this phase. **The code, not the README, is treated as authoritative** per the project's standing "code over documentation" rule (Phase 1 Rule #2). Any experiment report must cite the actual `model_name_used` value recorded by the Phase 4 instrumentation (§ Instrumentation Changes) for each real generation call, not the README's claim.

## Generation parameters — VERIFIED FROM CODE
- **Temperature / top-p / top-k**: **not set anywhere** in `services/ai.py` — `genai.GenerativeModel(model_name)` is constructed with no `generation_config`. This means the SDK/API default sampling parameters are in effect, whatever Google's current default is for each model — **not independently controllable or recorded by LectraAI today**. This is itself a confound (§ Confound Control) for any experiment comparing two generation calls, since model-default temperature is not pinned. **DATA REQUIRED**: whether the `google-generativeai` SDK exposes a way to read back the effective sampling parameters used (not verified in this phase).
- **Timeout**: `DEFAULT_GEMINI_TIMEOUT = 45.0` seconds per attempt (`request_options={"timeout": timeout}` in `_generate_with_retry`).
- **Retry/fallback configuration**: up to `len(FALLBACK_MODELS) × len(api_keys)` combinations attempted in order, hard-capped at `MAX_TOTAL_FALLBACK_ATTEMPTS = 3` total attempts (not 3 per model — 3 across the entire nested loop). On exhaustion, raises `ValueError`, which `generate_notes` catches to trigger the offline fallback generator.
- **API key rotation**: `_load_api_keys()` reads `GEMINI_API_KEY`, `GEMINI_API_KEY_2` .. `GEMINI_API_KEY_10` from the environment, deduplicated.

## Prompt version — VERIFIED FROM CODE (Phase 4 addition)
`backend/prompts/smart.py`:
```python
PROMPT_VERSION = "SMART_PROMPT_v1"
```
Added in Phase 4 (did not exist before). Must be bumped manually whenever `SMART_PROMPT`'s text changes — not automatically derived from a hash, by design choice, to keep it human-readable; if automatic drift detection is wanted later, `research/baselines/unconstrained_llm/unconstrained_prompt.py::diff_summary()` already demonstrates a pattern (char-count + structural check) that could be extended into a real hash-based check in Phase 5.

The experiment-only unconstrained variant (Experiment C, Condition B) uses `UNCONSTRAINED_PROMPT_VERSION = "SMART_PROMPT_UNCONSTRAINED_v1"`, defined in `research/baselines/unconstrained_llm/unconstrained_prompt.py` (research-only, not in `backend/`).

## What this means for experiment design
Because temperature/sampling is not pinned, **model non-determinism is an acknowledged, uncontrolled confound** (Phase 3 §12) for Experiments B and C. Where feasible, Phase 5 should generate multiple samples per condition and report variance rather than relying on a single draw — this was already anticipated in Phase 3 and is reconfirmed here as still true after direct code inspection.
