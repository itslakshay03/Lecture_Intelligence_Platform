"""
Builds LECTRAAI_IEEE_RESEARCH_PAPER.pdf (via Playwright, the same engine the
LectraAI product uses) and LECTRAAI_IEEE_RESEARCH_PAPER.docx (via python-docx)
from a single shared content structure.

Content is identical to LECTRAAI_IEEE_RESEARCH_PAPER.md / latex/*.tex. No
numeric value here is new: all are traceable via PAPER_TRACEABILITY.md.

Run:  ../../backend/venv/Scripts/python.exe build_outputs.py
"""
import base64
import subprocess
import sys
import textwrap
from pathlib import Path

HERE = Path(__file__).resolve().parent
FIGDIR = HERE / "figures"
RESULTS_FIGDIR = HERE.parents[1] / "research" / "results" / "processed" / "phase5_5" / "figures" \
    if (HERE.parents[1] / "research").exists() else HERE / "figures"

TITLE = ("LectraAI: An AI-Assisted Lecture-to-Study-Pack Framework with "
         "Duration-Bounded Timestamp Grounding and Deterministic Multi-Format "
         "Artifact Transformation")
# --- Author block (three group members). Names, roll numbers, emails and the
# --- department are as supplied by the authors. The source manuscript carried
# --- no institution name, so INSTITUTION is left as an explicit placeholder
# --- rather than guessed. CITY is as given by the authors.
AUTHORS = [
    {"name": "Lakshay Anand",     "roll": "2300320130137", "email": "lakshayanand3939@gmail.com"},
    {"name": "Harshit Chaudhary", "roll": "2300320130113", "email": "officialharshit111@gmail.com"},
    {"name": "Ayush Mavi",        "roll": "2300320130078", "email": "ayushmavi2004@gmail.com"},
]
DEPT = "Information Technology"
INSTITUTION = "ABES Engineering College"
CITY = "Ghaziabad, India"

ABSTRACT = (
    "Converting long recorded lectures into structured, revision-ready study material is "
    "time-consuming, and simple summarization alone does not produce the varied artifacts "
    "(organized notes, quizzes, flashcards, revision schedules, interview questions) that "
    "learners use when preparing for assessments. This paper presents LectraAI, an end-to-end "
    "framework that takes a lecture video, extracts and cleans its transcript, generates "
    "structured study notes with a single large-language-model (LLM) call constrained by an "
    "explicit transcript-grounding prompt, associates generated topics with points in the "
    "lecture using a duration-bounded keyword-overlap heuristic, and then produces the remaining "
    "study artifacts through deterministic (template and regular-expression) transformation of "
    "the generated notes rather than through additional model calls. We describe the implemented "
    "system, an instrumented evaluation methodology, and an initial evaluation on seven real "
    "computer-science lectures. Within this sample we report: (i) that the timestamp mechanism "
    "assigned a topic-level timestamp to 56.0% of topics (14 of 25), with two of seven lectures "
    "receiving none - a coverage characteristic, not a validated accuracy result; (ii) an "
    "objective sub-finding on one lecture that the deterministic quiz produced markedly less "
    "lexically diverse answer options (44.4% unique) than a direct-LLM alternative built from the "
    "same notes (100% unique); and (iii) that end-to-end processing latency was strongly and "
    "significantly correlated with transcript length (Pearson r = 0.98, p < 0.001, n = 7), with "
    "the single LLM call accounting for a mean of 58.7% of processing time. Human evaluation of "
    "timestamp accuracy, artifact quality, and note groundedness was designed and prepared but "
    "not collected; consequently three of the four research questions remain inconclusive. We "
    "report these limitations explicitly and release the annotation and evaluation infrastructure."
)

KEYWORDS = ("lecture summarization, educational content generation, large language models, "
            "timestamp grounding, deterministic transformation, study-pack generation, "
            "transcript processing, reproducible evaluation")

# ---- Body: list of (kind, payload) blocks -------------------------------------
# kind in {h1, h2, p, fig, table}
BODY = []
def h1(t): BODY.append(("h1", t))
def h2(t): BODY.append(("h2", t))
def p(t):  BODY.append(("p", textwrap.dedent(t).strip()))
def fig(path, cap, label): BODY.append(("fig", (path, cap, label)))
def table(caption, headers, rows, label): BODY.append(("table", (caption, headers, rows, label)))

