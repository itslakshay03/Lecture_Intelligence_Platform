import React from 'react';
import { Workflow, ChevronRight } from 'lucide-react';
import { slugify, stripLeadingEmoji } from './lib/notes';

/**
 * Renders `studyPack.topics` as scannable cards. A card is only clickable when
 * its title reliably maps to a rendered notes section (same slug) — no
 * fabricated anchors.
 */
export default function ImportantTopics({ topics = [], sectionSlugs, onJump }) {
  const list = Array.isArray(topics) ? topics.filter((t) => t && (t.title || t.content)) : [];
  if (list.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.7rem' }}>
      {list.map((t, i) => {
        const title = stripLeadingEmoji(t.title || `Topic ${i + 1}`);
        const slug = slugify(t.title || '');
        const linkable = Boolean(slug && sectionSlugs && sectionSlugs.has(slug));
        const points = Array.isArray(t.key_points) ? t.key_points.filter(Boolean) : [];
        const Tag = linkable ? 'button' : 'div';

        return (
          <Tag
            key={t.id || i}
            type={linkable ? 'button' : undefined}
            onClick={linkable ? () => onJump(slug) : undefined}
            style={{
              textAlign: 'left',
              display: 'flex',
              gap: '0.65rem',
              padding: '0.75rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              cursor: linkable ? 'pointer' : 'default',
              transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
            }}
            onMouseEnter={
              linkable
                ? (e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                : undefined
            }
            onMouseLeave={
              linkable
                ? (e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'none';
                  }
                : undefined
            }
          >
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-light)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              {i + 1}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                className="lai-line-clamp-2"
                style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}
              >
                {title}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {points.length > 0 && <span>{points.length} key point{points.length === 1 ? '' : 's'}</span>}
                {t.diagram && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Workflow size={11} /> diagram
                  </span>
                )}
              </span>
            </span>
            {linkable && <ChevronRight size={15} style={{ flexShrink: 0, color: 'var(--text-light)', alignSelf: 'center' }} />}
          </Tag>
        );
      })}
    </div>
  );
}
