# RQ3 Claim-Level Annotation Package — `INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED`

## What was inspected
Phase 5 attempted an automated groundedness proxy (exact-substring matching of bolded terms against the transcript) and found it unreliable on manual inspection: it miscounted markdown section-header labels ("Primary Objective:", "Execution Style") as factual claims, and produced false negatives from simple orthographic variants (e.g., "Multi-programming" in the notes vs. "multi-programmed" in the transcript) that a substring match cannot bridge.

## Why no replacement automated metric was built
Per explicit instruction, an unreliable proxy must not be revived, and a new automated substitute must not be invented in its place merely to produce a number. Semantic judgment of whether a claim is "supported," "partially supported," "unsupported," or "factually incorrect" against a transcript requires exactly the kind of contextual reading an LLM-as-judge would need to perform — which Phase 3/4 did not approve as a substitute for human ground truth on this question.

## What was prepared instead
`condition_A_claims_blank.json` (31 units) and `condition_B_claims_blank.json` (27 units): the two real notes documents from Experiment C (`results/raw/phase5/expC_3MqyDWDpZoI.json`), mechanically segmented into candidate claim units (bullet points and sentences — a purely structural, deterministic split, not a semantic judgment of what counts as a "claim"). Each record has `classification` and `evidence_location` left as `FILL_IN` for a real human annotator, per the schema in §15 of the Phase 5.5 instructions (lecture_id, claim_id, condition, claim, evidence_location, classification).

## Current status
**RQ3 is classified `INCONCLUSIVE — HUMAN GROUND TRUTH REQUIRED`.** The real generated outputs (both conditions) are preserved unmodified in `results/raw/phase5/expC_3MqyDWDpZoI.json`. What is needed for Phase 6: a human annotator works through both `*_claims_blank.json` files, classifying each unit against the real transcript (`results/raw/phase5/real_transcript_3MqyDWDpZoI.txt`), after which `research/evaluation/metrics/` should gain a small aggregation function (not yet written) to compute per-condition unsupported-claim rate from the completed annotations.
