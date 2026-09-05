import re
import json
import random
import logging
from typing import Dict, Any, List

logger = logging.getLogger("study_pack")

# Matches transcript cue markers in either "[MM:SS]" or "[H:MM:SS]" form.
# The optional first group captures hours; the second group tolerates legacy
# markers where minutes were never rolled into hours (e.g. "122:00").
_CUE_TIME_RE = r'\[?⏱?\s*(?:(\d{1,2}):)?(\d{1,3}):(\d{2})\]?'


def _cue_to_seconds(hrs, mins, secs) -> int:
    """Converts a matched (hours, minutes, seconds) cue tuple to total seconds."""
    h = int(hrs) if hrs else 0
    return h * 3600 + int(mins) * 60 + int(secs)


def _fmt_hms(total_sec) -> str:
    """Formats seconds as MM:SS, or H:MM:SS once the offset reaches one hour."""
    total_sec = max(0, int(total_sec))
    h = total_sec // 3600
    m = (total_sec % 3600) // 60
    s = total_sec % 60
    if h > 0:
        return f"{h:d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def _format_duration(duration_seconds: float) -> str:
    """Formats duration in seconds to standard MM:SS or HH:MM:SS string."""
    if not duration_seconds or duration_seconds <= 0:
        return "00:00"
    total_sec = int(duration_seconds)
    hours = total_sec // 3600
    mins = (total_sec % 3600) // 60
    secs = total_sec % 60
    if hours > 0:
        return f"{hours:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"

def _extract_grounded_timestamps(
    topics: List[Dict],
    notes_md: str,
    transcript_text: str = "",
    duration: float = 0.0,
    video_id: str = ""
) -> List[Dict]:
    """
    Extracts real, grounded topic timestamps based on actual video duration and transcript timing.
    Strictly validates against actual video duration:
      - 0 <= sec < duration
      - Chronological order
      - No fabricated equal intervals (e.g. 08:05, 16:10)
    """
    # 1. Gather all transcript cues [⏱ MM:SS] from transcript_text and notes_md
    cues = []
    combined_source = f"{transcript_text}\n{notes_md}"
    for m in re.finditer(_CUE_TIME_RE + r'\s*([^\[\n]+)?', combined_source):
        total_sec = _cue_to_seconds(m.group(1), m.group(2), m.group(3))
        if total_sec < 0:
            continue
        if duration > 0 and total_sec >= duration:
            continue
        text_snippet = (m.group(4) or "").strip()
        cues.append({
            "sec": total_sec,
            "time": _fmt_hms(total_sec),
            "text": text_snippet
        })

    # Sort cues chronologically and deduplicate by second
    cues.sort(key=lambda x: x["sec"])
    unique_cues = []
    seen_secs = set()
    for c in cues:
        if c["sec"] not in seen_secs:
            seen_secs.add(c["sec"])
            unique_cues.append(c)
    cues = unique_cues

    grounded_list = [
        {"time": "00:00", "sec": 0, "label": "Lecture Introduction & Overview"}
    ]
    used_secs = {0}

    # 2. Map each topic to real transcript/cue timing
    for idx, t in enumerate(topics):
        title = t.get("title", f"Topic {idx + 1}")
        clean_title = re.sub(r"^[⚙️🔄💻📐🏗️📊📘📌🔍🌳⭐🌲🔢🎯🎮🧩🎲⏱️⏰🕐️\s]+", "", title).strip()
        
        # Check if topic content itself has an explicit [⏱ MM:SS] / [⏱ H:MM:SS]
        matched_sec = None
        matched_time = None

        content_match = re.search(_CUE_TIME_RE, t.get("content", "") + " " + title)
        if content_match:
            cand_sec = _cue_to_seconds(content_match.group(1), content_match.group(2), content_match.group(3))
            if cand_sec >= 0 and (duration <= 0 or cand_sec < duration):
                matched_sec = cand_sec
                matched_time = _fmt_hms(cand_sec)

        # If not found directly, find where topic keywords appear in transcript cues
        if matched_sec is None and cues:
            # Extract distinct search terms
            terms = [
                w.lower() for w in re.findall(r'[a-zA-Z0-9*]+', clean_title)
                if len(w) >= 3 or w.lower() in ('a*', 'bfs', 'dfs', 'ids', 'csp', 'sql', 'tcp', 'udp')
            ]
            best_cue = None
            best_score = 0
            for cue in cues:
                if cue["sec"] in used_secs:
                    continue
                cue_lower = cue["text"].lower()
                score = sum(1 for term in terms if term in cue_lower)
                if any(acro in cue_lower for acro in ('bfs', 'dfs', 'a*') if acro in terms):
                    score += 2
                if score > best_score and score >= 1:
                    best_score = score
                    best_cue = cue

            if best_cue and (duration <= 0 or best_cue["sec"] < duration):
                matched_sec = best_cue["sec"]
                matched_time = best_cue["time"]

        # Assign to topic if valid
        if matched_sec is not None and matched_sec not in used_secs and (duration <= 0 or matched_sec < duration):
            used_secs.add(matched_sec)
            t["seconds"] = matched_sec
            t["timestamp"] = matched_time
            grounded_list.append({
                "time": matched_time,
                "sec": matched_sec,
                "label": clean_title or f"Topic {idx + 1}"
            })

    # Sort final timestamp list chronologically
    grounded_list.sort(key=lambda x: x["sec"])

    # Strict validation: filter out any timestamp >= duration (if duration known)
    if duration > 0:
        grounded_list = [item for item in grounded_list if item["sec"] < duration and item["sec"] >= 0]

    return grounded_list

