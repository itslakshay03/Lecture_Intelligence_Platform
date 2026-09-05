import React from 'react';

/**
 * Compact numbered strip. Shows current / reviewed / flagged / answer-opened
 * state per question and jumps on click.
 */
export default function QuestionNavigator({ questions, currentIndex, marks, revealed, onJump }) {
  if (questions.length < 2) return null;

  return (
    <div className="iv-navigator" role="list" aria-label="Question navigator">
      {questions.map((q, i) => {
        const mark = marks[i];
        let cls = 'iv-nav-chip';
        let suffix = revealed.has(i) ? ': answer opened' : '';
        if (i === currentIndex) cls += ' is-current';
        if (mark === 'reviewed') {
          cls += ' is-reviewed';
          suffix = ': reviewed';
        } else if (mark === 'flagged') {
          cls += ' is-flagged';
          suffix = ': flagged for review';
        } else if (revealed.has(i)) {
          cls += ' is-opened';
        }
        return (
          <button
            key={q.id || i}
            type="button"
            role="listitem"
            className={cls}
            aria-current={i === currentIndex ? 'true' : undefined}
            aria-label={`Question ${i + 1}${suffix}`}
            onClick={() => onJump(i)}
          >
            <span aria-hidden="true">{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
