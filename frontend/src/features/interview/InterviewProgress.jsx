import React from 'react';
import { Check, Flag } from 'lucide-react';

/** Position + progress bar + session-only reviewed / flagged counts. */
export default function InterviewProgress({ index, total, summary }) {
  const pct = total ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div className="iv-progress">
      <div className="iv-progress-top">
        <span className="iv-progress-count">Question {index + 1} of {total}</span>
        <div className="iv-progress-tallies">
          <span className="iv-tally iv-tally--review">
            <Check size={13} /> {summary.reviewed} reviewed
          </span>
          {summary.flagged > 0 && (
            <span className="iv-tally iv-tally--flag">
              <Flag size={12} /> {summary.flagged} flagged
            </span>
          )}
          <span className="iv-tally iv-tally--rest">{summary.remaining} left</span>
        </div>
      </div>
      <div
        className="iv-progress-bar"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${index + 1} of ${total}`}
      >
        <div style={{ width: `${pct}%` }} />
      </div>
      <span className="iv-progress-note">Reviewed / flagged marks are kept for this session only</span>
    </div>
  );
}
