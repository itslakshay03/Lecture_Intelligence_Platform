import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Friendly "nothing here yet" panel.
 * <EmptyState icon={BookOpen} title="No lectures" description="…" action={<Button/>} />
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  compact = false,
  className = '',
  style = {},
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: compact ? '2rem 1.5rem' : '3.5rem 2rem',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-card)',
        ...style,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.1rem',
        }}
      >
        <Icon size={24} />
      </div>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h3>
      {description && (
        <p
          style={{
            margin: '0.4rem 0 0 0',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            maxWidth: 420,
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '1.4rem' }}>{action}</div>}
    </div>
  );
}
