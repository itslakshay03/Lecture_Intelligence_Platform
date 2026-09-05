import React, { useId } from 'react';

/**
 * Accessible on/off toggle.
 * <Switch checked={v} onChange={setV} label="Force refresh" />
 */
export default function Switch({ checked = false, onChange, label, description, disabled = false, id }) {
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <label
      htmlFor={fieldId}
      style={{
        display: 'flex',
        alignItems: description ? 'flex-start' : 'center',
        gap: '0.7rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <button
        id={fieldId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        style={{
          flexShrink: 0,
          width: 38,
          height: 22,
          borderRadius: 9999,
          border: 'none',
          padding: 2,
          cursor: 'inherit',
          backgroundColor: checked ? 'var(--accent-primary)' : 'var(--border-color)',
          transition: 'background-color var(--transition-base)',
          display: 'flex',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '9999px',
            backgroundColor: '#fff',
            boxShadow: 'var(--shadow-sm)',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform var(--transition-base)',
          }}
        />
      </button>
      {(label || description) && (
        <span style={{ minWidth: 0 }}>
          {label && (
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
