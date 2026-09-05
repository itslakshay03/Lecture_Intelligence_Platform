import React from 'react';

/**
 * Compact question grid.
 *   mode "take"   — shows answered / current / unanswered.
 *   mode "result" — shows ✓ correct / ✕ incorrect / — unanswered.
 * Clicking a chip jumps to that question.
 */
export default function QuestionNavigator({ count, currentIndex, answers, questions, mode = 'take', onJump }) {
  if (count < 2) return null;

  return (
    <div className="quiz-nav-grid" role="list" aria-label="Question navigator">
      {Array.from({ length: count }).map((_, i) => {
        const answered = answers[i] !== undefined && answers[i] !== null;
        let cls = 'quiz-nav-chip';
        let glyph = String(i + 1);
        let label = `Question ${i + 1}`;

        if (mode === 'result') {
          if (!answered) {
            cls += ' is-empty';
            glyph = '—';
            label += ': not answered';
          } else if (questions[i] && answers[i] === questions[i].correctIndex) {
            cls += ' is-correct';
            glyph = '✓';
            label += ': correct';
          } else {
            cls += ' is-wrong';
            glyph = '✕';
            label += ': incorrect';
          }
        } else {
          if (i === currentIndex) cls += ' is-current';
          else if (answered) cls += ' is-answered';
          label += answered ? ': answered' : ': not answered';
        }

        return (
          <button
            key={i}
            type="button"
            role="listitem"
            className={cls}
            aria-current={mode === 'take' && i === currentIndex ? 'true' : undefined}
            aria-label={label}
            onClick={() => onJump(i)}
          >
            <span aria-hidden="true">{glyph}</span>
          </button>
        );
      })}
    </div>
  );
}
