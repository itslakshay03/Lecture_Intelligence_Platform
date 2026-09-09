# PHASE_7_PAPER_QA.md

**Subject:** `LECTRAAI_IEEE_RESEARCH_PAPER` (`.md` / `.tex` / `.docx` / `.pdf`)
**Date:** 2026-09-06
**Auditor rule:** A checklist item passes only if it is verifiable against a committed evidence
file (`research/results/**`, `research/reports/**`) or the LectraAI source code. Cross-references
are in `PAPER_TRACEABILITY.md`.

Legend: ✅ pass · ⚠️ pass with a caveat recorded in the paper · ❌ fail (none present).

---

## A. Fabrication checks

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 1 | **No fabricated experimental results.** Every number in the abstract, Results, tables, and figures is reproduced from a pre-Phase-7 result file. | ✅ | `PAPER_TRACEABILITY.md` §3–§5. All values traced to `dataset_summary.json`, `expA_lectraai_vs_naive_divergence.json`, `expB_distractor_uniqueness_3MqyDWDpZoI.json`, `expB_flashcard_verbatim_overlap_3MqyDWDpZoI.json`, `expD_latency_summary.json`, `expD_latency_real_regen_batch.json`. No value first computed in Phase 7. |
| 2 | **No fabricated citations.** All references exist and were verified. | ✅ | 19/19 references are the Phase 2 verified list; `latex/references.bib` carries DOIs/arXiv IDs; preprints ([11], [13]) flagged as such in the reference text. |
| 3 | **No fabricated research contributions.** Contributions are classified, not inflated. | ✅ | Intro contributions map to `CONTRIBUTIONS_AND_NOVELTY.md` items A–F; each is tagged (System/engineering, System/methodological, Methodological, Empirical-sample-only). Paper states "zero currently-validated research contributions" equivalent: "We do not claim ... accurate timestamps, higher-quality artifacts ..., or reduced hallucination." |
| 4 | **No invented datasets or participants.** | ✅ | Dataset = N = 7, from `dataset_summary.json`. Human participants: paper states 0 annotations / 0 ratings / 0 groundedness labels (Setup §V-B). |
| 5 | **No invented baselines or statistical tests.** | ✅ | Baselines = naive equal-interval, direct-LLM artifact generator, unconstrained prompt (all in `research/`), plus one **excluded** extractive baseline (disclosed). Only test reported: Pearson correlation for RQ4 (`expD_latency_summary.json`). No t-test/ANOVA/effect-size claimed. |

## B. Research-question integrity

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 6 | **RQ statuses preserved exactly** (no inconclusive→supported drift). | ✅ | Paper: RQ1 INCONCLUSIVE, RQ2 INCONCLUSIVE + one narrow diversity sub-finding, RQ3 INCONCLUSIVE, RQ4 SUPPORTED for the evaluated sample only. Matches `FINAL_RQ_STATUS.md` verbatim. Section headings carry the status in parentheses. |
| 7 | **RQ1 not overstated.** Coverage is never called accuracy. | ✅ | "56.0% coverage" always paired with "output characteristic of the mechanism, not a validated accuracy measure" (Abstract, §VI-A, §VII). "not an accuracy measure" in Fig. 3 caption. `expA` file's own `ground_truth_status = DATA_REQUIRED` reflected. |
| 8 | **RQ2 not overstated.** Diversity ≠ quality; single-lecture scope stated. | ✅ | "It is a diversity result, not a quality result" (§VI-B). "only one lecture was compared" stated in Abstract, §VI-B, §VII. Flashcard caveat ("paraphrasing is not a defect") reflected from `expB_flashcard_verbatim_overlap` `interpretation_caveat`. |
| 9 | **RQ3 not overstated.** No groundedness/hallucination claim; rejected proxy disclosed. | ✅ | §IV-E and §VI-C state the automated proxy was attempted and **excluded** for construct-invalidity and "is not used as evidence." Status INCONCLUSIVE "because human ground truth was not collected." |
| 10 | **RQ4 causation not claimed.** Correlation and sample scope explicit. | ✅ | "This is a correlation, not a causal relationship" (§VI-D). "specific to this sample and this measurement window"; "We do not claim linear or universal scaling." Fig. 5 caption: "correlation, not causation." |

