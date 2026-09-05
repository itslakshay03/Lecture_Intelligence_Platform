# Final RQ Evidence Lock — Phase 6

This document is the authoritative, locked status of RQ1–RQ4. Phase 7 (paper drafting) must not describe any RQ's evidence status differently from what is stated here without a new phase of actual evidence collection.

---

## RQ1 — Timestamp Grounding

1. **Exact RQ:** How accurately does LectraAI's keyword-overlap timestamp-grounding method associate generated topics with their true lecture segments, compared with human-annotated reference timestamps and a naive equal-interval baseline?
2. **Original hypothesis (H1):** LectraAI's method will achieve lower MAE/median error and higher %-within-threshold than naive equal-interval assignment, vs. human reference.
3. **Experiment designed:** Experiment A — three-way comparison (LectraAI / naive / human reference), with a tolerance-window annotation protocol and strict/lenient scoring for multi-occurrence topics (Phase 3/4).
4. **Data actually available:** Real LectraAI output for 7 lectures/25 topics (`backend/output/*.json`); real naive-baseline output for the same; **zero** human-annotated reference timestamps. A complete, ready-to-use annotation package for all 7 lectures exists (`annotations/timestamps/annotation_package/`).
5. **Metrics actually computed:** Topic-timestamp coverage rate (56.0%, real); divergence-from-naive-baseline (mean 147.26s, n=14, real). **MAE, median AE, and %-within-±5/10/30s against ground truth were NOT computed — there is no ground truth to compute them against.**
6. **Statistical tests actually performed:** None (no ground truth to test against; the two real automated methods were only descriptively compared).
7. **Result:** LectraAI's real method produces a topic-level timestamp for a majority (56%) but not all real topics, with two of seven lectures receiving none at all. When it does produce a timestamp, it differs substantially (mean ~2.5 min) from naive spacing.
8. **Current evidence status: `INCONCLUSIVE — HUMAN_DATA_REQUIRED`.**
9. **What prevents a stronger conclusion:** No independent human reference timestamp exists for any topic in the dataset. The coverage/divergence findings are real but answer a different, narrower question ("does it produce output, and how different is that output from a naive rule") than the RQ itself asks ("is that output accurate").
10. **Exact wording allowed in the paper:** "LectraAI's timestamp-grounding method produced a topic-level timestamp for 56.0% of topics in the evaluated sample (14/25 topics, 7 lectures), with two lectures receiving no topic timestamps at all. A human-grounded accuracy evaluation was designed (annotation protocol and materials prepared for all seven lectures) but has not yet been completed; coverage is reported here as an implementation/output characteristic, not a validated accuracy measure."
11. **Exact wording that MUST NOT be used:** "LectraAI accurately grounds timestamps." "56% accuracy." "Timestamp MAE of X seconds" (no MAE against ground truth was ever computed). "LectraAI outperforms/underperforms the naive baseline" (no ground truth to judge either against). "Solves timestamp grounding."

---

## RQ2 — Artifact Generation Strategy

