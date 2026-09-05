# Contributions and Novelty Audit — Phase 6

Re-derived from Phase 2's literature/gap analysis and Phase 3's research-problem formulation, cross-checked against what Phases 5/5.5 actually produced as evidence. Classification categories: **RESEARCH CONTRIBUTION**, **SYSTEM CONTRIBUTION**, **ENGINEERING CONTRIBUTION**, **FUTURE WORK**, **NOT DEFENSIBLE AS NOVELTY**.

---

### A. Grounded timestamp alignment (keyword-overlap, transcript-cue-based)
**Classification: FUTURE WORK** (currently) — bordering **RESEARCH CONTRIBUTION** *if and only if* human-grounded accuracy evidence is later collected.
Phase 2 established that learned, multimodal temporal-grounding methods are a mature, separate research area (Zhang et al. 2023; Liu et al. 2023) that LectraAI's simple text-only heuristic does not compete with directly — a *lighter-weight* method for a *narrower* problem is a plausible angle, but Phase 5 could only measure the method's real coverage rate (56%), not its accuracy, since no ground truth exists. **A contribution here requires the missing human evaluation; it cannot be claimed today.**

### B. Single AI call followed by deterministic multi-artifact transformation
**Classification: SYSTEM CONTRIBUTION**, bordering **RESEARCH CONTRIBUTION** *if* the quality/cost trade-off is evaluated with real human data.
Phase 2 found no directly comparable prior work evaluating exactly this architectural pattern (one generative call, then rule-based derivation of several further artifacts) as its own object of study. This is a genuine, inspectable design choice, real and demonstrable (Phase 1, re-confirmed live in Phases 5/5.5: every real generation this study ran used `generation_method: gemini` for notes and confirmed-deterministic derivation for the rest). However, **combination alone is not evidence of value** — Phase 5's one real objective comparison (distractor/flashcard diversity) suggests a real cost (lower diversity in this specific artifact), not yet weighed against any measured benefit (speed/cost savings were measured — Phase 5.5 confirmed the transformation stage takes ~0.05s vs. ~23s for the one LLM call — but "cheaper" is not itself a research claim without a quality trade-off comparison, which remains incomplete).

### C. Explicit anti-hallucination / grounding constraints in a single-call prompt
**Classification: FUTURE WORK** (currently) — bordering **RESEARCH CONTRIBUTION** *if* human claim-level evidence is later collected.
Phase 2 found the hallucination-mitigation literature dominated by RAG and fine-tuning, with prompt-only constraints comparatively under-studied — a real, disclosed gap. Phase 5/5.5 verified the two prompt conditions differ *only* in the intended block (a real, useful piece of experiment infrastructure) but collected **zero** evidence of the constraints' actual effect, after the attempted automated proxy was found unreliable and formally excluded. **No contribution can be claimed here until human evaluation exists.**

### D. Deterministic artifact generation (quiz/flashcards/interview/revision from one document)
**Classification: ENGINEERING CONTRIBUTION** / experimental factor, **NOT DEFENSIBLE AS NOVELTY** by itself.
This is a real, working, regex/template-based mechanism (Phase 1 §7), and Phase 5 produced the first-ever real, quantified evidence of its behavior relative to an LLM alternative (distractor uniqueness, flashcard verbatim rate) — but the mechanism itself (rule-based derivation from generated text) is not a new technique in the literature (Phase 2 §5, Group 4), and the one real comparison available is n=1, insufficient to support a generalized research claim about the technique's merit or deficiency.

### E. Caching / fallback / task persistence
**Classification: ENGINEERING CONTRIBUTION** only.
Real, useful, verified reliability engineering (video-ID-keyed file cache, multi-model/multi-key fallback chain, SQLite task lifecycle with startup recovery — Phase 1 §6/§9, re-exercised live in Phases 5/5.5, including one real, correctly-handled 429 quota event). No experimental evidence was collected that elevates this beyond standard engineering practice, and none was designed to (Phase 3 did not target this as an RQ).

### F. Full study-pack workflow (transcript → notes → topics/quiz/flashcards/revision/interview → PDF, one pipeline)
**Classification: SYSTEM CONTRIBUTION** only.
A real, working, end-to-end system (verified live across all 7 dataset lectures, 0 failures). Phase 2 identified NoteIt (Zhao et al. 2025, ACM UIST) as the closest prior integrated system, differing in modality (multimodal video vs. transcript-only) and artifact scope (interactive notes vs. multiple distinct artifact types). **The combination of artifact types alone does not constitute novelty** (explicitly warned against in Phase 2 §14/§13 and reaffirmed here) — it is a legitimate system-description contribution, useful as the testbed that would make contributions A/B/C possible with further (human) evidence, not a research finding in itself.

---

## Summary Table

| Contribution | Classification |
|---|---|
| A. Grounded timestamp alignment | FUTURE WORK (contribution pending human eval) |
| B. Single AI call + deterministic transformation architecture | SYSTEM CONTRIBUTION (research contribution pending full quality/cost trade-off eval) |
| C. Anti-hallucination/grounding constraints | FUTURE WORK (contribution pending human eval) |
| D. Deterministic artifact generation | ENGINEERING CONTRIBUTION |
| E. Caching/fallback/task persistence | ENGINEERING CONTRIBUTION |
| F. Full study-pack workflow | SYSTEM CONTRIBUTION |

**No item in this audit is classified as a currently-validated RESEARCH CONTRIBUTION.** The strongest currently-defensible research-adjacent claim is Item B, positioned narrowly around the one real, quantified diversity/cost observation from Phase 5 — everything past that requires the human evaluation infrastructure already built and waiting (`annotations/`).
