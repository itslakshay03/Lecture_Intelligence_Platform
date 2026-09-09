# LectraAI: An AI-Assisted Lecture-to-Study-Pack Framework with Duration-Bounded Timestamp Grounding and Deterministic Multi-Format Artifact Transformation

*Manuscript prepared in IEEE conference style. This Markdown file is the content source of truth; `.tex`, `.docx`, and `.pdf` renderings are generated from it. Every numeric value is traceable via `PAPER_TRACEABILITY.md`.*

**Authors (group members):**

| Lakshay Anand | Harshit Chaudhary | Ayush Mavi |
|---|---|---|
| Information Technology | Information Technology | Information Technology |
| *[Institution name to be completed]* | *[Institution name to be completed]* | *[Institution name to be completed]* |
| Ghaziabad, India | Ghaziabad, India | Ghaziabad, India |
| lakshayanand3939@gmail.com | officialharshit111@gmail.com | ayushmavi2004@gmail.com |
| Roll No.: 2300320130137 | Roll No.: 2300320130113 | Roll No.: 2300320130078 |

*Affiliation note: the manuscript carried no institution name; the placeholder above is to be completed by the authors and was deliberately not guessed. In the rendered `.pdf` / `.docx`, the Abstract is set as a balanced two-column block with Index Terms as a separate line beneath it.*

---

## Abstract

Converting long recorded lectures into structured, revision-ready study material is time-consuming, and simple summarization alone does not produce the varied artifacts (organized notes, quizzes, flashcards, revision schedules, interview questions) that learners use when preparing for assessments. This paper presents **LectraAI**, an end-to-end framework that takes a lecture video, extracts and cleans its transcript, generates structured study notes with a single large-language-model (LLM) call constrained by an explicit transcript-grounding prompt, associates generated topics with points in the lecture using a duration-bounded keyword-overlap heuristic, and then produces the remaining study artifacts through **deterministic (template and regular-expression) transformation of the generated notes** rather than through additional model calls. We describe the implemented system, an instrumented evaluation methodology, and an initial evaluation on a set of **seven real computer-science lectures**. Within this sample we report: (i) that the timestamp mechanism assigned a topic-level timestamp to 56.0% of topics (14 of 25), with two of seven lectures receiving none, a coverage characteristic rather than a validated accuracy result; (ii) an objective sub-finding on one lecture that the deterministic quiz produced markedly less lexically diverse answer options (44.4% unique) than a direct-LLM alternative built from the same notes (100% unique); and (iii) that end-to-end processing latency was strongly and significantly correlated with transcript length (Pearson r = 0.98, p < 0.001, n = 7), with the single LLM call accounting for a mean of 58.7% of processing time. Human evaluation of timestamp accuracy, artifact quality, and note groundedness was designed and prepared but **not collected**; consequently three of the four research questions remain inconclusive. We report these limitations explicitly and release the annotation and evaluation infrastructure to enable the missing studies.

**Keywords:** lecture summarization, educational content generation, large language models, timestamp grounding, deterministic transformation, study-pack generation, transcript processing, reproducible evaluation.

---

## I. Introduction

Recorded lectures are now a primary learning resource, but consuming them for revision is inefficient: a learner must re-watch long videos, pause to take notes, and separately construct practice questions and a revision schedule. Automatic *summarization* of lecture transcripts addresses only part of this workload. Learners preparing for examinations typically rely on several distinct artifact types — organized notes, self-test quizzes, flashcards for spaced recall, a revision timeline, and, in professional contexts, interview-style questions — and they benefit from being able to jump back to the moment in the lecture where a concept was introduced. Producing all of these by hand is laborious, and producing each of them with a separate LLM call is costly and introduces additional opportunities for ungrounded or inconsistent content.

This paper describes **LectraAI**, a framework that occupies a specific point in this design space: it uses the LLM once, to generate structured notes under an explicit grounding constraint, and then derives topics, a quiz, flashcards, a revision plan, and interview questions from those notes through **deterministic transformation** (template filling and regular-expression extraction). Timestamps for generated topics are produced by a lightweight, non-learned heuristic that matches topic keywords against transcript cue markers and validates the result against the video's true duration. The system also renders a printable PDF study pack, persists task state in SQLite, and instruments each processing stage for measurement.

We frame the investigation around four research questions, whose evidence status is drawn directly from the project's internal audit (Phase 6):

- **RQ1 — Timestamp grounding:** How accurately does LectraAI's timestamp mechanism associate generated study content with relevant points in the lecture?
- **RQ2 — Artifact generation strategy:** How does LectraAI's deterministic artifact transformation compare with direct LLM-generated educational artifacts in terms of artifact quality?
- **RQ3 — Prompt ablation / groundedness:** How do explicit grounding constraints in the LectraAI prompt affect the groundedness of generated notes relative to an unconstrained prompt?
- **RQ4 — Processing efficiency:** How does lecture/transcript length relate to end-to-end processing latency?

**Contributions.** We classify our contributions conservatively, following the project's Phase-6 contribution audit:

