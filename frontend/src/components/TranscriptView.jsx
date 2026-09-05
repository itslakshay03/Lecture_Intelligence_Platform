import React from 'react';
import { ScrollText, Play, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from './ui/Card';
import Badge from './ui/Badge';

/**
 * Timestamp navigator. Uses the real grounded `timestamps` from the study pack
 * (not a hardcoded list). A dedicated full-transcript view is out of scope for
 * this phase and would need a backend transcript field that isn't returned.
 */
export default function TranscriptView({ videoId, timestamps = [], duration = 0, onSeekVideo }) {
  const clean = (Array.isArray(timestamps) ? timestamps : [])
    .filter((t) => t && typeof t.sec === 'number' && t.sec >= 0 && (!duration || t.sec < duration))
    .sort((a, b) => a.sec - b.sec);

  return (
    <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
            Timestamps & key moments
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Click any moment to jump to that point in the video lecture.
          </p>
        </div>
        <Badge variant="indigo" icon={ScrollText}>Grounded timestamps</Badge>
      </div>

      {clean.length === 0 ? (
        <Card>
          <CardBody style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            No reliable timestamps were extracted for this lecture — the transcript may not have carried timing information.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Jump points</CardTitle>
          </CardHeader>
          <CardBody style={{ paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {clean.map((item, idx) => (
                <button
                  key={`${item.sec}-${idx}`}
                  type="button"
                  onClick={() => onSeekVideo && onSeekVideo(item.sec)}
                  disabled={!videoId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.9rem',
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    cursor: videoId ? 'pointer' : 'default',
                    textAlign: 'left',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!videoId) return;
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                    }}
                  >
                    <Play size={11} fill="#fff" />
                    {item.time}
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', flex: 1, minWidth: 0 }}>
                    {item.label || 'Lecture moment'}
                  </span>
                  {videoId && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', flexShrink: 0 }}>
                      Jump to video
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
