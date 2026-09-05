# Timestamp Annotation Instructions

*(Reproducing and operationalizing Phase 3 §8 / Phase 4 §7. Follow exactly — deviations must be logged in the record's `notes` field, not silently applied.)*

## What to do
For each lecture assigned to you:
1. Watch/scrub the video (or read the transcript alongside it) **without looking at LectraAI's own output first** — this is an `independent_reference` pass. LectraAI's generated topics/timestamps must not be visible to you during this pass.
2. Identify each **meaningful concept** the lecturer substantively explains — not every sentence, not a passing one-word mention. A rule of thumb: if a student studying this lecture would list it as "one of the things this lecture covered," it qualifies.
3. For each such topic, record a **tolerance window** `[start_sec, end_sec]` — the span during which the lecturer transitions into and through introducing/explaining it (typically a few seconds to ~30 seconds). Do not record a single instant unless the transition is genuinely that abrupt.
4. Write a short `topic_label` and `description` in your own words (do not copy LectraAI's wording — you haven't seen it yet).
5. Write a one-line `evidence` note (a short quote or paraphrase from the transcript) justifying the window you chose.
6. If a topic is substantively revisited later in the lecture, record the **first** occurrence as your primary record (`is_primary_occurrence: true`). You may optionally also record later occurrences with `is_primary_occurrence: false`.

## Rules
- A topic ≠ an arbitrary sentence. Passing mentions, restatements, or transitions ("as I said before...") do not count as a new topic.
- The timestamp represents **introduction/explanation**, not every later reference.
- Base your judgment on the transcript/video only — never on LectraAI's output, during the independent-reference pass.
- If you genuinely cannot tell when a topic starts (e.g., a very gradual, meandering transition), widen the window rather than guessing a false-precise instant, and say so in `notes`.

## Disagreement / adjudication
- Two annotators' windows for the *same* topic are considered agreeing if they overlap by ≥50% OR their midpoints are within 15 seconds of each other.
- If they disagree by more than that, a third reviewer (or the two original annotators, in discussion) produces one reconciled record with `annotation_pass: "adjudication"`. The original two independent records are kept, not overwritten, so disagreement rate itself can be reported.

## Output
One JSON file per lecture per annotator (and, where produced, one adjudicated file per lecture), conforming to `schema.json` in this directory. Filename convention: `<lecture_id>__<annotator_id>__<annotation_pass>.json`.
