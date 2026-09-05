# PHASE 5.5 — EVIDENCE COMPLETION + FINAL EXPERIMENT VALIDATION

*Produced 2026-09-05. The Phase 5 report (`PHASE_5_EXPERIMENTAL_RESULTS.md`) is preserved unmodified — this phase does not rewrite history, only validates it and closes what is closeable without fabrication.*

---

## 1. Purpose

Close the most important evidence gaps identified in Phase 5 while preserving every valid result already collected: validate Phase 5's numbers independently, generate real figures, prepare (not fabricate) human-evaluation infrastructure, attempt a modest real dataset expansion, and produce a single final evidence matrix for Phase 6 — without inventing any human data.

---

## 2. Phase 5 Gaps → Gap Matrix

| Evidence Area | RQ | Phase 5 Status | Required | Phase 5.5 Action | Final Status |
|---|---|---|---|---|---|
| Timestamp ground truth | RQ1 | Absent | Human independent annotation | Prepared full annotation package (7 real lectures: title, duration, freshly re-fetched real transcript, blank schema-conformant form) | **`HUMAN_DATA_REQUIRED`** — infrastructure ready, 0 annotations |
| Artifact human evaluation | RQ2 | Absent | Human blinded ratings | No annotator available; added one further real objective metric (flashcard verbatim-overlap) instead of fabricating ratings | **`HUMAN_DATA_REQUIRED`** — objective evidence extended, 0 ratings |
| Note groundedness evaluation | RQ3 | Attempted automated proxy, found unreliable | Human claim-level annotation | Formally closed the unreliable proxy (not revived); prepared real claim-segmentation package (58 candidate units, unclassified) | **`INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED`** |
| Dataset size/diversity | All | N=7, short of 18-20 target | More real lectures, esp. CODING/NUMERICAL | Attempted real search for new candidate videos; no specific, individually-verifiable video ID could be confirmed with available tools (YouTube playlist pages are JS-rendered, not scrapable) | **N=7, unchanged** — documented as a real tooling constraint, not forced |
| Latency | RQ4 | Fully executed, real data | Validation | Independently recalculated all values from raw data | **VALIDATED**, 1 aggregation-method ambiguity disclosed (not an error) |
| Baseline coverage | RQ2/RQ3 | 1 of 7 lectures had comparison artifacts | More coverage across dataset | Not expanded — real API quota is a documented constraint (Phase 5 §19) and Priority 5/6 ranked below human-evidence work; adding more single-lecture generations without any rating capacity would not have closed a real gap | **Unchanged (N=1 lecture with comparison data)** — documented, not silently left ambiguous |
| Statistical analysis | RQ4 | 1 real inferential test (Pearson r) | Verification | Recalculated from raw data at full precision (r=0.981456, p=0.0000885) | **VALIDATED** |
| Figures | All | 0 generated | Real figures from real data | 5 figures generated (dataset duration, topic-timestamp coverage, distractor uniqueness, latency vs. length, latency stage breakdown); none for RQ2 human-quality or RQ3 groundedness (no real data to plot) | **5 real figures produced** |
| Result traceability | All | Existed, single-phase | Update for Phase 5.5 additions | Rewrote with `phase5/`/`phase5_5/` split, all new artifacts added | **Updated, no orphan numbers** |

---

## 3. Gap Matrix