1. **Exact RQ:** How does the quality of LectraAI's deterministic downstream study artifacts (quiz, flashcards, interview questions) compare with directly LLM-generated equivalents produced from the same notes?
2. **Original hypothesis (H2):** Direct-LLM quiz will show more plausible, content-specific distractors than LectraAI's current generic hardcoded distractors; flashcards/interview will differ more in coverage/relevance than in correctness.
3. **Experiment designed:** Experiment B — blinded human rating (correctness, relevance, coverage, distractor plausibility, difficulty) of deterministic vs. direct-LLM artifacts from the same source notes.
4. **Data actually available:** Real deterministic artifacts (product, unmodified) and real direct-LLM-generated artifacts (experiment-only, real Gemini calls) for **1 of 7** lectures (`results/raw/phase5/expB_3MqyDWDpZoI.json`). **Zero** human ratings. Rubric, blinding protocol, and rating schema exist and are unused.
5. **Metrics actually computed:** Distractor uniqueness (objective, real: 44.4% vs. 100.0%); flashcard verbatim-overlap-with-notes (objective, real: 100% vs. 11.1%). **Correctness, relevance, coverage, distractor plausibility (as a human-judged quality, not the mechanical uniqueness proxy), and difficulty appropriateness were NOT measured.**
6. **Statistical tests actually performed:** None (n=1 lecture; the module's own guard (`MIN_N_FOR_INFERENTIAL_TEST = 5`) would correctly refuse inference at this sample size, and was not overridden).
7. **Result:** On the one lecture evaluated, the deterministic condition's quiz distractors are markedly less diverse (verbatim template reuse, quantified) than the direct-LLM condition's; flashcards are, by construction, near-100%-verbatim extractions versus mostly-paraphrased LLM output.
8. **Current evidence status: `INCONCLUSIVE`, with one narrow `SUPPORTED` sub-finding restricted to distractor/flashcard diversity on a single lecture.**
9. **What prevents a stronger conclusion:** Zero human judgment of correctness, relevance, usefulness, or difficulty exists for any artifact type; only 1 of 7 lectures has any comparison data at all; the two real objective metrics measure structural diversity/extraction-behavior, not quality.
10. **Exact wording allowed in the paper:** "On the single lecture for which a direct-LLM comparison was generated, LectraAI's deterministic quiz distractors showed markedly lower lexical diversity (44.4% unique, 8/18) than a direct-LLM alternative (100.0% unique, 27/27) drawn from the same source notes; flashcard answers showed a corresponding pattern consistent with extraction (100% verbatim overlap with source notes) versus paraphrase (11.1%). Human evaluation of correctness, relevance, and usefulness for either condition was designed but not collected."
11. **Exact wording that MUST NOT be used:** "The quiz generator is poor." "LectraAI's artifacts are lower quality." "Direct-LLM artifacts are better/more useful/more correct." Any claim generalized beyond the single evaluated lecture.

---

## RQ3 — Grounding / Anti-Hallucination Prompt Ablation

1. **Exact RQ:** Do LectraAI's explicit transcript-grounding and anti-hallucination prompt constraints reduce unsupported/ungrounded claims in generated notes compared with an otherwise-equivalent unconstrained prompt?
2. **Original hypothesis (H3):** The constrained prompt will produce a lower unsupported-claim rate, possibly with a coverage trade-off.
3. **Experiment designed:** Experiment C — generate notes under both conditions from the identical transcript/model, then have a human classify claims as supported/partially supported/unsupported/factually incorrect against the transcript.
4. **Data actually available:** Real notes generated under both conditions for **1 of 7** lectures (`results/raw/phase5/expC_3MqyDWDpZoI.json`), with the two prompts verified to differ only in the intended constraint block. A real, mechanical claim-segmentation (58 candidate units across both conditions) exists, entirely unclassified. **Zero** human claim classifications.
5. **Metrics actually computed:** One automated groundedness proxy was attempted (exact-substring presence of bolded terms in the transcript) and found unreliable on manual inspection (false negatives from markdown-header mislabeling and orthographic mismatches) — **excluded from evidence, not used to support any conclusion.**
6. **Statistical tests actually performed:** None.
7. **Result:** No usable result exists toward the actual research question.
8. **Current evidence status: `INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED`.**
9. **What prevents a stronger conclusion:** This RQ has the least usable evidence of the four. No reliable metric — automated or human — has been applied to either condition's output.
10. **Exact wording allowed in the paper:** "The effect of explicit grounding constraints on unsupported-claim rate was investigated by generating notes under both a constrained and an unconstrained prompt from the same transcript (verified to differ only in the constraint block). An automated groundedness proxy was attempted and found methodologically unreliable (misclassifying structural markdown headers as factual claims, and missing orthographic variants); it was excluded rather than used as evidence. Human claim-level evaluation was designed and partially prepared (candidate claim units segmented) but not collected; this research question remains unevaluated."
11. **Exact wording that MUST NOT be used:** Any hallucination-rate number. "Reduces hallucination." "Improves groundedness." "The constrained prompt is more/less grounded." Any reuse, in any form, of the rejected proxy's 21.7%/35.3% figures as evidence.

---

## RQ4 — Processing Efficiency

1. **Exact RQ:** How does LectraAI's end-to-end processing latency vary with lecture duration, and which processing stage contributes most to total latency?
2. **Hypothesis:** None — Phase 3/4 deliberately scoped this as descriptive/observational, since no baseline exists for "correct" latency.
3. **Experiment designed:** Experiment D — measure stage-level and total latency across real lectures via the Phase 4 instrumentation; relate latency to transcript length/duration descriptively.
4. **Data actually available:** Real stage-level and total latency for all **7 of 7** lectures (`results/raw/phase5/expD_latency_real_regen_batch.json`), 0 failures, 0 offline-fallback triggers. Independently recalculated in both Phase 5.5 and this phase.
5. **Metrics actually computed:** Mean/median/SD of total and per-stage latency; AI-generation share of total (both macro- and micro-average, disclosed); fallback rate (0%); failure rate (0%).
6. **Statistical tests actually performed:** Pearson correlation between transcript character count and total latency — **real, re-verified in this phase: r=0.981456, p=0.0000885, n=7.**
7. **Result:** AI generation dominates total latency (mean 58.7% per lecture); total latency is strongly, significantly correlated with transcript length in this sample.
8. **Current evidence status: `SUPPORTED` for the evaluated sample — correlation explicitly distinguished from causation, and not generalized beyond this sample/time-window.**
9. **What prevents a stronger conclusion:** n=7 is small; data reflects one execution session/network condition; no comparison baseline exists (by design — RQ4 has no "better/worse" reference, only description).
10. **Exact wording allowed in the paper:** "In the evaluated sample of seven real lectures, transcript length showed a strong, statistically significant positive association with total processing latency (Pearson r=0.98, p<0.001, n=7). The single Gemini generation call accounted for a mean of 58.7% of total latency per lecture, the dominant stage in every case observed. All seven evaluated lectures completed successfully with no fallback-generator invocations."
11. **Exact wording that MUST NOT be used:** "Transcript length causes higher latency." "Latency always scales linearly with transcript length." "This holds across all lecture types/durations" (only 3 duration bands, 5/7 Short, were represented). Any claim implying network/API latency is a fixed, reproducible property of the system rather than a measurement taken in one specific window.

---

## Summary Table

| RQ | Status |
|---|---|
| RQ1 | INCONCLUSIVE — HUMAN_DATA_REQUIRED |
| RQ2 | INCONCLUSIVE, with one narrow SUPPORTED sub-finding (distractor/flashcard diversity, n=1 lecture) |
| RQ3 | INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED |
| RQ4 | SUPPORTED (evaluated sample only; correlation, not causation) |

No status was upgraded from its Phase 5.5 value. All four are reconfirmed by this phase's independent audit.
