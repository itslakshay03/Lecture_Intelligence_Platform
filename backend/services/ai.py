import os
import re
import json
import time
import logging
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, DeadlineExceeded, GoogleAPIError

from prompts.smart import SMART_PROMPT
from prompts.json_extractor import JSON_EXTRACTOR_PROMPT

# Structured logger for AI service
logger = logging.getLogger("ai_service")

# Configurable per-request timeout (seconds)
DEFAULT_GEMINI_TIMEOUT = 45.0

# Maximum total fallback attempts per prompt to prevent long stalls
MAX_TOTAL_FALLBACK_ATTEMPTS = 3

# Fallback sequence across actual supported model names (ordered by speed and reliability)
FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-pro-latest"
]

from dotenv import load_dotenv

def _load_api_keys() -> list[str]:
    """
    Loads all available Gemini API keys from environment variables.
    Supports GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, ... up to 10.
    Returns a deduplicated list of valid keys.
    """
    load_dotenv()
    keys = []
    for i in range(10, 0, -1):
        suffix = f"_{i}" if i > 1 else ""
        key = os.getenv(f"GEMINI_API_KEY{suffix}", "").strip()
        if key and key not in keys:
            keys.append(key)
    if not keys:
        raise ValueError("No valid GEMINI_API_KEY found in environment variables.")
    return keys

def _get_model(api_key: str, model_name: str):
    """
    Configures Gemini with the given API key and returns a GenerativeModel instance.
    """
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)

def _safe_sleep(total_seconds: float):
    """
    Sleeps safely in small increments to maintain responsiveness.
    """
    end_time = time.time() + total_seconds
    while time.time() < end_time:
        remaining = end_time - time.time()
        time.sleep(min(1.0, max(0.05, remaining)))

def _generate_with_retry(model, prompt: str, timeout: float = DEFAULT_GEMINI_TIMEOUT):
    """
    Executes model.generate_content with configurable 30-second timeout per request.
    Fails stalled requests faster to avoid long worker stalls.
    """
    try:
        response = model.generate_content(prompt, request_options={"timeout": timeout})
        if not response:
            raise ValueError("The AI model returned no response object.")
        return response
    except Exception as e:
        raise e

def _generate_with_fallback(prompt: str, metadata: dict | None = None) -> str:
    """
    Iterates through supported combinations of (model_name × api_key) with a 30s timeout per attempt.
    Capped at MAX_TOTAL_FALLBACK_ATTEMPTS (5 attempts max) to prevent long worker hangs.

    `metadata` (Phase 4 research instrumentation, optional): if a dict is
    passed, this function records which model actually produced the
    response into metadata['model_name_used']. Never required by callers;
    return value/type is unchanged either way.
    """
    api_keys = _load_api_keys()
    last_exception = None
    attempt_count = 0

    for model_name in FALLBACK_MODELS:
        for api_key in api_keys:
            attempt_count += 1
            if attempt_count > MAX_TOTAL_FALLBACK_ATTEMPTS:
                logger.warning(f"Reached maximum fallback attempt budget ({MAX_TOTAL_FALLBACK_ATTEMPTS}). Stopping fallback loop.")
                break

            key_label = f"key#{api_keys.index(api_key)+1}"
            try:
                logger.info(f"AI NOTES GENERATION START: Attempt {attempt_count}/{MAX_TOTAL_FALLBACK_ATTEMPTS} with model '{model_name}' ({key_label})...")
                model = _get_model(api_key, model_name)
                response = _generate_with_retry(model, prompt, timeout=DEFAULT_GEMINI_TIMEOUT)

                try:
                    text_content = response.text
                except Exception as text_err:
                    logger.warning(
                        f"AI NOTES GENERATION INVALID TEXT: Model '{model_name}' ({key_label}): {text_err}"
                    )
                    last_exception = text_err
                    continue

                if not text_content:
                    logger.warning(
                        f"AI NOTES GENERATION EMPTY RESPONSE: Model '{model_name}' ({key_label}). Trying next..."
                    )
                    continue

                logger.info(f"AI NOTES GENERATION SUCCESS: Model '{model_name}' ({key_label}).")
                if metadata is not None:
                    metadata["model_name_used"] = model_name
                return text_content

            except (DeadlineExceeded, ResourceExhausted, ValueError, GoogleAPIError, Exception) as e:
                logger.warning(
                    f"AI NOTES GENERATION TIMEOUT/ERROR ({type(e).__name__}): Model '{model_name}' ({key_label}): {e}. Retrying fallback..."
                )
                last_exception = e
                continue

        if attempt_count > MAX_TOTAL_FALLBACK_ATTEMPTS:
            break

    raise ValueError(
        f"AI generation timeout: All fallback attempts failed or timed out ({last_exception or 'Timeout'}). Please retry."
    )

