import React from 'react';

/**
 * Completed / remaining sessions + percent. Frontend-only — the label makes
 * clear it isn't persisted.
 */
export default function RevisionProgress({ summary }) {
  return (
    <div className="rv-progress">
      <div className="rv-progress-top">
        <span className="rv-progress-count">
          {summary.completed} of {summary.total} sessions marked done
        </span>
        <span className="rv-progress-note">Progress is kept for this session only</span>
      </div>
      <div
        className="rv-progress-bar"
        role="progressbar"
        aria-valuenow={summary.completed}
        aria-valuemin={0}
        aria-valuemax={summary.total}
        aria-label={`${summary.completed} of ${summary.total} revision sessions marked done`}
      >
        <div style={{ width: `${summary.percent}%` }} />
      </div>
    </div>
  );
}
