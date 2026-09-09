# PAPER_TRACEABILITY.md

**Document:** `LECTRAAI_IEEE_RESEARCH_PAPER` (`.md` source of truth; `.tex`, `.docx`, `.pdf` renderings)
**Purpose:** Map every substantive claim, number, figure, and table in the paper to the exact
evidence file that produced it, the research question it belongs to, and the locked evidence
status from the Phase 6 audit.
**Rule applied:** No value appears in the paper that is not reproduced from a committed file
under `research/results/` (raw or processed) or directly verifiable in the LectraAI source code.
Nothing here is newly computed for the paper.

Prepared: 2026-09-06. Traceability is against repository HEAD at the time of Phase 7.

---

## 1. Legend

| Evidence status | Meaning (locked in `research/results/FINAL_RQ_STATUS.md`) |
|---|---|
| SUPPORTED (sample) | Objectively computed; true for the evaluated 7-lecture sample only; no generalization |
| INCONCLUSIVE | Question cannot be answered with the evidence collected (human data absent or proxy rejected) |
| NARROW SUB-FINDING | A single objective, single-lecture observation that is defensible but does not resolve its RQ |
| SYSTEM FACT | Property of the implemented code, verifiable by reading the source; not an experimental result |
| METHOD FACT | Property of the evaluation design / released materials; not a result |
| LITERATURE | Attributed statement about prior work, from the Phase 2 verified reference list |

RQ definitions (verbatim from `research/results/FINAL_RQ_STATUS.md`):

- **RQ1** — timestamp grounding accuracy. **Status: INCONCLUSIVE** (no human ground truth).
- **RQ2** — deterministic artifact transformation vs. direct-LLM artifacts, *quality*. **Status: INCONCLUSIVE**, plus one **NARROW SUB-FINDING** on distractor diversity.
- **RQ3** — effect of explicit grounding constraints on note groundedness. **Status: INCONCLUSIVE** (no human claim labels; automated proxy rejected).
- **RQ4** — transcript length vs. end-to-end latency. **Status: SUPPORTED for the evaluated sample only** (correlation, not causation).

---

## 2. Primary evidence files

| Short name | Path | Produced in |
|---|---|---|
| DATASET | `research/results/processed/phase5/dataset_summary.json` | Phase 5 |
| DIVERGENCE | `research/results/processed/phase5/expA_lectraai_vs_naive_divergence.json` | Phase 5 |
| DISTRACTOR | `research/results/processed/phase5/expB_distractor_uniqueness_3MqyDWDpZoI.json` | Phase 5 |
| FLASHCARD | `research/results/processed/phase5_5/expB_flashcard_verbatim_overlap_3MqyDWDpZoI.json` | Phase 5.5 |
| LATENCY_SUM | `research/results/processed/phase5/expD_latency_summary.json` | Phase 5 |
| LATENCY_RAW | `research/results/raw/phase5/expD_latency_real_regen_batch.json` | Phase 5 |
| PROMPTDIFF | `research/results/raw/phase5/expC_3MqyDWDpZoI.json` + `research/reports/PHASE_5_*` | Phase 5 |
| RQ_STATUS | `research/results/FINAL_RQ_STATUS.md` | Phase 6 |
| CLAIM_AUDIT | `research/results/FINAL_CLAIM_AUDIT.md` | Phase 6 |
| BOUNDARY | `research/results/PAPER_CLAIM_BOUNDARY.md` | Phase 6 |
| LIMITATIONS | `research/results/FINAL_LIMITATIONS.md` | Phase 6 |
| VALIDATION | `research/results/RESULT_VALIDATION.md` | Phase 6 |
| CONTRIB | `research/results/CONTRIBUTIONS_AND_NOVELTY.md` | Phase 6 |
| LITREV | Phase 2 literature review (verified 19-reference list + citation-verification table) | Phase 2 |
| PHASE1 | Phase 1 implementation audit + current source under `backend/` | Phase 1 |
| CODE | Live source: `backend/services/{transcript,ai,pipeline,pdf,task_repository}.py`, `backend/prompts/smart.py`, `backend/main.py` | current |

---

## 3. Abstract — claim-by-claim

