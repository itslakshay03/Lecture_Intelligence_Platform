import pytest
from utils.study_pack import parse_notes_to_study_pack, _format_duration

def test_format_duration():
    assert _format_duration(0) == "00:00"
    assert _format_duration(-10) == "00:00"
    assert _format_duration(59) == "00:59"
    assert _format_duration(65) == "01:05"
    assert _format_duration(642) == "10:42"
    assert _format_duration(3600) == "01:00:00"
    assert _format_duration(3725) == "01:02:05"

def test_grounded_timestamps_with_real_duration():
    sample_notes = """# 📘 Operating Systems: Virtual Memory

### 📌 Overview
Overview of virtual memory concepts.

## 💾 Paging Mechanism
- Page tables translate virtual addresses to physical addresses.
- Pages are fixed size blocks of memory.

## 🔄 Page Replacement Algorithms
- FIFO, LRU, and Optimal algorithms.
- LRU replaces the page that has not been used for the longest time.
"""
    sample_transcript = """
    [⏱ 00:00] Welcome to OS virtual memory.
    [⏱ 02:15] Today we dive deep into the paging mechanism and page tables.
    [⏱ 06:40] Now let us discuss page replacement algorithms such as LRU.
    """
    actual_duration = 645.0  # 10m 45s video

    pack = parse_notes_to_study_pack(
        notes_md=sample_notes,
        video_id="test_vid_1",
        duration=actual_duration,
        transcript_text=sample_transcript
    )

    assert pack["video_duration"] == 645.0
    assert pack["video_duration_formatted"] == "10:45"
    
    timestamps = pack["timestamps"]
    assert len(timestamps) >= 2
    
    # Check bounds
    for item in timestamps:
        assert 0 <= item["sec"] < actual_duration
        
    # Check ordering
    for i in range(len(timestamps) - 1):
        assert timestamps[i]["sec"] <= timestamps[i+1]["sec"]
        
    # Check real cue matching (02:15 for Paging, 06:40 for Page Replacement)
    times = [item["time"] for item in timestamps]
    assert "02:15" in times
    assert "06:40" in times
    
    # Assert NO fabricated intervals like 08:05
    assert "08:05" not in times
    assert "16:10" not in times

def test_timestamps_strictly_bounded_by_duration():
    """Any timestamp equal to or greater than actual video duration must be rejected."""
    sample_notes = """# 📘 Short Lecture

## 🎯 Topic Inside Video
- Content at 2 minutes [⏱ 02:00]

## 🚀 Topic Out Of Bounds
- Erroneous reference at 15 minutes [⏱ 15:00]
"""
    actual_duration = 300.0  # Exactly 5 minutes (300 seconds)

    pack = parse_notes_to_study_pack(
        notes_md=sample_notes,
        video_id="short_vid",
        duration=actual_duration,
        transcript_text=""
    )

    for item in pack["timestamps"]:
        assert item["sec"] < actual_duration, f"Timestamp {item['time']} ({item['sec']}s) exceeds duration {actual_duration}s"

def test_fallback_when_duration_unavailable():
    """When duration and cues are unavailable, no fake timestamps should be fabricated."""
    sample_notes = """# 📘 Unknown Length Lecture

## 🌲 Decision Trees
- How decision trees split data.
"""
    pack = parse_notes_to_study_pack(
        notes_md=sample_notes,
        video_id="unknown_vid",
        duration=0.0,
        transcript_text=""
    )

    # Should only have Introduction and no fabricated intervals
    assert len(pack["timestamps"]) == 1
    assert pack["timestamps"][0]["time"] == "00:00"