h1("I. Introduction")
p("""Recorded lectures are now a primary learning resource, but consuming them for revision is
inefficient: a learner must re-watch long videos, pause to take notes, and separately construct
practice questions and a revision schedule. Automatic summarization of lecture transcripts
addresses only part of this workload. Learners preparing for examinations typically rely on
several distinct artifact types - organized notes, self-test quizzes, flashcards for spaced
recall, a revision timeline, and, in professional contexts, interview-style questions - and they
benefit from being able to jump back to the moment in the lecture where a concept was introduced.
Producing all of these by hand is laborious, and producing each with a separate LLM call is
costly and introduces additional opportunities for ungrounded or inconsistent content.""")
p("""This paper describes LectraAI, a framework that occupies a specific point in this design
space: it uses the LLM once, to generate structured notes under an explicit grounding constraint,
and then derives topics, a quiz, flashcards, a revision plan, and interview questions from those
notes through deterministic transformation (template filling and regular-expression extraction).
Timestamps for generated topics are produced by a lightweight, non-learned heuristic that matches
topic keywords against transcript cue markers and validates the result against the video's true
duration. The system also renders a printable PDF study pack, persists task state in SQLite, and
instruments each processing stage for measurement.""")
p("""We frame the investigation around four research questions, whose evidence status is drawn from
the project's internal audit. RQ1 - Timestamp grounding: How accurately does LectraAI's timestamp
mechanism associate generated study content with relevant points in the lecture? RQ2 - Artifact
generation strategy: How does LectraAI's deterministic artifact transformation compare with
direct LLM-generated educational artifacts in terms of artifact quality? RQ3 - Prompt ablation /
groundedness: How do explicit grounding constraints in the LectraAI prompt affect the
groundedness of generated notes relative to an unconstrained prompt? RQ4 - Processing efficiency:
How does lecture/transcript length relate to end-to-end processing latency?""")
p("""Contributions. We classify our contributions conservatively. (1) (System / engineering) An
end-to-end, instrumented lecture-to-study-pack architecture combining dual-strategy transcript
extraction, single-call grounded note generation, a duration-bounded timestamp-association
heuristic, deterministic multi-format artifact transformation, PDF assembly, and task persistence
with graceful model fallback. (2) (System / methodological) A duration-bounded
timestamp-association mechanism that constrains topic-time associations using the video's true
duration and embedded transcript cue markers, with a reproducible protocol for evaluating its
coverage and its divergence from a naive baseline in the absence of human ground truth. (3)
(Methodological) An experimental framework - with released baselines and materials - for
comparing (a) deterministic artifact transformation against direct-LLM artifact generation from
identical notes, and (b) grounded against unconstrained prompting, holding the transcript and
model fixed. (4) (Empirical, evaluated-sample only) An analysis of end-to-end processing latency
with respect to transcript length on seven real lectures, including a per-stage breakdown. We do
not claim that LectraAI produces accurate timestamps, higher-quality artifacts than an LLM
baseline, or reduced hallucination; the evidence required for those claims (human annotation and
rating) was not collected.""")

h1("II. Related Work")
p("""Lecture and educational-video summarization. Deep-learning approaches to video summarization
are surveyed by Apostolidis et al. [1]. Lecture-specific note generation from slide-based videos
was demonstrated by Xu et al. [4], and multimodal lecture understanding has a dedicated benchmark
from Lee et al. [2]. Transcript quality is an upstream variable: Kuhn et al. [3] measure
commercial ASR accuracy on higher-education lectures and find wide vendor variation. LectraAI
consumes platform-provided captions rather than performing its own speech recognition, and
operates on transcript text only.""")
p("""LLM-based educational content generation. Broad reviews of LLMs in learning environments
discuss personalization, adaptability, and factual-reliability concerns [5]. Lin et al. [6]
report that decomposing generation into sub-tasks improves human-rated lesson quality relative to
single-step generation - relevant to LectraAI's single-call design, which trades that potential
gain for cost and consistency.""")
p("""Automatic question and distractor generation. Educational question generation with LLMs,
including Bloom's-taxonomy alignment, is studied by Scaria et al. [7], with
methodology-and-educator-insight work by Biancini et al. [9]. Distractor generation is surveyed
by Alhazmi et al. [8]; neural distractor generation predates the LLM era [10], and preprint work
explores fine-tuned question generation [11]. A consistent theme is that automated evaluation
does not substitute for human judgement of question quality. LectraAI's quiz is produced by fixed
templates rather than by a model.""")
p("""Flashcards and spaced repetition. Sentence generation for spaced-repetition practice has been
evaluated with real learners by Paddags et al. [12], and retrieval-augmented generation of such
content by Kaczmarek et al. [13]. Optimal, learner-adaptive review scheduling is established by
Tabibian et al. [14]. LectraAI's flashcards are extracted verbatim from the generated notes, and
its revision plan is a fixed schedule with no learner-performance input.""")
p("""Temporal grounding. Associating natural-language content with points in a video has two
recent surveys [15], [16]; state-of-the-art methods are learned and multimodal. LectraAI's
timestamp mechanism is deliberately simpler - text-only keyword overlap against transcript cue
markers, bounded by video duration - and is evaluated here only on coverage and divergence.""")
p("""Hallucination and grounding. Hallucination in LLMs is surveyed by Huang et al. [17], with
education-specific risk discussion by Peltekova et al. [18]; mitigation in the literature is
dominated by retrieval augmentation and fine-tuning. LectraAI instead uses prompt-only negative
constraints, which our RQ3 was designed to ablate.""")
p("""Integrated systems. The closest prior integrated system is NoteIt [19], which converts
instructional videos into interactive notes through multimodal understanding and was user-tested.
LectraAI differs in being transcript-only and producing several distinct artifact types; the
combination of artifact types is not claimed as a novelty in itself.""")

h1("III. The LectraAI Framework")
h2("A. Overview")
p("""Fig. 1 shows the implemented pipeline. A lecture URL is submitted; the backend creates an
asynchronous task, extracts and cleans the transcript, issues one grounded LLM call to generate
Markdown study notes, applies regular-expression clean-up, and then performs deterministic
transformation of the notes into: segmented topics, topic timestamps, a multiple-choice quiz,
flashcards, a five-stage revision plan, and tiered interview questions. The study pack is
serialized to JSON, rendered to a PDF, and the task's terminal state plus per-stage
instrumentation are stored in SQLite.""")
p("""Critical distinction. Only the note-generation stage is model-generated. Topics, timestamps,
quiz, flashcards, revision plan, and interview questions are produced by template and
regular-expression logic operating on the generated notes; no further model call is made. We
describe the system as AI-assisted study-pack generation followed by deterministic multi-format
transformation, and avoid the phrasing "AI-generated" for the derived artifacts.""")
fig("fig0_architecture.png",
    "LectraAI pipeline architecture (schematic of the verified implementation). "
    "Pink: the single AI-generated stage (one Gemini call). Blue: deterministic transformation "
    "and processing. Grey: input, output, and persistence. Derived artifacts are transformations "
    "of the generated notes, not independent model outputs.", "1")