| # | Claim / number in abstract | Value | Evidence file | RQ | Status |
|---|---|---|---|---|---|
| A1 | "single large-language-model (LLM) call constrained by an explicit transcript-grounding prompt" | — | CODE (`services/ai.py` single `generate_notes`; `prompts/smart.py` `<strict_negative_constraints>`), PHASE1 | — | SYSTEM FACT |
| A2 | remaining artifacts produced by "deterministic (template and regular-expression) transformation of the generated notes" | — | CODE (`services/pipeline.py` `_build_quiz`/`_build_flashcards`/`_build_revision_plan`/`_build_interview_questions`, `_extract_grounded_timestamps`), PHASE1 | — | SYSTEM FACT |
| A3 | "seven real computer-science lectures" | N = 7 | DATASET `n_lectures` = 7 | — | METHOD FACT |
| A4 | timestamp assigned to "56.0% of topics (14 of 25)" | 14/25 = 56.0% | DIVERGENCE `topic_timestamp_coverage.coverage_pct` = 56.0; `total_topics_with_lectraai_timestamp` = 14; `total_topics_across_dataset` = 25 | RQ1 | INCONCLUSIVE (coverage is not accuracy) |
| A5 | "two of seven lectures receiving none" | 2 of 7 | DIVERGENCE `n_lectures_with_zero_topic_coverage` = 2 (`1msEo8PIcbw`, `T4lGm7MjA6Y`) | RQ1 | INCONCLUSIVE |
| A6 | "coverage characteristic rather than a validated accuracy result" | — | RQ_STATUS RQ1; DIVERGENCE `ground_truth_status` = "DATA_REQUIRED" | RQ1 | INCONCLUSIVE |
| A7 | deterministic quiz "44.4% unique" answer options | 8/18 = 44.4% | DISTRACTOR `deterministic_condition.uniqueness_pct` = 44.4 | RQ2 | NARROW SUB-FINDING |
| A8 | direct-LLM alternative "100% unique" | 27/27 = 100.0% | DISTRACTOR `direct_llm_condition.uniqueness_pct` = 100.0 | RQ2 | NARROW SUB-FINDING |
| A9 | "objective sub-finding on one lecture" | lecture `3MqyDWDpZoI` | DISTRACTOR `lecture_id`; RQ_STATUS RQ2 | RQ2 | NARROW SUB-FINDING |
| A10 | latency "strongly and significantly correlated with transcript length (Pearson r = 0.98, p < 0.001, n = 7)" | r = 0.9815, p = 8.91e-5, n = 7 | LATENCY_SUM `pearson_r_charcount_vs_latency` = 0.98146, `pearson_p` = 8.9056e-5, `n_lectures` = 7 | RQ4 | SUPPORTED (sample) |
| A11 | "single LLM call accounting for a mean of 58.7% of processing time" | 58.70% | LATENCY_SUM `ai_generation_pct_of_total_mean` = 58.70081 | RQ4 | SUPPORTED (sample) |
| A12 | "Human evaluation ... not collected" | 0 / 0 / 0 | RQ_STATUS; LIMITATIONS items on human data; DIVERGENCE `ground_truth_status` | RQ1–RQ3 | INCONCLUSIVE |
| A13 | "three of the four research questions remain inconclusive" | RQ1, RQ2, RQ3 | RQ_STATUS | — | METHOD FACT |
| A14 | "release the annotation and evaluation infrastructure" | — | `research/` protocols, schemas, per-lecture packages, rubrics (committed) | — | METHOD FACT |

---

## 4. Section-by-section traceability

### I. Introduction

