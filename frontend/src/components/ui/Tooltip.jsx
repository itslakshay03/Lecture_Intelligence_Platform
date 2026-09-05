import React, { useId, useState } from 'react';

/**
 * Lightweight tooltip. Wraps a single interactive child; shows on hover/focus.
 * <Tooltip label="Download PDF"><button>…</button></Tooltip>
 */
export default function Tooltip({ label, placement = 'top', delay = 120, children, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState(null);
  const id = useId();

  if (disabled || !label) return children;

  const show = () => {
    const t = window.setTimeout(() => setOpen(true), delay);
    setTimer(t);
  };
  const hide = () => {
    if (timer) window.clearTimeout(timer);
    setOpen(false);
  };

  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' },
    bottom: { top: '100%', left: '50%', transform: 'translate(-50%, 8px)' },
    left: { right: '100%', top: '50%', transform: 'translate(-8px, -50%)' },
    right: { left: '100%', top: '50%', transform: 'translate(8px, -50%)' },
  }[placement] || {};

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {React.isValidElement(children) ? React.cloneElement(children, { 'aria-describedby': open ? id : undefined }) : children}
      {open && (
        <span
          role="tooltip"
          id={id}
          className="lai-animate-fade-in"
          style={{
            position: 'absolute',
            zIndex: 'var(--z-tooltip)',
            ...pos,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            backgroundColor: 'var(--text-main)',
            color: 'var(--bg-card)',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.3rem 0.55rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