h2("B. Transcript acquisition and cleaning")
p("""The transcript is obtained by a dual-strategy fetcher: first via a subtitle-download path
(yt-dlp with optional authenticated cookies), then, on failure, via a transcript API. Retrieved
captions are concatenated with an inserted [MM:SS] (or [H:MM:SS] past one hour) cue marker
whenever a gap of at least 60 s occurs between consecutive caption segments; the video duration
is captured from the fetch metadata. The transcript is de-duplicated, stripped of common
spoken-filler and channel-promotional phrases via regular expressions, and truncated to a maximum
of 120,000 characters before the model call. In the evaluated dataset the longest transcript was
59,821 characters, so truncation never triggered.""")
h2("C. Grounded note generation")
p("""A single call is made with a prompt (SMART_PROMPT_v1) containing an explicit block of strict
negative constraints: write only content traceable to the transcript; do not complete the lecture
with outside knowledge; do not invent examples or analogies; preserve the lecturer's claim
strength. The model returns one Markdown document. A subsequent regular-expression pass removes
residual transcript intros, generic section titles, and internal identifiers, and softens a small
set of over-strong phrasings. If every model/API attempt fails, a local non-model heuristic note
generator is used; the evaluated runs did not trigger this path.""")
h2("D. Deterministic transformation")
p("""From the generated notes: topics come from splitting on level-two headings (title, text, up
to six bullet key points, optional diagram block); timestamps from Section IV-B; quiz items from
fixed question templates per topic with incorrect options drawn from a small fixed pool of
generic sentences, then correct-option position shuffled; flashcards by pairing each extracted
bold term with its containing sentence; revision plan as a fixed five-stage schedule (24 h, 3 d,
7 d, 14 d, 30 d) with only the per-stage topic-title list varying; interview questions from fixed
templates assigned round-robin to difficulty tiers by topic index.""")
h2("E. Assembly, rendering, persistence")
p("""Artifacts are assembled into one JSON study pack (also exposing the raw notes, video
duration, and grounded timestamp list). Notes are converted Markdown-to-HTML and rendered to an
A4 PDF by a headless-browser subprocess. Task lifecycle (pending -> processing -> completed |
failed) is persisted in SQLite; a startup routine marks any task left in processing as failed.
Repeat submissions are served from a file cache keyed by video identifier unless a forced refresh
is requested.""")
h2("F. Research instrumentation")
p("""For measurement, the task record additionally stores the generation method (model vs. offline
fallback), the model that responded, the prompt version, and the transcript character count; a
separate table stores start/end timestamps for the transcript-fetch, AI-generation,
transformation, and PDF-render stages. This instrumentation is additive and does not alter
processing behaviour (the system's test suite passes unchanged with it enabled).""")

h1("IV. Methodology")
p("""We separate the production system (Section III) from research-only components (baselines and
evaluation scripts used only for this study, never invoked by the deployed pipeline).""")
h2("A. Lecture acquisition")
p("""Lectures were selected as publicly accessible computer-science lectures with usable captions,
an identifiable duration, and coherent content. Each was processed once through the unmodified
production pipeline with a forced refresh so all instrumentation fields were populated by a
genuine run.""")
h2("B. Duration-bounded timestamp association")
p("""For a topic with title t and video duration D: (i) if the topic text contains an explicit cue
at second s with 0 <= s < D, assign it; otherwise (ii) extract search terms from the cleaned
title, score each transcript cue by the number of search terms present in its text (with a small
bonus for domain acronyms), and assign the highest-scoring cue with 0 <= s < D provided its score
is at least 1. Topics for which no cue clears the threshold receive no topic-level timestamp. The
final list is sorted chronologically and entries with s >= D discarded.""")
p("""Two quantities are computed without human ground truth. Topic-timestamp coverage is the
fraction of generated topics that received a timestamp. Divergence from a naive baseline is, for
timestamped topics, the mean of the per-topic absolute error e_i = | s_hat_i - b_i |, where
b_i = i * D / n is the naive equal-interval position for topic i of n, and s_hat_i is the
assigned second. Both quantities are descriptive; neither is an accuracy measure.""")
h2("C. Research-only baselines")
p("""(1) Naive equal-interval timestamps, the null comparison for RQ1. (2) Direct-LLM artifact
generator: given the same generated notes, one model call per artifact type requesting the same
JSON structure; the comparison condition for RQ2; not part of LectraAI. (3) Unconstrained note
prompt: SMART_PROMPT_v1 with only the constraint block removed, everything else identical;
programmatically verified to differ only in that block; the comparison condition for RQ3. An
extractive TF-IDF summarization baseline was implemented but excluded after a real-transcript
trial showed spoken-lecture transcripts collapse its sentence segmentation; it is reported as an
excluded baseline, not tuned to perform better.""")
h2("D. Metrics and their evidence requirements")
p("""Timestamp accuracy (RQ1): |t_pred - t_ref| against a human reference window, aggregated as
MAE, median absolute error, and percentage within +/-5/10/30 s. Requires human reference
timestamps; not computed. A tolerance-window protocol and per-lecture annotation packages were
prepared for all seven lectures. Artifact quality (RQ2): blinded human ratings (correctness,
relevance, coverage, distractor plausibility, difficulty; 1-5). Not collected. Two objective
structural metrics were computed instead - distractor uniqueness (unique distractor strings
divided by total) and flashcard verbatim overlap (answers found verbatim in notes divided by
total) - and are labelled as diversity/behaviour, not quality. Groundedness (RQ3): human
claim-level classification against the transcript, aggregated as an unsupported-claim rate. Not
collected. An automated proxy was attempted and excluded for construct-invalidity (miscounting
Markdown headers as claims; missing orthographic variants). A mechanical claim-segmentation (58
units) was prepared for a future human pass. Latency (RQ4): per-stage and total wall-clock time
from instrumentation; its relationship to transcript length via the Pearson correlation. Requires
no human judgement; computed.""")
h2("E. Statistical analysis")
p("""Descriptive statistics are reported for all quantities. For RQ4, the Pearson correlation
between transcript character count and total latency is reported with its two-sided p-value at
n = 7. No inferential test is applied to RQ1-RQ3: RQ1 has no ground truth, and RQ2/RQ3 have
single-lecture data. All previously reported values were independently recalculated from raw data
during the project's audit (9 of 9 confirmed; one aggregation-convention ambiguity disclosed in
Section VI-D).""")

