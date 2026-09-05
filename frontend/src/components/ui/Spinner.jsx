import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Inline loading spinner. Sizes: sm | md | lg | number (px).
 */
export default function Spinner({ size = 'md', label, style = {}, className = '', ...props }) {
  const px = typeof size === 'number' ? size : { sm: 16, md: 22, lg: 34 }[size] || 22;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: label ? '0.5rem' : 0,
        color: 'var(--accent-primary)',
        ...style,
      }}
      {...props}
    >
      <Loader2 size={px} className="animate-spin" />
      {label && (
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
      )}
    </span>
  );
}

/** Centered full-panel loading state. */
export function LoadingPanel({ label = 'Loading…', minHeight = 240 }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.875rem',
        minHeight,
        padding: '2rem',
        color: 'var(--text-muted)',
      }}
    >
      <Spinner size="lg" />
      <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>{label}</p>
    </div>
  );
}