| Claim | Evidence | RQ | Status |
|---|---|---|---|
| Four RQs, as stated | RQ_STATUS (verbatim RQ text) | — | METHOD FACT |
| "uses the LLM once ... then derives ... through deterministic transformation" | CODE, PHASE1 | — | SYSTEM FACT |
| Contribution 1 (end-to-end instrumented architecture) | CONTRIB item A (classified System/engineering); CODE | — | SYSTEM FACT |
| Contribution 2 (duration-bounded timestamp mechanism + reproducible coverage/divergence protocol) | CONTRIB item B; CODE `_extract_grounded_timestamps`; DIVERGENCE | RQ1 | SYSTEM + METHOD FACT |
| Contribution 3 (experimental framework + released baselines) | CONTRIB items C–D; `research/` baseline scripts | RQ2, RQ3 | METHOD FACT |
| Contribution 4 (latency analysis on 7 lectures) | CONTRIB item E; LATENCY_SUM, LATENCY_RAW | RQ4 | SUPPORTED (sample) |
| "We do not claim ... accurate timestamps, higher-quality artifacts ..., or reduced hallucination" | BOUNDARY "CANNOT MAKE" list | RQ1–RQ3 | INCONCLUSIVE |

### II. Related Work

Every reference [1]–[19] is from the Phase 2 verified list (LITREV), which recorded title, authors,
venue, year, and DOI/arXiv ID and a per-citation verification outcome. See `latex/references.bib`.

| Statement | Reference(s) | Status |
|---|---|---|
| Deep-learning video summarization survey | [1] Apostolidis 2021 | LITERATURE |
| Slide-based lecture note generation | [4] Xu 2019 (Lecture2Note) | LITERATURE |
| Multimodal lecture understanding benchmark | [2] Lee 2023 | LITERATURE |
| Commercial ASR accuracy varies by vendor | [3] Kuhn 2023 | LITERATURE |
| LLMs in learning environments: personalization + reliability concerns | [5] Shahzad 2025 | LITERATURE |
| Sub-task decomposition improves human-rated lesson quality vs. single-step | [6] Lin 2025 | LITERATURE |
| Educational question generation aligned to Bloom's taxonomy | [7] Scaria 2024 | LITERATURE |
| MCQ generation methodology + educator insights | [9] Biancini 2024 | LITERATURE |
| Distractor generation survey | [8] Alhazmi 2024 | LITERATURE |
| Pre-LLM neural distractor generation | [10] Qiu 2020 | LITERATURE |
| Fine-tuned question generation (preprint, flagged) | [11] Ehsan 2025 (preprint) | LITERATURE |
| Spaced-repetition sentence generation, learner-evaluated | [12] Paddags 2024 | LITERATURE |
| RAG for spaced-repetition content | [13] Kaczmarek 2025 (preprint) | LITERATURE |
| Optimal adaptive review scheduling | [14] Tabibian 2019 (PNAS) | LITERATURE |
| Temporal sentence grounding survey | [15] Zhang 2023 (TPAMI) | LITERATURE |
| Video moment localization survey | [16] Liu 2023 (ACM CSUR) | LITERATURE |
| Hallucination in LLMs survey | [17] Huang 2023 | LITERATURE |
| Hallucination risk in educational tools | [18] Peltekova 2026 | LITERATURE |
| Closest integrated system (multimodal, user-tested) | [19] Zhao 2025 (NoteIt, UIST) | LITERATURE |
| "combination of artifact types is not claimed as a novelty in itself" | CONTRIB (novelty assessment) | METHOD FACT |

### III. The LectraAI Framework (all SYSTEM FACT — verifiable in CODE / PHASE1)

