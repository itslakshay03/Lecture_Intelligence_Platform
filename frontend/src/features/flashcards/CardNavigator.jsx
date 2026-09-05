import React from 'react';

/**
 * Compact numbered strip. Shows each card's session mark
 * (known / review) and the current position. Click jumps to a card.
 */
export default function CardNavigator({ total, currentIndex, marks, onJump }) {
  if (total < 2) return null;

  return (
    <div className="fc-navigator" role="list" aria-label="Card navigator">
      {Array.from({ length: total }).map((_, i) => {
        const mark = marks[i];
        let cls = 'fc-nav-chip';
        let suffix = '';
        if (i === currentIndex) cls += ' is-current';
        if (mark === 'known') {
          cls += ' is-known';
          suffix = ': marked known';
        } else if (mark === 'review') {
          cls += ' is-review';
          suffix = ': marked for review';
        }
        return (
          <button
            key={i}
            type="button"
            role="listitem"
            className={cls}
            aria-current={i === currentIndex ? 'true' : undefined}
            aria-label={`Card ${i + 1}${suffix}`}
            onClick={() => onJump(i)}
          >
            <span aria-hidden="true">{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