h1("V. Experimental Setup")
h2("A. Dataset")
p("""The evaluated dataset consists of N = 7 real computer-science lectures (Table I). All seven
were processed successfully via a genuine model call (0 offline-fallback invocations, 0
failures); the responding model was recorded as gemini-3.6-flash for every run, under prompt
version SMART_PROMPT_v1. The dataset is small, skewed toward short lectures, contains no
coding-implementation or numerical lecture, and represents four subject domains. A
dataset-expansion attempt did not yield additional individually-verifiable lecture identifiers
with the available tooling.""")
table("TABLE I. Dataset characteristics (N = 7).",
      ["Property", "Value"],
      [["Lectures", "7"],
       ["Duration (s): mean / median", "1163.9 / 777.0"],
       ["  min / max / SD", "393.0 / 3702.3 / 1140.9"],
       ["Duration bands", "Short (<=15 min): 5; Medium: 1; Long (>45 min): 1"],
       ["Transcript length (chars): mean / median", "17,109 / 10,590"],
       ["  min / max / SD", "5,326 / 59,821 / 19,006"],
       ["Subject domains", "OS: 2; Networks: 2; DBMS: 2; AI: 1"],
       ["Lecture-type categories", "Comparison: 3; Architecture: 2; Algorithm: 1; Theory: 1"],
       ["Caption source recorded", "0 of 7"],
       ["Language", "English (all 7)"]], "I")
fig("fig1_dataset_duration_distribution.png",
    "Lecture-duration distribution of the evaluated dataset (N = 7). Five lectures are under "
    "15 minutes; one exceeds 45 minutes.", "2")
h2("B. Human evaluation status")
p("""Human timestamp annotations: 0. Human artifact ratings: 0. Human claim-level groundedness
labels: 0. The corresponding infrastructure (protocols, schemas, per-lecture packages, rubrics,
blinding procedure) is complete and released; only the human-collected data is absent.""")
h2("C. Reproducibility notes")
p("""The implementation documentation names a different model identifier (gemini-2.5-flash) than
the code's fallback list; the instrumentation recorded gemini-3.6-flash as the responder for all
seven runs, and that value is authoritative here. Sampling parameters (temperature, top-p) are
not set in the code and not independently recorded - an acknowledged reproducibility limitation.
All raw/processed result files, the seven study-pack JSON outputs, the figures, and the analysis
scripts are in the project repository.""")

h1("VI. Results")
h2("A. RQ1 - Timestamp grounding (INCONCLUSIVE)")
p("""Across the seven lectures the pipeline generated 25 topics; the timestamp mechanism assigned
a topic-level timestamp to 14 (56.0% coverage). Two lectures received no topic-level timestamps
at all. For the 14 timestamped topics, the assigned times diverged from the naive equal-interval
baseline by a mean of 147.3 s (median 124.0 s, SD 93.0 s; Table II). Fig. 3 shows per-lecture
coverage.""")
table("TABLE II. RQ1 - timestamp coverage and divergence from the naive baseline.",
      ["Lecture", "Topics", "With timestamp", "Mean |diff| vs. naive (s)"],
      [["3MqyDWDpZoI", "5", "3", "150.2"],
       ["1msEo8PIcbw", "3", "0", "-"],
       ["T4lGm7MjA6Y", "5", "0", "-"],
       ["uDulBxDb7GM", "3", "2", "168.5"],
       ["VyvTabQHevw", "2", "2", "101.3"],
       ["WJ-UaAaumNA", "5", "5", "143.5"],
       ["ZtVw2iuFI2w", "2", "2", "177.0"],
       ["Total / mean", "25", "14 (56.0%)", "147.3 (n=14)"]], "II")
p("""Interpretation. Coverage of 56% is an output characteristic of the mechanism, not a validated
accuracy measure; without human reference timestamps we cannot say whether the assigned times are
correct, and large divergence from the naive baseline could indicate either better or worse
localization. RQ1 is inconclusive.""")
fig("fig2_topic_timestamp_coverage.png",
    "LectraAI topic-timestamp coverage by lecture (N = 7, 25 topics). Not an accuracy measure. "
    "Two lectures have zero topic-level coverage.", "3")
h2("B. RQ2 - Artifact generation strategy (INCONCLUSIVE; one narrow diversity sub-finding)")
p("""Direct-LLM comparison artifacts were generated from the notes of one lecture (3MqyDWDpZoI),
using the same model and source notes as the production pipeline. Two objective structural
metrics were computed (Table III, Fig. 4).""")
table("TABLE III. RQ2 - objective structural metrics (one lecture, 3MqyDWDpZoI).",
      ["Metric", "LectraAI (det.)", "Direct-LLM"],
      [["Quiz distractor uniqueness", "8/18 (44.4%)", "27/27 (100.0%)"],
       ["Flashcard answer verbatim in notes", "10/10 (100.0%)", "1/9 (11.1%)"]], "III")