def parse_notes_to_study_pack(
    notes_md: str,
    video_id: str,
    duration: float = 0.0,
    transcript_text: str = ""
) -> Dict[str, Any]:
    """
    Parses Markdown study notes into a rich, structured Study Pack JSON object
    containing topics, interactive quiz questions, flashcards, revision plan,
    interview preparation questions, and grounded video timestamps with real duration.
    """
    lines = notes_md.split("\n")
    
    # 1. Extract Title
    title = "Lecture Study Notes"
    for line in lines:
        if line.strip().startswith("# "):
            title = re.sub(r"^#\s*📘?\s*", "", line.strip()).strip()
            break
            
    # 2. Extract Overview
    overview = "Comprehensive study notes generated from the lecture."
    overview_match = re.search(r"###\s*📌\s*Overview\s*\n+([^\n#]+)", notes_md)
    if overview_match:
        overview = overview_match.group(1).strip()
        
    # 3. Extract Topics
    # Find all '## [Emoji] [Topic Name]'
    topic_blocks = re.split(r"(?=\n##\s+)", notes_md)
    topics = []
    
    for idx, block in enumerate(topic_blocks, 1):
        if not block.strip().startswith("## "):
            continue
        header_line = block.strip().split("\n")[0]
        t_title = re.sub(r"^##\s*[⚙️🔄💻📐🏗️📊📘📌]?\s*", "", header_line).strip()
        
        # Extract Mermaid code if present
        m_code = None
        m_match = re.search(r"```mermaid\s*\n(.*?)```", block, re.DOTALL)
        if m_match:
            m_code = m_match.group(1).strip()
            
        # Extract bullet points
        bullets = [re.sub(r"^\s*[-*]\s*", "", line).strip() for line in block.split("\n") if line.strip().startswith(("- ", "* "))]
        
        topics.append({
            "id": f"topic-{idx}",
            "title": t_title,
            "content": block.strip(),
            "key_points": bullets[:6],
            "diagram": m_code
        })
        
    if not topics:
        topics.append({
            "id": "topic-1",
            "title": title,
            "content": notes_md,
            "key_points": ["Core concepts explained in full notes."],
            "diagram": None
        })

    # 4. Generate Grounded Timestamps based on actual duration and transcript cues
    timestamps = _extract_grounded_timestamps(
        topics=topics,
        notes_md=notes_md,
        transcript_text=transcript_text,
        duration=duration,
        video_id=video_id
    )

    # 5. Generate Interactive Quiz Questions from Key Points & Terms
    quiz = _build_quiz_questions(notes_md, topics)

    # 6. Generate Flashcards
    flashcards = _build_flashcards(notes_md, topics)

    # 7. Generate Revision Plan
    revision_plan = _build_revision_plan(topics)

    # 8. Generate Interview Questions
    interview_questions = _build_interview_questions(notes_md, topics)

    return {
        "video_id": video_id,
        "title": title,
        "overview": overview,
        "notes_markdown": notes_md,
        "video_duration": float(duration),
        "video_duration_formatted": _format_duration(duration),
        "timestamps": timestamps,
        "topics": topics,
        "quiz": quiz,
        "flashcards": flashcards,
        "revision_plan": revision_plan,
        "interview_questions": interview_questions
    }

