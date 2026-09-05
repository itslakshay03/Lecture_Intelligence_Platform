# LectraAI Research — Experimental Infrastructure

> **No experimental results are included until data collection and evaluation are completed.** Everything under `research/` as of Phase 4 is design, tooling, and validated (pilot-only) plumbing — not findings. See `reports/PHASE_4_METHODOLOGY_AND_EXPERIMENTAL_SETUP.md` for the full account of what has and has not been done.

## Purpose
This directory holds everything needed to evaluate four research questions about LectraAI's actual, verified implementation (not aspirational claims about it) — kept entirely separate from the shipped product in `backend/` and `frontend/`.

## Research Questions
- **RQ1 — Timestamp Grounding:** how accurately does LectraAI's keyword-overlap timestamp method associate topics with their true lecture segments, vs. human annotation and a naive baseline?
- **RQ2 — Artifact Generation Strategy:** how does LectraAI's deterministic/template-derived quiz, flashcards, and interview questions compare with directly LLM-generated equivalents?
- **RQ3 — Grounding / Anti-Hallucination Ablation:** do `SMART_PROMPT`'s explicit grounding constraints reduce unsupported claims vs. an unconstrained prompt?
- **RQ4 — Processing Efficiency:** how does latency break down across pipeline stages, and how does it scale with lecture duration?

**Critical framing, preserved from Phase 1 throughout:** LectraAI's Gemini call generates only the notes markdown. Quiz, flashcards, revision plan, and interview questions are currently produced by deterministic regex/template code in `backend/utils/study_pack.py` — never describe them as independently AI-generated anywhere in this research tree or its outputs.

## Directory structure
```
research/
├── README.md                  — this file
├── configs/                   — model config (verified from code), reproducibility config template
├── dataset/                   — manifest.csv (real candidate lectures) + schema
├── annotations/
│   ├── timestamps/            — annotation schema + instructions (RQ1)
│   └── ratings/                — rating schema, rubrics, blinding protocol (RQ2/RQ3)
├── baselines/                 — experiment-only comparison conditions (NOT part of the product)
│   ├── unconstrained_llm/     — Experiment C, Condition B
│   ├── direct_llm_artifacts/  — Experiment B, Condition B
│   ├── naive_timestamp/       — Experiment A, baseline condition
│   └── extractive/            — optional/stretch notes-groundedness anchor
├── experiments/                — per-RQ experiment runners (mostly scaffolded, not yet executed)
│   └── latency/extract_latency.py — REAL, functional (reads the new instrumentation)
├── evaluation/
│   ├── metrics/                — timestamp MAE/median/%-within-threshold (unit-tested)
│   ├── statistics/              — paired-comparison test-selection pipeline
│   └── scripts/
├── results/                    — EMPTY. Nothing here until Phase 5 actually runs an experiment.
└── reports/                    — PHASE_4_METHODOLOGY_AND_EXPERIMENTAL_SETUP.md
```

## What is production code vs. research-only code
- **Production (in `backend/`):** the additive instrumentation fields/table described in the Phase 4 report — `generation_method`, `model_name_used`, `prompt_version`, `transcript_char_count` on `tasks`, plus the new `task_stage_events` table and `PROMPT_VERSION` constant. These ship with the real application and are backward-compatible (verified: all 92 existing backend tests still pass).
- **Research-only (in `research/`, this directory):** everything else — baselines, metric functions, annotation schemas, statistics code. None of it is imported by `backend/` or `frontend/`. Where a research script needs shipped logic (e.g. the real `SMART_PROMPT`, or `_generate_with_fallback`), it imports it read-only; it never modifies it.

## How experiments will be executed (once Phase 5 begins)
1. Populate `dataset/manifest.csv` with the final stratified sample (target N=18-20, per Phase 3 §7), extending the 7 real candidate lectures already listed.
2. Collect human timestamp annotations per `annotations/timestamps/annotation_instructions.md`.
3. Run the baselines in `baselines/` against the dataset.
4. Collect blinded human ratings per `annotations/ratings/rubrics.md` + `blinding_protocol.md`.
5. Compute metrics via `evaluation/metrics/`.
6. Run the statistical analysis pipeline via `evaluation/statistics/paired_analysis.py`.
7. Write results to `results/raw/` (machine-generated JSON/CSV only, never hand-typed) and summarize in `results/processed/`.

## Reproducibility
Every experiment run must be recorded with an `experiment_config.<id>.json` (see `configs/experiment_config.example.json`) capturing dataset version, model, prompt version, baseline condition, and execution timestamp — before any result is considered citable.

## Install
```
pip install -r research/requirements.txt   # numpy, scipy — needed for evaluation/statistics/
```
(`backend/requirements.txt` is untouched — this is a separate, research-only dependency list.)