| Paper statement | Source location |
|---|---|
| Async task creation; transcript extract → 1 grounded LLM call → regex cleanup → deterministic transform → JSON → PDF → SQLite | `backend/main.py` `process_youtube_video`; `services/pipeline.py` |
| "Only ... AI note generation is model-generated" | `services/ai.py` (sole model call site); `services/pipeline.py` (no model calls in artifact builders) |
| Dual-strategy transcript fetch: yt-dlp (+ optional cookies) then transcript API fallback | `services/transcript.py` |
| `[MM:SS]` / `[H:MM:SS]` cue inserted on ≥ 60 s caption gap; duration from fetch metadata | `services/transcript.py` |
| De-dup, filler/promo regex strip, truncate at 120,000 chars | `services/transcript.py` |
| "longest transcript was 59,821 characters, so truncation was never triggered" | DATASET `transcript_chars.max` = 59821 (< 120000) |
| `SMART_PROMPT_v1` with `<strict_negative_constraints>` block; single Markdown doc returned | `backend/prompts/smart.py` (`PROMPT_VERSION = "SMART_PROMPT_v1"`) |
| Regex post-processing removes intros / generic titles / IDs, softens over-strong phrasing | `services/pipeline.py` notes post-processing |
| Offline heuristic note generator on total model failure; not triggered in evaluated runs | `services/ai.py` fallback; LATENCY_RAW `generation_method` = "gemini" for all 7 |
| Topics = split on level-2 headings, ≤ 6 key points, optional diagram block | `services/pipeline.py` topic segmentation |
| Quiz = per-topic templates + fixed generic distractor pool + correct-option shuffle | `services/pipeline.py` `_build_quiz` |
| Flashcards = bold-term extraction + containing sentence | `services/pipeline.py` `_build_flashcards` |
| Revision plan = fixed 5-stage schedule (24 h, 3 d, 7 d, 14 d, 30 d) | `services/pipeline.py` `_build_revision_plan` |
| Interview questions = fixed templates, round-robin by difficulty tier | `services/pipeline.py` `_build_interview_questions` |
| JSON assembly exposes raw notes + duration + grounded timestamp list | `services/pipeline.py` study-pack assembly |
| Markdown→HTML→A4 PDF via headless-browser subprocess | `services/pdf.py` |
| Lifecycle `pending→processing→completed\|failed`; startup marks stuck `processing` as `failed` | `services/task_repository.py`; `backend/main.py` startup |
| File cache keyed by video ID unless forced refresh | `backend/main.py` / `services/pipeline.py` cache check |
| Instrumentation: `generation_method`, `model_name_used`, `prompt_version`, `transcript_char_count`, stage start/end table | `services/task_repository.py` (`log_stage_event` / `get_stage_events`), migration; Phase 4 |
| "instrumentation is additive ... test suite passes unchanged" | Phase 4 report; backend test run (see §6) |

### IV. Methodology

| Paper statement | Evidence | RQ | Status |
|---|---|---|---|
| Each lecture processed once through unmodified pipeline with forced refresh | Phase 5 procedure; LATENCY_RAW (per-run instrumentation populated) | — | METHOD FACT |
| Duration-bounded association rule (explicit cue → else keyword-overlap score ≥ 1, `0 ≤ s < D`, discard `s ≥ D`) | CODE `_extract_grounded_timestamps`; PHASE1 | RQ1 | SYSTEM FACT |
| Coverage = fraction of topics with a topic-level timestamp | DIVERGENCE `topic_timestamp_coverage.definition` | RQ1 | METHOD FACT |
| Divergence = mean \|assigned − `i·D/n`\| over timestamped topics | DIVERGENCE `metric` string; `expA` per-lecture `mean_abs_diff_vs_naive_sec` | RQ1 | METHOD FACT |
| Naive equal-interval baseline (`b_i = i·D/n`) | DIVERGENCE; research baseline script | RQ1 | METHOD FACT |
| Direct-LLM artifact generator = 1 model call per artifact type from identical notes; not part of LectraAI | Phase 5 `expB`/`expC` procedure; DISTRACTOR, FLASHCARD | RQ2 | METHOD FACT |
| Unconstrained prompt = `SMART_PROMPT_v1` minus only the constraint block; verified to differ only there | PROMPTDIFF; Phase 5 report RQ3 section | RQ3 | METHOD FACT |
| Extractive TF-IDF baseline implemented then excluded (sentence segmentation collapses on spoken transcripts) | Phase 5 report "excluded baseline"; LIMITATIONS item | — | METHOD FACT |
| RQ1 accuracy metrics (MAE / median / ±5/10/30 s) require human refs; **not computed** | RQ_STATUS RQ1; DIVERGENCE `ground_truth_status` | RQ1 | INCONCLUSIVE |
| RQ2 human rubric (correctness/relevance/coverage/distractor plausibility/difficulty, 1–5, blinded); **not collected**; 2 objective metrics computed instead | RQ_STATUS RQ2; CLAIM_AUDIT RQ2 rows | RQ2 | INCONCLUSIVE + NARROW SUB-FINDING |
| RQ3 automated groundedness proxy attempted then **excluded** for construct-invalidity (headers miscounted as claims; misses orthographic variants); 58-unit claim segmentation prepared | RQ_STATUS RQ3; Phase 5 / 5.5 report RQ3 sections | RQ3 | INCONCLUSIVE |
| RQ4 latency from instrumentation; Pearson r + p at n = 7 | LATENCY_SUM, LATENCY_RAW | RQ4 | SUPPORTED (sample) |
| "9 of 9 [values] confirmed; one aggregation-convention ambiguity" | VALIDATION | — | METHOD FACT |

