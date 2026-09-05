import React from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import { NAV_SECTIONS } from './navConfig';

const SIDEBAR_BG = 'var(--bg-sidebar)';

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.6rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        fontWeight: isActive ? 700 : 500,
        textDecoration: 'none',
        color: isActive ? '#ffffff' : '#94a3b8',
        backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
        transition: 'background-color var(--transition-fast), color var(--transition-fast)',
      })}
      onMouseEnter={(e) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
          e.currentTarget.style.color = '#e2e8f0';
        }
      }}
      onMouseLeave={(e) => {
        if (!e.currentTarget.getAttribute('aria-current')) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#94a3b8';
        }
      }}
    >
      {({ isActive }) => (
        <>
          <Icon size={18} style={{ color: isActive ? '#ffffff' : '#94a3b8', flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onNavigate, onClose, showClose = false }) {
  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: SIDEBAR_BG,
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
              color: '#fff',
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(79,70,229,0.45)',
            }}
          >
            <GraduationCap size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Lectra<span style={{ color: '#818cf8' }}>AI</span>
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                backgroundColor: 'rgba(129,140,248,0.16)',
                color: '#a5b4fc',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              BETA
            </span>
          </div>
        </div>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        className="lai-no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 0.7rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
      >
        {NAV_SECTIONS.map((section, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {section.heading && (
              <p
                style={{
                  margin: i === 0 ? '0.25rem 0.85rem 0.35rem' : '0.9rem 0.85rem 0.35rem',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#64748b',
                }}
              >
                {section.heading}
              </p>
            )}
            {section.items.map((item) => (
              <NavItem key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / account */}
      <div style={{ padding: '0.85rem 0.7rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem',
            padding: '0.55rem 0.7rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '9999px',
              backgroundColor: '#312e81',
              color: '#c7d2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
              flexShrink: 0,
            }}
          >
            S
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Student Account
            </p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Local workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
