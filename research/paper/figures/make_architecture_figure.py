"""
Generates the LectraAI pipeline/architecture schematic (Fig. 1 of the paper).

This is a SCHEMATIC of the real, verified implementation (Phase 1 audit +
current source code) — it contains no experimental data. Its purpose is to
make unambiguous which single stage is AI-generated (the Gemini notes call)
and which stages are deterministic transformation.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path

OUT = Path(__file__).resolve().parent / "fig0_architecture.png"

fig, ax = plt.subplots(figsize=(9.2, 5.4))
ax.set_xlim(0, 100); ax.set_ylim(0, 62); ax.axis("off")

AI = "#F4C7C3"       # AI-generated stage (single Gemini call)
DET = "#CFE3F7"      # deterministic stage
IO = "#E4E4E4"       # input / output / store

def box(x, y, w, h, text, color, fontsize=8.5):
    ax.add_patch(mpatches.FancyBboxPatch((x, y), w, h,
                 boxstyle="round,pad=0.4,rounding_size=1.2",
                 fc=color, ec="#555555", lw=1.0))
    ax.text(x + w/2, y + h/2, text, ha="center", va="center",
            fontsize=fontsize, wrap=True)

def arrow(x1, y1, x2, y2):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", lw=1.3, color="#444444"))

# Row 1: input -> transcript -> clean -> AI notes
box(1,  46, 15, 12, "YouTube\nlecture URL", IO)
box(20, 46, 17, 12, "Transcript\nextraction\n(yt-dlp -> transcript-api\nfallback; [MM:SS] cues)", DET, 7.6)
box(41, 46, 16, 12, "Clean + truncate\n(filler strip;\n<=120,000 chars)", DET, 7.8)
box(61, 46, 17, 12, "AI note generation\n(single Gemini call,\ngrounded prompt)\n=> Markdown notes", AI, 7.6)
box(82, 46, 16, 12, "Notes quality\npost-processing\n(regex cleanup)", DET, 7.8)
arrow(16,52, 20,52); arrow(37,52, 41,52); arrow(57,52, 61,52); arrow(78,52, 82,52)

# vertical drop from notes post-processing to deterministic transformation bus
arrow(90, 46, 90, 39)
ax.text(50, 40.5, "Deterministic multi-format transformation of the generated notes  (regex / template; no further AI call)",
        ha="center", va="center", fontsize=8.2, style="italic")

# Row 2: deterministic artifacts derived from notes
box(1,  22, 14, 12, "Topic\nsegmentation", DET)
box(17, 22, 14, 12, "Timestamp\nassociation\n(keyword overlap,\nduration-bounded)", DET, 7.4)
box(33, 22, 14, 12, "Quiz\n(template MCQs)", DET)
box(49, 22, 14, 12, "Flashcards\n(bold-term\nextraction)", DET, 7.8)
box(65, 22, 14, 12, "Revision plan\n(fixed 5-stage\nschedule)", DET, 7.8)
box(81, 22, 17, 12, "Interview questions\n(template, by\ndifficulty tier)", DET, 7.6)
for cx in (8, 24, 40, 56, 72, 89):
    arrow(cx, 40, cx, 34)

# Row 3: assembly + outputs + stores
box(20, 3, 24, 12, "Study-pack assembly\n(structured JSON)", DET, 8)
box(50, 3, 16, 12, "PDF render\n(Markdown->HTML->\nPlaywright)", DET, 7.8)
box(72, 3, 26, 12, "Outputs / stores:\nJSON study pack, PDF,\nSQLite task record\n(+ instrumentation)", IO, 7.8)
for cx in (8, 24, 40, 56, 72, 89):
    arrow(cx, 22, cx, 15.2) if cx in (24,) else None
arrow(32, 22, 32, 15)          # topic/quiz/etc -> assembly (representative)
arrow(44, 9, 50, 9)            # assembly -> pdf
arrow(66, 9, 72, 9)            # pdf -> stores

# legend
leg = [mpatches.Patch(fc=AI, ec="#555555", label="AI-generated (one Gemini call)"),
       mpatches.Patch(fc=DET, ec="#555555", label="Deterministic transformation / processing"),
       mpatches.Patch(fc=IO, ec="#555555", label="Input / output / persistence")]
ax.legend(handles=leg, loc="lower left", bbox_to_anchor=(0.0, -0.06),
          ncol=3, fontsize=8, frameon=False)

fig.tight_layout()
fig.savefig(OUT, dpi=160, bbox_inches="tight")
print("wrote", OUT)