### V. Experimental Setup

| Paper value | Number | Evidence | Status |
|---|---|---|---|
| N lectures | 7 | DATASET `n_lectures` | METHOD FACT |
| Duration s: mean / median / min / max / SD | 1163.9 / 777.0 / 393.0 / 3702.3 / 1140.9 | DATASET `duration_sec` (`mean` 1163.944, `median` 777.0, `min` 393.0, `max` 3702.319, `sd` 1140.912) | METHOD FACT |
| Duration bands: Short / Medium / Long | 5 / 1 / 1 | DATASET `duration_band_counts` (`Short` 5, `Medium` 1, `Long` 1) | METHOD FACT |
| Transcript chars: mean / median / min / max / SD | 17109 / 10590 / 5326 / 59821 / 19006 | DATASET `transcript_chars` (`mean` 17109.29, `median` 10590.0, `min` 5326, `max` 59821, `sd` 19006.25) | METHOD FACT |
| Subject domains | OS 2, Networks 2, DBMS 2, AI 1 | DATASET `subject_domain_counts` | METHOD FACT |
| Lecture-type categories | Comparison 3, Architecture 2, Algorithm 1, Theory 1 | DATASET `topic_category_counts` (`COMPARISON` 3, `ARCHITECTURE` 2, `ALGORITHM` 1, `THEORY` 1) | METHOD FACT |
| Caption source recorded | 0 of 7 | DATASET `transcript_source_known_count` = 0 | METHOD FACT / LIMITATION |
| Offline-fallback invocations / failures | 0 / 0 | LATENCY_SUM `fallback_rate` 0.0, `failure_rate` 0.0; LATENCY_RAW all `status` "completed", `generation_method` "gemini" | METHOD FACT |
| Responding model recorded | `gemini-3.6-flash` (all 7) | LATENCY_RAW `model_name_used` (×7) | METHOD FACT |
| Prompt version | `SMART_PROMPT_v1` (all 7) | LATENCY_RAW `prompt_version` (×7); `prompts/smart.py` | SYSTEM FACT |
| "documentation names `gemini-2.5-flash`; code fallback list names `gemini-3.6-flash` ..." | — | PHASE1 vs. `services/ai.py` model list; VALIDATION / LIMITATIONS reproducibility item | LIMITATION |
| Sampling params (temperature/top-p) not set/recorded | — | CODE (`services/ai.py` — no generation config set); LIMITATIONS reproducibility item | LIMITATION |
| Human annotations / ratings / groundedness labels | 0 / 0 / 0 | RQ_STATUS; LIMITATIONS | INCONCLUSIVE inputs |
| Dataset-expansion attempt yielded no new verifiable IDs | — | Phase 5.5 report "Data Still Required"; LIMITATIONS tooling item | METHOD FACT |

### VI. Results

**RQ1 (Table II, Fig. 3)** — all from DIVERGENCE (`expA_lectraai_vs_naive_divergence.json`):

