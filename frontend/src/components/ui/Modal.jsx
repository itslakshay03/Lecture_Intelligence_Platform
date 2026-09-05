import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZES = { sm: 380, md: 520, lg: 720, xl: 920 };

/**
 * Accessible modal dialog rendered in a portal.
 *
 * <Modal open={open} onClose={close} title="Confirm" footer={<Button/>}>
 *   body content
 * </Modal>
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  hideClose = false,
}) {
  const panelRef = useRef(null);
  const lastFocused = useRef(null);

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;
    lastFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    // move focus into the dialog
    const id = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
      window.clearTimeout(id);
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [open, handleKey]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(2px)',
        animation: 'lai-fade-in 140ms both',
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        tabIndex={-1}
        className="lai-animate-scale-in"
        style={{
          width: '100%',
          maxWidth: SIZES[size] || SIZES.md,
          maxHeight: 'calc(100vh - 2.5rem)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          outline: 'none',
        }}
      >
        {(title || !hideClose) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1.1rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              {title && (
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {title}
                </h2>
              )}
              {description && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 4,
                  display: 'flex',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div style={{ padding: '1.25rem', overflowY: 'auto', fontSize: '0.9rem', color: 'var(--text-main)' }}>
          {children}
        </div>

        {footer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.625rem',
              padding: '0.9rem 1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
