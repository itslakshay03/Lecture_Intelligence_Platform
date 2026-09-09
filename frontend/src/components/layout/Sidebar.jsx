import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, X, Sun, Moon } from 'lucide-react';
import { PRIMARY_NAV, STUDY_TOOL_NAV, UTILITY_NAV } from './navConfig';
import { useTheme } from '@/theme/ThemeProvider';
import { openStudyTool } from '@/features/dashboard/lib/openStudyTool';

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
        gap: '0.7rem',
        padding: '0.55rem 0.75rem',
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
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
            }}
          >
            <Icon size={16} style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
          </span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

/** Study-tool shortcut row — not a route, see openStudyTool. */
function StudyToolItem({ item, onNavigate }) {
  const navigate = useNavigate();
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => {
        openStudyTool(navigate, item.tab);
        onNavigate?.();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        width: '100%',
        padding: '0.55rem 0.75rem',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: 'transparent',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#94a3b8',
        cursor: 'pointer',
        transition: 'background-color var(--transition-fast), color var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
        e.currentTarget.style.color = '#e2e8f0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#94a3b8';
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <Icon size={16} />
      </span>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.label}
      </span>
    </button>
  );
}

/** Theme toggle rendered as its own primary-nav-style row (not a route). */
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.6rem 0.85rem',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: 'transparent',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#94a3b8',
        cursor: 'pointer',
        transition: 'background-color var(--transition-fast), color var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-sidebar-hover)';
        e.currentTarget.style.color = '#e2e8f0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#94a3b8';
      }}
    >
      {isDark ? <Sun size={18} style={{ flexShrink: 0 }} /> : <Moon size={18} style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1, textAlign: 'left' }}>Theme</span>
      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}

function SectionHeading({ children, first = false }) {
  return (
    <p
      style={{
        margin: first ? '0.25rem 0.85rem 0.35rem' : '0.9rem 0.85rem 0.35rem',
        fontSize: '0.66rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#64748b',
      }}
    >
      {children}
    </p>
  );
}

/**
 * Mobile drawer navigation (>1024px uses TopNav instead — see AppShell).
 * Unchanged in mechanics from earlier phases: hamburger opens this as an
 * overlay drawer; only the nav content/grouping was extended here to match
 * TopNav's item set (Study Pack shortcuts + Search + Profile).
 */
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
        style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 0.7rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
      >
        {PRIMARY_NAV.map((item) => (
          <NavItem key={item.id} item={item} onNavigate={onNavigate} />
        ))}

        <SectionHeading>Study Pack</SectionHeading>
        {STUDY_TOOL_NAV.map((item) => (
          <StudyToolItem key={item.id} item={item} onNavigate={onNavigate} />
        ))}

        <div style={{ marginTop: '0.3rem' }}>
          <ThemeToggle />
        </div>

        <SectionHeading>Account</SectionHeading>
        {UTILITY_NAV.map((item) => (
          <NavItem key={item.id} item={item} onNavigate={onNavigate} />
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