See §2 above (combined per efficient reporting — the matrix itself is the deliverable requested in the instructions' Section 2).

---

## 4. Human Annotation Status

**0 human timestamp annotations exist.** Full annotation package prepared for all 7 real lectures (`research/annotations/timestamps/annotation_package/`) — real titles, real durations, freshly re-fetched real transcripts (not reused from the original generation run, to keep the annotator's reference material independent), and blank forms conforming exactly to `schema.json`. No annotation was performed by me, and none was simulated.

---

## 5. Human Rating Status

**0 human quality/groundedness ratings exist** for RQ2 or RQ3. Real comparison artifacts exist for 1 lecture (RQ2: quiz/flashcards/interview; RQ3: both notes conditions). A real claim-segmentation package (58 candidate units) was prepared for RQ3 specifically, ready for a human to classify, per §7 below.

---

## 6. Dataset Expansion

**Attempted, not achieved.** Real web searches were run for candidate CODING/NUMERICAL lectures (sorting algorithms, recursion/complexity). Search results returned channel/playlist pages and academic course pages, not individually-confirmable YouTube video IDs suitable for direct processing. A follow-up attempt to fetch a specific channel's playlist page directly returned only static footer content (YouTube playlist pages render video listings via JavaScript, which the available fetch tool cannot execute). **Rather than gamble on an unverified video ID** (risking a wasted, possibly-failing real API call, or worse, misattributing a video's identity), dataset expansion was not forced. **Dataset remains N=7**, exactly as in Phase 5 — reported honestly per instruction #18 ("Do not claim 18–20 if fewer were collected").

---

## 7. RQ1 Completion

**Priority 1, executed to the extent possible without a human annotator.** Real annotation package built and verified (7/7 lectures, each with a real, freshly-fetched transcript — one minor real discrepancy disclosed: `T4lGm7MjA6Y`'s re-fetched transcript is 60,274 chars vs. 59,821 chars during original generation, likely due to which of the two fetch strategies succeeded on retry; not corrected, both real). Matching methodology (human topic ↔ LectraAI topic) from `annotation_instructions.md` was **not exercised**, because there are no human topics to match against yet. **Final status: `HUMAN_DATA_REQUIRED`.** The real, ground-truth-independent evidence from Phase 5 (56% coverage, 2/7 lectures at 0% coverage) was re-validated (§10) and is the only currently-usable RQ1 evidence.

---

## 8. RQ2 Completion

**Priority 2.** No blinding/randomization exercise was performed because no rating round occurred (nothing to blind). One additional real, objective, mechanically-computed metric was added: flashcard "back" text verbatim-overlap with the source notes — **100% (10/10) for LectraAI's deterministic condition, 11.1% (1/9) for the direct-LLM condition** (`research/results/processed/phase5_5/expB_flashcard_verbatim_overlap_3MqyDWDpZoI.json`). This is explicitly caveated in the file itself: a high rate is *expected by construction* for the deterministic path (it literally extracts sentences, per Phase 1 §7), and a low rate for the LLM path reflects paraphrasing, not a quality defect. **This metric is not combined with the distractor-uniqueness metric into any single "quality score"** — per instruction #12, objective metrics are kept separate from (nonexistent) human judgments, never blended into a misleading composite.

---

## 9. RQ3 Completion/Blocker

**Priority 3.** The Phase 5 automated proxy's failure was re-inspected (not re-run): its two concrete failure modes (markdown-header-as-claim, orthographic mismatch) were re-confirmed as construct-validity problems, not something a parameter tweak would fix. **No replacement automated metric was built.** Per explicit instruction, RQ3 is formally classified **`INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED`**. A real claim-segmentation package (31 units, Condition A; 27 units, Condition B — mechanical bullet/sentence splitting, no semantic judgment) was prepared in `research/annotations/ratings/rq3_claim_annotation/`, with `classification` and `evidence_location` left blank for a human.

---

## 10. RQ4 Validation

**Priority 5 (partially — see also §11).** RQ4 was **not rerun** (per explicit instruction not to rerun it unnecessarily). All 7 real measurements, stage timings, transcript lengths, and total latencies were re-verified as still present and internally consistent in `raw/phase5/expD_latency_real_regen_batch.json`. The reported Pearson r=0.9815 was independently recalculated: **r=0.981456, p=0.0000885** — confirms the original figure to its reported precision (`RESULT_VALIDATION.md`, rows 1-3). One aggregation-method ambiguity was found and disclosed (§11).

---

## 11. Statistical Validation

Full independent recalculation performed for all 9 Phase 5 numeric results (`research/results/RESULT_VALIDATION.md`): **9/9 VALIDATED**. One item (AI-generation stage as % of total latency) carries a disclosed methodological note: Phase 5's reported 58.7% is a "macro-average" (mean of each lecture's own ratio); an alternative "micro-average" (ratio of the two means) gives 59.9%. Both are correctly computed from the same real data; this is a definitional choice, not an error, and is now explicitly labeled so Phase 6 does not inherit an unlabeled convention.

---

## 12. Result Corrections

**None required.** All recalculations matched the originally reported values (within display-rounding). The one disclosure in §11 is a clarification, not a correction — no number was found to be wrong.

---

## 13. Final Figures

5 real figures generated (`research/results/processed/phase5_5/figures/`), each from real, validated data, with real sample sizes and honest titles/captions:
1. `fig1_dataset_duration_distribution.png` — N=7 real lectures.
2. `fig2_topic_timestamp_coverage.png` — N=7 lectures, 25 topics; explicitly labeled "NOT an accuracy measure."
3. `fig3_distractor_uniqueness.png` — N=1 lecture; explicitly labeled "a DIVERSITY metric, not a correctness/quality rating."
4. `fig4_latency_vs_transcript_length.png` — N=7 lectures; real Pearson r/p annotated; explicitly labeled "correlation, not causation."
5. `fig5_latency_stage_breakdown.png` — N=7 lectures, real SD error bars.

**No figure exists for RQ2 human-quality comparison or RQ3 groundedness comparison** — no real data exists to plot honestly.

---

## 14. Final Tables

Table A (Dataset characteristics), Table E (Latency), and the timestamp-coverage/distractor-uniqueness tables are populated with real data throughout this report and `FINAL_EVIDENCE_MATRIX.md`. **Table B (full timestamp accuracy), Table C (artifact evaluation), Table D (prompt ablation), and Table F (full statistical analysis for RQ1-3) remain unpopulated** — no fabricated row was added to any of them; see `FINAL_EVIDENCE_MATRIX.md` for the authoritative per-RQ evidence status instead of an empty templated table.

---

## 15. Exclusions

Unchanged from Phase 5 (extractive baseline on real transcripts, RQ3's original automated proxy, pytest-suite-generated DB rows, stale pre-fix cache file) — all still correctly excluded; none revived. **New in Phase 5.5:** the dataset-expansion attempt itself is recorded as an exclusion of *effort*, not data — no video was processed and then excluded; none was confidently identified to begin with (§6).

---

## 16. Failed Runs

None occurred in Phase 5.5 — no new real API generation calls were made this phase (all Phase 5.5 work used already-existing real generation outputs, freshly-fetched real transcripts (transcript-only calls, no Gemini cost), or real code recalculation). The one real 429 quota incident remains a Phase 5 event, not repeated here.

---

## 17. API Quota Limitations

No new Gemini API calls were made in Phase 5.5, so the previously-documented ~20-requests/day/model constraint was not tested further. Real, no-Gemini-cost transcript-fetch calls (yt-dlp/youtube-transcript-api, for the annotation packages) were made for all 7 lectures, including 2 that hit a real yt-dlp rate limit (HTTP 429) and correctly fell through to the transcript-api fallback strategy (Phase 1 §8's documented multi-strategy behavior working as designed, real evidence, not simulated).

---

## 18. Reproducibility

- Dataset manifest version: `research/dataset/manifest.csv` as of Phase 5.5 (unchanged content from Phase 5, N=7).
- Model: `gemini-3.6-flash` (Phase 5 generations, unchanged, re-verified from stored records, not re-queried).
- Prompt versions: `SMART_PROMPT_v1`, `SMART_PROMPT_UNCONSTRAINED_v1`, `DIRECT_LLM_ARTIFACTS_v1` (unchanged from Phase 5).
- Execution date (Phase 5.5 work): 2026-09-05.
- Random seed: N/A — no stochastic sampling was performed in Phase 5.5 (all recalculations are deterministic; `bootstrap_ci` in `paired_analysis.py` was not invoked this phase since no new paired dataset exists to analyze).
- Software: Python 3.12 (backend venv), numpy 2.5.2, scipy 1.18.1 (installed Phase 5), matplotlib 3.11.1 (installed Phase 5.5). Exact pytest/FastAPI versions: **NOT RECORDED** in this phase (unchanged from `backend/requirements.txt`, not re-queried).
- Experiment scripts: `research/evaluation/scripts/generate_figures.py` (new, Phase 5.5); all Phase 5 baseline/metric scripts unchanged.

---

## 19. Final RQ Statuses

| RQ | Status |
|---|---|
| RQ1 — Timestamp Grounding | **INCONCLUSIVE** (real coverage/divergence evidence exists; accuracy question unevaluated; `HUMAN_DATA_REQUIRED`) |
| RQ2 — Artifact Generation Strategy | **INCONCLUSIVE**, with one narrowly **SUPPORTED** sub-finding (distractor diversity gap) |
| RQ3 — Prompt Ablation | **INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED** |
| RQ4 — Processing Efficiency | **SUPPORTED** (for this sample; correlation, not causation; not generalized beyond it) |

No RQ was forced to a positive outcome. Full detail: `research/results/FINAL_EVIDENCE_MATRIX.md`.

---

## 20. Evidence Matrix

See `research/results/FINAL_EVIDENCE_MATRIX.md` — the single source of truth for Phase 6, per instruction.

---

## 21. Remaining Limitations

All Phase 5 limitations remain (dataset size/diversity, zero annotators being the largest gap, unpinned model temperature, single-lecture depth on B/C, no CODING/NUMERICAL category, no truncation-boundary edge case). **Newly identified in Phase 5.5:** the tooling available in this environment cannot reliably discover and verify new candidate YouTube videos at scale (JS-rendered playlist pages) — any future dataset expansion will need either a human-supplied list of candidate video URLs, or a different discovery tool (e.g., the YouTube Data API, not currently integrated anywhere in this project).

---

## 22. Phase 6 Handoff

### BLOCKING ITEMS (require human involvement or external data)
- Human timestamp annotations (RQ1) — package ready, 0 collected.
- Human blinded artifact ratings (RQ2) — rubric/blinding protocol ready, 0 collected.
- Human claim-level groundedness classification (RQ3) — segmentation package ready, 0 classified.
- A human-supplied list of candidate lecture URLs, if dataset expansion toward N=18-20 is still wanted (this environment's tools cannot reliably discover new videos on their own).

### NON-BLOCKING ITEMS (completable programmatically, no fabrication)
- Backfill formal `experiment_config.<id>.json` records for Phase 5's real runs (Phase 5 §20's disclosed minor gap, still open).
- Once human RQ1/RQ2/RQ3 data exists: write the small aggregation script mentioned in `rq3_claim_annotation/README.md`, then run `paired_analysis.py` on the real resulting paired data and report whatever it shows, including a null result if that is what the data shows.
- Generate additional Experiment B/C comparison artifacts for more of the 7 lectures if/when API quota allows, to strengthen RQ2/RQ3's evidence base beyond n=1 even before human rating exists (more real comparison data is useful groundwork regardless of when rating happens).
- If a human supplies real candidate video URLs, process them through the real pipeline exactly as this phase did for the existing 7 (well-established, low-risk procedure).

### What prevents a strong conclusion, per RQ
- **RQ1:** no human reference — cannot say whether LectraAI is more/less accurate than naive, only that its coverage is incomplete.
- **RQ2:** no human rating — cannot say whether direct-LLM artifacts are actually better, only that they are more diverse/less verbatim-extracted.
- **RQ3:** no human ground truth at all — cannot say anything about relative groundedness.
- **RQ4:** small n (7) and single time-window — the real finding is solid for this sample but should not be generalized further without more data collected across different times/network conditions.