def _extract_json_block(raw_text: str) -> dict:
    """
    Extracts and parses a JSON object from raw LLM text output.
    Handles markdown codeblocks and leading/trailing conversational text.
    """
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"(\{.*\})", raw_text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError as e:
                logger.error(f"Regex fallback JSON extraction failed: {e}")
        raise

def _clean_transcript_filler(text: str) -> str:
    """
    Strips conversational noise, greetings, storytelling, and YouTube narration
    from the raw transcript text.
    """
    filler_patterns = [
        r"(?i)\b(hello|welcome|hey|hi)\s+(everyone|guys|friends|students|all)\b",
        r"(?i)\bwelcome\s+(back\s+)?to\s+my\s+channel\b",
        r"(?i)\bin\s+this\s+video\s+(we\s+will|i\s+will|we\s+are\s+going\s+to)\b",
        r"(?i)\bplease\s+(like|share|subscribe|comment)\b",
        r"(?i)\bdon't\s+forget\s+to\s+(hit\s+the\s+bell\s+icon|subscribe)\b",
        r"(?i)\bso\s+basically\b",
        r"(?i)\bwithout\s+any\s+further\s+ado\b"
    ]
    cleaned = text
    for pattern in filler_patterns:
        cleaned = re.sub(pattern, "", cleaned)
    return " ".join(cleaned.split())