## C. System-description integrity

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 11 | **AI-vs-deterministic described correctly.** Only notes are AI-generated. | ✅ | Abstract: "single LLM call" for notes; artifacts by "deterministic (template and regular-expression) transformation." §III-A "Critical distinction": only note generation is model-generated; "we avoid the phrasing 'AI-generated' for the derived artifacts." Matches `services/pipeline.py` (no model calls in artifact builders). |
| 12 | **No "AI-generated" wording for deterministic artifacts** (quiz, flashcards, revision plan, interview questions, timestamps). | ✅ | Full-text check of `.md`: "AI-generated" appears only as "the single AI-generated stage" (Fig. 1 caption) and in the contrastive phrase being rejected in §III-A. Derived artifacts are consistently "deterministic," "template," "regex-extracted," "fixed schedule." |
| 13 | **Pipeline stages match the code.** | ✅ | §III-B..F verified line-by-line against `services/{transcript,ai,pipeline,pdf,task_repository}.py`, `prompts/smart.py`, `main.py` — see `PAPER_TRACEABILITY.md` §4 (III). 60 s cue-gap, 120,000-char truncation, 5-stage revision schedule (24h/3d/7d/14d/30d), SQLite lifecycle, cache-by-video-ID all confirmed. |
| 14 | **Model identifier stated honestly.** | ⚠️ | Paper (§V-A, §V-C) reports the **instrumentation-recorded** responder `gemini-3.6-flash` for all 7 runs (`expD_latency_real_regen_batch.json`) and explicitly notes the docs/code identifier discrepancy (`gemini-2.5-flash` in docs) as a reproducibility limitation. Caveat is intentional and disclosed, not an error. |
| 15 | **Instrumentation described as additive / non-behavioural.** | ✅ | §III-F: "additive and does not alter processing behaviour (the system's existing test suite passes unchanged)." Regression run below confirms 92/92. |

## D. Numeric verification (independent re-read in Phase 7)

