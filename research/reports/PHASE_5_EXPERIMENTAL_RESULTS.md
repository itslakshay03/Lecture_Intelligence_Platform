# PHASE 5 — EXPERIMENTAL RESULTS

*Produced 2026-09-05. Builds on Phase 1-4, all delivered earlier in this project. Labeling convention preserved from Phase 4: every claim is tagged **ACTUAL MEASUREMENT**, **CALCULATED METRIC**, **STATISTICAL RESULT**, **INTERPRETATION**, or **LIMITATION**.*

**Read this before anything else:** this phase collected real, non-fabricated data for Experiment D (fully) and Experiment A's non-human-judgment components, and generated real comparison artifacts for Experiments B and C using real Gemini API calls — but it did **not** collect any human timestamp annotation or any human quality/groundedness rating. This is not an oversight; it is a deliberate, disclosed limit on what an AI agent can honestly produce. Phase 3/4 designed those specific measurements to require an independent human judgment precisely so the evaluation isn't circular (an AI system judging an AI system's output). Substituting myself as the "annotator" or "reviewer" would not produce evidence — it would produce a self-referential artifact dressed up as evidence. Where the brief's instructions could be read as asking for that, I did not do it, and this report says so plainly rather than blurring the distinction.

---

## 1. Executive Summary

Seven real lectures were reprocessed through the actual, unmodified LectraAI backend with Phase 4's instrumentation active, producing the first genuine dataset for **RQ4 (latency)**: all 7 succeeded via real Gemini calls (0 failures, 0 offline-fallback triggers), with a real, statistically significant correlation between transcript length and total latency (Pearson r=0.98, p=0.0001, n=7). A real, previously-unknown data-quality bug was found and fixed (a stale pre-schema cache file). A second, more consequential real finding emerged for **RQ1**: LectraAI's real timestamp-grounding mechanism assigned **zero** topic-level timestamps for 2 of 7 real lectures, and only 56% of all real topics across the dataset received any timestamp at all — a genuine coverage gap, discovered by running real code on real data, not by design. Real comparison artifacts were generated for **RQ2** (direct-LLM quiz/flashcards/interview questions) and **RQ3** (unconstrained-prompt notes), both via real Gemini API calls against real transcripts/notes, and an objective, non-subjective structural metric (distractor uniqueness) shows a stark, real difference: LectraAI's deterministic quiz distractors are 44.4% unique (8/18, driven by verbatim template reuse) vs. 100% unique (27/27) for the direct-LLM alternative. **No human annotation or rating exists for any RQ** — this remains the single largest gap, and is explained in §5/§25, not glossed over.

---

## 2. Relationship to Previous Phases

Phase 1-4's findings are unchanged and re-confirmed live in this phase: single-LLM-call notes generation (re-confirmed: every real generation this phase logged `generation_method: "gemini"`, never `"offline_fallback"`); deterministic quiz/flashcard/interview derivation (re-confirmed and now quantified — §8); keyword-overlap timestamp grounding (re-confirmed, and its real coverage rate is now measured for the first time — §6). **One methodology adjustment made and disclosed here:** Phase 4's Experiment A design assumed a naive-baseline-vs-LectraAI-vs-human-reference three-way comparison would be computed together once human annotation existed. Since human annotation does not exist yet, this phase computed a *different, honestly-relabeled* two-way comparison (LectraAI vs. naive, no ground truth) to avoid implying an accuracy claim that isn't supported — this is documented as a substitution, not silently presented as the original design.

---

## 3. Dataset

**ACTUAL MEASUREMENT.** N=7 real lectures (`research/dataset/manifest.csv`), all re-verified/regenerated in this phase via real `force_refresh=true` calls through the unmodified production pipeline. **This falls short of Phase 3's recommended N=18-20** — see §18 (Data Exclusions) and §25 for why, and §26 for the concrete path to close this gap. All 7 are confirmed `generation_method: gemini` (not offline-fallback) — a real confound Phase 4 flagged as unresolved is now resolved for this specific set of 7.

---

## 4. Dataset Statistics

**ACTUAL MEASUREMENT / CALCULATED METRIC**, from `research/results/processed/dataset_summary.json`:

| | Value |
|---|---|
| N lectures | 7 |
| Duration (sec): mean / median / min / max / SD | 1163.9 / 777.0 / 393.0 / 3702.3 / 1140.9 |
| Transcript length (chars): mean / median / min / max / SD | 17109 / 10590 / 5326 / 59821 / 19006 |
| Duration band counts | Short: 5, Medium: 1, Long: 1 |
| Subject domain counts | Operating Systems: 2, Computer Networks: 2, DBMS: 2, Artificial Intelligence: 1 |
| Topic-category counts | COMPARISON: 3, ARCHITECTURE: 2, ALGORITHM: 1, THEORY: 1 |
| Language | en (all 7, per manifest; not independently re-verified against caption metadata) |
| Transcript source (manual/auto captions) | **UNKNOWN for all 7** — not captured anywhere in the current pipeline |

**LIMITATION:** heavily Short-duration-skewed (5/7); no CODING or NUMERICAL topic-category lecture exists; `transcript_source` is unknown for every lecture. Longest transcript (59,821 chars) is well under the 120,000-char truncation boundary — **the dataset currently contains no real truncation-boundary edge case**, contrary to Phase 4's plan to deliberately include one.

---

## 5. Annotation Process

**DATA REQUIRED — not completed, and not attempted by substitution.** Zero human timestamp annotations exist (`research/annotations/timestamps/` remains schema-only). Zero human quality/groundedness ratings exist (`research/annotations/ratings/` remains schema-only). **Reason, stated plainly:** these require an independent human judgment that this execution environment does not have access to arrange (no reviewer panel was recruitable within this phase), and — critically — an AI agent performing this role would invalidate the measurement's purpose, since the entire point of RQ1's human reference and RQ2/RQ3's human ratings is to obtain judgment independent of any LLM system. This is documented as a blocking gap requiring human involvement in Phase 6+, not something Phase 5 could complete on its own.

---

## 6. Experiment A — Timestamp Accuracy

**Status: PARTIALLY EXECUTED — the non-human-judgment half only.**

Human reference component: **DATA REQUIRED** (§5).

What was actually computed, from real data (`backend/output/*.json`, unmodified, real LectraAI output; `research/results/processed/expA_lectraai_vs_naive_divergence.json`):

**ACTUAL MEASUREMENT + CALCULATED METRIC:**

| Lecture | n_topics | n_topics_with_LectraAI_timestamp | Coverage |
|---|---|---|---|
| 3MqyDWDpZoI | 5 | 3 | 60% |
| 1msEo8PIcbw | 3 | **0** | **0%** |
| T4lGm7MjA6Y | 5 | **0** | **0%** |
| uDulBxDb7GM | 3 | 2 | 67% |
| VyvTabQHevw | 2 | 2 | 100% |
| WJ-UaAaumNA | 5 | 5 | 100% |
| ZtVw2iuFI2w | 2 | 2 | 100% |
| **Overall** | **25** | **14** | **56.0%** |

**This is a real, previously-undocumented finding**: 2 of 7 real lectures (28.6%) received **no topic-level timestamp at all** from LectraAI's real `_extract_grounded_timestamps` method — the keyword-overlap match failed to clear its minimum-score threshold for every topic in those two lectures. This was discovered by running real, unmodified production code against real cached data, not designed in advance.

**CALCULATED METRIC** (for the 14 topics that did receive a timestamp): mean absolute difference from the naive equal-interval baseline = 147.26 sec, median = 124.00 sec, SD = 92.99 sec (n=14 topic-level comparisons).

**INTERPRETATION:** LectraAI's real method, when it produces a timestamp at all, places it substantially differently from a naive even-spacing assumption (on the order of 2 minutes on average) — consistent with it responding to actual transcript content rather than just dividing the video into equal slices. **This is not an accuracy claim** — without ground truth, a large difference from naive could mean LectraAI is more accurate, less accurate, or just different; only human annotation can resolve this.

**LIMITATION:** No human reference exists. The 56% coverage rate itself, however, is a real, ground-truth-independent finding: even before asking "how accurate," the more basic question "does it produce a timestamp at all" already has a documented, real, non-trivial failure rate.

---

## 7. Experiment B — Artifact Quality

**Status: PARTIALLY EXECUTED — real comparison data generated; human rating not performed.**

**ACTUAL MEASUREMENT:** real direct-LLM quiz (9 items), flashcards (9 items), and interview questions (5 items across basic/intermediate/advanced) were generated via real Gemini API calls (`research/baselines/direct_llm_artifacts/generate_artifacts.py`) from the real notes of lecture CAND01 (3MqyDWDpZoI), stored in `research/results/raw/expB_3MqyDWDpZoI.json`. All confirmed `model_name_used: gemini-3.6-flash`, matching the model that also produced Condition A's underlying notes for this lecture — **the pre-registered confound control (same model family, same source notes) held.**

**CALCULATED METRIC (objective, non-subjective — distractor uniqueness):**

| Condition | n_distractors | n_unique | Uniqueness |
|---|---|---|---|
| LectraAI deterministic (product) | 18 | 8 | **44.4%** |
| Direct-LLM (experiment-only) | 27 | 27 | **100.0%** |

This is a real, code-computed, traceable finding (`research/results/processed/expB_distractor_uniqueness_3MqyDWDpZoI.json`): LectraAI's real deterministic distractors are drawn from a fixed pool of ~6 template sentences (e.g., "It eliminates all resource requirements.", "It operates without any data structures.") reused verbatim across different quiz questions, exactly as Phase 1's code-level finding predicted — now quantified with real numbers on real output. Every direct-LLM distractor, by contrast, is unique and topic-specific (e.g., "Round-robin", "Shortest Job Next" — real scheduling concepts from the actual lecture).

**INTERPRETATION:** this is real, strong evidence consistent with H2's prediction that direct-LLM distractors are more content-specific than LectraAI's current generic templates. **It is not itself a "quality" or "correctness" rating** — a plausible-sounding distractor could still be wrong, and a repeated-template distractor could still be technically correct-as-a-wrong-answer. Only the human rubric (relevance, distractor plausibility, Likert 1-5) can establish quality; this metric establishes *diversity*, a necessary but not sufficient condition for plausibility.

**DATA REQUIRED:** correctness, relevance, coverage, perceived difficulty for all four artifact types — **zero human ratings collected** (§5). Flashcard and interview-question comparison data exists in raw form (`expB_3MqyDWDpZoI.json`) but was not scored by any objective or human method in this phase, since flashcard/interview quality is much harder to assess without semantic judgment than quiz-distractor set-cardinality.

---

## 8. Experiment C — Prompt Ablation

**Status: PARTIALLY EXECUTED — real comparison data generated; human groundedness rating not performed; the automated proxy attempted was found unreliable and is reported as such.**

**ACTUAL MEASUREMENT:** real notes were generated under both conditions for lecture CAND01, from the identical real transcript, both via `gemini-3.6-flash` (`research/results/raw/expC_3MqyDWDpZoI.json`):
- Condition A (constrained `SMART_PROMPT_v1`): 3890 characters.
- Condition B (unconstrained `SMART_PROMPT_UNCONSTRAINED_v1`, verified in Phase 4 to differ from A only in the removed constraint block): 3763 characters.

**CALCULATED METRIC attempted (automated groundedness proxy):** an exact-substring check of whether each document's bolded (`**term**`) phrases appear verbatim in the source transcript. Result: Condition A 5/23 (21.7%) found verbatim; Condition B 18/51 (35.3%) found verbatim.

**This result is reported but explicitly flagged as unreliable, not as evidence of a real difference:** manual inspection of the "not found" lists (`research/results/processed/expC_groundedness_proxy_3MqyDWDpZoI.json`) shows the metric is dominated by two false-negative sources unrelated to actual groundedness: (1) markdown section-header labels ("Primary Objective:", "Execution Style", "Real-World Application:") being counted as "claims" when they are structural scaffolding, not factual content; (2) simple orthographic mismatches (e.g., "Multi-programming" in the notes vs. "multi-programmed" in the transcript) that an exact-substring check cannot bridge. **This automated proxy is therefore not used to support any conclusion about RQ3** — it is reported only as a documented, honest account of an attempted automated method that did not clear its own bar for reliability, per the instruction to report methodological findings honestly rather than silently discard an inconvenient result. Per Phase 3/4's explicit constraint, an LLM was deliberately **not** used to semantically judge hallucination as a substitute for this — the only automation attempted was a crude, inspectable text-matching heuristic, and even that is disclosed as insufficient.

**DATA REQUIRED:** real groundedness/unsupported-claim-rate/factual-correctness/coverage comparison — **zero human ratings collected**. This is RQ3's central measurement and remains fully open.

---

## 9. Experiment D — Latency

**Status: FULLY EXECUTED with real data — the most complete experiment this phase.**

**ACTUAL MEASUREMENT**, all 7 real lectures, real `force_refresh=true` runs through the unmodified production pipeline, real Phase 4 instrumentation (`research/results/raw/expD_latency_real_regen_batch.json`):

| Lecture | Duration (s) | Transcript chars | Total latency (s) | fetch (s) | AI gen (s) | transform (s) | PDF (s) |
|---|---|---|---|---|---|---|---|
| 3MqyDWDpZoI | 393.0 | 5326 | 34.25 | 9.99 | 19.06 | 0.038 | 4.78 |
| 1msEo8PIcbw | 714.3 | 10590 | 38.21 | 13.28 | 19.89 | 0.028 | 4.86 |
| T4lGm7MjA6Y | 3702.3 | 59821 | 66.34 | 14.90 | 45.73 | 0.086 | 5.46 |
| uDulBxDb7GM | 642.0 | 8556 | 31.98 | 9.39 | 17.13 | 0.032 | 5.04 |
| VyvTabQHevw | 777.0 | 11553 | 33.27 | 9.15 | 19.37 | 0.037 | 4.52 |
| WJ-UaAaumNA | 1139.0 | 13495 | 38.01 | 9.01 | 24.25 | 0.044 | 4.52 |
| ZtVw2iuFI2w | 780.0 | 10424 | 32.41 | 5.08 | 19.02 | 0.109 | 7.92 |

Every task: `generation_method = gemini`, `model_name_used = gemini-3.6-flash`, `prompt_version = SMART_PROMPT_v1`. **Fallback rate: 0/7 (0%). Failure rate: 0/7 (0%)** — real production executions only; this excludes the earlier deliberate rate-limit encounter during Experiment B's generation (a real 429 quota error, correctly handled by the existing fallback/retry logic — see §19) and the fully separate pytest test-suite's simulated failures (Phase 4 §20), neither of which is a real production execution and neither is counted here, per instruction #22.

**STATISTICAL RESULT:**
- Total latency: mean=39.21s, median=34.25s, SD=12.23s, min=31.98s, max=66.34s (n=7).
- AI generation stage: mean=23.49s (58.7% of total latency on average) — clearly the dominant stage.
- Transcript fetch: mean=10.12s. PDF render: mean=5.30s. Transformation (parsing/derivation): mean=0.054s — negligible, consistent with it being pure in-memory regex work (Phase 1 §7).
- **Pearson correlation, transcript character count vs. total latency: r=0.9815, p=0.0001 (n=7).** Strong, statistically significant positive relationship — computed via the real scipy branch of `research/evaluation/statistics` infrastructure (Issue B from Phase 4 resolved: scipy/numpy installed and verified working, not just the honest fallback path).

**INTERPRETATION:** in this sample, processing time is strongly and significantly associated with transcript length, and is dominated by the single Gemini call rather than transcript fetch, transformation, or PDF rendering. **LIMITATION:** n=7 is small; the correlation, while significant at this sample size, should not be treated as a precise population estimate; network/API latency (transcript fetch, Gemini call) reflects one specific time window and is not a universal performance guarantee (Phase 3 §12's acknowledged confound, re-confirmed real here).

---

## 10. Statistical Analysis

**ACTUALLY EXECUTED**, `research/evaluation/statistics/paired_analysis.py`, real scipy/numpy branch confirmed working (§Phase 4 Issue B resolved). Applied to real data:
- RQ4's transcript-length-vs-latency relationship: Pearson correlation (§9), not a paired comparison (no two conditions to pair — this is a single-arm observational relationship, exactly as Phase 4 §5 specified for RQ4, which has no hypothesis test by design).
- RQ1/RQ2/RQ3 paired comparisons: **not run**, because none currently has a real paired dataset (RQ1 needs human reference values to pair against; RQ2/RQ3 need human ratings to pair). Running `paired_analysis.py` on the objective-metric results (e.g., distractor uniqueness, n=1 lecture) would violate the module's own `MIN_N_FOR_INFERENTIAL_TEST = 5` guard and correctly return `insufficient_data_for_inference` — not attempted, since the outcome is already known and would add nothing.

**No p-value, confidence interval, or effect size is reported anywhere in this report for RQ1, RQ2, or RQ3.** The only real inferential statistic produced this phase is RQ4's Pearson correlation (§9).

---

## 11. Results Tables

All tables in §4, §6, §7, §9 above are the real, complete result tables producible from this phase's data. No table for "Artifact Quality [human ratings]" or "Prompt Ablation [groundedness]" is included, because populating either with numbers would require exactly the fabrication this phase's rules prohibit.

---

## 12. Generated Figures

**None generated this phase.** Every figure Phase 4 specified (timestamp error distribution, artifact quality comparison, prompt ablation comparison) requires either human-annotated ground truth or human ratings, neither of which exists. The one figure that *could* be honestly generated from real data — latency vs. transcript length (§9) — was not rendered as an image file in this phase (no plotting library invocation was run); the underlying real numbers are reported in the §9 table instead, fully traceable to `expD_latency_real_regen_batch.json`. **DATA REQUIRED / DEFERRED:** an actual `.png`/`.svg` scatterplot from this real data is a trivial follow-up (matplotlib is not yet installed in `research/requirements.txt` — a small addition, not a blocker) and should be produced in Phase 6 rather than fabricated here without the plotting step actually having been run.

---

## 13. RQ-by-RQ Findings

**RQ1 (Timestamp Grounding):** Evidence collected: real topic-timestamp coverage rate (56%, n=25 topics/7 lectures) and real divergence-from-naive-baseline (mean 147.3s, n=14 topic comparisons). Result: LectraAI's real method fails to produce any timestamp for a meaningful fraction of real topics, and produces substantially different results from naive spacing when it does succeed. Statistical evidence: none applicable (no ground truth to test against). Interpretation: the coverage gap is a real, actionable limitation independent of any accuracy question. Limitation: accuracy itself remains entirely unevaluated without human reference data.

**RQ2 (Artifact Generation Strategy):** Evidence collected: real generated comparison artifacts (1 lecture) and one real, objective structural metric (distractor uniqueness: 44.4% vs. 100.0%). Result: a clear, large, real difference in distractor diversity. Statistical evidence: none (n=1 lecture; not powered for inference). Interpretation: consistent with, but not proof of, an actual plausibility/correctness quality gap. Limitation: no human judgment of correctness, relevance, or plausibility exists; only one lecture was evaluated even structurally.

**RQ3 (Prompt Ablation):** Evidence collected: real notes generated under both conditions (1 lecture); one attempted automated groundedness proxy, found unreliable and explicitly not used as evidence. Result: **no usable evidence toward the actual research question.** Statistical evidence: none. Interpretation: none can be responsibly drawn. Limitation: this RQ has made the least real progress of the four.

**RQ4 (Processing Efficiency):** Evidence collected: real, complete latency data across all 7 real lectures, all pipeline stages. Result: AI generation dominates latency (~59%); latency scales with transcript length (r=0.98, p<0.001). Statistical evidence: real, significant Pearson correlation. Interpretation: a defensible, evidence-backed descriptive finding for this dataset. Limitation: n=7, single time-window, no comparison baseline (by design).

---

## 14. Supported Contributions

None of Phase 2/3's candidate contributions can be called "supported" on the strength of this phase's evidence alone — every one requires either a larger dataset (RQ4) or human judgment (RQ1-RQ3) that doesn't yet exist. What *is* supported, narrowly:

- **"LectraAI's deterministic quiz distractors are measurably less diverse than a direct-LLM alternative on the same source material"** — SUPPORTED by real, objective, n=18-vs-27-distractor data (1 lecture). Scope: diversity only, not correctness/plausibility.
- **"LectraAI's timestamp-grounding mechanism does not achieve full topic coverage"** — SUPPORTED by real data (56% coverage, 2/7 lectures at 0%). Scope: coverage only, not accuracy.
- **"Processing latency for this pipeline is dominated by the LLM call and scales with transcript length"** — SUPPORTED by real, statistically significant data (n=7).

---

## 15. Unsupported/Inconclusive Findings

- Any claim that LectraAI's timestamp assignments are more or less *accurate* than naive spacing — **INCONCLUSIVE**, no ground truth.
- Any claim about relative *quality/correctness* of deterministic vs. direct-LLM artifacts beyond distractor diversity — **INCONCLUSIVE**, no human rating.
- Any claim about grounding-constraint effectiveness (RQ3) — **INCONCLUSIVE**, the one automated proxy attempted was found unreliable and no human evaluation exists.
- Any generalization of the RQ4 latency finding beyond this specific 7-lecture, single-session sample — **not warranted**; n=7 is small and reflects one execution window.

---

## 16. Threats to Validity

- **Internal validity:** Experiment D's 7 comparisons are within-subject in the sense that the same pipeline/model processed all 7, but they were NOT all run in a single tight time window (the ZtVw2iuFI2w single-task run and the 6-lecture batch were submitted a few minutes apart) — a source of minor, disclosed timing variance, not a design flaw. Experiment B/C held source notes/transcript constant across conditions as designed (confirmed: same model responded to both).
- **External validity:** N=7, 3 subject domains, 5/7 Short-duration — results should not be generalized beyond this sample.
- **Construct validity:** the RQ1 "divergence from naive" metric measures difference, not accuracy — explicitly not conflated with a validity claim in this report. The RQ3 automated groundedness proxy was found NOT to validly measure groundedness and was excluded from interpretation accordingly — a construct-validity failure caught and disclosed, not hidden.
- **Statistical conclusion validity:** only one real inferential test was run (RQ4's correlation, n=7) — genuinely significant, but from a small sample; no other RQ has enough real data for any statistical conclusion to be attempted responsibly.

---

## 17. Limitations

Dataset size (N=7 vs. recommended 18-20); domain diversity (no CODING/NUMERICAL lecture); language (English only, unverified caption-type); **zero annotators, zero reviewers** — the largest limitation of this phase; human-evaluation subjectivity therefore entirely untested; API/model variability acknowledged but not resolved (temperature still unpinned, per Phase 4 §16); real transcript quality not independently audited; RQ1's matching methodology (divergence, not accuracy) is a genuine substitute, not the originally-designed comparison; small sample statistical power for everything except RQ4; deterministic-artifact limitations now quantified for quiz distractors only, not flashcards/interview/revision; no user study exists; no OCR exists (correctly, per Phase 1 — not fabricated as a component); no comparison with any commercial system was attempted or claimed.

---

## 18. Data Exclusions

| Excluded | Reason |
|---|---|
| Extractive-summarization baseline, real-transcript pilot | Real execution revealed the period-based sentence splitter collapses a real spoken-lecture transcript (comma-heavy, period-sparse) into ~8 giant run-on blocks rather than real sentences — a genuine incompatibility with LectraAI's actual transcript format, not a toy-data artifact as Phase 4 initially suspected. Excluded from further use pending a re-engineered sentence-boundary approach (not attempted here, to avoid "modifying to improve results," per instruction #16/§21). |
| RQ3's automated groundedness proxy result | Computed, but excluded from interpretation (§8) — found unreliable via manual inspection of its own output, not fabricated evidence. |
| Pytest-suite-generated `task_stage_events`/`tasks` rows (Phase 4 pilots, and routine test runs) | Excluded from all Experiment D statistics in this report, per instruction #31/§22 — only the 7 real, deliberate, this-phase production runs are counted. |
| The stale `ZtVw2iuFI2w.json` (pre-fix) | Superseded by the real regeneration in this phase; the stale file's data was never used in any reported metric. |

---

## 19. Failed/Incomplete Runs

- A real HTTP 429 (`ResourceExhausted`, `generativelanguage.googleapis.com/generate_content_free_tier_requests`, daily quota 20/model) was encountered during Experiment B's quiz-generation call. This was **not a failure of the experiment** — LectraAI's real, unmodified fallback/retry logic (Phase 1 §7) automatically retried against the next model/key combination and succeeded; the final result (`expB_3MqyDWDpZoI.json`) reflects the successful retry. Documented here as real evidence of the fallback mechanism working under genuine quota pressure, and as a caution: further real API-based experimentation in this project is now constrained by the free-tier daily quota (20 requests/model/day), which is why this phase did not attempt to expand the dataset to N=18-20 via many more live generations (§25).
- The first backend-server start attempt this phase silently failed to bind port 8000 (a stale process from earlier in the session already held it), and the very first `ZtVw2iuFI2w` regeneration request was inadvertently served by that stale, un-instrumented process — producing a completed task with the correct duration/topic fix but **no** instrumentation data. This was caught (not assumed successful), the stale process was killed, a genuinely fresh server was verified to hold the port, and the regeneration was re-run correctly. Documented in full rather than silently discarded.

---

## 20. Reproducibility Information

- Model: `gemini-3.6-flash` responded to every real generation call in this phase (verified per-call, not assumed).
- Prompt versions: `SMART_PROMPT_v1` (Condition A generations), `SMART_PROMPT_UNCONSTRAINED_v1` (Condition B, Experiment C), `DIRECT_LLM_ARTIFACTS_v1` (Experiment B Condition B).
- Dataset version: `research/dataset/manifest.csv` as of this phase (7 rows, all `generation_method: gemini` confirmed).
- Execution window: 2026-09-05, approximately 06:20-06:50 UTC (single session).
- Full experiment-config records (per Phase 4's `experiment_config.example.json` template) were **not** separately created as standalone files this phase — the equivalent information is embedded directly in each raw result file's own fields (lecture_id, model, prompt_version, generated_at_utc). **DATA REQUIRED / minor process gap:** formal `experiment_config.<id>.json` files per Phase 4's template should be backfilled in Phase 6 for full compliance with the reproducibility template, even though the underlying information is not lost.

---

## 21. Raw Result Locations

```
research/results/raw/
  expB_3MqyDWDpZoI.json
  expC_3MqyDWDpZoI.json
  expD_latency_real_regen_batch.json
  real_transcript_3MqyDWDpZoI.txt
  extractive_pilot_real_transcript_3MqyDWDpZoI.txt
```

## 22. Processed Result Locations

```
research/results/processed/
  dataset_summary.json
  expA_lectraai_vs_naive_divergence.json
  expB_distractor_uniqueness_3MqyDWDpZoI.json
  expC_groundedness_proxy_3MqyDWDpZoI.json
  expD_latency_summary.json
```

Full traceability: `research/results/RESULT_TRACEABILITY.md`.

---

## 23. Exact Files Added/Modified

**Added:**
```
research/results/raw/expB_3MqyDWDpZoI.json
research/results/raw/expC_3MqyDWDpZoI.json
research/results/raw/expD_latency_real_regen_batch.json
research/results/raw/real_transcript_3MqyDWDpZoI.txt
research/results/raw/extractive_pilot_real_transcript_3MqyDWDpZoI.txt
research/results/processed/dataset_summary.json
research/results/processed/expA_lectraai_vs_naive_divergence.json
research/results/processed/expB_distractor_uniqueness_3MqyDWDpZoI.json
research/results/processed/expC_groundedness_proxy_3MqyDWDpZoI.json
research/results/processed/expD_latency_summary.json
research/results/RESULT_TRACEABILITY.md
research/reports/PHASE_5_EXPERIMENTAL_RESULTS.md
```

**Modified:**
```
research/dataset/manifest.csv           -- real values replacing DATA REQUIRED/unknown placeholders
backend/output/ZtVw2iuFI2w.json         -- regenerated for real (stale-cache fix); .pdf likewise
```

**Backend/frontend code:** **NOT modified this phase.** All Phase 4 instrumentation code ran as-is; no bug in it was found requiring a code change (the one real issue — the stale server process — was an execution-environment mistake on my part, not a code defect).

---

## 24. Production Changes

**None.** Zero lines of `backend/` or `frontend/` source code were changed in Phase 5. The only production-adjacent artifact touched was the regenerated cache file `backend/output/ZtVw2iuFI2w.json` (and its `.pdf`), which is data, not code, and was regenerated via the application's own existing, unmodified `force_refresh` feature exactly as an end user could trigger it.

---

## 25. Final Evidence Inventory

### RQ1
- Dataset size: 7 lectures, 25 topics.
- Annotation count: **0** human annotations.
- Baseline: naive equal-interval (implemented, real data used).
- Metrics available: topic-timestamp coverage rate (real, 56%), divergence-from-naive (real, n=14).
- Actual result availability: coverage — yes, real. Accuracy — no.
- Statistical evidence: none (no ground truth).
- **Conclusion status: INCONCLUSIVE** (coverage finding is real and reportable; the core accuracy question is NOT YET EVALUATED).

### RQ2
- Dataset size: 1 lecture (comparison artifacts generated for CAND01 only).
- Ratings count: **0** human ratings.
- Baseline: direct-LLM generator (implemented, real data generated).
- Metrics available: distractor uniqueness (real, objective).
- Actual result availability: diversity — yes, real. Correctness/relevance/plausibility/coverage — no.
- Statistical evidence: none (n=1, not powered).
- **Conclusion status: INCONCLUSIVE**, with one **SUPPORTED** narrow sub-finding (distractor diversity gap, §14).

### RQ3
- Dataset size: 1 lecture (both prompt conditions generated for CAND01 only).
- Ratings count: **0** human ratings.
- Baseline: unconstrained-prompt generator (implemented, real data generated).
- Metrics available: an attempted automated proxy, found unreliable and excluded.
- Actual result availability: **none usable**.
- Statistical evidence: none.
- **Conclusion status: NOT YET EVALUATED.**

### RQ4
- Dataset size: 7 lectures, all real.
- Ratings/annotation count: N/A (no human judgment required for this RQ).
- Baseline: N/A (observational, by design).
- Metrics available: stage-level and total latency, fallback rate, failure rate — all real.
- Actual result availability: full.
- Statistical evidence: real, significant Pearson correlation (r=0.98, p=0.0001, n=7).
- **Conclusion status: SUPPORTED** (for this specific 7-lecture sample and time window — not claimed to generalize further).

---

## 26. Phase 6 Handoff

Phase 6 must **not** proceed to writing the paper. It must first:

**Blocking, requires human involvement (cannot be produced by an AI agent in isolation):**
- [ ] Recruit 2-3 human annotators/reviewers.
- [ ] Collect independent-reference human timestamp annotations (RQ1) — target: the full 18-20 lecture dataset once expanded, or at minimum the current 7.
- [ ] Collect blinded human ratings for Experiment B (quiz/flashcards/interview: correctness, relevance, coverage, distractor plausibility, difficulty) and Experiment C (notes: factual correctness, groundedness, coverage, relevance, clarity + unsupported-claim listing).
- [ ] Compute inter-rater reliability once 2+ raters have overlapping data (Krippendorff's alpha / ICC, per Phase 4 §12).

**Achievable without new human involvement, real-API-cost aware (free-tier quota is 20 requests/model/day — plan generation batches accordingly, per §19):**
- [ ] Expand the dataset toward N=18-20, prioritizing CODING and NUMERICAL topic-categories and Medium/Long duration bands (current gaps, §4), and deliberately including one transcript near/over the 120,000-char truncation boundary (currently absent, §4).
- [ ] Generate Experiment B/C comparison artifacts for the remaining lectures beyond CAND01 (currently only 1 of 7 has comparison data).
- [ ] Investigate and, if worthwhile, re-engineer the extractive baseline's sentence-boundary detection (e.g., using `[⏱ MM:SS]` cue markers as pseudo-boundaries) before attempting to use it further — or formally drop it, per §18.
- [ ] Backfill formal `experiment_config.<id>.json` records for this phase's real runs (§20).
- [ ] Add `matplotlib` (or similar) to `research/requirements.txt` and render the real latency-vs-duration scatterplot from `expD_latency_real_regen_batch.json` (data already exists; only the plotting step is missing, §12).
- [ ] Re-run `paired_analysis.py` on real paired data once human ratings/annotations exist for RQ1-RQ3, and report whatever it shows — including a null/non-significant result, if that is what the data shows.

**Only after the above** should Phase 6 begin determining final research contributions, strongest findings, and paper structure — and even then, RQ4 is currently the only RQ with a real, statistically supported finding; RQ1-RQ3 remain evidence-partial or evidence-absent pending human involvement.