p("""Interpretation. The distractor-diversity difference is a real, objective, single-lecture
observation consistent with the design (fixed templates vs. content-specific generation). It is a
diversity result, not a quality result: a diverse distractor may still be wrong, and a
repeated-template distractor may still be a valid incorrect option. Overall artifact-quality
superiority of either approach was not established - no human ratings exist for any artifact
type, and only one lecture was compared. RQ2 is inconclusive, with one narrow supported
sub-finding on distractor diversity.""")
fig("fig3_distractor_uniqueness.png",
    "Quiz distractor uniqueness for one lecture. A diversity metric, not a correctness or "
    "quality rating.", "4")
h2("C. RQ3 - Prompt ablation / groundedness (INCONCLUSIVE)")
p("""Notes were generated for one lecture under both the constrained production prompt and the
unconstrained prompt, from the identical transcript and model; the prompts were verified to
differ only in the removed constraint block (constrained notes: 3,890 characters; unconstrained:
3,763). An automated groundedness proxy was attempted and excluded for construct-invalidity. No
human claim-level groundedness labels were collected. RQ3 is inconclusive because human ground
truth was not collected; a mechanical claim-segmentation (58 units) has been prepared for a
future human pass.""")
h2("D. RQ4 - Processing efficiency (SUPPORTED for the evaluated sample)")
p("""Per-lecture and aggregate latency are in Table IV. Total end-to-end latency had a mean of
39.2 s (median 34.2 s, SD 12.2 s, range 32.0-66.3 s). The single AI-generation call was the
dominant stage in every case, at a mean of 58.7% of total latency per lecture (an alternative
aggregation - the ratio of the two means - gives 59.9%; both are reported). The deterministic
transformation stage was negligible (mean 0.05 s). There were 0 model-fallback invocations and 0
failures.""")
table("TABLE IV. RQ4 - per-lecture processing latency (seconds).",
      ["Lecture", "Chars", "Fetch", "AI gen.", "Transf.", "PDF", "Total"],
      [["uDulBxDb7GM", "8,556", "9.39", "17.13", "0.03", "5.04", "31.98"],
       ["ZtVw2iuFI2w", "10,424", "5.08", "19.02", "0.11", "7.92", "32.41"],
       ["VyvTabQHevw", "11,553", "9.15", "19.37", "0.04", "4.52", "33.27"],
       ["3MqyDWDpZoI", "5,326", "9.99", "19.06", "0.04", "4.78", "34.25"],
       ["WJ-UaAaumNA", "13,495", "9.01", "24.25", "0.04", "4.52", "38.01"],
       ["1msEo8PIcbw", "10,590", "13.28", "19.89", "0.03", "4.86", "38.21"],
       ["T4lGm7MjA6Y", "59,821", "14.90", "45.73", "0.09", "5.46", "66.34"],
       ["Mean", "17,109", "10.12", "23.49", "0.05", "5.30", "39.21"]], "IV")
p("""The Pearson correlation between transcript character count and total latency was r = 0.98
(p ~ 8.9e-5, i.e. p < 0.001; n = 7). Fig. 5 plots the relationship; Fig. 6 shows the per-stage
breakdown.""")
fig("fig4_latency_vs_transcript_length.png",
    "End-to-end latency vs. transcript length (N = 7; Pearson r = 0.98, p < 0.001). "
    "Correlation, not causation; the dashed line is a descriptive trend only.", "5")
fig("fig5_latency_stage_breakdown.png",
    "Latency by processing stage (N = 7; error bars = SD). The single model call dominates.", "6")
p("""Interpretation. Within this seven-lecture sample, transcript length shows a strong,
statistically significant positive association with end-to-end latency, and processing time is
dominated by the single model call. This is a correlation, not a causal relationship, and it is
specific to this sample and this measurement window: latency includes network-dependent
components that vary over time, and the sample spans only three duration bands with a single
lecture above 20 minutes. We do not claim linear or universal scaling.""")
h2("E. Result validation")
p("""All nine quantitative results reported earlier in the project were independently recalculated
from raw data and confirmed. The only noted discrepancy is definitional: the AI-stage latency
share can be aggregated as a per-lecture mean of ratios (58.7%) or a ratio of means (59.9%); we
report both.""")

h1("VII. Discussion")
p("""What the evidence supports. Two claims are defensible. First, the timestamp mechanism has
incomplete coverage - 56% of topics overall, 0% for two of seven lectures - independent of any
accuracy question: the mechanism sometimes produces nothing to evaluate. The likely cause is the
keyword-overlap score's minimum threshold combined with terse, acronym-heavy topic titles and
sparse cue text. Second, within the evaluated sample, latency scales with transcript length and
is dominated by the model call; the practical implication is that the model call is the component
to optimize or budget for.""")
p("""What the evidence does not support. We cannot conclude anything about timestamp accuracy,
about artifact quality relative to an LLM baseline, or about hallucination reduction. The
distractor-diversity result shows a real structural consequence of the template approach, but
structural diversity is necessary, not sufficient, for good distractors, and the result is from a
single lecture.""")
p("""Design implications. The single-call-plus-deterministic-transformation architecture has a
measured cost profile (~0.05 s derivation) and a measured structural limitation (low distractor
diversity). Whether that trade-off is acceptable depends on a quality measurement not yet made;
the literature [6], [7], [8], [10] suggests model-based generation tends to produce higher-rated
educational questions, motivating the RQ2 human study. Positioning: relative to NoteIt [19] and
prior lecture-note systems [2], [4], LectraAI is transcript-only and multi-artifact; it does not
use a visual channel and, on current evidence, makes no quality claim. Its timestamp mechanism is
far simpler than learned temporal grounding [15], [16].""")

