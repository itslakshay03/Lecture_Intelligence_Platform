import React from 'react';
import { Check, RotateCcw, Circle } from 'lucide-react';

/**
 * Card position + progress bar + session-only Known / Need-review / Remaining
 * counts. These counts are local UI state — nothing is sent to or stored by
 * the backend.
 */
export default function FlashcardProgress({ index, total, summary }) {
  const pct = total ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div className="fc-progress">
      <div className="fc-progress-top">
        <span className="fc-progress-count">Card {index + 1} of {total}</span>
        <div className="fc-progress-tallies" aria-label="Session progress">
          <span className="fc-tally fc-tally--known">
            <Check size={13} /> {summary.known} known
          </span>
          <span className="fc-tally fc-tally--review">
            <RotateCcw size={13} /> {summary.review} to review
          </span>
          <span className="fc-tally fc-tally--rest">
            <Circle size={11} /> {summary.remaining} left
          </span>
        </div>
      </div>
      <div
        className="fc-progress-bar"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Card ${index + 1} of ${total}`}
      >
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
