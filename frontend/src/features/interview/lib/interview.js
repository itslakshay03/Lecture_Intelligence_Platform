/**
 * Interview-question helpers. Operates only on the real `interview_questions`
 * object from `fetchTaskContent` — nothing is generated or invented.
 *
 * Backend shape:
 *   { basic: Item[], intermediate: Item[], advanced: Item[] }
 *   Item = { id, question, answer }
 */

const BUCKETS = [
  { key: 'basic', label: 'Basic' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

/** Strip stray markdown / HTML from a plain-text field. */
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

/**
 * Flatten the three difficulty buckets (in basic -> advanced order) into a
 * single ordered list. A question is kept if it has prompt text; a missing
 * answer becomes '' (the UI shows that it wasn't provided rather than faking one).
 * Returns { ok, questions, counts, reason }.
 */
export function normalizeInterview(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, questions: [], counts: null, reason: 'missing' };
  }

  const hasAnyArray = BUCKETS.some(({ key }) => Array.isArray(raw[key]));
  if (!hasAnyArray) return { ok: false, questions: [], counts: null, reason: 'missing' };

  const questions = [];
  const counts = { basic: 0, intermediate: 0, advanced: 0, total: 0 };

  BUCKETS.forEach(({ key, label }) => {
    const list = Array.isArray(raw[key]) ? raw[key] : [];
    list.forEach((item, i) => {
      if (!item || typeof item !== 'object') return;
      const question = cleanText(item.question);
      if (!question) return;
      questions.push({
        id: item.id || `${key}-${i + 1}`,
        question,
        answer: cleanText(item.answer),
        difficulty: key,
        difficultyLabel: label,
      });
      counts[key] += 1;
      counts.total += 1;
    });
  });

  if (questions.length === 0) return { ok: false, questions: [], counts, reason: 'empty' };
  return { ok: true, questions, counts, reason: null };
}

/** marks: { [questionIndex]: 'reviewed' | 'flagged' } */
export function summarize(marks, total) {
  let reviewed = 0;
  let flagged = 0;
  Object.values(marks).forEach((m) => {
    if (m === 'reviewed') reviewed += 1;
    else if (m === 'flagged') flagged += 1;
  });
  return {
    reviewed,
    flagged,
    remaining: total - reviewed,
    total,
    percent: total ? Math.round((reviewed / total) * 100) : 0,
  };
}
