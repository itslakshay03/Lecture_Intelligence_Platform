import React from 'react';

/**
 * A single "label + description on the left, control on the right" row,
 * used for individual preferences inside a SettingsSection. Stacks the
 * control below the label on narrow screens instead of overflowing.
 */
export default function PreferenceRow({ label, description, htmlFor, children, last = false }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem 1.5rem',
        padding: last ? '0.85rem 0 0' : '0.85rem 0',
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ minWidth: 200, flex: '1 1 240px' }}>
        {htmlFor ? (
          <label htmlFor={htmlFor} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
            {label}
          </label>
        ) : (
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{label}</span>
        )}
        {description && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            {description}
          </span>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}
