import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const TONES = {
  info: { color: 'var(--accent-primary)', Icon: Info },
  success: { color: 'var(--success)', Icon: CheckCircle2 },
  warning: { color: 'var(--warning)', Icon: AlertTriangle },
  danger: { color: 'var(--danger)', Icon: XCircle },
};

let seq = 0;

export function ToastProvider({ children, max = 4 }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (opts) => {
      const id = ++seq;
      const toast = {
        id,
        tone: opts.tone || 'info',
        title: opts.title || '',
        description: opts.description || '',
        duration: opts.duration ?? 4200,
      };
      setToasts((list) => [...list, toast].slice(-max));
      if (toast.duration > 0) {
        timers.current.set(id, window.setTimeout(() => dismiss(id), toast.duration));
      }
      return id;
    },
    [dismiss, max],
  );

  const api = useMemo(
    () => ({
      toast: push,
      success: (title, description) => push({ tone: 'success', title, description }),
      error: (title, description) => push({ tone: 'danger', title, description }),
      info: (title, description) => push({ tone: 'info', title, description }),
      warning: (title, description) => push({ tone: 'warning', title, description }),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          style={{
            position: 'fixed',
            top: 'calc(var(--topbar-height) + 12px)',
            right: 16,
            zIndex: 'var(--z-toast)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxWidth: 'min(360px, calc(100vw - 32px))',
            pointerEvents: 'none',
          }}
        >
          {toasts.map((t) => {
            const tone = TONES[t.tone] || TONES.info;
            const Icon = tone.Icon;
            return (
              <div
                key={t.id}
                role="status"
                className="lai-animate-slide-in"
                style={{
                  pointerEvents: 'auto',
                  display: 'flex',
                  gap: '0.65rem',
                  padding: '0.8rem 0.9rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${tone.color}`,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <Icon size={17} style={{ color: tone.color, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {t.title && (
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {t.title}
                    </p>
                  )}
                  {t.description && (
                    <p
                      style={{
                        margin: t.title ? '0.15rem 0 0 0' : 0,
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.45,
                      }}
                    >
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 2,
                    alignSelf: 'flex-start',
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export default ToastProvider;