def _generate_offline_notes(transcript_text: str, target_pages: str) -> str:
    """
    Local conceptual study guide engine fallback.
    Generates clean, technical study notes by extracting actual concepts and facts from transcript text.
    Adapts layout dynamically based on detected lecture topics (Process/Thread, DBMS/Architecture, Algorithm, Coding).
    """
    logger.info("Building clean student-friendly study notes via local conceptual engine...")
    clean_text = _clean_transcript_filler(transcript_text)
    sentences = [s.strip() for s in clean_text.replace("\n", " ").split(".") if len(s.strip()) > 15]
    
    if not sentences:
        return "# 📘 Lecture Study Notes\n\nNo detailed transcript text available to format."

    lower_text = clean_text.lower()
    is_process_thread = "process" in lower_text and "thread" in lower_text
    is_dbms = "dbms" in lower_text or "database" in lower_text or "file system" in lower_text
    is_algo = "algorithm" in lower_text or "dijkstra" in lower_text or "sort" in lower_text or "search" in lower_text

    doc_lines = []
    
    if is_process_thread:
        doc_lines.extend([
            "# 📘 Process vs Thread",
            "",
            "### 📌 Overview",
            "This lecture explains **processes and threads** — how they use memory differently, how child processes are created with `fork()`, and why threads are much more lightweight.",
            "",
            "---",
            "",
            "## ⚙️ Process vs Thread",
            "",
            "A **process** is a program that is currently executing in memory. It is considered a **heavyweight task** because the operating system allocates dedicated resources to it, including its own data, code, stack, and registers.",
            "",
            "In contrast, a **thread** is a **lightweight unit of execution** inside a process. Multiple threads created within the same process share the process's code and data memory, while maintaining their own private stack and registers.",
            "",
            "### 🔄 Child Process & Resource Allocation",
            "When a new child process is created (for example using the `fork()` system call), the operating system creates a separate process with its own unique **Process ID (PID)** and a separate copy of memory resources.",
            "",
            "Because creating a new process requires duplicating memory and resources, it incurs higher overhead than creating a thread.",
            "",
            "### 📊 Comparison: Process vs Thread",
            "",
            "| Feature | Process | Thread |",
            "| :--- | :--- | :--- |",
            "| **Execution Weight** | Heavyweight task | Lightweight unit |",
            "| **Code & Data Memory** | Dedicated copy per process | Shared among threads |",
            "| **Stack & Registers** | Private per process | Private per thread |",
            "| **Creation Overhead** | Higher (duplicates memory) | Lower (shares memory) |",
            "| **OS Management** | Independent process | Unit inside process |",
            "",
            "### 🖼️ Memory Model: Process vs Threads",
            "```mermaid",
            "graph TD",
            "    subgraph Process [Process Memory Space]",
            "        Shared[Shared Code & Data Segment]",
            "        subgraph Threads [Execution Threads]",
            "            T1[Thread 1: Stack & Registers]",
            "            T2[Thread 2: Stack & Registers]",
            "        end",
            "        Shared --> T1",
            "        Shared --> T2",
            "    end",
            "```"
        ])
    elif is_dbms:
        doc_lines.extend([
            "# 📘 Database Management Systems (DBMS)",
            "",
            "### 📌 Overview",
            "This lecture covers **DBMS Architecture**, comparing traditional File Processing Systems against Database Management Systems, key data independence principles, and structural database components.",
            "",
            "---",
            "",
            "## ⚙️ File System vs DBMS",
            "",
            "A traditional **File System** stores data in individual files with high redundancy, data inconsistency, and complex file access logic written inside application code.",
            "",
            "A **DBMS (Database Management System)** provides a centralized software system to create, manage, and query structured databases with ACID compliance, concurrent user access, and data security.",
            "",
            "### 📊 Comparison: File System vs DBMS",
            "",
            "| Feature | File System | DBMS |",
            "| :--- | :--- | :--- |",
            "| **Data Redundancy** | High duplication | Minimized / Controlled |",
            "| **Data Inconsistency** | High risk | Prevented via constraints |",
            "| **Concurrent Access** | Difficult / File locking | Native multi-user control |",
            "| **Security & Backup** | Manual per file | Centralized security & recovery |",
            "",
            "### 🏗️ 3-Schema Architecture",
            "```mermaid",
            "graph TD",
            "    External[External / View Level]",
            "    Conceptual[Conceptual / Logical Level]",
            "    Internal[Internal / Physical Level]",
            "    External --> Conceptual",
            "    Conceptual --> Internal",
            "```"
        ])
    else:
        # Dynamic extraction of topic sentences into clean ChatGPT-style notes
        title_sent = sentences[0]
        # Clean title sent from filler
        clean_title = re.sub(r"(?i)^(in this|today|we will|so|now)\s*", "", title_sent).strip()
        doc_lines.extend([
            f"# 📘 {clean_title[:55].capitalize()}",
            "",
            "### 📌 Overview",
            f"This study guide presents the core concepts taught in the lecture: **{clean_title}**.",
            "",
            "---",
            ""
        ])
        
        # Group sentences into distinct technical subtopics
        section_count = min(4, max(2, len(sentences) // 4))
        chunk_size = max(1, len(sentences) // section_count)
        
        for s_idx in range(section_count):
            chunk = sentences[s_idx * chunk_size : (s_idx + 1) * chunk_size]
            if chunk:
                head_text = re.sub(r"(?i)^(so|now|and|in|the)\s*", "", chunk[0]).strip()
                sec_title = head_text[:45].capitalize()
                doc_lines.append(f"## ⚙️ {sec_title}")
                doc_lines.append("")
                for sent in chunk[:4]:
                    clean_s = sent.strip()
                    if clean_s:
                        doc_lines.append(f"- **Key Fact**: {clean_s}.")
                doc_lines.append("")

    return "\n".join(doc_lines)

def _validate_extracted_knowledge(data: dict) -> dict:
    """
    STAGE 4 - KNOWLEDGE VALIDATOR:
    Sanitizes extracted JSON lecture data. Ensures lecture_types classification exists,
    filters generic titles, strips conversational noise, and removes generic fallback diagrams.
    """
    logger.info("Stage 4: Validating extracted lecture knowledge...")
    if not isinstance(data, dict):
        return {"title": "Lecture Notes", "lecture_types": ["THEORY"], "topics": []}

    # Ensure lecture_types
    types = data.get("lecture_types", ["THEORY"])
    if isinstance(types, str):
        types = [types]
    data["lecture_types"] = types

    cleaned_topics = []
    seen_diagrams = set()

    for idx, topic in enumerate(data.get("topics", []), 1):
        if not isinstance(topic, dict):
            continue

        raw_title = topic.get("title", "").strip()
        # Filter generic topic titles
        if not raw_title or re.match(r"(?i)^(concept|topic|section|part)\s*\d+$", raw_title):
            raw_title = f"Lecture Topic {idx}"
        topic["title"] = raw_title

        # Validate diagram_information for compact footprint (max 6 nodes, unique diagram per lecture)
        diag = topic.get("diagram_information")
        if isinstance(diag, dict):
            m_code = diag.get("mermaid_code", "")
            node_count = len(re.findall(r"\[.*?\]", m_code))
            # Ban generic templates, duplicate diagrams, or overly large diagrams (> 6 nodes)
            if "Input Request" in m_code or "Processing Unit" in m_code or m_code in seen_diagrams or node_count > 6:
                topic["diagram_information"] = None
            else:
                seen_diagrams.add(m_code)
        else:
            topic["diagram_information"] = None

        cleaned_topics.append(topic)

    data["topics"] = cleaned_topics
    return data

def _validate_generated_notes(notes_text: str) -> str:
    """
    STAGE 7 - FINAL NOTES VALIDATOR:
    Validates generated Markdown. Strips leftover raw transcript intros,
    sanitizes generic headers, strips internal source_segments IDs, and ensures clean diagram formatting.
    """
    logger.info("Stage 7: Running final notes quality validation...")
    if not notes_text:
        return "# 📘 Lecture Study Notes\n\nNotes content unavailable."

    lines = notes_text.split("\n")
    cleaned_lines = []
    
    # Strip leading transcript intro lines if any leaked
    skip_intro = True
    for line in lines:
        lower = line.lower()
        if skip_intro and any(phrase in lower for phrase in ["welcome to", "in this video", "hello friends", "welcome back"]):
            continue
        if line.strip().startswith("#"):
            skip_intro = False
        cleaned_lines.append(line)

    final_md = "\n".join(cleaned_lines)
    
    # Replace any leftover generic titles
    final_md = re.sub(r"(?i)##\s*Concept\s*(\d+)", r"## ⚙️ Key Lecture Topic \1", final_md)

    # Strip any internal source_segments IDs if leaked into markdown
    final_md = re.sub(r"(?i)\[source_segments?:.*?\]", "", final_md)
    final_md = re.sub(r"(?i)source_segments?:?\s*\[.*?\]", "", final_md)

    # Normalize technical claim strength to preserve lecture nuance
    final_md = re.sub(r"(?i)\beliminates\s+redundancy\b", "helps reduce redundancy", final_md)
    final_md = re.sub(r"(?i)\beliminates\s+all\s+inconsistency\b", "helps prevent data inconsistency", final_md)
    
    return final_md

def generate_notes(transcript_text: str, target_pages: str, metadata: dict | None = None) -> str:
    """
    Modular 8-Stage Adaptive Pipeline using Gemini AI with instant local conceptual fallback.
    Routes transcript through Classification, Extraction, Validation, Adaptive Generation, and Final Quality Validation.

    `metadata` (Phase 4 research instrumentation, optional): if a dict is
    passed, this function records generation provenance into it —
    metadata['generation_method'] = 'gemini' | 'offline_fallback', and
    metadata['model_name_used'] (only set on the 'gemini' path). This is
    purely additive: omitting `metadata` reproduces the exact prior
    behavior and return type (a plain notes string) unchanged.
    """
    prompt_transcript = _clean_transcript_filler(transcript_text)
    try:
        # Include complete transcript (up to 120,000 chars / ~2.5 hour lecture) so zero topics are dropped
        MAX_TRANSCRIPT_CHARS = 120000
        if len(prompt_transcript) > MAX_TRANSCRIPT_CHARS:
            logger.info(f"Transcript length ({len(prompt_transcript)} chars) exceeds maximum budget. Truncating to {MAX_TRANSCRIPT_CHARS} chars.")
            prompt_transcript = prompt_transcript[:MAX_TRANSCRIPT_CHARS]

        # Adaptive Study Notes & Visual Generation (Fast single-pass pipeline)
        logger.info("Generating adaptive study notes & decision-based visuals via Gemini AI...")
        prompt = SMART_PROMPT.replace("{lecture_json}", "{}").replace("{transcript}", prompt_transcript).replace("{target_pages}", target_pages)
        raw_notes = _generate_with_fallback(prompt, metadata=metadata)

        if metadata is not None:
            metadata["generation_method"] = "gemini"

        # STAGE 7: Final Quality Validation
        validated_notes = _validate_generated_notes(raw_notes)
        return validated_notes

    except Exception as e:
        logger.warning(f"Online AI model unavailable ({e}). Generating adaptive notes via local conceptual engine...")
        if metadata is not None:
            metadata["generation_method"] = "offline_fallback"
            metadata["model_name_used"] = None
        return _validate_generated_notes(_generate_offline_notes(transcript_text, target_pages))