h1("VIII. Limitations")
p("""(1) Small dataset (N = 7). (2) Limited domain/format diversity - no coding or numerical
lecture; five of seven under 15 minutes. (3) No human timestamp ground truth (RQ1 accuracy
unevaluated). (4) No human artifact ratings (RQ2 quality unevaluated; one lecture only). (5) No
human groundedness labels (RQ3 unevaluated; automated proxy rejected). (6) Excluded extractive
baseline (transcript-format incompatibility). (7) Model configuration variability - sampling
parameters unpinned; documentation/code disagree on the model identifier. (8) Single measurement
window for RQ4. (9) No generalization claim beyond the seven-lecture sample. (10) No comparison
with third-party systems. (11) Tooling limitation for dataset growth. (12) No OCR/multimodal
input and no user study, by design.""")

h1("IX. Future Work")
p("""Infrastructure is prepared and released for: collecting human timestamp annotations and
computing MAE / median error / +/-5/10/30 s accuracy (RQ1); the blinded human artifact evaluation
across multiple lectures (RQ2); claim-level groundedness labelling for the two prompt conditions
(RQ3); dataset expansion to 18-20 lectures with coding/numerical coverage; pinning and recording
model sampling parameters; investigating the timestamp coverage-failure mode and evaluating
stronger alignment methods; and broadening the RQ4 measurement across sessions and to longer
lectures.""")

h1("X. Conclusion")
p("""We presented LectraAI, an instrumented, end-to-end framework that turns a lecture video into
a structured study pack using a single grounded LLM call for the notes and deterministic
transformation for the remaining artifacts, with a duration-bounded heuristic for topic
timestamps. On seven real computer-science lectures we found that the timestamp mechanism covers
56% of topics (two lectures at 0%), that the deterministic quiz is markedly less lexically
diverse than a direct-LLM alternative on the one lecture compared, and that end-to-end latency is
strongly correlated with transcript length and dominated by the model call. Human evaluation of
timestamp accuracy, artifact quality, and groundedness was designed and prepared but not
collected, so three of four research questions remain inconclusive. We release the full
evaluation infrastructure and identify the specific human studies needed to complete the
assessment.""")

REFERENCES = [
 "E. Apostolidis, E. Adamantidou, A. I. Metsai, V. Mezaris, and I. Patras, \"Video summarization using deep neural networks: A survey,\" arXiv:2101.06072, 2021.",
 "D. W. Lee, C. Ahuja, P. P. Liang, S. Natu, and L.-P. Morency, \"Multimodal lecture presentations dataset: Understanding multimodality in educational slides,\" in Proc. IEEE/CVF ICCV, 2023. arXiv:2208.08080.",
 "K. Kuhn, V. Kersken, B. Reuter, N. Egger, and G. Zimmermann, \"Measuring the accuracy of automatic speech recognition solutions,\" ACM Trans. Accessible Computing, vol. 16, no. 4, 2023, doi:10.1145/3636513.",
 "C. Xu, R. Wang, S. Lin, X. Luo, B. Zhao, L. Shao, and M. Hu, \"Lecture2Note: Automatic generation of lecture notes from slide-based educational videos,\" in Proc. IEEE ICME, 2019, pp. 898-903.",
 "T. Shahzad, T. Mazhar, M. U. Tariq, W. Ahmad, K. Ouahada, and H. Hamam, \"A comprehensive review of large language models: Issues and solutions in learning environments,\" Discover Sustainability (Springer), 2025, doi:10.1007/s43621-025-00815-8.",
 "J. Lin, J. Rao, Y. Zhao, Y. Wang, A. Gurung, A. Barany, J. Ocumpaugh, R. S. Baker, and K. R. Koedinger, \"Automatic large language models creation of interactive learning lessons,\" arXiv:2506.17356, 2025.",
 "N. Scaria, S. D. Chenna, and D. Subramani, \"Automated educational question generation at different Bloom's skill levels using large language models: Strategies and evaluation,\" in Proc. AIED, 2024. arXiv:2408.04394.",
 "E. Alhazmi, Q. Z. Sheng, W. E. Zhang, M. Zaib, and A. Alhazmi, \"Distractor generation in multiple-choice tasks: A survey of methods, datasets, and evaluation,\" in Proc. EMNLP, 2024. arXiv:2402.01512.",
 "G. Biancini, A. Ferrato, and C. Limongelli, \"Multiple-choice question generation using large language models: Methodology and educator insights,\" in Adjunct Proc. ACM UMAP, 2024, doi:10.1145/3631700.3665233.",
 "Z. Qiu, X. Wu, and W. Fan, \"Automatic distractor generation for multiple choice questions in standard tests,\" in Proc. COLING, 2020. arXiv:2011.13100.",
 "M. A. Ehsan, A. S. M. M. Hasan, K. B. Shahnoor, and S. S. Tasneem, \"Automatic question & answer generation using generative large language model (LLM),\" arXiv:2508.19475, 2025 (preprint).",
 "B. Paddags, D. Hershcovich, and V. Savage, \"Automated sentence generation for a spaced repetition software,\" in Proc. Workshop on Innovative Use of NLP for Building Educational Applications (BEA), ACL, 2024, aclanthology.org/2024.bea-1.29.",
 "J. I. Kaczmarek, J. Pokrywka, K. Biedalak, G. Kurzyp, and L. Grzybowski, \"Optimizing retrieval-augmented generation of medical content for spaced repetition learning,\" arXiv:2503.01859, 2025 (preprint).",
 "B. Tabibian, U. Upadhyay, A. De, A. Zarezade, B. Scholkopf, and M. Gomez-Rodriguez, \"Enhancing human learning via spaced repetition optimization,\" Proc. National Academy of Sciences (PNAS), vol. 116, no. 10, pp. 3988-3993, 2019, doi:10.1073/pnas.1815156116.",
 "H. Zhang, A. Sun, W. Jing, and J. T. Zhou, \"Temporal sentence grounding in videos: A survey and future directions,\" IEEE Trans. Pattern Analysis and Machine Intelligence, 2023. arXiv:2201.08071.",
 "M. Liu, L. Nie, Y. Wang, M. Wang, and Y. Rui, \"A survey on video moment localization,\" ACM Computing Surveys, 2023, doi:10.1145/3556537.",
 "L. Huang et al., \"A survey on hallucination in large language models: Principles, taxonomy, challenges, and open questions,\" arXiv:2311.05232, 2023.",
 "E. Peltekova, D. Miteva, and I. Patias, \"Hallucination in LLM-based educational tools: Risks and solutions for reliable learning,\" Journal of Business Innovation and Governance, 2026.",
 "R. Zhao, Z. Jiang, X. Zhang, C. Chang, H. Chen, W. Deng, L. Jin, X. Qi, X. Qian, and E. C. H. Ngai, \"NoteIt: A system converting instructional videos to interactable notes through multimodal video understanding,\" in Proc. ACM UIST, 2025, doi:10.1145/3746059.3747626.",
]

