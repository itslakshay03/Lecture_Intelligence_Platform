import React from 'react';
import { Play } from 'lucide-react';
import { stripLeadingEmoji } from './lib/notes';

/**
 * `studyPack.timestamps` rendered as clickable chips. Clicking calls `onSeek(sec)`
 * — the workspace's existing YouTube seek (switches to the video and starts at
 * that second). No timestamp is invented; the list is passed straight through.
 */
export default function KeyMoments({ timestamps = [], duration = 0, onSeek }) {
  const list = Array.isArray(timestamps)
    ? timestamps
        .filter((t) => t && typeof t.sec === 'number' && t.sec >= 0 && (!duration || t.sec < duration))
        .sort((a, b) => a.sec - b.sec)
    : [];

  if (list.length < 2) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {list.map((t, i) => (
        <button
          key={`${t.sec}-${i}`}
          type="button"
          onClick={() => onSeek?.(t.sec)}
          title={`Jump to ${t.time} in the video`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            cursor: 'pointer',
            maxWidth: '100%',
            transition: 'border-color var(--transition-fast), color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0,
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--accent-primary)',
            }}
          >
            <Play size={10} fill="currentColor" />
            {t.time}
          </span>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {stripLeadingEmoji(t.label || 'Lecture moment')}
          </span>
        </button>
      ))}
    </div>
  );
}
