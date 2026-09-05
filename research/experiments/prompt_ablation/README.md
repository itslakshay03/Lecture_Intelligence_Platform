# Experiment C — Prompt Grounding Ablation (RQ3)

**Status: DESIGNED, NOT EXECUTED.**

## Conditions
- **Condition A (product):** `SMART_PROMPT` (`prompt_version = "SMART_PROMPT_v1"`), real, unmodified.
- **Condition B (experiment-only):** `research/baselines/unconstrained_llm/unconstrained_prompt.py` — programmatically derives the unconstrained variant by removing exactly the `<strict_negative_constraints>` block from the real `SMART_PROMPT`. Verified (pilot, no API call): `only_difference_is_constraint_block: true`.

## What a runner script must do (Phase 5)
1. For each eligible lecture, generate notes under BOTH conditions using the SAME transcript (real API cost — not yet run for either condition in this phase).
2. Record `generation_metadata` (model_name_used, prompt_version) for both — model non-determinism is an acknowledged confound (`configs/model_configuration.md`); ideally generate multiple samples per condition if time allows.
3. Blind and present both documents to reviewers per `blinding_protocol.md`.
4. Reviewers rate per `rubrics.md`'s "Notes" dimensions AND list every unsupported claim found (`unsupported_claims` field in `rating_schema.json`).
5. Compare unsupported-claim rate, factual correctness, and coverage between conditions via `evaluation/statistics/paired_analysis.py` — explicitly check for and report any coverage trade-off alongside any groundedness gain (H3, Phase 3 §5).

## Blocking items (DATA REQUIRED)
- Zero notes generated under either condition for this experiment specifically (the prompt derivation is verified; actual generation is not yet run).
- Zero human ratings collected.
