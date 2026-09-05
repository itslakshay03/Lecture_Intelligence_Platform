# PHASE 4 — METHODOLOGY AND EXPERIMENTAL SETUP

*Produced 2026-09-05. Builds on Phase 1 (Project & Research Audit), Phase 2 (Literature Review & Research Gap), and Phase 3 (Research Questions, Hypotheses & Experiment Design), all delivered earlier in this same project and treated here as authoritative, unmodified context.*

**Labeling convention used throughout, per instructions:** every claim is tagged one of:
- **VERIFIED FROM CODE** — confirmed by directly reading/running the real source in this phase.
- **ACTUALLY EXECUTED** — a real pilot/smoke test was run in this phase and its actual output is shown.
- **DESIGNED BUT NOT EXECUTED** — the method/script/protocol exists and is ready, but has not been run on real experimental data.
- **DATA REQUIRED** — something real (annotations, ratings, dataset rows, generated comparison artifacts) is needed before this can move forward, and no placeholder value has been substituted for it.

---

## 1. Executive Summary

Phase 4 delivered two things: (1) a minimal, additive, backward-compatible **production instrumentation layer** on the real LectraAI backend (verified: all 92 pre-existing backend tests still pass after the change), and (2) a complete, separate **`research/` experimental infrastructure** — dataset manifest, annotation schemas, baseline implementations, metric functions, and a statistical-analysis pipeline — for the four Phase 3 research questions. No experiment was run to produce a result. No human annotation exists yet. No comparison LLM artifact has been generated yet. Everything that *was* run in this phase was a **pilot** using either synthetic toy numbers (to validate code correctness) or fake/mocked external stages (to validate the instrumentation's wiring, exactly mirroring the existing test suite's established pattern) — never a claim about LectraAI's real-world accuracy, quality, or latency.

**One real, previously-unknown finding surfaced during this phase:** one of the 7 already-cached real lectures (`ZtVw2iuFI2w`) has `video_duration: null` in its cached study-pack JSON, making it currently unusable for Experiment A. This is documented, not silently worked around.

---

## 2. Relationship to Phase 1–3

| From Phase 1 (preserved, re-verified in this phase) | From Phase 2 (preserved) | From Phase 3 (preserved) |
|---|---|---|
| Single Gemini call generates `notes_markdown` only; quiz/flashcards/revision/interview are deterministic (`utils/study_pack.py`) — **re-verified in this phase**: `services/ai.py` still contains zero references to quiz/flashcard/interview/revision. | Distractor-generation and LLM-content-evaluation literature establishes human-rating protocols this phase's rubrics directly reuse. | RQ1-RQ4 wording, preserved verbatim (§3 below). |
| Timestamp mechanism is keyword-overlap text matching against real transcript cues, duration-bounded (`utils/study_pack.py:_extract_grounded_timestamps`) — **re-verified, unchanged**. | Prior work on temporal grounding (learned, multimodal) frames why LectraAI's simpler heuristic needs its own accuracy measurement rather than assuming parity. | H1/H2/H3 hypotheses, preserved (§4). |
| README says `gemini-2.5-flash`; code's `FALLBACK_MODELS` lists different names — **re-confirmed still present** (`research/configs/model_configuration.md`). | NoteIt and other integrated systems are the closest prior art; combination alone is not novelty. | Experiment A/B/C/D matrix, preserved (§6). |
| Backend `tasks` table had no generation-provenance or stage-timing fields. | — | Phase 3 §14 pre-approved exactly this category of additive instrumentation change — implemented in this phase (§18). |
| `json_extractor.py` / `_extract_json_block` / `_validate_extracted_knowledge` are dead code, never called. | — | Not touched in this phase (irrelevant to instrumentation). |

**No contradiction between the reports and the current code was found** beyond the two already-known, already-documented discrepancies (README model name; the "8-Stage Adaptive Pipeline" docstring wording) — both re-confirmed present, neither newly discovered.

---

## 3. Final Research Questions

Preserved verbatim from Phase 3 (this prompt's own restated wording matches Phase 3's finalized versions closely enough that no rewording was needed):