| # | Paper value | Re-read from file | Match |
|---|---|---|---|
| 16a | Topic coverage 14/25 = 56.0% | `expA...divergence.json` → `topic_timestamp_coverage`: 25, 14, 56.0 | ✅ |
| 16b | Zero-coverage lectures = 2 (`1msEo8PIcbw`, `T4lGm7MjA6Y`) | same file → `lectures_with_zero_topic_coverage` | ✅ |
| 16c | Divergence mean/median/SD = 147.3 / 124.0 / 93.0 s (n = 14) | `overall`: 147.264 / 124.0 / 92.993; `n_topic_comparisons` 14 | ✅ |
| 16d | Per-lecture divergence table (150.2 / – / – / 168.5 / 101.3 / 143.5 / 177.0) | `per_lecture[*].mean_abs_diff_vs_naive_sec` (150.2 / null / null / 168.5 / 101.25 / 143.52 / 177.0) | ✅ (rounded) |
| 16e | Distractor uniqueness 8/18 = 44.4% vs 27/27 = 100.0% | `expB_distractor_uniqueness...`: det 18/8/44.4, llm 27/27/100.0 | ✅ |
| 16f | Flashcard verbatim 10/10 = 100.0% vs 1/9 = 11.1% | `expB_flashcard_verbatim_overlap...`: det 10/10/100.0, llm 9/1/11.1 | ✅ |
| 16g | Constrained/unconstrained notes = 3,890 / 3,763 chars | Phase 5 `expC` RQ3 record | ✅ |
| 16h | Latency mean/median/SD/range = 39.2 / 34.2 / 12.2 / 32.0–66.3 s | `expD_latency_summary.json` → `total_latency_sec`: 39.20871 / 34.249027 / 12.228203 / 31.98028–66.343903 | ✅ |
| 16i | Stage means = 10.12 / 23.49 / 0.05 / 5.30 s | `stage_means_sec`: 10.11577 / 23.49185 / 0.053489 / 5.299692 | ✅ |
| 16j | AI share 58.7% (mean of ratios); 59.9% (ratio of means) also given | `ai_generation_pct_of_total_mean` 58.70081; 23.49185/39.20871 = 0.599 | ✅ |
| 16k | Pearson r = 0.98, p ≈ 8.9e-5 (< 0.001), n = 7 | `pearson_r_charcount_vs_latency` 0.9814555; `pearson_p` 8.9056e-5; `n_lectures` 7 | ✅ |
| 16l | Fallback = 0, failures = 0 | `fallback_rate` 0.0; `failure_rate` 0.0; `expD...batch.json` all `status` "completed" | ✅ |
| 16m | Per-lecture latency Table IV (7 rows) | each row = `expD_latency_real_regen_batch.json` entry (see `PAPER_TRACEABILITY.md` §4 VI RQ4) | ✅ |
| 16n | Dataset: N 7; duration 1163.9/777.0/393.0/3702.3/1140.9; transcript 17109/10590/5326/59821/19006; domains OS2/Net2/DBMS2/AI1; bands 5/1/1 | `dataset_summary.json` — all fields match | ✅ |
| 16o | "9 of 9 quantitative results ... confirmed; one aggregation-convention ambiguity" | `RESULT_VALIDATION.md` | ✅ |

## E. Figures and tables

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 17 | **All figures are real and traceable.** | ✅ | Figs. 2–6 are the unmodified Phase 5.5 PNGs (`research/results/processed/phase5_5/figures/`), copied to `research/paper/figures/`. Fig. 1 = `make_architecture_figure.py` output, a schematic with **no data**. Byte-for-byte copy confirmed by regeneration script + file listing. |
| 18 | **Figure captions carry the right guardrails.** | ✅ | Fig. 3 "not an accuracy measure"; Fig. 4 "a diversity metric, not a correctness or quality rating"; Fig. 5 "correlation, not causation"; Fig. 1 "schematic of the verified implementation." |
| 19 | **All tables are real.** | ✅ | Table I ← `dataset_summary.json`; Table II ← `expA...divergence.json`; Table III ← `expB` distractor + flashcard files; Table IV ← `expD...batch.json` + summary. No table contains an unsourced cell. |
| 20 | **Figure numbering consistent across `.md` / `.tex` / `.docx` / `.pdf`.** | ✅ | 6 figures, 1–6, same order and captions in all four renderings; `build_outputs.py` and `.tex` both label architecture as Fig. 1 (column-spanning) and dataset duration as Fig. 2. |