1. **(System / engineering)** An end-to-end, instrumented lecture-to-study-pack architecture that combines dual-strategy transcript extraction, single-call grounded note generation, a duration-bounded timestamp-association heuristic, deterministic multi-format artifact transformation, PDF assembly, and task persistence with graceful model fallback.
2. **(System / methodological)** A duration-bounded timestamp-association mechanism that constrains topic–time associations using the video's true duration and embedded transcript cue markers, together with a reproducible protocol for evaluating its *coverage* and its *divergence from a naive baseline* in the absence of human ground truth.
3. **(Methodological)** An experimental framework — with released baselines and materials — for comparing (a) deterministic artifact transformation against direct-LLM artifact generation from identical notes, and (b) grounded against unconstrained prompting, holding the transcript and model fixed.
4. **(Empirical, evaluated-sample only)** An analysis of end-to-end processing latency with respect to transcript length on seven real lectures, including a per-stage latency breakdown.

We do **not** claim that LectraAI produces accurate timestamps, higher-quality artifacts than an LLM baseline, or reduced hallucination; the evidence required for those claims (human annotation and rating) was not collected, and we say so throughout.

---

## II. Related Work

**Lecture and educational-video summarization.** Deep-learning approaches to video summarization are surveyed by Apostolidis *et al.* [1]. Lecture-specific note generation from slide-based videos was demonstrated by Xu *et al.* [4], and multimodal lecture understanding has a dedicated benchmark from Lee *et al.* [2]. Transcript quality itself is an upstream variable: Kuhn *et al.* [3] measure the accuracy of commercial automatic speech recognition on higher-education lectures and find wide vendor variation. LectraAI consumes platform-provided captions rather than performing its own speech recognition, and operates on transcript text only (no slide or visual channel).

**LLM-based educational content generation.** Broad reviews of LLMs in learning environments discuss personalization, adaptability, and factual-reliability concerns [5]. Lin *et al.* [6] report that decomposing generation into sub-tasks improves human-rated lesson quality relative to single-step generation — a finding relevant to LectraAI's single-call design, which trades that potential quality gain for cost and consistency.

**Automatic question and distractor generation.** Educational question generation with LLMs, including alignment to Bloom's taxonomy, has been studied by Scaria *et al.* [7], with methodology-and-educator-insight work by Biancini *et al.* [9]. Distractor generation specifically is surveyed by Alhazmi *et al.* [8]; neural distractor generation predates the current LLM era (Qiu *et al.* [10]), and additional preprint work explores fine-tuned question generation [11]. A consistent theme is that automated evaluation does not substitute for human judgement of question quality. LectraAI's quiz is produced by fixed templates rather than by a model, placing it at the pre-neural end of this spectrum; our RQ2 evaluation quantifies one consequence (distractor diversity) but explicitly does not assess quality.

**Flashcards and spaced repetition.** Sentence generation for spaced-repetition practice has been evaluated with real learners by Paddags *et al.* [12], and retrieval-augmented generation of spaced-repetition content in a high-stakes domain by Kaczmarek *et al.* [13]. Optimal, learner-adaptive review scheduling is established at a top venue by Tabibian *et al.* [14]. LectraAI's flashcards are extracted verbatim from the generated notes, and its revision plan is a fixed schedule with no learner-performance input; the adaptive-scheduling line of work is future rather than implemented functionality.

**Temporal grounding.** Associating natural-language content with points in a video is a mature research area with two recent surveys [15], [16]; state-of-the-art methods are learned and multimodal. LectraAI's timestamp mechanism is deliberately simpler — text-only keyword overlap against transcript cue markers, bounded by video duration — and is positioned here as a lightweight heuristic whose *coverage* and *divergence from a naive baseline* we measure, not as a competitor to learned temporal grounding.

**Hallucination and grounding.** Hallucination in LLMs is surveyed by Huang *et al.* [17], with education-specific risk discussion by Peltekova *et al.* [18]; mitigation in the literature is dominated by retrieval augmentation and fine-tuning. LectraAI instead uses prompt-only negative constraints. Our RQ3 was designed to ablate exactly this factor but could not be completed for lack of human claim-level labels.

**Integrated systems.** The closest prior integrated system is NoteIt [19], which converts instructional videos into interactive notes through multimodal video understanding and was evaluated with a user study. LectraAI differs in being transcript-only and in producing several distinct artifact types; the *combination* of artifact types is not claimed as a novelty in itself, consistent with the project's Phase-2 assessment.

---

## III. The LectraAI Framework

### A. Overview

Fig. 1 shows the implemented pipeline. A YouTube lecture URL is submitted; the backend creates an asynchronous task, extracts and cleans the transcript, issues **one** grounded LLM call to generate Markdown study notes, applies regular-expression clean-up to those notes, and then performs **deterministic transformation** of the notes into: (a) segmented topics, (b) topic timestamps, (c) a multiple-choice quiz, (d) flashcards, (e) a five-stage revision plan, and (f) tiered interview questions. The structured study pack is serialized to JSON, rendered to a PDF, and the task's terminal state plus per-stage instrumentation are stored in SQLite.

