import pytest
from services.transcript import extract_video_id

def test_extract_standard_watch_url():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_youtu_be_url():
    url = "https://youtu.be/dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_embed_url():
    url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_v_slash_url():
    url = "https://www.youtube.com/v/dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_shorts_url():
    url = "https://www.youtube.com/shorts/dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_mobile_url():
    url = "https://m.youtube.com/watch?v=dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_extract_music_url():
    url = "https://music.youtube.com/watch?v=dQw4w9WgXcQ"
    assert extract_video_id(url) == "dQw4w9WgXcQ"

def test_url_with_extra_query_parameters():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=WL&si=abc_123"
    assert extract_video_id(url) == "dQw4w9WgXcQ"
    
    url_shorts = "https://www.youtube.com/shorts/dQw4w9WgXcQ?si=abc&feature=share"
    assert extract_video_id(url_shorts) == "dQw4w9WgXcQ"

    url_short_domain = "https://youtu.be/dQw4w9WgXcQ?t=100"
    assert extract_video_id(url_short_domain) == "dQw4w9WgXcQ"

def test_invalid_domains():
    with pytest.raises(ValueError, match="Unsupported domain"):
        extract_video_id("https://www.google.com/watch?v=dQw4w9WgXcQ")
    with pytest.raises(ValueError, match="Unsupported domain"):
        extract_video_id("https://vimeo.com/dQw4w9WgXcQ")

def test_malformed_urls():
    with pytest.raises(ValueError, match="YouTube URL cannot be empty"):
        extract_video_id("")
    with pytest.raises(ValueError, match="YouTube URL cannot be empty"):
        extract_video_id("   ")

def test_missing_video_id():
    # URL has watch path but missing 'v' parameter
    with pytest.raises(ValueError, match="Could not extract YouTube video ID"):
        extract_video_id("https://www.youtube.com/watch?list=WL")
    
    # URL has embed path but missing video id segment
    with pytest.raises(ValueError, match="Could not extract YouTube video ID"):
        extract_video_id("https://www.youtube.com/embed/")

def test_invalid_video_id_length():
    # Video ID too short (10 chars)
    with pytest.raises(ValueError, match="must be exactly 11 characters"):
        extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXc")
    
    # Video ID too long (12 chars)
    with pytest.raises(ValueError, match="must be exactly 11 characters"):
        extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQQ")

def test_invalid_characters_in_video_id():
    # Video ID containing spaces or invalid chars
    with pytest.raises(ValueError, match="contains invalid characters"):
        extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXc*")
