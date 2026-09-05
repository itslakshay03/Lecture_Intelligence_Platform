# Paper Claim Boundary — Phase 6

The definitive reference for what Phase 7 may and may not write. Cross-referenced to `FINAL_CLAIM_AUDIT.md` and `FINAL_RQ_STATUS.md`.

---

## CLAIMS WE CAN MAKE

*(Unqualified — the evidence directly and fully supports these as stated.)*

- LectraAI implements a pipeline that generates lecture notes via a single LLM (Gemini) call, then derives topics, quiz, flashcards, a revision plan, and interview questions from that one generated document through deterministic regex/template logic — never through a further LLM call.
- The two experimental prompt conditions (constrained/unconstrained) were verified, programmatically, to differ only in the intended constraint block.
- All seven lectures in the evaluated dataset completed processing successfully via real Gemini API calls, with zero offline-fallback invocations and zero failures.
- Transcript length was strongly and significantly correlated with total processing latency in the evaluated seven-lecture sample (Pearson r=0.98, p<0.001).
- The AI-generation stage accounted for the largest share of total processing time (mean 58.7% per lecture) among all measured stages, in every evaluated case.
- On the one lecture for which a direct comparison exists, LectraAI's deterministic quiz distractors were less lexically diverse (44.4% unique) than a direct-LLM-generated alternative (100.0% unique) from the same source notes.
- LectraAI's topic-timestamp mechanism produced a timestamp for 56.0% of topics across the evaluated dataset; two of seven lectures received none.
- Nine of nine previously-reported quantitative results were independently recalculated and confirmed, with one aggregation-convention ambiguity disclosed.

## CLAIMS WE CAN MAKE WITH QUALIFIERS

*(Require explicit hedging language — "in our evaluated sample," "preliminary," "observed," "suggests," "partially," "inconclusive.")*

- "In our evaluated sample, LectraAI's deterministic artifacts *suggest* a diversity limitation relative to a direct-LLM alternative — this is a preliminary, single-lecture observation, not a generalized quality comparison."
- "The divergence between LectraAI's real timestamp assignments and a naive baseline (mean 147s) is observed but its implication for accuracy remains inconclusive without human ground truth."
- "The architecture's cost/quality trade-off (fast, cheap deterministic derivation vs. observed lower distractor diversity) is suggestive but requires broader, human-rated evaluation to characterize fully."
- "Coverage gaps in timestamp assignment (56%) partially motivate future investigation into the matching threshold's sensitivity, though this was not directly tested."

## CLAIMS WE CANNOT MAKE

*(Explicitly, regardless of qualifier — the evidence does not exist to support these in any form.)*

- Validated timestamp accuracy, in any percentage or MAE form — no ground truth exists.
- Validated hallucination reduction or improved groundedness from the prompt constraints — no reliable metric (human or automated) was ever produced for this; the one attempted proxy was explicitly rejected.
- Human-rated superiority of any LectraAI artifact (notes, quiz, flashcards, revision plan, interview questions) over any alternative — zero human ratings exist for anything.
- Broad pedagogical effectiveness or learning-outcome claims of any kind — no user study, no learner data, ever collected.
- Any causal latency claim ("causes," "makes it slower") — only a correlational design was run.
- Generalization of any finding beyond the evaluated 7-lecture sample, 3 subject domains, or single execution session — the dataset lacks CODING/NUMERICAL categories and Medium/Long-duration representation, and latency reflects one specific network/API-load window.
- "State-of-the-art," "novel architecture," "first-of-its-kind," "solves," "eliminates," "guarantees," or "proves" — none of these are supported by any result in this study, per the conservative-language rule established in Phase 2 and reaffirmed throughout.
- That the multi-artifact combination itself is a novel system design — Phase 2 identified a closely comparable prior integrated system (NoteIt).

## CLAIMS REQUIRING FUTURE HUMAN EVALUATION

- **RQ1:** Timestamp accuracy against human-annotated ground truth — infrastructure ready (`annotations/timestamps/annotation_package/`), zero annotations collected.
- **RQ2:** Correctness, relevance, usefulness, and difficulty-appropriateness ratings for quiz/flashcards/interview questions — infrastructure ready (`annotations/ratings/rubrics.md`, `blinding_protocol.md`), zero ratings collected.
- **RQ3:** Claim-level groundedness classification (supported/partially supported/unsupported/factually incorrect) against the transcript — infrastructure ready (`annotations/ratings/rq3_claim_annotation/`, 58 candidate units segmented), zero classifications collected.

Until these three evidence gaps are closed, the paper's contribution must be framed around the system description, the validated RQ4 finding, and the one real, narrow, n=1 objective comparison in RQ2 — with RQ1 and RQ3 explicitly presented as designed-but-unevaluated future work, not as findings.