**Critical distinction.** Only the note-generation stage (one Gemini call) is model-generated. Topics, timestamps, quiz, flashcards, revision plan, and interview questions are produced by template and regular-expression logic operating on the generated notes; no further model call is made. We therefore describe the system as *AI-assisted study-pack generation followed by deterministic multi-format transformation*, and we avoid the phrasing "AI-generated" for the derived artifacts.

**Fig. 1.** *LectraAI pipeline architecture. Pink: the single AI-generated stage (one Gemini call). Blue: deterministic transformation and processing. Grey: input, output, and persistence. Derived artifacts are transformations of the generated notes, not independent model outputs.*

### B. Transcript acquisition and cleaning

The transcript is obtained by a dual-strategy fetcher: first via a subtitle-download path (`yt-dlp` with optional authenticated cookies), then, on failure, via a transcript API. The retrieved captions are concatenated with an inserted `[MM:SS]` (or `[H:MM:SS]` past one hour) **cue marker** whenever a gap of at least 60 seconds occurs between consecutive caption segments; the video's duration is captured from the fetch metadata. The transcript is then de-duplicated, stripped of common spoken-filler and channel-promotional phrases via regular expressions, and truncated to a maximum of 120,000 characters before being passed to the model. (In the evaluated dataset the longest transcript was 59,821 characters, so truncation was never triggered.)

### C. Grounded note generation

A single call is made to the LLM with a prompt (`SMART_PROMPT_v1`) that contains an explicit block of **strict negative constraints** instructing the model to write only content traceable to the transcript, to avoid completing the lecture with outside knowledge, to avoid inventing examples or analogies, and to preserve the lecturer's claim strength (e.g., not to escalate "helps reduce" into "eliminates"). The model returns a single Markdown document (headings, bullet lists, tables, optional diagram code blocks, optional inline mathematics). A subsequent regular-expression pass removes residual transcript intros, generic section titles, and internal identifiers, and softens a small set of over-strong phrasings.

If every model/API attempt fails, the system falls back to a local, non-model heuristic note generator; the evaluated runs did not trigger this path.

### D. Deterministic transformation

From the generated notes:

- **Topics** are obtained by splitting the document on level-two headings; each block yields a title, its text, up to six bullet "key points," and an optional diagram code block.
- **Timestamps** are associated by the mechanism in Section IV-C.
- **Quiz** items are produced by fixed question templates per topic, filled with the topic title and its first key points; the incorrect options are drawn from a small fixed pool of generic distractor sentences, after which the position of the correct option is shuffled for A/B/C/D balance.
- **Flashcards** are produced by extracting bold terms from the notes and pairing each with the sentence in which it appears.
- **Revision plan** is a fixed five-stage schedule (24 h, 3 d, 7 d, 14 d, 30 d) with fixed stage descriptions; only the per-stage list of topic titles varies by lecture.
- **Interview questions** are produced by fixed templates assigned round-robin to basic/intermediate/advanced tiers by topic index.

### E. Assembly, rendering, and persistence

The artifacts are assembled into a single JSON study pack (also exposing the raw notes Markdown, the video duration, and the grounded timestamp list). The notes are converted Markdown→HTML and rendered to an A4 PDF by a headless browser subprocess. Task lifecycle (`pending → processing → completed | failed`) is persisted in SQLite; a startup routine marks any task left in `processing` (e.g., after a crash) as `failed`. Repeat submissions of a previously processed video are served from a file cache keyed by video identifier unless a forced refresh is requested.

### F. Research instrumentation (added for this study)

