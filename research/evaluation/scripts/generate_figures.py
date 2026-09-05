"""
Phase 5.5 — Generate real figures from real, validated result data only.

Per Phase 5.5 instructions: only figures backed by sufficient real data are
generated. No figure exists here for:
  - "Timestamp error distribution" (no human ground truth -> no error exists,
    only coverage and divergence-from-naive, which ARE plotted, honestly
    labeled as such).
  - "Artifact quality comparison" in the human-rating sense (no human
    ratings exist -> the one real, objective sub-metric, distractor
    uniqueness, IS plotted, explicitly labeled as diversity, not quality).
  - "Prompt-ablation groundedness comparison" (the only attempted metric
    was found unreliable in Phase 5 and is not revived here, per explicit
    instruction).

Every figure below states its real sample size in the title/caption and is
regenerable by re-running this script against the same source files.
"""
import json
import csv
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # headless, no display needed
import matplotlib.pyplot as plt

RESULTS = Path(__file__).resolve().parents[2] / "results"
FIG_DIR = RESULTS / "processed" / "phase5_5" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)


def fig1_dataset_duration_distribution():
    rows = list(csv.DictReader(open(RESULTS.parents[0] / "dataset" / "manifest.csv", encoding="utf-8")))
    durations_min = [float(r["duration_seconds"]) / 60 for r in rows]
    labels = [r["lecture_id"] for r in rows]

    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.bar(labels, durations_min, color="#4C72B0")
    ax.set_xlabel("Lecture ID")
    ax.set_ylabel("Duration (minutes)")
    ax.set_title(f"Figure 1 — Dataset Duration Distribution (N={len(rows)} real lectures)")
    ax.axhline(15, color="gray", linestyle="--", linewidth=1, label="Short/Medium boundary (15 min)")
    ax.axhline(45, color="gray", linestyle=":", linewidth=1, label="Medium/Long boundary (45 min)")
    ax.legend(fontsize=8)
    fig.tight_layout()
    out = FIG_DIR / "fig1_dataset_duration_distribution.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print("Wrote", out)


def fig2_topic_timestamp_coverage():
    with open(RESULTS / "processed" / "phase5" / "expA_lectraai_vs_naive_divergence.json", encoding="utf-8") as f:
        d = json.load(f)
    per_lec = d["per_lecture"]
    labels = [p["video_id"] for p in per_lec]
    coverage_pct = [100 * p["n_topics_with_lectraai_timestamp"] / p["n_topics"] for p in per_lec]

    fig, ax = plt.subplots(figsize=(7, 4.5))
    colors = ["#C44E52" if c == 0 else "#55A868" for c in coverage_pct]
    ax.bar(labels, coverage_pct, color=colors)
    ax.set_xlabel("Lecture (YouTube video ID)")
    ax.set_ylabel("Topic-timestamp coverage (%)")
    ax.set_ylim(0, 105)
    total_topics = d["topic_timestamp_coverage"]["total_topics_across_dataset"]
    overall = d["topic_timestamp_coverage"]["coverage_pct"]
    ax.set_title(
        f"Figure 2 — LectraAI Topic-Timestamp Coverage by Lecture\n"
        f"(N=7 lectures, {total_topics} total topics; overall coverage={overall}%; NOT an accuracy measure)"
    )
    plt.xticks(rotation=30, ha="right")
    fig.tight_layout()
    out = FIG_DIR / "fig2_topic_timestamp_coverage.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print("Wrote", out)


def fig3_distractor_uniqueness():
    with open(RESULTS / "processed" / "phase5" / "expB_distractor_uniqueness_3MqyDWDpZoI.json", encoding="utf-8") as f:
        d = json.load(f)
    conditions = ["LectraAI\n(deterministic)", "Direct-LLM\n(experiment-only)"]
    uniqueness = [d["deterministic_condition"]["uniqueness_pct"], d["direct_llm_condition"]["uniqueness_pct"]]
    ns = [d["deterministic_condition"]["n_distractors"], d["direct_llm_condition"]["n_distractors"]]

    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    bars = ax.bar(conditions, uniqueness, color=["#C44E52", "#55A868"])
    for bar, n in zip(bars, ns):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 2, f"n={n} distractors", ha="center", fontsize=9)
    ax.set_ylabel("Distractor uniqueness (%)")
    ax.set_ylim(0, 110)
    ax.set_title(
        f"Figure 3 — Quiz Distractor Uniqueness\n"
        f"(1 real lecture: {d['lecture_id']}; a DIVERSITY metric, not a correctness/quality rating)"
    )
    fig.tight_layout()
    out = FIG_DIR / "fig3_distractor_uniqueness.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print("Wrote", out)


def fig4_latency_vs_transcript_length():
    with open(RESULTS / "raw" / "phase5" / "expD_latency_real_regen_batch.json", encoding="utf-8") as f:
        records = json.load(f)
    chars = [r["transcript_char_count"] for r in records]
    totals = [r["total_latency_sec"] for r in records]
    labels = [r["video_id"] for r in records]

    from scipy import stats
    r_val, p_val = stats.pearsonr(chars, totals)

    fig, ax = plt.subplots(figsize=(6.5, 5))
    ax.scatter(chars, totals, color="#4C72B0", s=60, zorder=3)
    for x, y, lab in zip(chars, totals, labels):
        ax.annotate(lab, (x, y), textcoords="offset points", xytext=(5, 5), fontsize=7)
    # simple least-squares trend line for visualization only -- not a causal model
    import numpy as np
    coeffs = np.polyfit(chars, totals, 1)
    xs = np.linspace(min(chars), max(chars), 50)
    ax.plot(xs, np.polyval(coeffs, xs), color="gray", linestyle="--", linewidth=1, label="linear trend (descriptive only)")
    ax.set_xlabel("Transcript length (characters)")
    ax.set_ylabel("Total processing latency (seconds)")
    ax.set_title(
        f"Figure 4 — Latency vs. Transcript Length (N=7 real lectures)\n"
        f"Pearson r={r_val:.3f}, p={p_val:.4f} — correlation, not causation"
    )
    ax.legend(fontsize=8)
    fig.tight_layout()
    out = FIG_DIR / "fig4_latency_vs_transcript_length.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print("Wrote", out)


def fig5_latency_stage_breakdown():
    with open(RESULTS / "raw" / "phase5" / "expD_latency_real_regen_batch.json", encoding="utf-8") as f:
        records = json.load(f)
    import numpy as np
    stages = ["transcript_fetch", "ai_generation", "transformation", "pdf_render"]
    means = [np.mean([r["stage_durations_sec"][s] for r in records]) for s in stages]
    sds = [np.std([r["stage_durations_sec"][s] for r in records], ddof=1) for s in stages]

    fig, ax = plt.subplots(figsize=(6.5, 4.5))
    ax.bar(stages, means, yerr=sds, capsize=5, color="#4C72B0")
    ax.set_ylabel("Mean stage duration (seconds)")
    ax.set_title(f"Figure 5 — Latency by Processing Stage (N=7 real lectures, error bars = SD)")
    plt.xticks(rotation=20, ha="right")
    fig.tight_layout()
    out = FIG_DIR / "fig5_latency_stage_breakdown.png"
    fig.savefig(out, dpi=150)
    plt.close(fig)
    print("Wrote", out)


if __name__ == "__main__":
    fig1_dataset_duration_distribution()
    fig2_topic_timestamp_coverage()
    fig3_distractor_uniqueness()
    fig4_latency_vs_transcript_length()
    fig5_latency_stage_breakdown()
    print("\nAll figures generated from real, validated data only. See RESULT_TRACEABILITY.md for sources.")
