import React from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';

/**
 * Reveal / hide the reference answer. Keyboard-accessible toggle with
 * aria-expanded + aria-controls; the revealed region is announced politely.
 */
export default function InterviewAnswer({ id, answer, revealed, onToggle }) {
  const regionId = `${id}-answer`;

  return (
    <div className="iv-answer">
      <button
        type="button"
        className="iv-answer-toggle"
        aria-expanded={revealed}
        aria-controls={regionId}
        onClick={onToggle}
      >
        {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
        {revealed ? 'Hide answer' : 'Show answer'}
      </button>

      {revealed && (
        <div id={regionId} className="iv-answer-body" role="region" aria-live="polite">
          <span className="iv-answer-label">Reference answer</span>
          {answer ? (
            <p className="iv-answer-text">{answer}</p>
          ) : (
            <p className="iv-answer-text iv-answer-text--muted">
              <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              No reference answer was provided for this question.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
