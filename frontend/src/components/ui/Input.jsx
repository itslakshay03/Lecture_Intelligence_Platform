import React from 'react';

export default function Input({
  label,
  error,
  helperText,
  icon: Icon = null,
  rightElement = null,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      {label && (
        <label style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: 'var(--text-main)'
        }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '0.875rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <Icon size={18} />
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            padding: Icon ? '0.625rem 1rem 0.625rem 2.625rem' : '0.625rem 1rem',
            paddingRight: rightElement ? '3rem' : '1rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: '0.925rem',
            outline: 'none',
            transition: 'border-color 0.15s ease-in-out',
            ...style
          }}
          className={className}
          {...props}
        />

        {rightElement && (
          <div style={{
            position: 'absolute',
            right: '0.75rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: '500' }}>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
}
