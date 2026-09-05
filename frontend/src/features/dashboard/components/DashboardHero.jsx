import React from 'react';
import { FileText, HelpCircle, Layers, CalendarClock, Briefcase, Sparkles } from 'lucide-react';

const OUTPUTS = [
  { label: 'Structured notes', icon: FileText },
  { label: 'Quizzes', icon: HelpCircle },
  { label: 'Flashcards', icon: Layers },
  { label: 'Revision plans', icon: CalendarClock },
  { label: 'Interview questions', icon: Briefcase },
];

export default function DashboardHero() {
  return (
    <header
      className="lai-animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          alignSelf: 'flex-start',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
          backgroundColor: 'var(--accent-light)',
          border: '1px solid var(--accent-border)',
          padding: '0.28rem 0.6rem',
          borderRadius: 'var(--radius-full)',
        }}
      >
        <Sparkles size={13} />
        Lecture Intelligence
      </span>

      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(1.6rem, 2.6vw, 2.15rem)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          color: 'var(--text-main)',
        }}
      >
        Turn lectures into knowledge.
      </h1>

      <p
        style={{
          margin: 0,
          maxWidth: 640,
          fontSize: '0.95rem',
          lineHeight: 1.6,
          color: 'var(--text-muted)',
        }}
      >
        Paste a lecture video and LectraAI reads the transcript, then generates a complete study
        pack — grounded notes, quizzes, flashcards, a spaced-repetition revision plan, and interview
        questions.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.1rem' }}>
        {OUTPUTS.map(({ label, icon: Icon }) => (
          <span
            key={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '0.35rem 0.7rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <Icon size={13} style={{ color: 'var(--accent-primary)' }} />
            {label}
          </span>
        ))}
      </div>
    </header>
  );
}
