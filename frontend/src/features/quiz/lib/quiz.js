/**
 * Quiz data helpers. Everything operates on the real `quiz` array from
 * `fetchTaskContent` — no questions are generated or altered.
 *
 * Backend shape (per item):
 *   { id, topic, question, options: string[], correct_index: number, explanation }
 */

const EMOJI_LEAD = /^[\s\p{Extended_Pictographic}\p{Emoji_Component}]+/u;

/** Strip a leading run of emoji / symbols from a label (topic tags carry them). */
export function stripLeadingEmoji(text = '') {
  const s = String(text);
  return s.replace(EMOJI_LEAD, '').trim() || s.trim();
}

/** Remove stray markdown/HTML syntax from an option or question string. */
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
 * Validates + normalizes the raw quiz array.
 * Returns { ok, questions, reason }. A question is kept only when it has a
 * prompt, at least two options and an in-range correct index.
 */
export function normalizeQuiz(raw) {
  if (!Array.isArray(raw)) return { ok: false, questions: [], reason: 'missing' };
  if (raw.length === 0) return { ok: false, questions: [], reason: 'empty' };

  const questions = [];
  raw.forEach((q, i) => {
    if (!q || typeof q !== 'object') return;
    const question = cleanText(q.question);
    const options = Array.isArray(q.options) ? q.options.map(cleanText).filter(Boolean) : [];
    const correctIndex = Number.isInteger(q.correct_index) ? q.correct_index : -1;
    if (!question || options.length < 2 || correctIndex < 0 || correctIndex >= options.length) return;
    questions.push({
      id: q.id || `q-${i + 1}`,
      topic: q.topic ? stripLeadingEmoji(q.topic) : '',
      question,
      options,
      correctIndex,
      explanation: typeof q.explanation === 'string' && q.explanation.trim() ? q.explanation.trim() : '',
    });
  });

  if (questions.length === 0) return { ok: false, questions: [], reason: 'invalid' };
  return { ok: true, questions, reason: null };
}

/** answers: { [questionIndex]: optionIndex }. */
export function scoreQuiz(questions, answers) {
  const total = questions.length;
  let correct = 0;
  let answered = 0;
  questions.forEach((q, i) => {
    const a = answers[i];
    if (a === undefined || a === null) return;
    answered += 1;
    if (a === q.correctIndex) correct += 1;
  });
  const incorrect = answered - correct;
  const unanswered = total - answered;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  return { total, correct, incorrect, unanswered, answered, percent };
}

export function performanceMessage(percent) {
  if (percent >= 90) return 'Excellent — you have a strong command of this lecture.';
  if (percent >= 70) return 'Solid grasp of the core concepts. Review the misses to lock them in.';
  if (percent >= 50) return 'A reasonable start. Revisit the notes for the topics you missed.';
  if (percent > 0) return 'Some gaps here — work through the study notes and try again.';
  return 'Review the lecture notes and retry the quiz to build your understanding.';
}

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
