import React, { useState } from 'react';
import { List, ChevronDown } from 'lucide-react';

function TocLinks({ entries, activeId, onNavigate }) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {entries.map((e) => {
        const active = e.id === activeId;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onNavigate(e.id)}
            style={{
              textAlign: 'left',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              borderLeft: `2px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
              background: active ? 'var(--accent-light)' : 'transparent',
              color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              lineHeight: 1.35,
              transition: 'color var(--transition-fast), background var(--transition-fast)',
            }}
            onMouseEnter={(e2) => {
              if (!active) e2.currentTarget.style.color = 'var(--text-main)';
            }}
            onMouseLeave={(e2) => {
              if (!active) e2.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {e.text}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * `variant="sidebar"` — sticky rail (desktop).
 * `variant="inline"`  — collapsible "On this page" panel (tablet / mobile).
 */
export default function TableOfContents({ entries, activeId, onNavigate, variant = 'sidebar' }) {
  const [open, setOpen] = useState(false);
  if (!entries || entries.length < 2) return null;

  if (variant === 'inline') {
    const activeLabel = entries.find((e) => e.id === activeId)?.text || 'On this page';
    return (
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '0.6rem 0.8rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 700,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
            <List size={15} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {open ? 'On this page' : activeLabel}
            </span>
          </span>
          <ChevronDown
            size={15}
            style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}
          />
        </button>
        {open && (
          <div style={{ padding: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
            <TocLinks
              entries={entries}
              activeId={activeId}
              onNavigate={(id) => {
                setOpen(false);
                onNavigate(id);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <aside
      aria-label="Table of contents"
      style={{
        position: 'sticky',
        top: '4rem',
        alignSelf: 'flex-start',
        width: 220,
        flexShrink: 0,
        maxHeight: 'calc(100vh - var(--topbar-height) - 2rem)',
        overflowY: 'auto',
        paddingRight: '0.25rem',
      }}
      className="lai-no-scrollbar"
    >
      <p
        style={{
          margin: '0 0 0.5rem 0.6rem',
          fontSize: '0.66rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-light)',
        }}
      >
        On this page
      </p>
      <TocLinks entries={entries} activeId={activeId} onNavigate={onNavigate} />
    </aside>
  );
}
