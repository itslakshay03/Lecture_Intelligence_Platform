import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Click-to-open menu.
 *
 * <Dropdown
 *   trigger={<Button icon={MoreVertical} />}
 *   items={[
 *     { label: 'Download', icon: Download, onClick: dl },
 *     { type: 'divider' },
 *     { label: 'Remove', icon: Trash, danger: true, onClick: rm },
 *   ]}
 * />
 */
export default function Dropdown({ trigger, items = [], align = 'right', width = 200, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <span
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        style={{ display: 'inline-flex' }}
      >
        {trigger}
      </span>

      {open && (
        <div
          role="menu"
          className="lai-animate-scale-in"
          style={{
            position: 'absolute',
            top: '100%',
            [align]: 0,
            marginTop: 6,
            minWidth: width,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: 6,
            zIndex: 'var(--z-drawer)',
          }}
        >
          {children
            ? React.Children.map(children, (child) =>
                React.isValidElement(child) ? React.cloneElement(child, { onSelect: close }) : child,
              )
            : items.map((item, i) => {
                if (item.type === 'divider') {
                  return (
                    <div
                      key={`d-${i}`}
                      style={{ height: 1, backgroundColor: 'var(--border-subtle)', margin: '4px 0' }}
                    />
                  );
                }
                const Icon = item.icon;
                return (
                  <button
                    key={item.label || i}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) return;
                      item.onClick?.();
                      close();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.5rem 0.65rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                      opacity: item.disabled ? 0.5 : 1,
                      color: item.danger ? 'var(--danger)' : 'var(--text-main)',
                    }}
                    onMouseEnter={(e) => {
                      if (!item.disabled) e.currentTarget.style.backgroundColor = 'var(--border-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {Icon && <Icon size={15} />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}