| Row | Topics | With timestamp | Mean \|diff\| vs. naive (s) | Source key |
|---|---|---|---|---|
| 3MqyDWDpZoI | 5 | 3 | 150.2 | `per_lecture[0]` (`n_topics` 5, `n_topics_with_lectraai_timestamp` 3, `mean_abs_diff_vs_naive_sec` 150.2) |
| 1msEo8PIcbw | 3 | 0 | — | `per_lecture[1]` (`...timestamp` 0, `mean_abs_diff` null) |
| T4lGm7MjA6Y | 5 | 0 | — | `per_lecture[2]` (`...timestamp` 0, `mean_abs_diff` null) |
| uDulBxDb7GM | 3 | 2 | 168.5 | `per_lecture[3]` |
| VyvTabQHevw | 2 | 2 | 101.3 | `per_lecture[4]` (`mean_abs_diff_vs_naive_sec` 101.25) |
| WJ-UaAaumNA | 5 | 5 | 143.5 | `per_lecture[5]` (`mean_abs_diff_vs_naive_sec` 143.52) |
| ZtVw2iuFI2w | 2 | 2 | 177.0 | `per_lecture[6]` |
| Total / mean | 25 | 14 (56.0%) | 147.3 (n = 14) | `overall.n_topic_comparisons` 14, `overall.mean_abs_diff_sec` 147.264; `topic_timestamp_coverage` (25, 14, 56.0) |
| median / SD of divergence | — | — | 124.0 / 93.0 | `overall.median_abs_diff_sec` 124.0, `overall.sd_abs_diff_sec` 92.993 |
| Per-lecture divergence range | — | — | 101.3–177.0 | min/max of `per_lecture[*].mean_abs_diff_vs_naive_sec` |

RQ1 interpretation ("coverage is not accuracy", "inconclusive") ← RQ_STATUS RQ1; DIVERGENCE
`ground_truth_status`; BOUNDARY "CANNOT MAKE".

**RQ2 (Table III, Fig. 4)**:

| Metric | LectraAI (det.) | Direct-LLM | Source |
|---|---|---|---|
| Quiz distractor uniqueness | 8/18 = 44.4% | 27/27 = 100.0% | DISTRACTOR `deterministic_condition` (`n_distractors` 18, `n_unique` 8, `uniqueness_pct` 44.4); `direct_llm_condition` (27, 27, 100.0) |
| Flashcard answer verbatim in notes | 10/10 = 100.0% | 1/9 = 11.1% | FLASHCARD `deterministic_condition` (`n_cards` 10, `n_verbatim_in_notes` 10, 100.0); `direct_llm_condition` (9, 1, 11.1) |
| One lecture only | `3MqyDWDpZoI` | — | DISTRACTOR / FLASHCARD `lecture_id` |

RQ2 interpretation ("diversity, not quality"; "inconclusive with one narrow sub-finding") ←
RQ_STATUS RQ2; FLASHCARD `interpretation_caveat`; CLAIM_AUDIT RQ2 rows; BOUNDARY.

**RQ3**:

| Paper value | Number | Source |
|---|---|---|
| Constrained notes length | 3,890 chars | Phase 5 `expC` / RQ3 section (constrained condition) |
| Unconstrained notes length | 3,763 chars | Phase 5 `expC` / RQ3 section (unconstrained condition) |
| Prompts differ only in constraint block | — | PROMPTDIFF; Phase 5 report RQ3 |
| Automated proxy excluded; 58-unit claim segmentation prepared | 58 | RQ_STATUS RQ3; Phase 5.5 report RQ3 |
| Status | INCONCLUSIVE | RQ_STATUS RQ3 |

**RQ4 (Table IV, Fig. 5, Fig. 6)** — per-lecture rows from LATENCY_RAW
(`expD_latency_real_regen_batch.json`), aggregates from LATENCY_SUM (`expD_latency_summary.json`):

| Lecture | Chars | Fetch | AI gen. | Transf. | PDF | Total | Source (LATENCY_RAW index) |
|---|---|---|---|---|---|---|---|
| uDulBxDb7GM | 8556 | 9.39 | 17.13 | 0.03 | 5.04 | 31.98 | idx 4 (`transcript_fetch` 9.393507, `ai_generation` 17.125792, `transformation` 0.032267, `pdf_render` 5.042387, `total_latency_sec` 31.98028) |
| ZtVw2iuFI2w | 10424 | 5.08 | 19.02 | 0.11 | 7.92 | 32.41 | idx 0 (5.082654 / 19.023483 / 0.109 / 7.918796 / 32.408158) |
| VyvTabQHevw | 11553 | 9.15 | 19.37 | 0.04 | 4.52 | 33.27 | idx 5 (9.147616 / 19.36544 / 0.036916 / 4.522292 / 33.266607) |
| 3MqyDWDpZoI | 5326 | 9.99 | 19.06 | 0.04 | 4.78 | 34.25 | idx 1 (9.990861 / 19.059846 / 0.038174 / 4.777626 / 34.249027) |
| WJ-UaAaumNA | 13495 | 9.01 | 24.25 | 0.04 | 4.52 | 38.01 | idx 6 (9.011469 / 24.249921 / 0.043697 / 4.522874 / 38.005236) |
| 1msEo8PIcbw | 10590 | 13.28 | 19.89 | 0.03 | 4.86 | 38.21 | idx 2 (13.280445 / 19.890491 / 0.027968 / 4.85801 / 38.207742) |
| T4lGm7MjA6Y | 59821 | 14.90 | 45.73 | 0.09 | 5.46 | 66.34 | idx 3 (14.903835 / 45.727983 / 0.086403 / 5.455858 / 66.343903) |
| **Mean** | **17109** | **10.12** | **23.49** | **0.05** | **5.30** | **39.21** | LATENCY_SUM `stage_means_sec` (10.11577 / 23.49185 / 0.053489 / 5.299692), `total_latency_sec.mean` 39.20871 |

