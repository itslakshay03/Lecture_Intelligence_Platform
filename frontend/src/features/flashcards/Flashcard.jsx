import React from 'react';
import { RotateCw, HelpCircle, Lightbulb } from 'lucide-react';

/**
 * A single flip card. Click / Enter / Space flips it. Both faces are in the
 * DOM for the 3D effect, but the hidden face is aria-hidden so a screen reader
 * only reads what's visible; a polite live region announces the flip.
 */
export default function Flashcard({ card, index, total, flipped, onFlip, mark }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div className="fc-stage">
      <div
        className="fc-card"
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`Flashcard ${index + 1} of ${total}. Currently showing the ${
          flipped ? 'answer' : 'question'
        }. Press Enter or Space to flip.`}
        onClick={onFlip}
        onKeyDown={handleKey}
      >
        <div className={`fc-inner${flipped ? ' is-flipped' : ''}`}>
          {/* Front */}
          <div className="fc-face fc-front" aria-hidden={flipped}>
            <div className="fc-face-head">
              <span className="fc-face-label">
                <HelpCircle size={13} /> Question
              </span>
              <span className="fc-face-count">
                {index + 1} / {total}
                {mark && <span className={`fc-mark-dot fc-mark-dot--${mark}`} aria-hidden="true" />}
              </span>
            </div>
            <div className="fc-face-body">
              <p className="fc-front-text">{card.front}</p>
            </div>
            <div className="fc-face-hint">
              <RotateCw size={13} /> Click, Enter or Space to reveal
            </div>
          </div>

          {/* Back */}
          <div className="fc-face fc-back" aria-hidden={!flipped}>
            <div className="fc-face-head">
              <span className="fc-face-label">
                <Lightbulb size={13} /> Answer
              </span>
              <span className="fc-face-count">
                {index + 1} / {total}
              </span>
            </div>
            <div className="fc-face-body fc-face-body--scroll">
              <p className="fc-back-text">{card.back}</p>
            </div>
            <div className="fc-face-hint">
              <RotateCw size={13} /> Flip back
            </div>
          </div>
        </div>
      </div>

      <span className="lai-sr-only" aria-live="polite">
        {flipped ? `Answer: ${card.back}` : `Question ${index + 1} of ${total}: ${card.front}`}
      </span>
    </div>
  );
}