For measurement, the task record additionally stores the generation method (model path vs. offline fallback), the specific model that responded, the prompt version, and the transcript character count; a separate table stores start/end timestamps for the transcript-fetch, AI-generation, transformation, and PDF-render stages. This instrumentation is additive and does not alter processing behaviour (the system's existing test suite passes unchanged with it enabled).

---

## IV. Methodology

We separate the **production system** (Section III, deployed behaviour) from **research-only components** (baselines and evaluation scripts used only for this study and never invoked by the deployed pipeline).

### A. Lecture acquisition

Lectures were selected as publicly accessible YouTube computer-science lectures with usable captions in a supported language, an identifiable duration, and coherent lecture content. Each lecture was processed once through the unmodified production pipeline with a forced refresh so that all instrumentation fields were populated by a genuine run.

### B. Transcript and cue processing

As in Section III-B. The `[MM:SS]` cue markers embedded during extraction are the only temporal anchors available to the downstream timestamp mechanism; no frame-level or audio-level alignment is performed.

### C. Duration-bounded timestamp association

For a topic with title *t* and video duration *D*, the mechanism (i) checks whether the topic's own text contains an explicit cue and, if so and if the cue second *s* satisfies 0 ≤ *s* < *D*, assigns it; otherwise (ii) extracts search terms from the cleaned topic title, scores each transcript cue by the count of search terms occurring in the cue's text (with a small bonus for domain acronyms), and assigns the highest-scoring cue whose second satisfies 0 ≤ *s* < *D*, provided its score is at least one. Topics for which no cue clears this threshold receive **no** topic-level timestamp (the study pack still contains a fixed 00:00 "Lecture Introduction" entry, but it is not associated with any generated topic). The final list is sorted chronologically and any entry with second ≥ *D* is discarded.

Two quantities are computed from this mechanism without human ground truth:

- **Topic–timestamp coverage:** the fraction of generated topics (across all lectures) that received a topic-level timestamp.
- **Divergence from a naive baseline:** for topics that received a timestamp, the mean absolute difference in seconds between the assigned time and a **naive equal-interval baseline** that places topic *i* of *n* at *i · D / n*, ignoring content. Both quantities are descriptive; neither is an accuracy measure.

### D. Research-only baselines

Three baselines were implemented outside the production codebase:

1. **Naive equal-interval timestamps** (Section IV-C), the null comparison for RQ1.
2. **Direct-LLM artifact generator:** given the *same* generated notes as the production pipeline, a single model call per artifact type (quiz, flashcards, interview questions) requesting the same JSON structure. Used only as the comparison condition for RQ2. This generator is **not** part of LectraAI.
3. **Unconstrained note prompt:** `SMART_PROMPT_v1` with only the `<strict_negative_constraints>` block removed and everything else — role framing, formatting rules, transcript, target length, model — held identical. Programmatically verified to differ from the production prompt only in that block. Used only as the comparison condition for RQ3.

An extractive TF-IDF summarization baseline was implemented but **excluded** after a real-transcript trial showed that spoken-lecture transcripts (sparse in sentence-ending punctuation) collapse its sentence segmentation; it is reported as an excluded baseline, not tuned to perform better.

### E. Evaluation metrics and their evidence requirements

- **Timestamp accuracy (RQ1):** absolute error |*t*<sub>pred</sub> − *t*<sub>ref</sub>| against a human reference window, aggregated as mean absolute error (MAE), median absolute error, and percentage within ±5 s / ±10 s / ±30 s. **These require human reference timestamps and were not computed** (no annotations were collected). A tolerance-window annotation protocol and a per-lecture annotation package (transcript, duration, blank schema-conformant form) were prepared for all seven lectures.
- **Artifact quality (RQ2):** human ratings of correctness, relevance, coverage, distractor plausibility, and difficulty on a 1–5 scale, under blinding. **Not collected.** Two *objective* structural metrics were computed instead and are clearly labelled as diversity/behaviour, not quality: **distractor uniqueness** (unique distractor strings ÷ total distractor strings) and **flashcard verbatim overlap** (flashcard answers found verbatim in the source notes ÷ total flashcards).
- **Groundedness (RQ3):** human claim-level classification of each notes claim as supported / partially supported / unsupported / factually incorrect against the transcript, aggregated as an unsupported-claim rate. **Not collected.** An automated proxy (exact-substring presence of bold terms in the transcript) was attempted and then **excluded** because manual inspection showed it systematically miscounts Markdown section headers as claims and misses orthographic variants; it is not used as evidence. A mechanical claim-segmentation of both prompt conditions' notes (58 candidate units) was prepared for a future human pass.
- **Latency (RQ4):** per-stage and total wall-clock time from the instrumentation; the relationship to transcript length is summarized with the Pearson correlation coefficient and its p-value. This requires no human judgement and **was computed**.

### F. Statistical analysis

Descriptive statistics (mean, median, standard deviation, range) are reported for all quantities. For RQ4, the Pearson correlation between transcript character count and total latency is reported with its two-sided p-value at n = 7. No inferential test is applied to RQ1–RQ3 quantities because (a) RQ1 has no ground truth to test against, and (b) RQ2/RQ3 have data for only a single lecture, below any threshold at which an inferential test would be meaningful. All previously reported quantitative values were independently recalculated from the raw data files during the project's Phase-5.5 and Phase-6 audits (9 of 9 confirmed; one aggregation-convention ambiguity for the AI-stage latency share is disclosed in Section VI-D).

---

## V. Experimental Setup

### A. Dataset

The evaluated dataset consists of **N = 7 real computer-science lectures** (Table I). All seven were processed successfully through the production pipeline via a genuine model call (0 offline-fallback invocations, 0 failures); the responding model was recorded as `gemini-3.6-flash` for every run, under prompt version `SMART_PROMPT_v1`.

**TABLE I. DATASET CHARACTERISTICS (N = 7).**

| Property | Value |
|---|---|
| Lectures | 7 |
| Duration (s): mean / median / min / max / SD | 1163.9 / 777.0 / 393.0 / 3702.3 / 1140.9 |
| Duration bands | Short (≤15 min): 5; Medium (15–45 min): 1; Long (>45 min): 1 |
| Transcript length (chars): mean / median / min / max / SD | 17109 / 10590 / 5326 / 59821 / 19006 |
| Subject domains | Operating Systems: 2; Computer Networks: 2; DBMS: 2; Artificial Intelligence: 1 |
| Lecture-type categories | Comparison: 3; Architecture: 2; Algorithm: 1; Theory: 1 |
| Caption source (manual vs. auto) recorded | 0 of 7 (not captured by the pipeline) |
| Language | English (all 7; not independently re-verified per lecture) |

The dataset is small and skewed toward short lectures, contains no coding-implementation or numerical lecture, and represents four subject domains. A dataset-expansion attempt during Phase 5.5 did not yield additional individually-verifiable lecture identifiers with the available tooling; the dataset was therefore not enlarged rather than padded.

### B. Human evaluation status

| Evaluation | Required for | Collected |
|---|---|---|
| Human timestamp annotations | RQ1 | **0** |
| Human artifact ratings | RQ2 (quality) | **0** |
| Human claim-level groundedness labels | RQ3 | **0** |

The corresponding annotation and rating infrastructure (protocols, schemas, per-lecture packages, rubrics, blinding procedure) is complete and released; only the human-collected data is absent.

### C. Reproducibility notes

The system's implementation documentation names a different model identifier (`gemini-2.5-flash`) than the model-fallback list in the code (`gemini-3.6-flash`, `gemini-3.5-flash`, and further entries); the instrumentation recorded `gemini-3.6-flash` as the responder for all seven runs, and that recorded value is authoritative for this study. Sampling parameters (temperature, top-p) are not set in the code and are therefore whatever the SDK/API default is; they are not independently recorded, which is an acknowledged reproducibility limitation for any generation-to-generation comparison. All raw and processed result files, the seven study-pack JSON outputs, the figures, and the analysis scripts are included in the project repository.

---

## VI. Results

### A. RQ1 — Timestamp grounding (INCONCLUSIVE)

Across the seven lectures the pipeline generated **25 topics**; the timestamp mechanism assigned a topic-level timestamp to **14 of them (56.0% coverage)**. **Two of the seven lectures** (`1msEo8PIcbw`, `T4lGm7MjA6Y`) received **no** topic-level timestamps at all — for every topic in those lectures, the keyword-overlap score failed to clear the minimum threshold. Fig. 3 shows coverage per lecture.

For the 14 topics that received a timestamp, the assigned times diverged from the naive equal-interval baseline by a **mean of 147.3 s** (median 124.0 s, SD 93.0 s; Table II). Per-lecture mean divergence ranged from 101.3 s to 177.0 s.

**TABLE II. RQ1 — TIMESTAMP COVERAGE AND DIVERGENCE FROM THE NAIVE BASELINE.**

| Lecture | Topics | Topics with timestamp | Mean abs. diff. vs. naive (s) |
|---|---|---|---|
| 3MqyDWDpZoI | 5 | 3 | 150.2 |
| 1msEo8PIcbw | 3 | 0 | — |
| T4lGm7MjA6Y | 5 | 0 | — |
| uDulBxDb7GM | 3 | 2 | 168.5 |
| VyvTabQHevw | 2 | 2 | 101.3 |
| WJ-UaAaumNA | 5 | 5 | 143.5 |
| ZtVw2iuFI2w | 2 | 2 | 177.0 |
| **Total / mean** | **25** | **14 (56.0%)** | **147.3 (n = 14)** |

**Interpretation.** Coverage of 56% is an **output characteristic of the mechanism, not a validated accuracy measure**: without human reference timestamps we cannot say whether the assigned times are correct, and a large divergence from the naive baseline could indicate either better or worse localization. RQ1 is therefore **inconclusive**; a human-grounded accuracy evaluation was designed and prepared but not completed.

### B. RQ2 — Artifact generation strategy (INCONCLUSIVE; one narrow supported diversity sub-finding)

Direct-LLM comparison artifacts were generated from the notes of **one lecture** (`3MqyDWDpZoI`), using the same model and source notes as the production pipeline. Two objective structural metrics were computed (Table III, Fig. 4):

**TABLE III. RQ2 — OBJECTIVE STRUCTURAL METRICS (ONE LECTURE, `3MqyDWDpZoI`).**

| Metric | LectraAI (deterministic) | Direct-LLM (research baseline) |
|---|---|---|
| Quiz distractor uniqueness | 8 / 18 unique (44.4%) | 27 / 27 unique (100.0%) |
| Flashcard answer verbatim in notes | 10 / 10 (100.0%) | 1 / 9 (11.1%) |

The deterministic quiz drew its incorrect options from a small fixed pool of generic sentences reused across questions, whereas every direct-LLM distractor was distinct and topic-specific. The flashcard metric confirms the expected mechanical difference: the deterministic path extracts sentences verbatim, while the LLM baseline paraphrases.

**Interpretation.** The distractor-diversity difference is a **real, objective, single-lecture** observation consistent with the design (fixed templates vs. content-specific generation). It is a **diversity** result, not a quality result: a diverse distractor may still be wrong, and a repeated-template distractor may still be a valid incorrect option. **Overall artifact-quality superiority of either approach was not established** — no human ratings of correctness, relevance, usefulness, or difficulty exist for any artifact type, and only one lecture was compared. RQ2 is therefore **inconclusive**, with one narrow supported sub-finding on distractor diversity.

### C. RQ3 — Prompt ablation / groundedness (INCONCLUSIVE)

Notes were generated for one lecture (`3MqyDWDpZoI`) under both the constrained production prompt and the unconstrained prompt, from the identical transcript and model; the two prompts were verified to differ only in the removed constraint block. The constrained notes were 3,890 characters and the unconstrained notes 3,763 characters. An automated groundedness proxy was attempted and then **excluded** for the construct-validity reasons in Section IV-E. **No human claim-level groundedness labels were collected.** RQ3 is therefore **inconclusive because human ground truth was not collected**; a mechanical claim-segmentation of both conditions' notes (58 candidate units) has been prepared for a future human pass.

### D. RQ4 — Processing efficiency (SUPPORTED for the evaluated sample)

Per-lecture and aggregate latency are given in Table IV. Across the seven lectures, total end-to-end latency had a **mean of 39.2 s** (median 34.2 s, SD 12.2 s, range 32.0–66.3 s). The single AI-generation call was the dominant stage in every case, accounting for a mean of **58.7%** of total latency per lecture (an alternative aggregation — the ratio of the two means — gives 59.9%; both are reported to avoid an unlabelled convention). The deterministic transformation stage was negligible (mean 0.05 s), consistent with its implementation as in-memory string processing. There were **0 model-fallback invocations and 0 failures** across the seven runs.

**TABLE IV. RQ4 — PER-LECTURE PROCESSING LATENCY (SECONDS).**

| Lecture | Transcript chars | Fetch | AI gen. | Transform | PDF | Total |
|---|---|---|---|---|---|---|
| uDulBxDb7GM | 8556 | 9.39 | 17.13 | 0.03 | 5.04 | 31.98 |
| ZtVw2iuFI2w | 10424 | 5.08 | 19.02 | 0.11 | 7.92 | 32.41 |
| VyvTabQHevw | 11553 | 9.15 | 19.37 | 0.04 | 4.52 | 33.27 |
| 3MqyDWDpZoI | 5326 | 9.99 | 19.06 | 0.04 | 4.78 | 34.25 |
| WJ-UaAaumNA | 13495 | 9.01 | 24.25 | 0.04 | 4.52 | 38.01 |
| 1msEo8PIcbw | 10590 | 13.28 | 19.89 | 0.03 | 4.86 | 38.21 |
| T4lGm7MjA6Y | 59821 | 14.90 | 45.73 | 0.09 | 5.46 | 66.34 |
| **Mean** | **17109** | **10.12** | **23.49** | **0.05** | **5.30** | **39.21** |

The Pearson correlation between transcript character count and total latency was **r = 0.98** (p ≈ 8.9 × 10⁻⁵ ≈ p < 0.001, n = 7). Fig. 5 plots the relationship; Fig. 6 shows the per-stage breakdown.

**Interpretation.** Within this seven-lecture sample, transcript length shows a **strong, statistically significant positive association** with end-to-end processing latency, and processing time is dominated by the single model call rather than by transcript retrieval, transformation, or PDF rendering. This is a **correlation**, not a causal relationship, and it is **specific to this sample and this measurement window**: latency includes network-dependent components (caption retrieval, the model API) that vary over time, and the sample spans only three duration bands with a single lecture above 20 minutes. We do not claim linear or universal scaling.

### E. Result validation

All nine quantitative results reported across Phases 5 and 5.5 were independently recalculated from the raw data files in Phase 6 and confirmed. The only noted discrepancy is definitional, not numerical: the AI-stage latency share can be aggregated as a per-lecture mean of ratios (58.7%) or as a ratio of means (59.9%); we report both.

---

## VII. Discussion

**What the evidence supports.** Two claims are defensible on the current evidence. First, the timestamp mechanism has **incomplete coverage** — 56% of topics overall, and 0% for two of seven lectures. This is independent of any accuracy question: the mechanism sometimes produces nothing to evaluate. The likely cause is the keyword-overlap score's minimum threshold combined with terse or acronym-heavy topic titles and sparse cue text; the two zero-coverage lectures were the network-OSI lecture and the long AI-search lecture, both with many short technical topic titles. Second, within the evaluated sample, **latency scales with transcript length and is dominated by the model call**. Practically, this means that for a deployment the model call is the component to optimize or budget for, and that very long lectures (approaching the 120,000-character truncation limit, which no evaluated lecture reached) would be expected to incur proportionally more model time.

**What the evidence does not support.** We cannot conclude anything about timestamp *accuracy*, about whether deterministic artifacts are better or worse *in quality* than LLM-generated ones, or about whether the grounding constraints reduce *hallucination*. The distractor-diversity result (RQ2) shows a real structural consequence of the template approach, but structural diversity is a necessary, not sufficient, condition for good distractors, and the result is from a single lecture. The direct-LLM baseline's higher diversity is likewise not evidence of higher quality.

**Design implications.** The single-call-plus-deterministic-transformation architecture has a measured cost profile (fast, ~0.05 s derivation) and a measured structural limitation (low distractor diversity). Whether that trade-off is acceptable depends on a quality measurement that has not been made. The literature [6]–[10] suggests that model-based or decomposed generation tends to produce higher-rated educational questions, which motivates prioritizing the human RQ2 study.

**Positioning.** Relative to NoteIt [19] and prior lecture-note systems [2], [4], LectraAI is transcript-only and produces multiple artifact types; it does not use a visual channel and does not, on current evidence, make a quality claim. Its timestamp mechanism is far simpler than learned temporal grounding [15], [16] and is evaluated here only on coverage and divergence.

---

## VIII. Limitations

1. **Small dataset (N = 7)** — below the size at which the reported statistics should be treated as population estimates.
2. **Limited domain and format diversity** — four subject domains; no coding-implementation or numerical lecture; five of seven lectures under 15 minutes; a single lecture above 20 minutes.
3. **No human timestamp ground truth** — RQ1 accuracy is unevaluated.
4. **No human artifact ratings** — RQ2 quality is unevaluated; only one lecture has any comparison data.
5. **No human claim-level groundedness labels** — RQ3 is unevaluated; the one automated proxy attempted was rejected for construct-invalidity and is not used.
6. **Excluded extractive baseline** — incompatible with spoken-lecture transcript formatting; excluded rather than modified.
7. **Model configuration variability** — sampling parameters are not pinned or recorded; the implementation documentation and code disagree on the model identifier (recorded runs used `gemini-3.6-flash`).
8. **Single measurement window** — RQ4 latency reflects one session's network and API conditions.
9. **No generalization claim** — no finding is claimed beyond the evaluated seven-lecture sample.
10. **No comparison with third-party systems** — all comparisons are internal (deterministic vs. a purpose-built direct-LLM baseline).
11. **Tooling limitation for dataset growth** — automated discovery of additional verifiable lecture identifiers was not achievable with the available tools.
12. **No OCR / multimodal input and no user study** — these are absent by design, not assumed.

---

## IX. Future Work

The immediate priorities, for which infrastructure is already prepared and released:

- **Collect human timestamp annotations** for the seven lectures (and an expanded set) using the released tolerance-window protocol, then compute MAE, median error, and ±5/10/30 s accuracy for the LectraAI mechanism and the naive baseline (RQ1).
- **Conduct the blinded human artifact evaluation** (quiz, flashcards, interview questions) comparing deterministic and direct-LLM conditions across multiple lectures, using the released rubric and blinding procedure (RQ2).
- **Collect claim-level groundedness labels** for the constrained vs. unconstrained prompt conditions using the released claim-segmentation, then compute unsupported-claim rates (RQ3).
- **Expand the dataset** toward 18–20 lectures with explicit coverage of coding and numerical lecture types and of medium/long durations, ideally from a curated URL list or a platform data API.
- **Pin and record model sampling parameters** and reconcile the model-identifier discrepancy for full reproducibility.
- **Investigate the coverage failure mode** — the keyword-overlap threshold and its behaviour on acronym-heavy topic titles — and evaluate stronger timestamp-alignment methods.
- **Broaden the RQ4 measurement** across multiple sessions and network conditions, and to longer lectures near the truncation boundary.

---

## X. Conclusion

We presented LectraAI, an instrumented, end-to-end framework that turns a lecture video into a structured study pack using a single grounded LLM call for the notes and deterministic transformation for the remaining artifacts, with a duration-bounded heuristic for topic timestamps. On seven real computer-science lectures we found that the timestamp mechanism covers 56% of topics (with two lectures at 0%), that the deterministic quiz is markedly less lexically diverse than a direct-LLM alternative on the one lecture compared, and that end-to-end latency is strongly correlated with transcript length and dominated by the model call. Human evaluation of timestamp accuracy, artifact quality, and groundedness was designed and prepared but not collected, so three of four research questions remain inconclusive. Rather than overstate the outcome, we release the full evaluation infrastructure and identify the specific human studies needed to complete the assessment. The contribution of this paper is a working system, a reproducible evaluation methodology with released materials, and an honest, bounded account of what seven lectures of real data do and do not show.

---

## References

[1] E. Apostolidis, E. Adamantidou, A. I. Metsai, V. Mezaris, and I. Patras, "Video summarization using deep neural networks: A survey," *arXiv:2101.06072*, 2021.

[2] D. W. Lee, C. Ahuja, P. P. Liang, S. Natu, and L.-P. Morency, "Multimodal lecture presentations dataset: Understanding multimodality in educational slides," in *Proc. IEEE/CVF Int. Conf. Computer Vision (ICCV)*, 2023. arXiv:2208.08080.

[3] K. Kuhn, V. Kersken, B. Reuter, N. Egger, and G. Zimmermann, "Measuring the accuracy of automatic speech recognition solutions," *ACM Trans. Accessible Computing*, vol. 16, no. 4, 2023, doi:10.1145/3636513.

[4] C. Xu, R. Wang, S. Lin, X. Luo, B. Zhao, L. Shao, and M. Hu, "Lecture2Note: Automatic generation of lecture notes from slide-based educational videos," in *Proc. IEEE Int. Conf. Multimedia and Expo (ICME)*, 2019, pp. 898–903.

[5] T. Shahzad, T. Mazhar, M. U. Tariq, W. Ahmad, K. Ouahada, and H. Hamam, "A comprehensive review of large language models: Issues and solutions in learning environments," *Discover Sustainability*, Springer, 2025, doi:10.1007/s43621-025-00815-8.

[6] J. Lin, J. Rao, Y. Zhao, Y. Wang, A. Gurung, A. Barany, J. Ocumpaugh, R. S. Baker, and K. R. Koedinger, "Automatic large language models creation of interactive learning lessons," *arXiv:2506.17356*, 2025.

[7] N. Scaria, S. D. Chenna, and D. Subramani, "Automated educational question generation at different Bloom's skill levels using large language models: Strategies and evaluation," in *Proc. Int. Conf. Artificial Intelligence in Education (AIED)*, 2024. arXiv:2408.04394.

[8] E. Alhazmi, Q. Z. Sheng, W. E. Zhang, M. Zaib, and A. Alhazmi, "Distractor generation in multiple-choice tasks: A survey of methods, datasets, and evaluation," in *Proc. Conf. Empirical Methods in Natural Language Processing (EMNLP)*, 2024. arXiv:2402.01512.

[9] G. Biancini, A. Ferrato, and C. Limongelli, "Multiple-choice question generation using large language models: Methodology and educator insights," in *Adjunct Proc. ACM Conf. User Modeling, Adaptation and Personalization (UMAP)*, 2024, doi:10.1145/3631700.3665233.

[10] Z. Qiu, X. Wu, and W. Fan, "Automatic distractor generation for multiple choice questions in standard tests," in *Proc. Int. Conf. Computational Linguistics (COLING)*, 2020. arXiv:2011.13100.

[11] M. A. Ehsan, A. S. M. M. Hasan, K. B. Shahnoor, and S. S. Tasneem, "Automatic question & answer generation using generative large language model (LLM)," *arXiv:2508.19475*, 2025 (preprint).

[12] B. Paddags, D. Hershcovich, and V. Savage, "Automated sentence generation for a spaced repetition software," in *Proc. Workshop on Innovative Use of NLP for Building Educational Applications (BEA), ACL*, 2024, aclanthology.org/2024.bea-1.29.

[13] J. I. Kaczmarek, J. Pokrywka, K. Biedalak, G. Kurzyp, and Ł. Grzybowski, "Optimizing retrieval-augmented generation of medical content for spaced repetition learning," *arXiv:2503.01859*, 2025 (preprint).

[14] B. Tabibian, U. Upadhyay, A. De, A. Zarezade, B. Schölkopf, and M. Gomez-Rodriguez, "Enhancing human learning via spaced repetition optimization," *Proc. National Academy of Sciences (PNAS)*, vol. 116, no. 10, pp. 3988–3993, 2019, doi:10.1073/pnas.1815156116.

[15] H. Zhang, A. Sun, W. Jing, and J. T. Zhou, "Temporal sentence grounding in videos: A survey and future directions," *IEEE Trans. Pattern Analysis and Machine Intelligence*, 2023. arXiv:2201.08071.

[16] M. Liu, L. Nie, Y. Wang, M. Wang, and Y. Rui, "A survey on video moment localization," *ACM Computing Surveys*, 2023, doi:10.1145/3556537.

[17] L. Huang, W. Yu, W. Ma, W. Zhong, Z. Feng, H. Wang, Q. Chen, W. Peng, X. Feng, B. Qin, and T. Liu, "A survey on hallucination in large language models: Principles, taxonomy, challenges, and open questions," *arXiv:2311.05232*, 2023.

[18] E. Peltekova, D. Miteva, and I. Patias, "Hallucination in LLM-based educational tools: Risks and solutions for reliable learning," *Journal of Business Innovation and Governance*, 2026.

[19] R. Zhao, Z. Jiang, X. Zhang, C. Chang, H. Chen, W. Deng, L. Jin, X. Qi, X. Qian, and E. C. H. Ngai, "NoteIt: A system converting instructional videos to interactable notes through multimodal video understanding," in *Proc. ACM Symp. User Interface Software and Technology (UIST)*, 2025, doi:10.1145/3746059.3747626.

---

### Figure list

- **Fig. 1.** LectraAI pipeline architecture (schematic of the verified implementation; AI-generated vs. deterministic stages). Source: `research/paper/figures/fig0_architecture.png`.
- **Fig. 2.** Dataset duration distribution (N = 7). Source: `research/results/processed/phase5_5/figures/fig1_dataset_duration_distribution.png`.
- **Fig. 3.** LectraAI topic–timestamp coverage by lecture (N = 7, 25 topics; not an accuracy measure). Source: `.../fig2_topic_timestamp_coverage.png`.
- **Fig. 4.** Quiz distractor uniqueness, one lecture (a diversity metric, not a quality rating). Source: `.../fig3_distractor_uniqueness.png`.
- **Fig. 5.** End-to-end latency vs. transcript length (N = 7; Pearson r = 0.98, p < 0.001; correlation, not causation). Source: `.../fig4_latency_vs_transcript_length.png`.
- **Fig. 6.** Latency by processing stage (N = 7; error bars = SD). Source: `.../fig5_latency_stage_breakdown.png`.