## F. Limitations and honesty

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 21 | **Limitations disclosed.** | ✅ | §VIII lists 12 consolidated items covering the 16 in `FINAL_LIMITATIONS.md`: N = 7, domain/format skew, no human ground truth (×3), excluded baseline, model-config variability, single measurement window, no generalization, no third-party comparison, tooling limit, no multimodal/user study. |
| 22 | **No human-evaluation claim when N = 0.** | ✅ | Setup §V-B table: annotations 0, ratings 0, groundedness labels 0. Abstract: "designed and prepared but not collected." No sentence anywhere reports a human rating, MAE against human refs, or an unsupported-claim rate. |
| 23 | **No causation-from-correlation anywhere** (not just RQ4). | ✅ | RQ4 correlation explicitly hedged; §VII "very long lectures ... would be expected to incur proportionally more model time" is marked forward-looking and tied to the code's truncation constant, not asserted as measured. |
| 24 | **Abstract is IEEE-compliant.** | ✅ | Single paragraph, ~300 words, self-contained, no citations, states problem / system / evaluation / three concrete sample findings / the not-collected limitation. Followed by Index Terms / Keywords line. |
| 25 | **No agriculture / AgriSense content copied.** | ✅ | Full-text search of `.md`, `.tex`, `build_outputs.py`: no "agri", "crop", "GDD", "growing degree", "soil", "yield", "sensor" domain content. The friend's paper informed section ordering and prose register only; its PDF could not even be opened with available tooling. |
| 26 | **References verified and correctly attributed.** | ✅ | Each Related Work statement maps to a specific reference in `PAPER_TRACEABILITY.md` §4 (II). Venues (ICCV, EMNLP, COLING, AIED, UMAP, UIST, PNAS, TPAMI, ACM CSUR, ACM TACCESS, IEEE ICME, ACL BEA) recorded in `references.bib`. Preprints labelled. |
| 27 | **No over-claim of novelty.** | ✅ | §II and §VII: "the combination of artifact types is not claimed as a novelty in itself"; timestamp mechanism "positioned here as a lightweight heuristic ... not as a competitor to learned temporal grounding." Matches `CONTRIBUTIONS_AND_NOVELTY.md`. |
| 28 | **Deterministic artifacts not described as adaptive/personalised.** | ✅ | §III-D and §II: revision plan is "a fixed schedule with no learner-performance input"; adaptive scheduling ([14]) named as "future rather than implemented functionality." |

## G. Regression / process

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 29 | **No production code modified in Phase 7.** | ✅ | Phase 7 writes only under `research/paper/**` (`LECTRAAI_IEEE_RESEARCH_PAPER.{md,tex,docx,pdf}`, `references.bib`, `figures/`, `build_outputs.py`, `PAPER_TRACEABILITY.md`, this file). No change under `backend/` or `frontend/`. |
| 30 | **Backend test suite green.** | ✅ | `backend/venv/Scripts/python.exe -m pytest -q` → **92 passed**, 3 pre-existing deprecation warnings, 12.61 s (run 2026-09-06). |
| 31 | **Renderings generated from the single source, not hand-typed.** | ✅ | `.docx` and `.pdf` produced by `research/paper/build_outputs.py` (python-docx + Playwright, the same PDF engine as `backend/services/pdf.py`); `.tex` mirrors the `.md`; content parity checked against `LECTRAAI_IEEE_RESEARCH_PAPER.md`. |
| 32 | **Output files present and non-trivial.** | ✅ | `LECTRAAI_IEEE_RESEARCH_PAPER.pdf` (~566 KB, IEEE two-column, 6 figures embedded), `.docx` (~407 KB, two-column body section, tables + figures), `.md` (43 KB), `latex/*.tex` + `references.bib`. |

---

## Summary

| Category | Items | Pass | Caveat | Fail |
|---|---|---|---|---|
| A. Fabrication | 1–5 | 5 | 0 | 0 |
| B. RQ integrity | 6–10 | 5 | 0 | 0 |
| C. System description | 11–15 | 4 | 1 (item 14, disclosed model-ID discrepancy) | 0 |
| D. Numeric verification | 16a–16o | 15 | 0 | 0 |
| E. Figures & tables | 17–20 | 4 | 0 | 0 |
| F. Limitations & honesty | 21–28 | 8 | 0 | 0 |
| G. Regression / process | 29–32 | 4 | 0 | 0 |
| **Total** | **32** | **45 sub-checks pass** | **1 disclosed caveat** | **0** |

**Verdict:** The paper is consistent with the Phase 1–6 evidence record. No fabricated results,
citations, contributions, datasets, participants, baselines, or statistical tests. All four RQ
statuses are carried through unchanged (RQ1/RQ2/RQ3 inconclusive, RQ4 supported for the evaluated
sample only). The one caveat (item 14) is the model-identifier discrepancy, which the paper itself
discloses in Section V-C. No production code was changed; 92/92 backend tests pass.