| Paper aggregate | Number | Source |
|---|---|---|
| Total latency median / SD / range | 34.2 / 12.2 / 32.0–66.3 | LATENCY_SUM `total_latency_sec` (`median` 34.249027, `sd` 12.228203, `min` 31.98028, `max` 66.343903) |
| AI-gen share of total (per-lecture mean of ratios) | 58.7% | LATENCY_SUM `ai_generation_pct_of_total_mean` 58.70081 |
| AI-gen share of total (ratio of means) | 59.9% | 23.49185 / 39.20871 = 0.599 (VALIDATION notes both conventions) |
| Transformation stage mean | 0.05 s | LATENCY_SUM `stage_means_sec.transformation` 0.053489 |
| Pearson r (chars vs. total latency) | 0.98 | LATENCY_SUM `pearson_r_charcount_vs_latency` 0.9814555 |
| Pearson p | 8.9e-5 (< 0.001) | LATENCY_SUM `pearson_p` 8.9056e-5 |
| n | 7 | LATENCY_SUM `n_lectures` |
| Fallback / failure count | 0 / 0 | LATENCY_SUM `fallback_rate` 0.0, `failure_rate` 0.0 |

RQ4 interpretation ("correlation not causation", "specific to this sample/window", "no linear or
universal scaling claim") ← RQ_STATUS RQ4; BOUNDARY "CAN MAKE WITH QUALIFIERS" and "CANNOT MAKE".

**VI.E Result validation** ← VALIDATION (9/9 recomputed and confirmed; the 58.7% vs. 59.9%
aggregation-convention ambiguity is the sole disclosed discrepancy).

### VII. Discussion

| Statement | Evidence | Status |
|---|---|---|
| "incomplete coverage — 56% overall, 0% for two of seven" | DIVERGENCE (as RQ1 above) | INCONCLUSIVE-derived observation |
| "the two zero-coverage lectures were the network-OSI lecture and the long AI-search lecture" | DATASET domains + DIVERGENCE `lectures_with_zero_topic_coverage` (`1msEo8PIcbw`, `T4lGm7MjA6Y`) | METHOD FACT |
| "latency scales with transcript length and is dominated by the model call" (sample) | LATENCY_SUM | SUPPORTED (sample) |
| "cannot conclude anything about timestamp accuracy / artifact quality / hallucination" | BOUNDARY "CANNOT MAKE"; RQ_STATUS | INCONCLUSIVE |
| "structural diversity is a necessary, not sufficient, condition for good distractors" | FLASHCARD `interpretation_caveat` reasoning; CLAIM_AUDIT | NARROW SUB-FINDING framing |
| "literature [6]–[10] suggests model-based / decomposed generation tends to produce higher-rated questions" | LITREV [6],[7],[8],[9],[10] | LITERATURE |
| Positioning vs. NoteIt [19], [2], [4]; "far simpler than learned temporal grounding [15], [16]" | LITREV; CONTRIB positioning | LITERATURE + METHOD FACT |
| "~0.05 s derivation" | LATENCY_SUM `stage_means_sec.transformation` | SUPPORTED (sample) |
| "very long lectures approaching the 120,000-char truncation limit, which no evaluated lecture reached" | CODE truncation constant; DATASET `transcript_chars.max` 59821 | SYSTEM FACT (forward-looking, hedged) |

### VIII. Limitations

All 12 numbered items map 1:1 onto LIMITATIONS (`research/results/FINAL_LIMITATIONS.md`, 16 items;
the paper consolidates closely-related items). Key numeric anchors: N = 7 (DATASET); "five of seven
under 15 minutes" and "a single lecture above 20 minutes" (DATASET `duration_band_counts` +
`duration_sec`); "four subject domains" (DATASET `subject_domain_counts`); human data 0/0/0
(RQ_STATUS); model-identifier disagreement and unpinned sampling params (VALIDATION / LIMITATIONS).

