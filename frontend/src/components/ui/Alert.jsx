import React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

const TONES = {
  info: { color: 'var(--accent-primary)', bg: 'var(--accent-light)', border: 'var(--accent-border)', Icon: Info },
  success: { color: 'var(--success)', bg: 'var(--success-light)', border: '#a7f3d0', Icon: CheckCircle2 },
  warning: { color: 'var(--warning)', bg: 'var(--warning-light)', border: '#fde68a', Icon: AlertTriangle },
  danger: { color: 'var(--danger)', bg: 'var(--danger-light)', border: '#fecaca', Icon: XCircle },
};

/**
 * Inline contextual message block.
 * <Alert tone="danger" title="Upload failed">Details…</Alert>
 */
export default function Alert({
  tone = 'info',
  title,
  children,
  icon: IconOverride,
  onClose,
  className = '',
  style = {},
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  const Icon = IconOverride || t.Icon;

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={className}
      {...rest}
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: t.bg,
        border: `1px solid ${t.border}`,
        color: 'var(--text-main)',
        ...style,
      }}
    >
      <Icon size={18} style={{ color: t.color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: t.color }}>{title}</p>
        )}
        {children && (
          <div
            style={{
              margin: title ? '0.2rem 0 0 0' : 0,
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            {children}
          </div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 2,
            display: 'flex',
            alignSelf: 'flex-start',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
