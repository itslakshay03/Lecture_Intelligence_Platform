import os
import re
import json
import logging
import http.cookiejar
import requests
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable
)

from config import BASE_DIR

logger = logging.getLogger("transcript_service")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _format_timestamp(seconds: float) -> str:
    """
    Formats time in seconds to a ⏱ timestamp marker.
    Uses MM:SS for sub-hour offsets and rolls over to H:MM:SS at/after one hour
    so long lectures (> 100 min) never emit ambiguous 3-digit-minute markers.
    """
    total = max(0, int(seconds))
    hrs = total // 3600
    mins = (total % 3600) // 60
    secs = total % 60
    if hrs > 0:
        return f"⏱ {hrs:d}:{mins:02d}:{secs:02d}"
    return f"⏱ {mins:02d}:{secs:02d}"


def clean_transcript(text: str) -> str:
    """
    Deduplicates consecutive sentences and cleans transcript strings while preserving [⏱ MM:SS] timestamps.
    """
    text = " ".join(text.split())
    lines = text.split(".")
    cleaned = []
    previous = ""
    for line in lines:
        line = line.strip()
        if line and line != previous:
            cleaned.append(line)
            previous = line
    return ". ".join(cleaned)


def page_budget(duration_seconds: float) -> str:
    """
    Decides target notes length based on video duration in minutes.
    Ensures short videos (< 15 mins) yield concise 2-4 page study notes.
    """
    duration_minutes = duration_seconds / 60
    if duration_minutes < 5:
        return "1-2 pages (Concise High-Yield Summary)"
    elif duration_minutes < 15:
        return "2-4 pages (Focused Study Guide)"
    elif duration_minutes < 30:
        return "4-6 pages (Detailed Courseware)"
    elif duration_minutes < 60:
        return "6-8 pages (Comprehensive Master Guide)"
    else:
        return "8-12 pages (Exhaustive Exam Preparation)"


def extract_video_id(url: str) -> str:
    """
    Parses a YouTube URL and extracts its 11-character video ID.
    Supports standard, youtu.be, embed, mobile, music, and Shorts formats.
    """
    if not url or not url.strip():
        raise ValueError("YouTube URL cannot be empty.")

    try:
        parsed = urlparse(url.strip())
    except Exception as e:
        raise ValueError(f"Malformed URL structure: {e}") from e

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Invalid URL: No hostname found.")

    hostname = hostname.lower()

    allowed_domains = {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be"
    }

    is_valid_domain = hostname in allowed_domains or hostname.endswith(".youtube.com")
    if not is_valid_domain:
        raise ValueError(f"Unsupported domain: '{hostname}'. Only YouTube links are supported.")

    path = parsed.path
    query = parsed.query
    video_id = None

    if hostname == "youtu.be":
        path_parts = [p for p in path.split("/") if p]
        if path_parts:
            video_id = path_parts[0]
    else:
        if path == "/watch":
            params = parse_qs(query)
            if "v" in params and params["v"]:
                video_id = params["v"][0]
        elif path.startswith(("/embed/", "/v/", "/shorts/")):
            path_parts = [p for p in path.split("/") if p]
            if len(path_parts) >= 2:
                video_id = path_parts[1]

    if not video_id:
        raise ValueError("Could not extract YouTube video ID from the provided URL format.")

    video_id = video_id.split("?")[0].split("&")[0].split("#")[0]

    if len(video_id) != 11:
        raise ValueError(
            f"Extracted video ID '{video_id}' is invalid. "
            f"YouTube video IDs must be exactly 11 characters."
        )

    if not re.match(r'^[a-zA-Z0-9_-]{11}$', video_id):
        raise ValueError(
            f"Extracted video ID '{video_id}' contains invalid characters."
        )

    return video_id


def _get_cookies_path() -> Path | None:
    """Returns the absolute path to cookies.txt if it exists, otherwise None."""
    cookies_env = os.getenv("YOUTUBE_COOKIES_PATH", "cookies.txt").strip()
    cookies_path = Path(cookies_env)
    if not cookies_path.is_absolute():
        cookies_path = BASE_DIR / cookies_path
    if cookies_path.exists():
        return cookies_path
    logger.warning(f"Cookies file NOT found at path: {cookies_path}")
    return None


# ---------------------------------------------------------------------------
# Strategy 1: yt-dlp (best anti-detection, handles PoToken)
# ---------------------------------------------------------------------------

