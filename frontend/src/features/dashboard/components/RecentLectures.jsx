import React, { useState } from 'react';
import { Clock, ArrowRight, BookOpen, PlayCircle, FileText, HelpCircle, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { youtubeThumb, formatWhen } from '../lib/recentLectures';

const RESOURCE_ICONS = { notes: FileText, quiz: HelpCircle, flashcards: Layers };

function Thumb({ videoId }) {
  const src = youtubeThumb(videoId);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        style={{
          aspectRatio: '16 / 9',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, var(--accent-light), var(--bg-main))',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
        }}
      >
        <PlayCircle size={26} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        objectFit: 'cover',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        display: 'block',
      }}
    />
  );
}

function LectureCard({ item, onOpen }) {
  const resources = Array.isArray(item.resources) ? item.resources : [];

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.7rem',
        textAlign: 'left',
        padding: '0.8rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--accent-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Thumb videoId={item.videoId} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0 0.15rem' }}>
        <h3
          className="lai-line-clamp-2"
          style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35 }}
        >
          {item.title || 'Lecture study guide'}
        </h3>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Clock size={12} /> {formatWhen(item)}
        </span>

        {resources.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.1rem' }}>
            {resources
              .filter((r) => RESOURCE_ICONS[r])
              .map((r) => {
                const Icon = RESOURCE_ICONS[r];
                return (
                  <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    <Icon size={12} /> {r}
                  </span>
                );
              })}
          </div>
        )}

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            marginTop: '0.15rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--accent-primary)',
          }}
        >
          Open workspace <ArrowRight size={14} />
        </span>
      </div>
    </button>
  );
}

export default function RecentLectures({ recentLectures = [], onOpen, onFocusInput }) {
  if (recentLectures.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Your learning history will appear here"
        description="Process a YouTube lecture and its study pack — notes, quiz, flashcards, revision plan and interview questions — shows up here for one-click access."
        action={
          <Button variant="primary" size="sm" onClick={onFocusInput}>
            Process your first lecture
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
      {recentLectures.map((item, idx) => (
        <LectureCard key={item.taskId || item.videoId || idx} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}
