import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  HelpCircle,
  Layers,
  CalendarClock,
  Briefcase,
  Library,
} from 'lucide-react';

/**
 * Compact launcher grid. "Process new lecture" acts on the current page;
 * the rest navigate to their existing routes (feature pages are still
 * Phase-0 placeholders and that's intentional).
 */
export default function QuickActions({ onFocusInput }) {
  const navigate = useNavigate();

  const actions = [
    { label: 'Process new lecture', hint: 'Paste a URL', icon: Sparkles, primary: true, run: onFocusInput },
    { label: 'Study notes', hint: 'Structured notes', icon: FileText, run: () => navigate('/notes') },
    { label: 'Quiz', hint: 'Test recall', icon: HelpCircle, run: () => navigate('/quiz') },
    { label: 'Flashcards', hint: 'Active recall', icon: Layers, run: () => navigate('/flashcards') },
    { label: 'Revision plan', hint: 'Spaced review', icon: CalendarClock, run: () => navigate('/revision') },
    { label: 'Interview prep', hint: 'By difficulty', icon: Briefcase, run: () => navigate('/interview') },
    { label: 'Lecture library', hint: 'Past study packs', icon: Library, run: () => navigate('/library') },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: '0.75rem',
      }}
    >
      {actions.map(({ label, hint, icon: Icon, primary, run }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem',
            textAlign: 'left',
            padding: '0.8rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${primary ? 'var(--accent-border)' : 'var(--border-color)'}`,
            backgroundColor: primary ? 'var(--accent-light)' : 'var(--bg-card)',
            cursor: 'pointer',
            transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = primary ? 'var(--accent-border)' : 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: primary ? 'var(--accent-primary)' : 'var(--bg-main)',
              border: primary ? 'none' : '1px solid var(--border-color)',
              color: primary ? '#fff' : 'var(--accent-primary)',
              flexShrink: 0,
            }}
          >
            <Icon size={17} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.25 }}>
              {label}
            </span>
            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
