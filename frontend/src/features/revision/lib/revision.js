/**
 * Revision-plan helpers. Operates only on the real `revision_plan` array from
 * `fetchTaskContent` — nothing is generated or invented.
 *
 * Backend shape (per stage):
 *   { stage, interval, priority, goal, topics: string[] }
 */

const EMOJI_LEAD = /^[\s\p{Extended_Pictographic}\p{Emoji_Component}]+/u;

function stripLeadingEmoji(text = '') {
  const s = String(text);
  return s.replace(EMOJI_LEAD, '').trim() || s.trim();
}

/** Remove stray markdown / HTML from a plain-text field. */
export function cleanText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*{2,3}([^*]+)\*{2,3}/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

/** Normalizes a priority string to a { key, label } pair, or null if absent. */
export function normalizePriority(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const key = value.trim().toLowerCase().replace(/\s*priority\s*$/i, '');
  if (key in PRIORITY_RANK) {
    return { key, label: key.charAt(0).toUpperCase() + key.slice(1) };
  }
  return { key: 'other', label: cleanText(value) };
}

/**
 * Validate + normalize the raw revision plan.
 * A stage is kept if it has any usable text (stage label OR goal OR topics).
 * Returns { ok, stages, reason }.
 */
export function normalizeRevision(raw) {
  if (!Array.isArray(raw)) return { ok: false, stages: [], reason: 'missing' };
  if (raw.length === 0) return { ok: false, stages: [], reason: 'empty' };

  const stages = [];
  raw.forEach((s, i) => {
    if (!s || typeof s !== 'object') return;
    const stage = cleanText(s.stage);
    const interval = cleanText(s.interval);
    const goal = cleanText(s.goal);
    const topics = Array.isArray(s.topics)
      ? s.topics.map((t) => cleanText(stripLeadingEmoji(t))).filter(Boolean)
      : [];
    if (!stage && !goal && topics.length === 0) return;
    stages.push({
      id: `rev-${i + 1}`,
      stage: stage || `Session ${i + 1}`,
      interval,
      priority: normalizePriority(s.priority),
      goal,
      topics,
    });
  });

  if (stages.length === 0) return { ok: false, stages: [], reason: 'invalid' };
  return { ok: true, stages, reason: null };
}

/** done: Set<number> of completed stage indices. */
export function summarize(done, total) {
  const completed = done.size;
  return {
    completed,
    remaining: total - completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}
