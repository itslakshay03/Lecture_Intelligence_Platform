import React from 'react';
import { Video, Sparkles, Clock } from 'lucide-react';
import { deriveStats } from '../lib/recentLectures';

function StatCard({ icon: Icon, label, value, title }) {
  return (
    <div
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        padding: '0.9rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent-primary)',
          flexShrink: 0,
        }}
      >
        <Icon size={17} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-main)', lineHeight: 1.1 }}>
          {value}
        </span>
        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</span>
      </span>
    </div>
  );
}

/**
 * Local-history metrics only. Nothing here is server analytics or invented —
 * every number is counted from `lectra_recent_lectures`.
 */
export default function StatsRow({ recentLectures }) {
  const s = deriveStats(recentLectures);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
      <StatCard icon={Video} label="Lectures processed" value={s.lectures} />
      <StatCard
        icon={Sparkles}
        label="Study tools generated"
        value={s.studyTools}
        title="Notes, quiz, flashcards, revision plan and interview questions — 5 per completed lecture."
      />
      <StatCard icon={Clock} label="Last activity" value={s.lastActivity || '—'} />
    </div>
  );
}
