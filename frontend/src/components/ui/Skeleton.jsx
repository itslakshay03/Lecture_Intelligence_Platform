import React from 'react';

/**
 * Content-shaped loading placeholder with a shimmer sweep.
 * <Skeleton width="60%" height={16} />  or  <Skeleton.Text lines={3} />
 */
export default function Skeleton({
  width = '100%',
  height = 14,
  radius = 'var(--radius-sm)',
  circle = false,
  style = {},
  className = '',
}) {
  const size = circle ? { width: height, height, borderRadius: '9999px' } : { width, height, borderRadius: radius };
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--border-subtle)',
        ...size,
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'translateX(-100%)',
          background:
            'linear-gradient(90deg, transparent, rgba(var(--accent-primary-rgb) / 0.08), transparent)',
          animation: 'lai-shimmer 1.6s infinite',
        }}
      />
    </span>
  );
}

function SkeletonText({ lines = 3, gap = 8, lastWidth = '70%' }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? lastWidth : '100%'} />
      ))}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Skeleton circle height={38} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton height={12} width="45%" />
          <Skeleton height={10} width="30%" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

Skeleton.Text = SkeletonText;
Skeleton.Card = SkeletonCard;
