/**
 * Flashcard data helpers. Operates only on the real `flashcards` array from
 * `fetchTaskContent` — nothing is generated or invented.
 *
 * Backend shape (per card): { id, front, back }
 */

/** Strip stray markdown / HTML syntax from a card face. */
export function cleanText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[*\-+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\*{2,3}([^*]+)\*{2,3}/g, '$1')
    .replace(/_{2,3}([^_]+)_{2,3}/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate + normalize. A card is kept only if it has non-empty front and back
 * text. Returns { ok, cards, reason }.
 */
export function normalizeFlashcards(raw) {
  if (!Array.isArray(raw)) return { ok: false, cards: [], reason: 'missing' };
  if (raw.length === 0) return { ok: false, cards: [], reason: 'empty' };

  const cards = [];
  raw.forEach((c, i) => {
    if (!c || typeof c !== 'object') return;
    const front = cleanText(c.front);
    const back = cleanText(c.back);
    if (!front || !back) return;
    cards.push({ id: c.id || `fc-${i + 1}`, front, back });
  });

  if (cards.length === 0) return { ok: false, cards: [], reason: 'invalid' };
  return { ok: true, cards, reason: null };
}

/** marks: { [cardIndex]: 'known' | 'review' } */
export function summarize(marks, total) {
  let known = 0;
  let review = 0;
  Object.values(marks).forEach((m) => {
    if (m === 'known') known += 1;
    else if (m === 'review') review += 1;
  });
  return { known, review, marked: known + review, remaining: total - (known + review), total };
}

/** Index of the first card the user flagged for review, or 0. */
export function firstReviewIndex(marks) {
  const keys = Object.keys(marks)
    .filter((k) => marks[k] === 'review')
    .map(Number)
    .sort((a, b) => a - b);
  return keys.length ? keys[0] : 0;
}
