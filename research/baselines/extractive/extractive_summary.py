"""
Baseline 4 — Extractive summarization (OPTIONAL/STRETCH).

Per Phase 3 §12: "useful mainly as a sanity-check anchor, not a
competitive baseline" — included only if reviewer time permits in
Phase 5. Not required for RQ1-RQ4's core evaluation.

Pure-stdlib TF-IDF sentence scoring (no new dependency added to either
`backend/` or `research/`). Selects the top-N highest-scoring sentences
from the raw transcript as a naive "summary" — deliberately unsophisticated,
since its only purpose is to anchor the groundedness scale at "trivially
~100% grounded because it's copied verbatim" (Phase 2 §12).
"""
from __future__ import annotations

import math
import re
from collections import Counter


def _sentences(text: str) -> list[str]:
    # Reuses the same simple period-split approach as
    # backend/services/transcript.py:clean_transcript (Phase 1 §8), not a
    # linguistically sophisticated sentence splitter — consistent with
    # this baseline's deliberately simple, non-competitive role.
    return [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 15]


def _tokenize(sentence: str) -> list[str]:
    return re.findall(r"[a-zA-Z]{3,}", sentence.lower())


def extractive_summary(transcript_text: str, n_sentences: int = 10) -> list[str]:
    """
    Returns the top `n_sentences` sentences by TF-IDF score, in their
    ORIGINAL transcript order (not score order) so the "summary" reads
    coherently. Raises on empty input rather than returning an empty list
    silently mislabeled as a valid summary.
    """
    sentences = _sentences(transcript_text)
    if not sentences:
        raise ValueError("extractive_summary: no sentences found in transcript_text — DATA REQUIRED.")

    tokenized = [_tokenize(s) for s in sentences]
    n_docs = len(tokenized)

    doc_freq = Counter()
    for tokens in tokenized:
        doc_freq.update(set(tokens))

    scores = []
    for tokens in tokenized:
        if not tokens:
            scores.append(0.0)
            continue
        tf = Counter(tokens)
        score = 0.0
        for term, count in tf.items():
            idf = math.log((n_docs + 1) / (doc_freq[term] + 1)) + 1.0
            score += (count / len(tokens)) * idf
        scores.append(score)

    n_take = min(n_sentences, len(sentences))
    top_indices = sorted(range(len(sentences)), key=lambda i: scores[i], reverse=True)[:n_take]
    top_indices.sort()  # restore original transcript order
    return [sentences[i] for i in top_indices]


if __name__ == "__main__":
    # Smoke test on a small synthetic toy transcript — NOT real lecture
    # data, only proves the scoring/selection logic runs correctly.
    toy_transcript = (
        "Welcome everyone to this lecture. Today we discuss operating systems. "
        "A process is a program in execution with its own memory space. "
        "A thread is a lightweight unit of execution inside a process. "
        "Threads within the same process share code and data memory. "
        "This has nothing to do with anything important right now. "
        "Creating a new process is more expensive than creating a thread."
    )
    for s in extractive_summary(toy_transcript, n_sentences=3):
        print("-", s)