def _build_quiz_questions(notes_md: str, topics: List[Dict]) -> List[Dict]:
    """Generates structured multiple choice quiz questions derived from lecture notes."""
    quiz = []
    q_id = 1

    for t in topics:
        title = t["title"]
        points = t["key_points"]
        
        if len(points) >= 2:
            fact1 = _clean_option_text(points[0])
            fact2 = _clean_option_text(points[1])
            quiz.append({
                "id": f"q-{q_id}",
                "topic": title,
                "question": f"Which statement regarding {title} is strictly correct based on the lecture?",
                "options": [
                    fact1,
                    f"It contradicts the core principle of {title}.",
                    f"It is completely handled outside OS memory space.",
                    f"It eliminates all resource requirements."
                ],
                "correct_index": 0,
                "explanation": f"As covered in the lecture: {fact1}"
            })
            q_id += 1
            
            quiz.append({
                "id": f"q-{q_id}",
                "topic": title,
                "question": f"In the context of {title}, what key property was emphasized by the lecturer?",
                "options": [
                    f"It operates without any data structures.",
                    fact2,
                    f"It requires manual memory deallocation per thread.",
                    f"It is restricted to single-threaded CPU architectures."
                ],
                "correct_index": 1,
                "explanation": f"Lecture note detail: {fact2}"
            })
            q_id += 1

    if not quiz:
        quiz.append({
            "id": "q-1",
            "topic": "General Concept",
            "question": "What is the primary goal of this lecture material?",
            "options": [
                "To explain technical computer science concepts with clear grounding.",
                "To generate raw transcript quotes.",
                "To list unrelated textbook formulas.",
                "To avoid defining key terminology."
            ],
            "correct_index": 0,
            "explanation": "LectraAI converts lectures into clear, student-friendly college study guides."
        })

    return _balance_quiz_options(quiz[:10])

def _clean_option_text(text: str) -> str:
    """
    Sanitizes AI-generated option labels to clean, plain, consistently formatted text.
    Strips accidental Markdown / HTML formatting syntax (bold, italics, code, headings, bullets, links)
    while preserving meaningful mathematical symbols, punctuation, parentheses, numbers, and formulas.
    """
    if not isinstance(text, str):
        return text

    s = text.strip()

    # 1. Remove HTML tags
    s = re.sub(r"<[^>]+>", "", s)

    # 2. Markdown links: [anchor text](http://...) -> anchor text
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)

    # 3. Heading syntax at start of string (e.g. "### Heading" -> "Heading")
    s = re.sub(r"^#{1,6}\s+", "", s)

    # 4. Leading bullet points or numbers (e.g. "- Point", "* Point", "1. Point")
    s = re.sub(r"^[\*\-\+]\s+", "", s)
    s = re.sub(r"^\d+\.\s+", "", s)

    # 5. Bold & Italic markdown:
    # ***text*** or ___text___ -> text
    s = re.sub(r"\*{3}([^*]+)\*{3}", r"\1", s)
    s = re.sub(r"_{3}([^_]+)_{3}", r"\1", s)
    # **text** or __text__ -> text
    s = re.sub(r"\*{2}([^*]+)\*{2}", r"\1", s)
    s = re.sub(r"_{2}([^_]+)_{2}", r"\1", s)
    # *text* or _text_ (non-word boundary aware for italic)
    s = re.sub(r"\*([^*]+)\*", r"\1", s)
    s = re.sub(r"(?<!\w)_([^_]+)_(?!\w)", r"\1", s)

    # 6. Inline backtick code: `code` -> code
    s = re.sub(r"`([^`]+)`", r"\1", s)

    # 7. Normalize duplicate spaces and strip edges
    s = re.sub(r"\s+", " ", s).strip()

    return s

def _balance_quiz_options(quiz: List[Dict]) -> List[Dict]:
    """
    Ensures that correct answers are naturally and evenly distributed
    across positions A (0), B (1), C (2), and D (3), and guarantees that
    all option labels are cleanly sanitized with no formatting leaks.
    Guarantees that the semantic meaning, factually correct answer,
    and correct_index are 100% synchronized and preserved.
    """
    if not quiz:
        return quiz

    n = len(quiz)
    # Generate balanced base positions e.g. for 10 Qs: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1]
    base_positions = [i % 4 for i in range(n)]

    # Shuffle targets with anti-repetition smoothing (no 3 adjacent identical positions)
    for _ in range(50):
        random.shuffle(base_positions)
        has_triple = any(
            base_positions[i] == base_positions[i+1] == base_positions[i+2]
            for i in range(len(base_positions) - 2)
        )
        if not has_triple:
            break

    for idx, q in enumerate(quiz):
        current_options = [_clean_option_text(opt) for opt in q.get("options", [])]
        correct_idx = q.get("correct_index", 0)

        if not current_options or correct_idx >= len(current_options):
            continue

        # Extract the factually correct answer text (already cleaned)
        correct_text = current_options[correct_idx]

        # Extract distractors (already cleaned)
        distractors = [opt for i, opt in enumerate(current_options) if i != correct_idx]
        random.shuffle(distractors)

        target_pos = base_positions[idx] % len(current_options)

        # Assemble new options with correct_text placed at target_pos
        new_options = list(distractors)
        new_options.insert(target_pos, correct_text)

        q["options"] = new_options
        q["correct_index"] = target_pos

    return quiz

