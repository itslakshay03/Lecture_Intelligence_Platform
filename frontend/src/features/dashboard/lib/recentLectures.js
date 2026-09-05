/**
 * Helpers for the Dashboard's (and Library's) view of `lectra_recent_lectures`
 * (localStorage). All values here are derived from real local data written by
 * LectureFlow — nothing is fabricated. This is the single place both features
 * read the storage key from, so there is one definition of "recent lectures".
 */

export const RECENTS_STORAGE_KEY = 'lectra_recent_lectures';

/** How many lectures LectureFlow keeps in local history before trimming the oldest. */
export const MAX_STORED_LECTURES = 50;

/** Reads + parses the stored recent-lectures list. Never throws. */
export function readRecentLectures() {
  try {
    const saved = localStorage.getItem(RECENTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

/** YouTube thumbnail URL for a stored videoId, or null when unavailable. */
export function youtubeThumb(videoId, quality = 'mqdefault') {
  if (!videoId || !YT_ID_RE.test(videoId)) return null;
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Human "time ago" from an ISO timestamp. Falls back to the pre-formatted
 * `createdAt` string stored on older entries (which isn't machine-parseable).
 */
export function formatWhen(item) {
  const iso = item?.createdAtISO;
  if (iso) {
    const then = new Date(iso).getTime();
    if (!Number.isNaN(then)) {
      const diff = Date.now() - then;
      const min = Math.round(diff / 60000);
      if (min < 1) return 'Just now';
      if (min < 60) return `${min} min ago`;
      const hr = Math.round(min / 60);
      if (hr < 24) return `${hr} hr ago`;
      const day = Math.round(hr / 24);
      if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  return item?.createdAt || 'Recently';
}

/**
 * Metrics for the stats strip — strictly counted from local history.
 * `studyTools` = 5 per completed lecture (notes, quiz, flashcards, revision,
 * interview), which the backend generates for every study pack.
 */
export function deriveStats(recentLectures = []) {
  const lectures = recentLectures.length;
  return {
    lectures,
    studyPacks: lectures,
    studyTools: lectures * 5,
    lastActivity: lectures > 0 ? formatWhen(recentLectures[0]) : null,
  };
}
