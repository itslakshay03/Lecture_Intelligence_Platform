import React from 'react';

export function Card({ children, className = '', style = {}, onClick, hoverable = false, ...props }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        transition: hoverable ? 'all 0.2s ease-in-out' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem 0.75rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', style = {}, ...props }) {
  return (
    <h3
      style={{
        fontSize: '1.1rem',
        fontWeight: '700',
        color: 'var(--text-main)',
        letterSpacing: '-0.01em',
        lineHeight: '1.4',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', style = {}, ...props }) {
  return (
    <p
      style={{
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        lineHeight: '1.5',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardBody({ children, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        fontSize: '0.925rem',
        color: 'var(--text-main)',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', style = {}, ...props }) {
  return (
    <div
      style={{
        padding: '0.875rem 1.5rem 1.25rem 1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