- **RQ1 — Timestamp Grounding:** How accurately does LectraAI's keyword-overlap timestamp-grounding method associate generated topics with their true lecture segments, compared with human-annotated reference timestamps and a naive equal-interval baseline?
- **RQ2 — Artifact Generation Strategy:** How does the quality of LectraAI's deterministic downstream study artifacts (quiz, flashcards, interview questions) compare with directly LLM-generated equivalents produced from the same notes?
- **RQ3 — Grounding / Anti-Hallucination Prompt Ablation:** Do LectraAI's explicit transcript-grounding and anti-hallucination prompt constraints reduce unsupported/ungrounded claims in generated notes compared with an otherwise-equivalent unconstrained prompt?
- **RQ4 — Processing Efficiency:** How does LectraAI's end-to-end processing latency vary with lecture duration, and which processing stage contributes most to total latency?

No RQ was added or dropped.

---

## 4. Hypotheses

Preserved from Phase 3 §5, unchanged:

- **H1:** LectraAI's method will achieve lower MAE/median error and higher %-within-threshold than naive equal-interval assignment, vs. human reference. *(Directional but not assumed — the naive baseline could win for evenly-paced lectures.)*
- **H2:** Direct LLM-generated quiz will show more plausible, content-specific distractors than LectraAI's current generic hardcoded distractors; flashcards/interview (extracted from already-grounded notes) are hypothesized to differ more in *coverage/relevance* than in *correctness*.
- **H3:** The constrained prompt will show a lower unsupported-claim rate than the unconstrained variant, possibly with a coverage trade-off.
- **RQ4 has no hypothesis** — it is descriptive/observational (Phase 3 §5's explicit design choice; no baseline exists for "correct" latency).

---

## 5. Experimental Design

### RQ1
| | |
|---|---|
| Hypothesis | H1 |
| Independent variable | Timestamp method (LectraAI / naive / human reference) |
| Dependent variable | Per-topic temporal error (seconds) |
| Controlled variables | Same lecture, same topic set, same video duration across both automated methods |
| Dataset/input | `research/dataset/manifest.csv` lectures with `experiment_eligibility` including "A" and non-null duration |
| Conditions | LectraAI method (real, unmodified) vs. naive baseline (`research/baselines/naive_timestamp/`, implemented + pilot-validated) |
| Baseline | Naive equal-interval assignment |
| Metric(s) | MAE, median AE, %≤5s/10s/30s (`research/evaluation/metrics/timestamp_metrics.py`, unit-tested — **VERIFIED FROM CODE, 12/12 synthetic tests pass**) |
| Human evaluation required | Yes — reference timestamps (`research/annotations/timestamps/`, schema + instructions ready, **DATA REQUIRED**: zero annotations collected) |
| Statistical test planned | Paired (per-topic) comparison via `research/evaluation/statistics/paired_analysis.py` — test selected by normality check at analysis time, not prescribed now |
| Expected output | `results/raw/expA_<date>.json` (schema exists; **DATA REQUIRED**: no run yet) |
| Confounders | Caption quality, duration-band imbalance, topic-density differences |
| Threats to validity | Annotator disagreement on broad/gradual topic transitions (mitigated by tolerance-window protocol) |

### RQ2
| | |
|---|---|
| Hypothesis | H2 |
| Independent variable | Generation method (deterministic product / direct-LLM experiment-only) |
| Dependent variable | Human ratings: correctness, relevance, coverage, distractor plausibility (quiz), perceived difficulty |
| Controlled variables | Same source notes fed to both conditions (Phase 3 §12 confound control) |
| Dataset/input | 10-12 lecture subset with `generation_method == "gemini"` confirmed |
| Conditions | Condition A = real `utils/study_pack.py` functions (unmodified); Condition B = `research/baselines/direct_llm_artifacts/generate_artifacts.py` (**DESIGNED, NOT EXECUTED** — real API cost) |
| Baseline | Condition B serves as the comparison condition (no separate null baseline needed — see Phase 3 §10) |
| Metric(s) | Rubric ratings (`research/annotations/ratings/rubrics.md`, `rating_schema.json`) |
| Human evaluation required | Yes — 2-reviewer blinded panel, **DATA REQUIRED**: not recruited, zero ratings |
| Statistical test planned | Paired per-item/per-lecture comparison, `paired_analysis.py` |
| Expected output | `results/raw/expB_<date>.json` (**DATA REQUIRED**) |
| Confounders | Model non-determinism (no pinned temperature — `configs/model_configuration.md`); reviewer bias (mitigated by blinding protocol) |
| Threats to validity | Condition-B prompt quality itself could be a confound if poorly designed — mitigated by using a simple, direct, literature-consistent prompt (not adversarially weak) |

### RQ3
| | |
|---|---|
| Hypothesis | H3 |
| Independent variable | Prompt condition (constrained `SMART_PROMPT_v1` / unconstrained `SMART_PROMPT_UNCONSTRAINED_v1`) |
| Dependent variable | Unsupported-claim rate, factual correctness, coverage |
| Controlled variables | Same transcript, same model/config, same output-format instructions — verified programmatically that the two prompts differ ONLY in the constraint block (**ACTUALLY EXECUTED pilot**, §9 below) |
| Dataset/input | 10-12 lecture subset (may overlap with RQ2's) |
| Conditions | `unconstrained_prompt.py` Condition B vs. real `SMART_PROMPT` Condition A |
| Baseline | Unconstrained variant is the control |
| Metric(s) | Unsupported-claim count/rate, correctness rating, coverage rating |
| Human evaluation required | Yes — same blinded 2-reviewer panel, **DATA REQUIRED** |
| Statistical test planned | Paired comparison, `paired_analysis.py` |
| Expected output | `results/raw/expC_<date>.json` (**DATA REQUIRED**) |
| Confounders | Model sampling non-determinism (same limitation as RQ2) |
| Threats to validity | Annotator subjectivity in judging "unsupported" — mitigated by a piloted rubric (piloting itself is **DATA REQUIRED** — not yet done) |

### RQ4
| | |
|---|---|
| Hypothesis | None (descriptive) |
| Independent variable | Lecture duration (covariate); pipeline stage (categorical) |
| Dependent variable | Stage-level and total latency (seconds) |
| Controlled variables | N/A — observational |
| Dataset/input | Any task processed through the real pipeline AFTER the Phase 4 instrumentation was added |
| Conditions | None — single-arm observation |
| Baseline | None (Phase 3 §4 explicit design decision — no comparison condition exists for "correct" latency) |
| Metric(s) | Per-stage duration, total duration (`research/experiments/latency/extract_latency.py`, **VERIFIED FROM CODE + ACTUALLY EXECUTED pilot**, §10 below) |
| Human evaluation required | No |
| Statistical test planned | Descriptive statistics only + scatterplot of duration vs. latency; no hypothesis test (no comparison condition) |
| Expected output | `results/raw/expD_<date>.json` |
| Confounders | Network variability (Gemini API, YouTube caption fetch) — not controllable, must be reported as measurement noise |
| Threats to validity | Reflects one specific environment/network/API-load window; not a universal performance claim |

---

## 6. Experiment Matrix

| Experiment | Conditions | Status | Real data available? |
|---|---|---|---|
| A — Timestamp Accuracy | LectraAI method / naive baseline / human reference | Naive baseline implemented + pilot-validated on real cached lecture; human reference schema ready, zero annotations | Partial (7 candidate lectures, 1 excluded for null duration) |
| B — Artifact Quality | Deterministic (product) / direct-LLM (experiment-only) | Product-side reads are trivial (real, unmodified functions); direct-LLM generator implemented, NOT yet invoked (real API cost) | None yet generated for Condition B |
| C — Prompt Ablation | Constrained (`SMART_PROMPT_v1`) / unconstrained (`SMART_PROMPT_UNCONSTRAINED_v1`) | Prompt derivation implemented + verified (pilot, no API call: `only_difference_is_constraint_block: true`); no notes generated under either condition specifically for this experiment | None |
| D — Processing Efficiency | Single-arm, observational | Instrumentation implemented, pilot-validated end-to-end (fake external stages) AND incidentally validated further by the existing pytest suite's failure-path tests (§10) | Fake-pipeline pilot data only; zero real-lecture latency data (no real force-refresh run executed in this phase) |

"Do not claim these metrics have been measured yet" is honored throughout — every cell above distinguishes *infrastructure readiness* from *measurement*.

---

## 7. Dataset Design

`research/dataset/manifest.csv` currently lists the **7 real lectures already cached** in `backend/output/` from prior development/testing (Phase 1 §9) — their `video_id`, `lecture_title`, `duration_seconds`, and `n_topics_lectraai` fields are **VERIFIED FROM CODE** (read directly from the real cached JSON files during this phase). Every other field (subject/topic-category assignment, transcript_source, transcript_char_count, generation_method) is either researcher-assigned from the real title/content or explicitly marked `DATA REQUIRED`/`unknown`.

**This is a candidate pool, not the final Phase-3-recommended N=18-20 stratified sample.** Coverage gaps in the current 7: no CODING or NUMERICAL `topic_category` lecture exists in the pool at all; only one Medium-duration-band lecture exists; `transcript_source` (manual vs. auto captions) is unknown for all 7 since this was never recorded at generation time.

**Real, previously-undocumented finding from this phase:** `ZtVw2iuFI2w` has `video_duration: null` in its cached JSON — excluded from Experiment A eligibility until investigated (`manifest_schema.md`, "Known data-quality issue").

**Acquisition protocol for the remaining ~11-13 lectures (Phase 5):** select additional public YouTube lectures filling the gaps above (CODING, NUMERICAL categories; Medium/Long duration bands; at least one auto-caption-only video), process each through the real, unmodified pipeline with `force_refresh=true`, confirm `generation_method == "gemini"` via the new instrumentation before adding to the manifest, and append a new row per Phase 3 §7's schema.

---

## 8. Dataset Sampling Strategy

Preserved from Phase 3 §7: stratify by duration band (Short/Medium/Long), subject/domain, LectraAI's own topic-category labels, and caption source. **Full Dataset** (target N=18-20) is for Experiment A; a **10-12-lecture Evaluation Subset** (drawn from the Full Dataset, preserving stratification as far as N allows) is for Experiments B/C, per Phase 3 §7's reviewer-workload calculation. As of this phase, the Full Dataset has 6 usable candidates (7 minus the null-duration exclusion) — **far short of N=18-20**; the Evaluation Subset has not been selected since the Full Dataset itself isn't populated yet. This shortfall is stated plainly, not minimized.

---

## 9. Human Annotation Protocol

Preserved and operationalized from Phase 3 §8: `research/annotations/timestamps/annotation_instructions.md` + `schema.json`. Key rules restated: independent-reference pass before seeing LectraAI's output; tolerance windows, not instants; strict/lenient scoring for multi-occurrence topics; ±15s/50%-overlap agreement threshold; adjudication by a third reviewer on disagreement. **DESIGNED, NOT EXECUTED** — zero annotations exist.

---

## 10. Human Evaluation Rubric

Preserved from Phase 3 §8, consolidated into `research/annotations/ratings/rubrics.md`: Notes (factual correctness, groundedness, coverage, relevance, clarity/usefulness — all 5 dimensions, since Phase 3 did not narrow this set), Quiz (answer correctness, relevance, distractor plausibility, difficulty), Flashcards (correctness, relevance, set-level coverage), Interview (correctness, relevance, usefulness). **Revision plan is explicitly excluded** (Phase 3 §7 Gap 3). Fixed 1-5 Likert scale (1=very poor … 5=excellent), exactly as Phase 3 specified. **DESIGNED, NOT EXECUTED.**

---

## 11. Blinding and Randomization

`research/annotations/ratings/blinding_protocol.md`: "System A"/"System B" labels, randomized independently per lecture (both the label assignment and presentation order), true mapping withheld until after all ratings are collected, output formatting normalized. **DESIGNED, NOT EXECUTED** — no rating round has occurred, so no claim of "blinding occurred" is made anywhere in this report, per the explicit instruction not to claim blinding unless it actually happens.

---

## 12. Inter-Rater Reliability

Preserved from Phase 3 §11: **Krippendorff's alpha** for ordinal Likert ratings (chosen over Cohen's kappa because it handles small samples, missing data, and more than 2 raters more gracefully) and **ICC** specifically for the continuous timestamp-window midpoints in Experiment A. If only one reviewer proves realistically available in Phase 5, this must be stated as an explicit limitation (no IRR computable), not glossed over. **DESIGNED, NOT EXECUTED** — no rating data exists to compute agreement on yet.

---

## 13. Baselines

| Baseline | File | Status |
|---|---|---|
| 1 — Unconstrained LLM | `research/baselines/unconstrained_llm/unconstrained_prompt.py` | **VERIFIED FROM CODE + ACTUALLY EXECUTED pilot** (prompt-diff smoke test, no API call): `constrained_char_count=5431`, `unconstrained_char_count=2701`, `only_difference_is_constraint_block=true` |
| 2 — Direct LLM Artifact Generator | `research/baselines/direct_llm_artifacts/generate_artifacts.py` | **DESIGNED, NOT EXECUTED** — real Gemini calls not yet made |
| 3 — Naive Timestamp Assignment | `research/baselines/naive_timestamp/naive_timestamp.py` | **ACTUALLY EXECUTED pilot** against real cached lecture `1msEo8PIcbw` (4 topics, 714.29s duration) — output shown in §21 |
| 4 — Extractive Summarization (optional/stretch) | `research/baselines/extractive/extractive_summary.py` | **ACTUALLY EXECUTED pilot** on synthetic toy text only — see §21's methodological finding about TF-IDF instability on tiny inputs |

---

## 14. Metrics

All operational definitions preserved from Phase 3 §10/§13; only the subset with a concrete implementation status is repeated here (full definitions: `research/evaluation/metrics/*.py` docstrings and Phase 3 §13).

| Metric | Component | Implementation status |
|---|---|---|
| MAE, median AE, %≤5/10/30s | Timestamps | **VERIFIED FROM CODE**, `timestamp_metrics.py`, 12/12 unit tests pass on synthetic data |
| Groundedness/unsupported-claim rate, factual correctness, coverage | Notes | Rubric-defined (`rubrics.md`); no computation script yet — scoring is a human judgment recorded via `rating_schema.json`, aggregated by a Phase 5 script (not yet written) |
| Answer correctness, distractor plausibility, difficulty | Quiz | Same — human-judgment rubric, aggregation script not yet written |
| Correctness, relevance, coverage | Flashcards | Same |
| Correctness, relevance, usefulness | Interview | Same |
| Stage duration, total duration | System/Latency | **VERIFIED FROM CODE + ACTUALLY EXECUTED**, `extract_latency.py` |

**DATA REQUIRED**: a rubric-score aggregation script (reads `rating_schema.json` records, computes per-dimension means/medians per condition) was designed in Phase 3 §14 but not yet written in Phase 4 — flagged as a Phase 5 prerequisite (§26).

---

## 15. Statistical Analysis Plan

`research/evaluation/statistics/paired_analysis.py` implements the full Phase 3 §11 procedure: descriptive stats always first; Shapiro-Wilk normality check on paired differences; branches to paired t-test (+Cohen's d) or Wilcoxon signed-rank (+matched-pairs rank-biserial) accordingly; bootstrap percentile CI regardless of branch; explicit `insufficient_data_for_inference` result (not a fabricated p-value) when n < 5. **ACTUALLY EXECUTED** smoke test on synthetic toy data (§21) — and it **honestly reported** that `scipy`/`numpy` are not installed in this environment, falling back to descriptive-only + bootstrap CI with a clear warning rather than silently skipping or faking the normality check. `research/requirements.txt` (numpy, scipy) must be installed before Phase 5 can run the full inferential branch — **DATA REQUIRED** (dependency installation, not data per se, but a concrete blocking prerequisite).

---

## 16. Confound Control

Preserved from Phase 3 §13, re-verified against the current code in this phase:

| Confound | Status this phase |
|---|---|
| Model non-determinism / temperature not pinned | **VERIFIED FROM CODE** (`configs/model_configuration.md`): `genai.GenerativeModel(model_name)` is constructed with no `generation_config` anywhere in `services/ai.py` — sampling defaults are whatever the SDK/API currently defaults to, not controlled or recorded by LectraAI |
| Which fallback model responds | **Now recorded** via `model_name_used` instrumentation (§18) — previously unrecorded (Phase 1 gap), now closed |
| Prompt drift between conditions | **VERIFIED programmatically** for Experiment C (`only_difference_is_constraint_block: true`) |
| Offline-fallback contamination of "AI quality" experiments | **Now detectable** via `generation_method` instrumentation (§18) — previously undetectable (Phase 1/3 gap), now closed; must still be manually checked per lecture before inclusion in B/C |
| Truncation at 120,000 chars | **Now measurable** via `transcript_char_count` instrumentation (§18) |
| Caption quality (manual vs. auto) | Still **unknown** for all 7 existing cached lectures — not recorded anywhere at generation time; must be checked via yt-dlp metadata in Phase 5 |
| Reviewer bias / condition visibility | Addressed by design (blinding protocol) but not yet tested with real reviewers |

---

## 17. Reproducibility Strategy

`research/configs/experiment_config.example.json` defines the required record for every experiment run (dataset version, model, prompt version, baseline condition, execution timestamp, evaluator identity). **No real experiment_config file has been created yet** — the example is a template only, every field marked `DATA REQUIRED` where it cannot be known in advance.

---

## 18. Instrumentation Changes

**PRODUCTION CHANGE — implemented and verified in this phase.**

| File | Change | Verification |
|---|---|---|
| `backend/prompts/smart.py` | Added `PROMPT_VERSION = "SMART_PROMPT_v1"` constant. `SMART_PROMPT` itself NOT renamed or altered. | **VERIFIED FROM CODE** |
| `backend/services/ai.py` | `_generate_with_fallback(prompt, metadata=None)` and `generate_notes(transcript_text, target_pages, metadata=None)` — both gained an **optional** `metadata` dict parameter. Return types **unchanged** (`str` in both cases). When given a dict, populates `metadata['generation_method']` ('gemini'/'offline_fallback') and `metadata['model_name_used']`. | **VERIFIED FROM CODE + ACTUALLY EXECUTED** (fake-pipeline pilot, §21) |
| `backend/services/task_repository.py` | (a) `initialize_database()` now additively ensures 4 new nullable columns on `tasks` (`generation_method`, `model_name_used`, `prompt_version`, `transcript_char_count`) via an idempotent `PRAGMA table_info` check + `ALTER TABLE ADD COLUMN`; (b) creates a new `task_stage_events` table; (c) `update_task(...)` gained 4 new **optional** keyword arguments (COALESCE pattern, matching existing fields); (d) added `log_stage_event(task_id, stage, event)` (deliberately catches and logs its own errors rather than raising — instrumentation must never break the pipeline); (e) added `get_stage_events(task_id)`. | **VERIFIED FROM CODE + ACTUALLY EXECUTED** |
| `backend/main.py` | `process_youtube_video` now calls `log_stage_event` at 4 stage boundaries (transcript_fetch, ai_generation, transformation, pdf_render) and passes `generation_metadata`/`PROMPT_VERSION`/`transcript_char_count` into `update_task`. No existing behavior branch, status transition, or return value changed. | **VERIFIED FROM CODE + ACTUALLY EXECUTED** |
| `backend/tests/test_workflow_lifecycle.py` | `fake_generate_notes` fixture updated to accept the new optional `metadata` kwarg (otherwise the real code's new keyword-argument call would raise `TypeError` against the old fixture signature). No assertion was changed. | **VERIFIED — full suite re-run, 92/92 pass** |

**No API keys or sensitive data are logged** — the new fields are architecture/provenance metadata only (a model name string, a method label, a character count, ISO timestamps).

**Nothing else in `backend/` or `frontend/` was touched.**

---

## 19. Research Directory Structure

Implemented exactly as specified in the brief, with all subdirectories populated with real (non-empty) content — see the file tree in `research/README.md`. No existing application directory was duplicated.

---

## 20. Pilot Experiment

Three real pilots were run in this phase (none are final results):

1. **Naive-timestamp baseline vs. real cached lecture data** — `naive_timestamp.py` run against `backend/output/1msEo8PIcbw.json` (real: video_id `1msEo8PIcbw`, duration 714.29s, 4 topics). **ACTUALLY EXECUTED.** Output: 4 evenly-spaced timestamps (0.0, 178.57, 357.15, 535.72s). Validates the script correctly reads real study-pack JSON and computes correctly — no accuracy claim, since no ground truth exists to compare against.
2. **Instrumentation pilot** — a fake-external-stages run of the REAL `main.process_youtube_video`, mirroring the existing test suite's established pattern (monkeypatched `get_transcript`/`generate_notes`/`generate_pdf`, real `task_repository`/DB). **ACTUALLY EXECUTED.** Confirmed: `generation_method='gemini'`, `model_name_used='gemini-3.6-flash'` (a value I set in the fake for this specific pilot run to prove the wiring — not a real Gemini response), `prompt_version='SMART_PROMPT_v1'`, `transcript_char_count=37`, and all 4 stage-event start/end pairs correctly logged with real ISO timestamps. Task and its stage events were deleted afterward to avoid polluting the shared production DB.
3. **Metric/statistics code correctness** — 12 unit tests (`test_timestamp_metrics.py`) on synthetic toy numbers, all passing; a `paired_analysis.py` smoke test on synthetic toy numbers, which correctly and honestly reported that `scipy`/`numpy` are not installed rather than fabricating a test result.

**Methodological problem discovered and corrected during piloting:** the extractive-summarization baseline's TF-IDF scoring, when smoke-tested on a 6-sentence synthetic toy transcript, ranked a filler sentence ("Welcome everyone to this lecture") above content-bearing sentences about processes/threads. This is a known, expected weakness of TF-IDF on very small document counts (IDF statistics are unstable with so few "documents"/sentences) — not a bug in the arithmetic, but a real limitation discovered through piloting. **Correction:** this baseline is documented as optional/stretch only (consistent with Phase 3's original scoping) and must only be evaluated on real, full-length transcripts (hundreds of sentences), never small synthetic samples, if used at all in Phase 5.

**Incidental additional validation:** running the full pre-existing pytest suite (§18) also exercised the new stage-event logging across multiple real failure paths (invalid URL, transcript failure, AI-stage exception, PDF-stage exception) via the suite's own fake-pipeline fixtures, leaving inspectable (and since-reviewed) `task_stage_events` rows consistent with each failure mode's expected stage-completion pattern — additional real evidence the instrumentation behaves correctly under failure, not only the happy path. **A real, inherited limitation surfaced here**: these test-run rows (and pre-existing `tasks` rows from years of prior test runs, per Phase 1 §9) are not cleaned up by the existing test suite's failure-path tests, and the new `task_stage_events` table inherits the same non-cleanup characteristic — documented, not fixed, since fixing pre-existing test hygiene is out of Phase 4's scope.

---

## 21. Actual Changes Made

See §18 (Instrumentation Changes) for the production side. All `research/` files listed in §22 are net-new additions; none replace or modify any existing file outside `backend/`.

---

## 22. Files Added/Modified

### Modified (production)
- `backend/prompts/smart.py`
- `backend/services/ai.py`
- `backend/services/task_repository.py`
- `backend/main.py`
- `backend/tests/test_workflow_lifecycle.py`

### Added (research-only)
```
research/README.md
research/requirements.txt
research/configs/model_configuration.md
research/configs/experiment_config.example.json
research/dataset/manifest_schema.md
research/dataset/manifest.csv
research/annotations/timestamps/schema.json
research/annotations/timestamps/annotation_instructions.md
research/annotations/ratings/rating_schema.json
research/annotations/ratings/rubrics.md
research/annotations/ratings/blinding_protocol.md
research/baselines/unconstrained_llm/unconstrained_prompt.py
research/baselines/direct_llm_artifacts/generate_artifacts.py
research/baselines/naive_timestamp/naive_timestamp.py
research/baselines/extractive/extractive_summary.py
research/experiments/timestamp_accuracy/README.md
research/experiments/artifact_quality/README.md
research/experiments/prompt_ablation/README.md
research/experiments/latency/extract_latency.py
research/evaluation/metrics/timestamp_metrics.py
research/evaluation/metrics/test_timestamp_metrics.py
research/evaluation/statistics/paired_analysis.py
research/results/README.md
research/reports/PHASE_4_METHODOLOGY_AND_EXPERIMENTAL_SETUP.md   (this file)
```
No file outside `research/` and the 5 `backend/` files above was created, modified, or deleted. `frontend/` was not touched at all in this phase.

---

## 23. Known Limitations

1. Dataset has only 6 usable candidate lectures (7 minus 1 excluded for null duration) against a Phase-3-recommended N=18-20 — a substantial, stated shortfall.
2. No CODING or NUMERICAL topic-category lecture exists in the current candidate pool.
3. `transcript_source` (manual vs. auto captions) is unknown for every existing cached lecture.
4. Model temperature/sampling parameters are not pinned or recorded anywhere in the current codebase — an unavoidable confound until/unless the SDK is used differently (out of scope for Phase 4's "minimal instrumentation only" mandate).
5. `scipy`/`numpy` are not installed in the current environment — the full inferential-statistics branch has never actually executed, only its honest fallback path.
6. Test-run and prior-development rows in both `tasks` and the new `task_stage_events` table are not cleaned up automatically — inherited from the existing test suite's design, not introduced or fixed in this phase.
7. The extractive-summarization baseline is unreliable on very small inputs (discovered via piloting) and should only be run on real, full-length transcripts if used at all.
8. Rubric-score aggregation scripts (for turning individual `rating_schema.json` records into per-condition summary statistics) are designed but not yet written.

---

## 24. Threats to Validity

Carried forward from Phase 3 §13 without weakening: lecture difficulty/domain/length imbalance, caption quality, model variability, reviewer bias, condition visibility, subject-domain differences, API/model changes over a data-collection window, the 120,000-character truncation boundary, and the deterministic-derivation-inherits-notes-quality confound (Condition A and B in Experiment B must consume identical source notes). All of these remain exactly as significant as Phase 3 assessed them; nothing in Phase 4's instrumentation work reduces any of them — it only makes several of them (model identity, generation method, transcript size) *detectable* where they were previously invisible.

---

## 25. Data Still Required

- Human timestamp annotations (Experiment A) — **zero collected**.
- A finalized N=18-20 stratified dataset — currently N=6 usable candidates.
- Direct-LLM-generated quiz/flashcards/interview questions (Experiment B, Condition B) — **not generated** (real API cost, not incurred in this phase).
- Notes generated under the unconstrained prompt (Experiment C, Condition B) — **not generated**.
- Human quality/groundedness ratings (Experiments B and C) — **zero collected**; reviewer panel not recruited.
- At least one real (or fake-pipeline) task processed through the pipeline specifically to populate `task_stage_events` with data usable for a real (not pilot) latency report — the pilot in §20 was deliberately cleaned up and does not count as retained data.
- `scipy`/`numpy` installed in the execution environment.
- `caption_source` / `transcript_source` values for all candidate lectures (requires re-checking yt-dlp metadata).
- Root-cause investigation of `ZtVw2iuFI2w`'s null `video_duration`.

---

## 26. Exact Phase 5 Handoff Checklist

### COMPLETED IN PHASE 4
- [x] Minimal, additive, backward-compatible production instrumentation (generation_method, model_name_used, prompt_version, transcript_char_count, stage-level timing) — implemented and verified (92/92 existing tests pass + new pilot evidence).
- [x] Full `research/` directory structure, populated (not just scaffolded) with working code.
- [x] Naive timestamp baseline — implemented, pilot-validated against real data.
- [x] Unconstrained-prompt baseline — implemented, pilot-validated (prompt-diff proof, no API call).
- [x] Direct-LLM-artifact-generator baseline — implemented, not yet invoked.
- [x] Extractive-summarization baseline (optional) — implemented, pilot-tested, limitation documented.
- [x] Timestamp metric functions — implemented, unit-tested (12/12 pass).
- [x] Statistical analysis pipeline — implemented, smoke-tested, honestly reports missing dependencies.
- [x] Latency extraction script — implemented, tested against both a clean pilot and incidental real pytest-suite-generated data.
- [x] Annotation schema + instructions (timestamps) — complete.
- [x] Rating schema + rubrics + blinding protocol — complete.
- [x] Dataset manifest seeded with real data from the 7 existing cached lectures; one real data-quality issue discovered and documented.
- [x] Model configuration verified from code (not README); discrepancy re-confirmed and documented.
- [x] Reproducibility config template created.

### STILL REQUIRED (before any result can be produced)
- [ ] Expand dataset to N=18-20, filling category/duration/caption-source gaps.
- [ ] Investigate and resolve the `ZtVw2iuFI2w` null-duration issue (or exclude permanently with a documented reason).
- [ ] Recruit a 2-3 person reviewer panel.
- [ ] Collect independent-reference human timestamp annotations for the Full Dataset.
- [ ] Run the direct-LLM-artifact generator (real API cost) for the Evaluation Subset.
- [ ] Run the unconstrained-prompt generator (real API cost) for the Evaluation Subset.
- [ ] Confirm `generation_method == "gemini"` (not offline-fallback) for every lecture used in Experiments B/C.
- [ ] Collect blinded human ratings for Experiments B and C.
- [ ] Install `research/requirements.txt` (numpy, scipy).
- [ ] Write the rubric-score aggregation script (designed, not yet built).
- [ ] Process at least one real lecture end-to-end (or intentionally re-run the fake-pipeline pilot without cleanup) to have real `task_stage_events` data for Experiment D.
- [ ] Compute inter-rater reliability once 2+ raters have produced overlapping ratings.
- [ ] Run `paired_analysis.py` on real paired data for each RQ and report results — including honestly reporting non-significance if that is what the data shows.

### PHASE 5 SHOULD DO
Actual dataset collection → annotation → baseline execution (direct-LLM artifacts, unconstrained prompt) → human evaluation (blinded ratings) → timestamp evaluation → artifact evaluation → prompt-ablation evaluation → latency measurement (real lectures) → result generation (machine-written JSON/CSV under `results/raw/`) → statistical analysis (`paired_analysis.py` on real data) → honest reporting of whatever the data actually shows, significant or not.

**Phase 5 must NOT jump directly to writing the final paper.** Results must exist and be analyzed first.
