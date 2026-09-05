import React from 'react';

/**
 * Consistent titled section: heading + optional description + optional action,
 * then children. Keeps vertical rhythm uniform across the Dashboard.
 */
export default function DashboardSection({ title, description, action, children, style = {} }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', ...style }}>
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title && (
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-main)',
                }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {description}
              </p>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