def _build_flashcards(notes_md: str, topics: List[Dict]) -> List[Dict]:
    """Generates interactive flashcards derived from key lecture concepts."""
    cards = []
    fc_id = 1
    
    # Extract bold terms `**Term**` from notes
    bold_terms = re.findall(r"\*\*([^*]+)\*\*", notes_md)
    unique_terms = []
    for term in bold_terms:
        clean_t = term.strip()
        if len(clean_t) > 3 and len(clean_t) < 40 and clean_t not in unique_terms and not clean_t.lower().startswith("key"):
            unique_terms.append(clean_t)
            
    for term in unique_terms[:10]:
        # Search context sentence
        match = re.search(r"([^.\n]*?\*\*" + re.escape(term) + r"\*\*[^.\n]*?\.)", notes_md)
        back = match.group(1).strip() if match else f"Key technical term explained in {topics[0]['title'] if topics else 'the lecture'}."
        cards.append({
            "id": f"fc-{fc_id}",
            "front": f"What is {term}?",
            "back": back
        })
        fc_id += 1

    if not cards:
        cards.append({
            "id": "fc-1",
            "front": "What is the primary lecture focus?",
            "back": topics[0]["title"] if topics else "Core Lecture Concepts"
        })

    return cards

def _build_revision_plan(topics: List[Dict]) -> List[Dict]:
    """Generates a spaced-repetition revision schedule mapped to lecture subtopics."""
    topic_titles = [t["title"] for t in topics]
    
    return [
        {
            "stage": "24 Hours (Immediate Recall)",
            "interval": "Day 1",
            "priority": "High",
            "goal": "Review core definitions and key facts to consolidate short-term memory.",
            "topics": topic_titles[:2] if topic_titles else ["Lecture Overview"]
        },
        {
            "stage": "3 Days (Reinforcement)",
            "interval": "Day 3",
            "priority": "High",
            "goal": "Re-examine comparison tables and diagram relationships.",
            "topics": topic_titles[1:3] if len(topic_titles) > 1 else topic_titles
        },
        {
            "stage": "7 Days (Weekly Review)",
            "interval": "Day 7",
            "priority": "Medium",
            "goal": "Solve interactive quiz questions and test recall via flashcards.",
            "topics": topic_titles[2:4] if len(topic_titles) > 2 else topic_titles
        },
        {
            "stage": "14 Days (Pre-Exam Polish)",
            "interval": "Day 14",
            "priority": "Medium",
            "goal": "Attempt basic and intermediate interview prep questions.",
            "topics": topic_titles
        },
        {
            "stage": "30 Days (Mastery Verification)",
            "interval": "Day 30",
            "priority": "Low",
            "goal": "Final quick scan of exam focus callouts and master summary.",
            "topics": topic_titles
        }
    ]

def _build_interview_questions(notes_md: str, topics: List[Dict]) -> Dict[str, List[Dict]]:
    """Generates basic, intermediate, and advanced interview questions derived from lecture notes."""
    basic = []
    intermediate = []
    advanced = []
    
    for idx, t in enumerate(topics):
        title = t["title"]
        points = t["key_points"]
        summary = points[0] if points else f"Explained in {title}."
        
        if idx % 3 == 0:
            basic.append({
                "id": f"ib-{idx+1}",
                "question": f"Define {title} in simple terms. What is its fundamental role?",
                "answer": summary
            })
        elif idx % 3 == 1:
            intermediate.append({
                "id": f"ii-{idx+1}",
                "question": f"How does {title} handle resource allocation or execution compared to alternative approaches?",
                "answer": summary + " " + (points[1] if len(points) > 1 else "")
            })
        else:
            advanced.append({
                "id": f"ia-{idx+1}",
                "question": f"What are the architectural trade-offs and common performance pitfalls associated with {title}?",
                "answer": summary + " " + (points[-1] if len(points) > 1 else "")
            })
            
    if not basic:
        basic.append({
            "id": "ib-1",
            "question": "What is the core takeaway of this lecture?",
            "answer": "Refer to the comprehensive study guide notes section."
        })
        
    return {
        "basic": basic,
        "intermediate": intermediate,
        "advanced": advanced
    }
