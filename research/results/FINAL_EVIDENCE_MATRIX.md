# Final Evidence Matrix (Phase 5.5) — Single Source of Truth for Phase 6

| RQ | Evidence | Dataset | Metric | Statistical Evidence | Status | Limitation |
|---|---|---|---|---|---|---|
| RQ1 — Timestamp Grounding | Real topic-timestamp coverage (25 topics/7 lectures, 56.0%); real divergence-from-naive-baseline (n=14 topic comparisons, mean 147.26s) | N=7 real lectures, 0 human annotations | Coverage %, mean/median/SD divergence (validated, `RESULT_VALIDATION.md`) | None (no ground truth to test against) | **INCONCLUSIVE** | No human reference exists; coverage gap is real but accuracy is unevaluated; annotation package is ready (`annotations/timestamps/annotation_package/`) — `HUMAN_DATA_REQUIRED` |
| RQ2 — Artifact Generation Strategy | Real direct-LLM quiz/flashcards/interview generated (1 lecture); distractor uniqueness (44.4% vs 100.0%, validated); flashcard verbatim-overlap (100% vs 11.1%, new Phase 5.5) | N=1 lecture with comparison data; 0 human ratings | Set-cardinality uniqueness, exact-substring overlap — both objective/mechanical, not quality | None (n=1, not powered) | **INCONCLUSIVE**, with one narrowly **SUPPORTED** sub-finding: "LectraAI's deterministic quiz distractors are less diverse than a direct-LLM alternative on this lecture" | Only 1 of 7 lectures has comparison data; zero human judgment of correctness/relevance/plausibility/coverage exists; objective metrics measure diversity/extraction-behavior, not quality |
| RQ3 — Prompt Ablation | Real notes generated under both conditions (1 lecture); automated proxy attempted and rejected as unreliable; real claim-segmentation package prepared (58 candidate claim units, unclassified) | N=1 lecture; 0 human ratings; 0 claim classifications | None reliable (proxy explicitly excluded) | None | **INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED** | This RQ has the least usable evidence of the four; claim-annotation infrastructure is ready (`annotations/ratings/rq3_claim_annotation/`) — `HUMAN_DATA_REQUIRED` |
| RQ4 — Processing Efficiency | Real stage-level and total latency, all 7 lectures, 0 failures, 0 fallbacks; real Pearson correlation | N=7 real lectures | Mean/median/SD latency per stage; Pearson r (validated, `RESULT_VALIDATION.md`) | **Real, significant**: r=0.9815, p=0.0000885 (recalculated to higher precision in Phase 5.5), n=7 | **SUPPORTED** (for this specific 7-lecture sample and execution window — correlation, not causation; not claimed to generalize) | n=7 is small; single time-window; no comparison baseline (by design, RQ4 is observational) |

## What changed from Phase 5 to Phase 5.5
- All 9 previously-reported quantitative results **VALIDATED** by independent recalculation (1 aggregation-method ambiguity disclosed and resolved, not an error — see `RESULT_VALIDATION.md`).
- 5 real figures generated from real, validated data (none for RQ2 human-quality or RQ3 groundedness, since no real data exists for those).
- RQ2 gained one additional real, objective, honestly-caveated metric (flashcard verbatim-overlap).
- RQ3 formally closed as `INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED` rather than left ambiguous; real claim-segmentation infrastructure prepared for Phase 6.
- RQ1's human-annotation infrastructure fully prepared (all 7 lectures) and ready for immediate use once a human annotator is available.
- Dataset expansion was attempted (real search) but did not yield a specific, individually-verifiable new video within this phase's tool constraints — dataset remains N=7, honestly reported rather than forced to a larger number.

## What did NOT change
- Zero human annotations. Zero human ratings. RQ1-RQ3 remain blocked on human involvement, not on missing infrastructure.

---

## Phase 6 Addendum — Extended Matrix (paper-authoring reference)

*The table above (Phase 5.5) is preserved unmodified. This section adds the richer column set requested for Phase 6, re-verified against `FINAL_CLAIM_AUDIT.md` and `FINAL_RQ_STATUS.md` — no historical value changed, only reorganized/extended.*

| RQ | Hypothesis | Experiment | Data | Metric | Result | Statistical Evidence | Status | Limitation | Paper-Safe Claim |
|---|---|---|---|---|---|---|---|---|---|
| RQ1 | H1: LectraAI method beats naive baseline vs. human reference | Experiment A | 7 lectures, 25 topics, 0 human annotations | Coverage %, divergence-from-naive | 56.0% coverage (14/25); mean divergence 147.3s (n=14) | None (no ground truth) | INCONCLUSIVE | No human reference exists | "LectraAI's method produced a timestamp for 56.0% of topics; two of seven lectures received none. Human-grounded accuracy evaluation was designed but not completed." |
| RQ2 | H2: Direct-LLM distractors more plausible; flashcards differ mainly in coverage | Experiment B | 1 of 7 lectures, 0 human ratings | Distractor uniqueness, flashcard verbatim-overlap | 44.4% vs 100.0% unique; 100% vs 11.1% verbatim | None (n=1) | INCONCLUSIVE, 1 narrow SUPPORTED sub-finding | Only 1 lecture; no human quality judgment | "On the one lecture compared, deterministic distractors were markedly less diverse than a direct-LLM alternative from the same notes." |
| RQ3 | H3: Constrained prompt reduces unsupported claims, possibly with coverage trade-off | Experiment C | 1 of 7 lectures, automated proxy rejected, 0 human classifications | None reliable | No usable result | None | INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED | Automated proxy found invalid; no human evaluation performed | "The effect of grounding constraints on unsupported-claim rate remains unevaluated; an attempted automated proxy was found unreliable and excluded." |
| RQ4 | None (descriptive by design) | Experiment D | 7 of 7 lectures, real, complete | Stage/total latency, Pearson r | Mean latency 39.2s; AI-gen = 58.7% of total; r=0.981, p=0.0000885 | Real, significant (n=7) | SUPPORTED (evaluated sample only) | n=7; single time-window; no causal design | "In the evaluated sample, transcript length was strongly correlated with total latency (r=0.98, p<0.001); AI generation dominated processing time." |
