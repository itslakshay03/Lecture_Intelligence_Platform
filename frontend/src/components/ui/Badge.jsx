import React from 'react';

export default function Badge({
  children,
  variant = 'indigo', // 'indigo' | 'slate' | 'success' | 'warning' | 'danger'
  size = 'md', // 'sm' | 'md'
  icon: Icon = null,
  className = '',
  style = {},
  ...props
}) {
  const variantStyles = {
    indigo: {
      backgroundColor: 'var(--accent-light)',
      color: 'var(--accent-primary)',
      border: '1px solid var(--accent-border)'
    },
    slate: {
      backgroundColor: 'var(--border-subtle)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-color)'
    },
    success: {
      backgroundColor: 'var(--success-light)',
      color: 'var(--success)',
      border: '1px solid #a7f3d0'
    },
    warning: {
      backgroundColor: 'var(--warning-light)',
      color: 'var(--warning)',
      border: '1px solid #fde68a'
    },
    danger: {
      backgroundColor: 'var(--danger-light)',
      color: 'var(--danger)',
      border: '1px solid #fecaca'
    }
  };

  const sizeStyles = {
    sm: {
      padding: '1px 6px',
      fontSize: '0.72rem',
      iconSize: 12
    },
    md: {
      padding: '3px 10px',
      fontSize: '0.8rem',
      iconSize: 14
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.indigo;
  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontWeight: '600',
        borderRadius: 'var(--radius-full)',
        lineHeight: '1',
        ...currentVariant,
        ...currentSize,
        ...style
      }}
      className={className}
      {...props}
    >
      {Icon && <Icon size={currentSize.iconSize} />}
      <span>{children}</span>
    </span>
  );
}
