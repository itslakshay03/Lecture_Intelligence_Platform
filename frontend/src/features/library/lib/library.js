/**
 * Search / sort helpers for the Lecture Library. Operates only on the real
 * `lectra_recent_lectures` entries (see features/dashboard/lib/recentLectures) —
 * nothing here fetches, generates, or invents lecture data.
 */

/** Real watch URL for a stored videoId, or null. */
export function youtubeWatchUrl(videoId) {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

/** Best-effort creation time in ms — real ISO timestamp when present, else 0. */
function timeOf(item) {
  if (item?.createdAtISO) {
    const t = new Date(item.createdAtISO).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

const SORTERS = {
  newest: (a, b) => timeOf(b) - timeOf(a),
  oldest: (a, b) => timeOf(a) - timeOf(b),
  az: (a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }),
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'az', label: 'Title (A–Z)' },
];

/**
 * Filters by title / video id / task id (case-insensitive substring) and
 * sorts. Never mutates the input array.
 */
export function filterAndSortLectures(items, { query = '', sort = 'newest' } = {}) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((item) => {
        const haystacks = [item.title, item.videoId, item.taskId];
        return haystacks.some((h) => typeof h === 'string' && h.toLowerCase().includes(q));
      })
    : items.slice();

  const sorter = SORTERS[sort] || SORTERS.newest;
  return filtered.sort(sorter);
}