def _fetch_via_ytdlp(video_id: str) -> tuple[str, float] | None:
    """
    Uses yt-dlp to extract subtitle URLs, then downloads subtitles directly
    using the authenticated session. This avoids video format issues and the
    429 that occurs when yt-dlp tries to download subtitles through its own pipeline.
    Returns (raw_text, duration_seconds) on success, or None on failure.
    """
    try:
        import yt_dlp
    except ImportError:
        logger.info("yt-dlp not installed, skipping strategy 1.")
        return None

    cookies_path = _get_cookies_path()

    # Build authenticated session for downloading subtitle URLs
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/126.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "*/*",
        "Origin": "https://www.youtube.com",
        "Referer": f"https://www.youtube.com/watch?v={video_id}",
    })

    if cookies_path:
        cj = http.cookiejar.MozillaCookieJar(str(cookies_path))
        try:
            cj.load(ignore_discard=True, ignore_expires=True)
            session.cookies = cj
            logger.info(f"yt-dlp strategy: Loaded {len(list(cj))} cookies")
        except Exception as ce:
            logger.warning(f"yt-dlp strategy: Could not load cookies: {ce}")

    # Use yt-dlp only to extract video metadata and subtitle URLs with fast socket timeout
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "socket_timeout": 8,
    }
    if cookies_path:
        ydl_opts["cookiefile"] = str(cookies_path)

    try:
        logger.info("yt-dlp: Extracting video info and subtitle URLs...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(
                f"https://www.youtube.com/watch?v={video_id}",
                download=False
            )

        if info is None:
            logger.warning("yt-dlp: extract_info returned None")
            return None

        duration = float(info.get("duration", 0) or 0)
        manual_subs = info.get("subtitles", {})
        auto_subs = info.get("automatic_captions", {})

        logger.info(
            f"yt-dlp: Found manual={list(manual_subs.keys())} "
            f"auto={list(auto_subs.keys())[:10]}"
        )

        # Try manual subs first (higher quality), then auto-generated
        pref_langs = ["en", "en-US", "en-GB", "hi"]
        for src_label, src in [("manual", manual_subs), ("auto", auto_subs)]:
            for lang in pref_langs:
                if lang not in src:
                    continue
                entries = src[lang]
                # Prefer json3, fall back to other formats
                for fmt in ["json3", "srv3", "srv2", "srv1"]:
                    for entry in entries:
                        if entry.get("ext") != fmt:
                            continue
                        sub_url = entry.get("url")
                        if not sub_url:
                            continue
                        logger.info(
                            f"yt-dlp: Downloading {src_label} subtitle "
                            f"lang={lang} fmt={fmt}"
                        )
                        try:
                            r = session.get(sub_url, timeout=20)
                            if r.status_code == 200:
                                if fmt == "json3":
                                    text = _parse_json3_data(r.json())
                                else:
                                    # srv formats are XML — parse text tags
                                    text = _parse_srv_xml(r.text)
                                if text:
                                    logger.info(
                                        f"yt-dlp: Successfully fetched subtitle "
                                        f"({len(text)} chars)"
                                    )
                                    return text, duration
                            elif r.status_code == 429:
                                logger.warning(
                                    f"yt-dlp: Subtitle download rate-limited (HTTP 429). Skipping further attempts."
                                )
                                return None
                            else:
                                logger.warning(
                                    f"yt-dlp: Subtitle download returned HTTP {r.status_code}"
                                )
                        except Exception as de:
                            logger.warning(f"yt-dlp: Subtitle download error: {de}")

        logger.warning("yt-dlp: No subtitle could be downloaded for this video.")
        return None

    except Exception as e:
        logger.warning(f"yt-dlp: extract_info failed: {type(e).__name__}: {str(e)[:300]}")
        return None


def _parse_json3_subtitles(file_path: Path) -> str:
    """Parse yt-dlp json3 subtitle file into plain text."""
    try:
        with open(file_path, encoding="utf-8") as f:
            data = json.load(f)
        return _parse_json3_data(data)
    except Exception as e:
        logger.warning(f"Failed to parse json3 subtitles at {file_path}: {e}")
        return ""


def _parse_json3_data(data: dict) -> str:
    """Parse YouTube json3 subtitle data (already loaded as dict) into text with timestamp markers."""
    lines = []
    last_timestamp_sec = -120.0
    for event in data.get("events", []):
        start_ms = event.get("tStartMs", 0)
        start_sec = start_ms / 1000.0
        segs = event.get("segs", [])
        text_chunk = "".join(seg.get("utf8", "") for seg in segs if seg.get("utf8")).strip()
        if text_chunk and text_chunk != "\n":
            if start_sec - last_timestamp_sec >= 60.0:
                lines.append(f"\n[{_format_timestamp(start_sec)}]")
                last_timestamp_sec = start_sec
            lines.append(text_chunk)
    return " ".join(lines)


def _parse_srv_xml(xml_text: str) -> str:
    """Parse YouTube srv1/srv2/srv3 XML subtitle format into plain text."""
    import re as _re
    # Remove XML tags and get text content
    text = _re.sub(r'<[^>]+>', ' ', xml_text)
    # Decode common HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
    # Clean up whitespace
    return " ".join(text.split())


