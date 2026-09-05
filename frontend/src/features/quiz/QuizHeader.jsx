import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Quiz title + question count. The backend does not return a difficulty field,
 * so none is shown.
 */
export default function QuizHeader({ total, answered, phase }) {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          Lecture quiz
        </h1>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {total} question{total === 1 ? '' : 's'} generated from this lecture · answer them, then submit.
        </p>
      </div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.7rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          flexShrink: 0,
        }}
      >
        <HelpCircle size={14} style={{ color: 'var(--accent-primary)' }} />
        {phase === 'results' ? 'Results' : `${answered}/${total} answered`}
      </span>
    </header>
  );
}