### IX. Future Work

Each bullet corresponds to a prepared-but-unexecuted study in RQ_STATUS / PHASE_6_PAPER_READINESS
(`research/results/PHASE_6_PAPER_READINESS.md`) and to released infrastructure under `research/`
(tolerance-window protocol, artifact rubric + blinding procedure, 58-unit claim segmentation,
dataset-expansion plan toward 18–20 lectures). No result is claimed here.

### X. Conclusion

Restates only claims established above: 56% topic coverage with two 0% lectures (DIVERGENCE);
lower deterministic-quiz lexical diversity on one lecture (DISTRACTOR); latency–length correlation
dominated by the model call (LATENCY_SUM); three of four RQs inconclusive (RQ_STATUS); infrastructure
released. No new number appears in the conclusion.

---

## 5. Figures

| Fig. | File | Underlying data | RQ | Caption guardrail |
|---|---|---|---|---|
| 1 | `research/paper/figures/fig0_architecture.png` (generated by `figures/make_architecture_figure.py`) | none — schematic of CODE / PHASE1 | — | Labelled "schematic of the verified implementation"; AI stage vs. deterministic stages colour-coded |
| 2 | `figures/fig1_dataset_duration_distribution.png` (from `research/results/processed/phase5_5/figures/`) | DATASET `duration_sec` | — | Descriptive dataset property only |
| 3 | `figures/fig2_topic_timestamp_coverage.png` | DIVERGENCE `topic_timestamp_coverage` + `per_lecture` | RQ1 | Caption states "not an accuracy measure" |
| 4 | `figures/fig3_distractor_uniqueness.png` | DISTRACTOR | RQ2 | Caption states "a diversity metric, not a correctness or quality rating" |
| 5 | `figures/fig4_latency_vs_transcript_length.png` | LATENCY_RAW + LATENCY_SUM (`pearson_r`, `pearson_p`) | RQ4 | Caption states "correlation, not causation"; trend line "descriptive only" |
| 6 | `figures/fig5_latency_stage_breakdown.png` | LATENCY_SUM `stage_means_sec` | RQ4 | Error bars = SD; sample-only |

All five data figures are the exact PNGs produced in Phase 5.5 (`research/results/processed/phase5_5/figures/`),
copied unmodified into `research/paper/figures/`. Fig. 1 is the only figure created in Phase 7 and
contains no data.

---

## 6. Non-fabrication / non-regression checks performed in Phase 7

| Check | Result |
|---|---|
| Every abstract/section number re-read from its result JSON | Done — §3, §4 above; all match |
| No result value computed for the first time in Phase 7 | Confirmed — figures and JSON pre-date Phase 7; Fig. 1 has no data |
| RQ statuses copied verbatim from `FINAL_RQ_STATUS.md` (no upgrades) | Confirmed — RQ1/RQ2/RQ3 INCONCLUSIVE, RQ4 SUPPORTED (sample) |
| AI-vs-deterministic wording matches CODE reality | Confirmed — only notes are model-generated; §4 III rows |
| No production code modified in Phase 7 | Confirmed — Phase 7 touched only `research/paper/**` |
| Backend test suite still green | See `PHASE_7_PAPER_QA.md` §Regression |
| References limited to the Phase 2 verified list | Confirmed — 19/19, `latex/references.bib` |
| Friend's AgriSense paper used for structure only | Confirmed — no agriculture content, GDD/crop metrics, equations, or results imported |
