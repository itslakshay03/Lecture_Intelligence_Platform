# Human Evaluation Rubrics

Fixed rating scale for every Likert dimension below (Phase 3 §8, preserved here unchanged):

| Score | Meaning |
|---|---|
| 1 | Very poor |
| 2 | Poor |
| 3 | Acceptable |
| 4 | Good |
| 5 | Excellent |

Reviewers rate blinded items only (`condition_label`: "System A" / "System B" — see `blinding_protocol.md`). Never reveal or guess which system produced an item while rating.

## Notes (Experiment C, and Experiment B's shared source-notes check)
1. **Factual correctness** — does each claim match what the lecturer actually said?
2. **Groundedness** — is each claim traceable to the transcript, vs. invented/outside knowledge? Also list every unsupported claim found, verbatim, in `unsupported_claims`.
3. **Completeness/coverage** — does the document address the topics actually taught, without dropping major ones? (Build your own "should-be-covered" topic list from the transcript BEFORE reading the generated notes, then check overlap.)
4. **Relevance** — is the content free of off-topic padding?
5. **Clarity/usefulness** — would a student studying for an exam find this usable as-is?

## Quiz (Experiment B)
- **Answer correctness (binary)** — verify the marked-correct option against the transcript/notes.
- **Relevance** — is the question about genuinely important lecture content?
- **Distractor plausibility** — would a student who studied but made a reasoning error plausibly pick a wrong option? (1 = distractors are absurd/unrelated, 5 = distractors are genuinely tempting.)
- **Perceived difficulty** — Easy / Medium / Hard (categorical, not Likert).

## Flashcards (Experiment B)
- **Answer correctness (binary)** — does the "back" correctly answer the "front," per the notes?
- **Relevance** — is this a genuinely important term/concept, not a trivial one?
- **Coverage** — assessed at the *set* level, not per-card: build your own key-term checklist from the notes first, then check what fraction the flashcard set actually covers. Record this once per (lecture, condition), not per card.

## Interview questions (Experiment B)
- **Answer correctness (binary)** — verify the model answer against the notes.
- **Relevance** — does the question fit the topic and the claimed difficulty tier (basic/intermediate/advanced)?
- **Usefulness** — would this plausibly be asked in a real interview on this topic?

## What is deliberately NOT rated
- **Revision plan** — out of scope for Experiment B per Phase 3 §7 Gap 3 (requires longitudinal learner-performance data to evaluate meaningfully, not a one-shot LLM comparison; see `research/baselines/direct_llm_artifacts/generate_artifacts.py` docstring).
