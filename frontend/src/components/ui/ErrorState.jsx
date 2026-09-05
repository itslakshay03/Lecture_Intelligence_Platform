import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Full-panel error state with an optional retry action.
 * <ErrorState title="Couldn't load" description={err.message} onRetry={refetch} />
 */
export default function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className = '',
  style = {},
}) {
  return (
    <div
      role="alert"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        border: '1px solid var(--danger-light)',
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
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.1rem',
        }}
      >
        <AlertOctagon size={24} />
      </div>
      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h3>
      {description && (
        <p
          style={{
            margin: '0.4rem 0 0 0',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            maxWidth: 440,
            lineHeight: 1.55,
            wordBreak: 'break-word',
          }}
        >
          {description}
        </p>
      )}
      {onRetry && (
        <div style={{ marginTop: '1.4rem' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