# ---------------------------------------------------------------------------
# Strategy 2: youtube-transcript-api with cookies + proper headers
# ---------------------------------------------------------------------------

def _build_api() -> YouTubeTranscriptApi:
    """
    Builds a YouTubeTranscriptApi instance with a cookie-authenticated session
    and realistic browser headers.
    """
    cookies_path = _get_cookies_path()

    if cookies_path:
        logger.info(f"youtube-transcript-api: Using cookies from {cookies_path}")
        try:
            session = requests.Session()
            cj = http.cookiejar.MozillaCookieJar(str(cookies_path))
            cj.load(ignore_discard=True, ignore_expires=True)
            session.cookies = cj
            # Add realistic browser headers to reduce bot detection
            session.headers.update({
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/126.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Referer": "https://www.youtube.com/",
            })
            return YouTubeTranscriptApi(http_client=session)
        except Exception as ce:
            logger.warning(f"Failed to load cookies from {cookies_path}: {ce}")

    return YouTubeTranscriptApi()


def _fetch_via_transcript_api(video_id: str) -> tuple[str, float] | None:
    """
    Fetches transcript using youtube-transcript-api with cookie auth.
    Returns (raw_text, duration_seconds) on success, or None on failure.
    """
    try:
        api = _build_api()
        transcript = api.fetch(
            video_id,
            languages=["en-GB", "en-US", "hi", "en"]
        )
        lines = []
        last_timestamp_sec = -120.0
        duration = 0.0
        for item in transcript:
            start_sec = getattr(item, "start", 0.0)
            duration = max(duration, start_sec + getattr(item, "duration", 0.0))
            text_str = item.text.strip()
            if text_str:
                if start_sec - last_timestamp_sec >= 60.0:
                    lines.append(f"\n[{_format_timestamp(start_sec)}]")
                    last_timestamp_sec = start_sec
                lines.append(text_str)
        
        full_text = " ".join(lines)
        logger.info("youtube-transcript-api: Fetch succeeded with timestamps.")
        return full_text, float(duration)

    except TranscriptsDisabled as td:
        raise ValueError(f"Transcripts are disabled for this video: {td}") from td
    except NoTranscriptFound as ntf:
        raise ValueError(f"No transcripts found in preferred languages: {ntf}") from ntf
    except VideoUnavailable as vu:
        raise ValueError(f"The video is unavailable or restricted: {vu}") from vu
    except Exception as e:
        err = str(e).lower()
        is_ip_block = any(kw in err for kw in [
            "ipblocked", "requestblocked", "blocking", "cloud", "blocked", "ip"
        ])
        if is_ip_block:
            logger.warning(f"youtube-transcript-api: IP block detected: {e}")
            return None  # Signal to try next strategy
        raise ValueError(f"An error occurred while fetching the YouTube transcript:\n{e}") from e


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_transcript(url: str):
    """
    Fetches the cleaned transcript, target page layout budget, and video ID from a YouTube link.

    Uses a multi-strategy approach:
    1. yt-dlp (better anti-bot evasion, handles PoToken)
    2. youtube-transcript-api with cookie auth + browser headers

    Returns:
        tuple[str, str, str]: transcript_text, target_pages, video_id
    """
    video_id = extract_video_id(url)

    logger.info(f"Fetching transcript for video ID: {video_id}")

    # --- Strategy 1: yt-dlp ---
    logger.info("Trying strategy 1: yt-dlp")
    result = _fetch_via_ytdlp(video_id)
    if result:
        raw_text, duration = result
        transcript_text = clean_transcript(raw_text)
        target_pages = page_budget(duration)
        logger.info(f"Strategy 1 (yt-dlp) succeeded. Duration: {duration:.0f}s")
        return transcript_text, target_pages, video_id, float(duration)

    # --- Strategy 2: youtube-transcript-api ---
    logger.info("Strategy 1 failed. Trying strategy 2: youtube-transcript-api")
    result = _fetch_via_transcript_api(video_id)
    if result:
        raw_text, duration = result
        transcript_text = clean_transcript(raw_text)
        target_pages = page_budget(duration)
        logger.info(f"Strategy 2 (transcript-api) succeeded. Duration: {duration:.0f}s")
        return transcript_text, target_pages, video_id, float(duration)

    # --- All strategies failed ---
    raise ValueError(
        "YouTube is blocking transcript requests from your IP address.\n\n"
        "This happens when YouTube detects automated requests from your network. "
        "Your cookies have been applied but the IP-level block persists.\n\n"
        "To fix this:\n"
        "1. Refresh your cookies: Open YouTube in Chrome, then re-export cookies.txt\n"
        "2. Or try again after 15-30 minutes (temporary rate limit)\n"
        "3. Or use a VPN and re-export your cookies while connected to it"
    )
