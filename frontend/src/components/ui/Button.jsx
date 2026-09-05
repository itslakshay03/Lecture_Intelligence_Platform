import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  isLoading = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  style = {},
  ...props
}) {
  // Variant styles mapping
  const variantStyles = {
    primary: {
      backgroundColor: 'var(--accent-primary)',
      color: '#ffffff',
      border: '1px solid var(--accent-primary)',
      hoverBg: 'var(--accent-hover)',
    },
    secondary: {
      backgroundColor: 'var(--accent-light)',
      color: 'var(--accent-primary)',
      border: '1px solid var(--accent-border)',
      hoverBg: '#e0e7ff',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text-main)',
      border: '1px solid var(--border-color)',
      hoverBg: 'var(--border-subtle)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
      border: '1px solid transparent',
      hoverBg: 'var(--border-subtle)',
    },
    danger: {
      backgroundColor: 'var(--danger)',
      color: '#ffffff',
      border: '1px solid var(--danger)',
      hoverBg: '#dc2626',
    }
  };

  // Size styles mapping
  const sizeStyles = {
    sm: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.8rem',
      borderRadius: 'var(--radius-sm)',
      iconSize: 14,
    },
    md: {
      padding: '0.5rem 1.125rem',
      fontSize: '0.875rem',
      borderRadius: 'var(--radius-md)',
      iconSize: 16,
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      borderRadius: 'var(--radius-md)',
      iconSize: 18,
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const currentSize = sizeStyles[size] || sizeStyles.md;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all 0.15s ease-in-out',
    outline: 'none',
    boxShadow: variant === 'primary' ? 'var(--shadow-xs)' : 'none',
    ...currentVariant,
    ...currentSize,
    ...style
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={baseStyle}
      className={className}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={currentSize.iconSize} className="animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={currentSize.iconSize} />
      )}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === 'right' && <Icon size={currentSize.iconSize} />}
    </button>
  );
}
