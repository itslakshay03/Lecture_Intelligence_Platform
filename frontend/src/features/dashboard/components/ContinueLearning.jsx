import React, { useState } from 'react';
import { PlayCircle, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { youtubeThumb, formatWhen } from '../lib/recentLectures';

/** Featured "resume" card for the most recently processed lecture. */
export default function ContinueLearning({ lecture, onOpen }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  if (!lecture) return null;

  const thumb = youtubeThumb(lecture.videoId);
  const showImg = thumb && !thumbFailed;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.9rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--accent-border)',
        background: 'linear-gradient(120deg, var(--accent-light), var(--bg-card) 60%)',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: 116,
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          aspectRatio: '16 / 9',
          backgroundColor: 'var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
        }}
      >
        {showImg ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            onError={() => setThumbFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <PlayCircle size={24} />
        )}
      </div>

      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <Badge variant="indigo" size="sm">Continue learning</Badge>
        <h3
          className="lai-line-clamp-1"
          style={{ margin: '0.4rem 0 0.15rem', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}
        >
          {lecture.title || 'Lecture study guide'}
        </h3>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Last processed {formatWhen(lecture)} · pick up in the study workspace
        </p>
      </div>

      <Button
        variant="primary"
        size="sm"
        icon={ArrowRight}
        iconPosition="right"
        onClick={() => onOpen(lecture)}
        style={{ flexShrink: 0 }}
      >
        Resume
      </Button>
    </div>
  );
}