# ---------------------------------------------------------------------------
def _img_data_uri(path: Path) -> str:
    b = path.read_bytes()
    return "data:image/png;base64," + base64.b64encode(b).decode("ascii")

def build_html() -> str:
    css = """
    @page { size: A4; margin: 14mm 13mm; }
    body { font-family: 'Times New Roman', Georgia, serif; font-size: 9.3pt; line-height: 1.24;
           color:#111; }
    .title { font-size: 16pt; font-weight: bold; text-align:center; margin: 0 0 5pt; line-height:1.2; }
    .authors { display: flex; justify-content: center; gap: 8mm; margin: 4pt 0 8pt; }
    .author-cell { flex: 0 1 33%; text-align: center; }
    .author-cell .an { font-size: 10pt; font-weight: bold; margin-bottom: 2pt; }
    .author-cell .ad { font-size: 8.5pt; line-height: 1.25; color: #222; }
    .abstract-label, .kw-label { font-weight: bold; font-style: italic; }
    .abs2 { column-count: 2; column-gap: 6mm; margin: 3pt 0 4pt; }
    .abs2 .abstract { text-align: justify; margin: 0; }
    .keywords { text-align: justify; margin: 0 0 6pt; font-size: 9.3pt; line-height: 1.24; }
    .cols { column-count: 2; column-gap: 6mm; }
    h1 { font-size: 9.8pt; text-transform: uppercase; text-align:center; margin: 8pt 0 2.5pt; }
    h2 { font-size: 9.3pt; font-style: italic; margin: 6pt 0 2pt; }
    p  { text-align: justify; margin: 0 0 3.5pt; }
    figure { break-inside: avoid; margin: 4pt 0; text-align:center; }
    figure.wide { column-span: all; margin: 6pt 0; }
    figure img { width: 100%; border: 0.5pt solid #999; }
    figure.wide img { max-height: 180px; width: auto; max-width: 98%; }
    figure.narrow img { max-width: 78%; }
    figcaption { font-size: 8pt; text-align: justify; margin-top: 2pt; line-height: 1.2; }
    table { border-collapse: collapse; width: 100%; font-size: 7.9pt; margin: 3pt 0 4pt;
            break-inside: avoid; }
    caption { caption-side: top; font-size: 8pt; font-weight: bold; text-align:left;
              margin-bottom: 2pt; }
    th, td { border-top: 0.7pt solid #222; border-bottom: 0.7pt solid #222; padding: 2pt 3.5pt;
             text-align: left; vertical-align: top; }
    th { border-bottom: 1pt solid #000; }
    tr:last-child td { border-bottom: 1pt solid #000; }
    .refs { column-count: 2; column-gap: 6mm; font-size: 7.8pt; line-height: 1.25; }
    .refs ol { margin: 0; padding-left: 1.3em; }
    .refs li { margin-bottom: 2.5pt; text-align: justify; }
    """
    parts = [f"<style>{css}</style>"]
    parts.append(f'<div class="title">{TITLE}</div>')
    author_cells = ""
    for a in AUTHORS:
        author_cells += (
            '<div class="author-cell">'
            f'<div class="an">{a["name"]}</div>'
            f'<div class="ad">{DEPT}</div>'
            f'<div class="ad">{INSTITUTION}</div>'
            f'<div class="ad">{CITY}</div>'
            f'<div class="ad">{a["email"]}</div>'
            f'<div class="ad">Roll No.: {a["roll"]}</div>'
            '</div>'
        )
    parts.append(f'<div class="authors">{author_cells}</div>')
    # Abstract as its own balanced two-column block (flows column 1 -> column 2);
    # Index Terms is a separate full-width line beneath it; then the body.
    parts.append('<div class="abs2"><p class="abstract">'
                 f'<span class="abstract-label">Abstract&mdash;</span>{ABSTRACT}</p></div>')
    parts.append('<p class="keywords">'
                 f'<span class="kw-label">Index Terms&mdash;</span>{KEYWORDS}.</p>')
    parts.append('<div class="cols">')
    for kind, payload in BODY:
        if kind == "h1":
            parts.append(f"<h1>{payload}</h1>")
        elif kind == "h2":
            parts.append(f"<h2>{payload}</h2>")
        elif kind == "p":
            parts.append(f"<p>{payload}</p>")
        elif kind == "fig":
            path, cap, label = payload
            fp = FIGDIR / path
            wide = "wide" if label == "1" else "narrow"
            parts.append(f'<figure class="{wide}"><img src="{_img_data_uri(fp)}"/>'
                         f'<figcaption><b>Fig. {label}.</b> {cap}</figcaption></figure>')
        elif kind == "table":
            cap, headers, rows, label = payload
            th = "".join(f"<th>{h}</th>" for h in headers)
            trs = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
            parts.append(f'<table><caption>{cap}</caption><thead><tr>{th}</tr></thead>'
                         f'<tbody>{trs}</tbody></table>')
    parts.append("</div>")  # end cols
    parts.append('<h1>References</h1><div class="refs"><ol>')
    for r in REFERENCES:
        parts.append(f"<li>{r}</li>")
    parts.append("</ol></div>")
    return "<!doctype html><html><head><meta charset='utf-8'></head><body>" + "".join(parts) + "</body></html>"


