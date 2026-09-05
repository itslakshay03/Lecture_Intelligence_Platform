import React from 'react';

/**
 * Controlled underline tab strip.
 * <Tabs value={tab} onChange={setTab} tabs={[{ id, label, icon, count }]} />
 */
export default function Tabs({ value, onChange, tabs = [], className = '', style = {} }) {
  return (
    <div
      role="tablist"
      className={`lai-no-scrollbar ${className}`}
      style={{
        display: 'flex',
        gap: '0.25rem',
        overflowX: 'auto',
        borderBottom: '1px solid var(--border-color)',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 0.9rem',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${active ? 'var(--accent-primary)' : 'transparent'}`,
              marginBottom: -1,
              color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: active ? 700 : 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = 'var(--text-main)';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {Icon && <Icon size={15} />}
            <span>{tab.label}</span>
            {tab.count != null && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: active ? '#fff' : 'var(--text-muted)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
