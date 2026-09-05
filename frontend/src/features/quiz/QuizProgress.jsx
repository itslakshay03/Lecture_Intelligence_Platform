import React from 'react';

/** Progress bar + "Question X of N" + answered count. */
export default function QuizProgress({ index, total, answered }) {
  const pct = total ? Math.round(((index + 1) / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.78rem', fontWeight: 600 }}>
        <span style={{ color: 'var(--text-main)' }}>
          Question {index + 1} of {total}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {answered} of {total} answered
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${index + 1} of ${total}`}
        style={{
          height: 6,
          borderRadius: 'var(--radius-full)',
          background: 'var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--accent-primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-base)',
          }}
        />
      </div>
    </div>
  );
}
