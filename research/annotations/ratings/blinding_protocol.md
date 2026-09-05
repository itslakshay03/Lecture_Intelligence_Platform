# Blinding & Randomization Protocol

Applies to Experiment B (deterministic vs. direct-LLM artifacts) and Experiment C (constrained vs. unconstrained prompt).

## Blinding
- Reviewers see items labeled **"System A"** and **"System B"** only — never "LectraAI," "Gemini," "deterministic," "template," "constrained," or "unconstrained."
- The true mapping (which label = which condition, per lecture) is stored in a separate file, `condition_mapping.csv` (created per experiment run, not committed alongside the rating data used by reviewers), accessible only to the person running the analysis after all ratings are collected.
- Output formatting is normalized before presentation: same font/template/layout for both conditions, so condition cannot be guessed from presentation quirks (e.g., different Markdown emoji usage) rather than content.

## Randomization
- The System A / System B label assignment is randomized **independently per lecture** (not a fixed "A is always deterministic" mapping) — otherwise a reviewer who rates several lectures could learn the mapping by pattern.
- Presentation order (which condition a reviewer sees first for a given lecture) is also randomized per lecture.

## Reviewer instructions (verbatim, to be given to every reviewer before rating)
> You will review pairs of study materials labeled "System A" and "System B" for the same lecture. You do not need to know, and will not be told, what generated either one. Rate each item strictly on its own merits using the attached rubric. If you believe you can tell which system produced an item, note this in `reviewer_notes` but continue rating normally — do not let a guess about the source change your score.

## What must be true before claiming "blinding occurred"
- The condition_mapping.csv was generated and randomized BEFORE any reviewer saw any item.
- No reviewer had access to condition_mapping.csv during rating.
- If either of these was not actually done for a given data collection run, the report for that run must say "blinding was not achieved" rather than assert it occurred — per Phase 4's explicit instruction not to claim blinding unless it actually happened.