def build_pdf(html: str):
    out_pdf = HERE / "LECTRAAI_IEEE_RESEARCH_PAPER.pdf"
    tmp_html = HERE / "_paper_render.html"
    tmp_html.write_text(html, encoding="utf-8")
    worker = f"""
import sys, asyncio
if sys.platform == 'win32':
    try: asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception: pass
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=True)
    pg = b.new_page()
    pg.goto({repr(tmp_html.as_uri())}, wait_until='networkidle')
    pg.wait_for_timeout(800)
    pg.pdf(path={repr(str(out_pdf))}, format='A4', print_background=True,
           margin={{'top':'0','bottom':'0','left':'0','right':'0'}})
    b.close()
print('PDF written:', {repr(str(out_pdf))})
"""
    subprocess.run([sys.executable, "-c", worker], check=True)
    tmp_html.unlink(missing_ok=True)


def build_docx():
    from docx import Document
    from docx.shared import Pt, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.section import WD_SECTION
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    doc = Document()
    st = doc.styles["Normal"]
    st.font.name = "Times New Roman"; st.font.size = Pt(10)

    def _add(text, bold=False, italic=False, size=10, align=None, space_after=4):
        pr = doc.add_paragraph()
        run = pr.add_run(text); run.bold = bold; run.italic = italic; run.font.size = Pt(size)
        if align is not None: pr.alignment = align
        pr.paragraph_format.space_after = Pt(space_after)
        return pr

    _add(TITLE, bold=True, size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)

    # --- three-author block: borderless 1x3 table, each author centred ---
    atab = doc.add_table(rows=1, cols=3)
    atab.autofit = True
    for idx, a in enumerate(AUTHORS):
        cell = atab.rows[0].cells[idx]
        lines = [a["name"], DEPT, INSTITUTION, CITY, a["email"], f'Roll No.: {a["roll"]}']
        for li, text in enumerate(lines):
            para = cell.paragraphs[0] if li == 0 else cell.add_paragraph()
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            para.paragraph_format.space_after = Pt(0)
            run = para.add_run(text)
            run.font.size = Pt(10.5 if li == 0 else 8.5)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def _set_cols(section, n):
        found = section._sectPr.xpath("./w:cols")
        c = found[0] if found else OxmlElement("w:cols")
        if not found:
            section._sectPr.append(c)
        c.set(qn("w:num"), str(n))
        if n >= 2:
            c.set(qn("w:space"), "360")

    # Section: ABSTRACT alone, balanced across two columns (col 1 -> col 2).
    sec_abs = doc.add_section(WD_SECTION.CONTINUOUS)
    _set_cols(sec_abs, 2)
    ab = doc.add_paragraph(); r = ab.add_run("Abstract— "); r.bold = True; r.italic = True
    ab.add_run(ABSTRACT); ab.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # Section: Index Terms as a separate single-column line beneath the abstract.
    sec_kw = doc.add_section(WD_SECTION.CONTINUOUS)
    _set_cols(sec_kw, 1)
    kw = doc.add_paragraph(); r = kw.add_run("Index Terms— "); r.bold = True; r.italic = True
    kw.add_run(KEYWORDS + "."); kw.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # Section: the paper body, two columns.
    sec_body = doc.add_section(WD_SECTION.CONTINUOUS)
    _set_cols(sec_body, 2)

    for kind, payload in BODY:
        if kind == "h1":
            _add(payload.upper(), bold=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=3)
        elif kind == "h2":
            _add(payload, italic=True, bold=False, size=10, space_after=2)
        elif kind == "p":
            pr = doc.add_paragraph(payload); pr.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            pr.paragraph_format.space_after = Pt(4)
        elif kind == "fig":
            path, cap, label = payload
            fp = FIGDIR / path
            pr = doc.add_paragraph(); pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
            pr.add_run().add_picture(str(fp), width=Inches(3.2 if label != "1" else 6.4))
            cp = doc.add_paragraph(); cr = cp.add_run(f"Fig. {label}. "); cr.bold = True
            cp.add_run(cap); cp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            for run in cp.runs: run.font.size = Pt(8)
        elif kind == "table":
            cap, headers, rows, label = payload
            cp = doc.add_paragraph(); cr = cp.add_run(cap); cr.bold = True
            for run in cp.runs: run.font.size = Pt(8)
            t = doc.add_table(rows=1, cols=len(headers)); t.style = "Table Grid"
            for i, h in enumerate(headers):
                c = t.rows[0].cells[i]; c.text = ""; run = c.paragraphs[0].add_run(h)
                run.bold = True; run.font.size = Pt(8)
            for row in rows:
                cells = t.add_row().cells
                for i, val in enumerate(row):
                    cells[i].text = ""; run = cells[i].paragraphs[0].add_run(str(val))
                    run.font.size = Pt(8)

    _add("REFERENCES", bold=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=3)
    for i, ref in enumerate(REFERENCES, 1):
        pr = doc.add_paragraph(f"[{i}] {ref}")
        pr.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        for run in pr.runs: run.font.size = Pt(8)
        pr.paragraph_format.space_after = Pt(2)

    out = HERE / "LECTRAAI_IEEE_RESEARCH_PAPER.docx"
    doc.save(str(out))
    print("DOCX written:", out)


if __name__ == "__main__":
    html = build_html()
    build_docx()
    build_pdf(html)
    print("done.")
