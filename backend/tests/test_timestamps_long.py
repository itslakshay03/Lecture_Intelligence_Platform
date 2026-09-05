"""
Regression + adaptivity tests for the timestamp-linked notes system.

Focus: timestamps must adapt to the *actual* lecture duration, stay within
[0, duration), stay chronological, and remain correct for long lectures
(> 100 minutes) where transcript cue markers roll past 99 minutes.
"""
import pytest

from services.transcript import _format_timestamp
from utils.study_pack import (
    parse_notes_to_study_pack,
    _cue_to_seconds,
    _fmt_hms,
)

NOTES = """# 📘 Operating Systems Deep Dive

### 📌 Overview
Overview of the lecture.

## ⚙️ Alpha Concept
- Alpha concept explained with detail.

## ⚙️ Beta Concept
- Beta concept explained with detail.

## ⚙️ Gamma Concept
- Gamma concept explained with detail.
"""


def _marker(sec):
    """Transcript cue marker exactly as the transcript service emits it."""
    return f"\n[{_format_timestamp(sec)}]"


# --------------------------------------------------------------------------
# _format_timestamp / helpers
# --------------------------------------------------------------------------
@pytest.mark.parametrize("sec,expected", [
    (0, "⏱ 00:00"),
    (90, "⏱ 01:30"),
    (3599, "⏱ 59:59"),
    (3600, "⏱ 1:00:00"),
    (6120, "⏱ 1:42:00"),
    (7530, "⏱ 2:05:30"),
    (9000, "⏱ 2:30:00"),
])
def test_format_timestamp_rolls_over_to_hours(sec, expected):
    assert _format_timestamp(sec) == expected


def test_format_timestamp_never_emits_3_digit_minutes():
    for sec in range(0, 4 * 3600, 137):
        marker = _format_timestamp(sec)
        minutes_field = marker.replace("⏱ ", "").split(":")[-2]
        assert len(minutes_field) == 2


@pytest.mark.parametrize("hrs,mins,secs,expected", [
    (None, "10", "00", 600),
    ("1", "22", "00", 4920),
    (None, "122", "00", 7320),   # legacy MMM:SS marker
    (None, "02", "15", 135),
    ("2", "05", "30", 7530),
])
def test_cue_to_seconds(hrs, mins, secs, expected):
    assert _cue_to_seconds(hrs, mins, secs) == expected


@pytest.mark.parametrize("sec,expected", [
    (0, "00:00"), (135, "02:15"), (3600, "1:00:00"), (7320, "2:02:00"),
])
def test_fmt_hms(sec, expected):
    assert _fmt_hms(sec) == expected


# --------------------------------------------------------------------------
# Long-lecture regression (the bug: cues past 99:59 mis-parsed as small values)
# --------------------------------------------------------------------------
def test_long_lecture_timestamps_are_correct_and_ordered():
    duration = 9000.0  # 2h30m
    transcript = (
        _marker(0) + " introduction to the whole lecture "
        + _marker(600) + " now we begin the alpha concept in earnest "
        + _marker(7320) + " moving on to the beta concept after the break "
        + _marker(8400) + " finally the gamma concept to wrap up"
    )
    pack = parse_notes_to_study_pack(NOTES, "longvid", duration=duration,
                                     transcript_text=transcript)
    ts = pack["timestamps"]
    secs = [t["sec"] for t in ts]

    assert secs == sorted(secs), f"not chronological: {secs}"
    assert all(0 <= s < duration for s in secs), f"out of bounds: {secs}"
    # Beta / Gamma occur in the 2nd hour and must keep their real offsets.
    assert 7320 in secs, f"beta cue lost/mis-parsed: {ts}"
    assert 8400 in secs, f"gamma cue lost/mis-parsed: {ts}"
    label_for = {t["sec"]: t["time"] for t in ts}
    assert label_for[7320] == "2:02:00"


def test_legacy_3digit_minute_marker_still_parses():
    """Data cached by an earlier build used [⏱ 122:00] style markers."""
    transcript = "\n[⏱ 122:00] beta concept discussed here in the legacy format"
    pack = parse_notes_to_study_pack(NOTES, "legacy", duration=9000.0,
                                     transcript_text=transcript)
    secs = [t["sec"] for t in pack["timestamps"]]
    assert 7320 in secs


# --------------------------------------------------------------------------
# Duration adaptivity: different lengths -> different timestamp ranges
# --------------------------------------------------------------------------
@pytest.mark.parametrize("duration", [45, 90, 300, 900, 1800, 3600, 7200])
def test_timestamps_scale_with_duration(duration):
    n = 3
    span = duration
    cues = []
    for i, name in enumerate(["alpha", "beta", "gamma"]):
        sec = int(span * (i + 1) / (n + 1))
        cues.append(f"{_marker(sec)} discussing the {name} concept now")
    transcript = _marker(0) + " intro " + " ".join(cues)
    pack = parse_notes_to_study_pack(NOTES, f"vid{duration}", duration=float(duration),
                                     transcript_text=transcript)
    secs = [t["sec"] for t in pack["timestamps"]]
    assert secs == sorted(secs)
    assert all(0 <= s < duration for s in secs)
    assert secs[0] == 0  # always an intro anchor


def test_short_vs_long_same_notes_produce_different_ranges():
    tr_short = (_marker(0) + " a " + _marker(30) + " alpha concept " +
                _marker(70) + " beta concept " + _marker(110) + " gamma concept")
    tr_long = (_marker(0) + " a " + _marker(1200) + " alpha concept " +
               _marker(3300) + " beta concept " + _marker(5700) + " gamma concept")
    short = parse_notes_to_study_pack(NOTES, "s", duration=140.0, transcript_text=tr_short)
    long = parse_notes_to_study_pack(NOTES, "l", duration=6600.0, transcript_text=tr_long)
    max_short = max(t["sec"] for t in short["timestamps"])
    max_long = max(t["sec"] for t in long["timestamps"])
    assert max_short < 140
    assert max_long > 140
    assert max_long > max_short * 5


# --------------------------------------------------------------------------
# Bounds / no-fabrication guarantees
# --------------------------------------------------------------------------
def test_cue_beyond_duration_is_dropped():
    transcript = _marker(0) + " intro " + _marker(120) + " alpha concept " + \
                 _marker(2700) + " beta concept far past the end"
    pack = parse_notes_to_study_pack(NOTES, "b", duration=180.0, transcript_text=transcript)
    assert max(t["sec"] for t in pack["timestamps"]) < 180


def test_unknown_duration_no_fabricated_timestamps():
    pack = parse_notes_to_study_pack(NOTES, "u", duration=0.0, transcript_text="")
    assert len(pack["timestamps"]) == 1
    assert pack["timestamps"][0]["time"] == "00:00"


def test_noise_that_looks_like_times_is_not_promoted():
    noisy = """# 📘 Noise
### 📌 Overview
We meet at 10:30 today, ratio 16:00, big-O 05:00.

## ⚙️ Merge Sort
- Nothing time-coded here.
"""
    pack = parse_notes_to_study_pack(noisy, "n", duration=240.0, transcript_text="")
    # No transcript cues + no topic/cue match => only the intro anchor.
    assert [t["time"] for t in pack["timestamps"]] == ["00:00"]
