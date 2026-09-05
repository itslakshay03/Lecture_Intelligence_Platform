import React from 'react';
import Badge from './Badge';

export default function PageHeader({
  title,
  description,
  badgeText = null,
  actions = null,
  className = '',
  style = {}
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        ...style
      }}
      className={className}
    >
      <div>
        {badgeText && (
          <div style={{ marginBottom: '0.5rem' }}>
            <Badge variant="indigo">{badgeText}</Badge>
          </div>
        )}
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '800',
          color: 'var(--text-main)',
          letterSpacing: '-0.02em',
          lineHeight: '1.2'
        }}>
          {title}
        </h1>
        {description && (
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            marginTop: '0.375rem',
            lineHeight: '1.5'
          }}>
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
