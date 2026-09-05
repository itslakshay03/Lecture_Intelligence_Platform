# Result Traceability (updated Phase 5.5)

Directory layout after Phase 5.5's migration (Phase 5 files moved unmodified, content byte-identical, into `phase5/` subfolders; all Phase 5.5-new work lives in `phase5_5/` subfolders):

```
research/results/
  raw/phase5/            <- Phase 5 raw outputs, unmodified
  raw/phase5_5/          <- (empty this phase — no new raw generation outputs beyond what's in annotations/)
  processed/phase5/      <- Phase 5 processed metrics, unmodified
  processed/phase5_5/    <- Phase 5.5 new processed metrics + figures/
  RESULT_VALIDATION.md   <- Phase 5.5 independent recalculation of every Phase 5 number
  FINAL_EVIDENCE_MATRIX.md
```

| Result | Raw file | Processed file | Metric/script | Lecture(s) | Phase |
|---|---|---|---|---|---|
| Experiment D latency (7 lectures) | `raw/phase5/expD_latency_real_regen_batch.json` | `processed/phase5/expD_latency_summary.json` | inline script (Phase 5) | CAND01-07 | 5 |
| Experiment D latency — independent recheck | same | `RESULT_VALIDATION.md` row 1-3 | inline recompute script (Phase 5.5) | CAND01-07 | 5.5 |
| Experiment D — Figure 4 (latency vs. chars) | `raw/phase5/expD_latency_real_regen_batch.json` | `processed/phase5_5/figures/fig4_latency_vs_transcript_length.png` | `evaluation/scripts/generate_figures.py::fig4_...` | CAND01-07 | 5.5 |
| Experiment D — Figure 5 (stage breakdown) | same | `processed/phase5_5/figures/fig5_latency_stage_breakdown.png` | `generate_figures.py::fig5_...` | CAND01-07 | 5.5 |
| Dataset summary stats | `dataset/manifest.csv` | `processed/phase5/dataset_summary.json` | inline script (Phase 5) | CAND01-07 | 5 |
| Dataset — Figure 1 (duration distribution) | `dataset/manifest.csv` | `processed/phase5_5/figures/fig1_dataset_duration_distribution.png` | `generate_figures.py::fig1_...` | CAND01-07 | 5.5 |
| Experiment A topic-timestamp coverage + divergence | `backend/output/*.json` (real, unmodified) | `processed/phase5/expA_lectraai_vs_naive_divergence.json` | `baselines/naive_timestamp/naive_timestamp.py` | CAND01-07 | 5 |
| Experiment A — independent recheck | same | `RESULT_VALIDATION.md` row 4-5 | inline recompute script (Phase 5.5) | CAND01-07 | 5.5 |
| Experiment A — Figure 2 (coverage by lecture) | `processed/phase5/expA_lectraai_vs_naive_divergence.json` | `processed/phase5_5/figures/fig2_topic_timestamp_coverage.png` | `generate_figures.py::fig2_...` | CAND01-07 | 5.5 |
| Experiment B distractor uniqueness | `raw/phase5/expB_3MqyDWDpZoI.json` | `processed/phase5/expB_distractor_uniqueness_3MqyDWDpZoI.json` | inline script (Phase 5) | CAND01 | 5 |
| Experiment B — independent recheck | same | `RESULT_VALIDATION.md` row 6-7 | inline recompute script (Phase 5.5) | CAND01 | 5.5 |
| Experiment B — Figure 3 (distractor uniqueness) | `processed/phase5/expB_distractor_uniqueness_3MqyDWDpZoI.json` | `processed/phase5_5/figures/fig3_distractor_uniqueness.png` | `generate_figures.py::fig3_...` | CAND01 | 5.5 |
| Experiment B flashcard verbatim-overlap (NEW, Phase 5.5) | `raw/phase5/expB_3MqyDWDpZoI.json` + `backend/output/3MqyDWDpZoI.json` | `processed/phase5_5/expB_flashcard_verbatim_overlap_3MqyDWDpZoI.json` | inline script (Phase 5.5) | CAND01 | 5.5 |
| Experiment C prompt-diff verification | `backend/prompts/smart.py` (real, unmodified) | — (Phase 4 pilot output, restated) | `baselines/unconstrained_llm/unconstrained_prompt.py::diff_summary()` | N/A | 4 |
| Experiment C real generation | `raw/phase5/expC_3MqyDWDpZoI.json` | `processed/phase5/expC_groundedness_proxy_3MqyDWDpZoI.json` (proxy, EXCLUDED from interpretation) | inline script (Phase 5) | CAND01 | 5 |
| RQ3 claim segmentation (NEW, Phase 5.5, unclassified) | `raw/phase5/expC_3MqyDWDpZoI.json` | `annotations/ratings/rq3_claim_annotation/condition_{A,B}_claims_blank.json` | inline segmentation script (Phase 5.5) | CAND01 | 5.5 |
| Human timestamp annotation packages (NEW, Phase 5.5, blank) | `backend/output/*.json` + freshly re-fetched real transcripts | `annotations/timestamps/annotation_package/*.json` | inline script (Phase 5.5) | CAND01-07 | 5.5 |

**Not traceable to any file because it does not exist (unchanged from Phase 5, reconfirmed in Phase 5.5 and Phase 6):** any human timestamp annotation, any human quality/groundedness rating, any inter-rater reliability value, any p-value/CI/effect-size for RQ1-RQ3's actual research questions.

**No orphan numbers:** every number in `PHASE_5_5_EVIDENCE_COMPLETION.md` and `FINAL_EVIDENCE_MATRIX.md` traces to a row above.

## Phase 6 additions (final RQ linkage; no historical row above was altered)

| Document | Final RQ linkage | Validation record |
|---|---|---|
| `FINAL_CLAIM_AUDIT.md` | Claims #1-3 → RQ1; #4-6 → RQ2; #7-8 → RQ3; #9-11 → RQ4; #12 → all (validation meta-claim); #13 → dataset; #14 → system/engineering | Cross-checked against every row in this table |
| `FINAL_RQ_STATUS.md` | One section per RQ1-4, each citing the exact raw/processed files above | Re-derives nothing new; locks Phase 5.5's statuses after independent re-audit |
| `CONTRIBUTIONS_AND_NOVELTY.md` | Items A/C → RQ1/RQ3 respectively; Item B → RQ2 + RQ4 (cost/quality framing); Items D/E/F → engineering/system, not RQ-linked | References `FINAL_CLAIM_AUDIT.md` claims #4, #5, #9, #11, #14 |
| `PAPER_CLAIM_BOUNDARY.md` | Every claim tagged to its RQ per `FINAL_RQ_STATUS.md` | Direct restatement, no new computation |
| `FINAL_LIMITATIONS.md` | Items 1-3 → dataset (all RQs); 4-6 → RQ1/RQ2/RQ3 respectively; 7-9 → RQ2/RQ3; 8/14 → RQ4; 11-12 → excluded-baseline provenance | Traces to Phase 5/5.5 exclusion records, unchanged |
| `PHASE_6_PAPER_READINESS.md` | Whole-study verdict, all RQs | Synthesizes the above, no new data |

**No new raw or processed result files were created in Phase 6** — this phase audited and re-organized existing evidence only, per its explicit non-experimental scope.
