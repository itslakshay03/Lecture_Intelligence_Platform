import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, Search, Sun, Moon, ChevronDown } from 'lucide-react';
import { PRIMARY_NAV, STUDY_TOOL_NAV } from './navConfig';
import { useTheme } from '@/theme/ThemeProvider';
import { openStudyTool } from '@/features/dashboard/lib/openStudyTool';

/**
 * Desktop top navigation bar (>1024px) — replaces the persistent left
 * sidebar. Mobile keeps the existing hamburger + drawer (Sidebar.jsx),
 * unchanged, so nothing here affects mobile nav.
 *
 * Study Pack / Quiz / Flashcards / Revision Plan / Interview are shortcuts,
 * not routes — see openStudyTool for what they actually do.
 */
export default function TopNav() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="topnav">
      <div className="topnav-brand">
        <div className="topnav-logo">
          <GraduationCap size={18} />
        </div>
        <span className="topnav-brand-text">
          Lectra<span className="topnav-brand-accent">AI</span>
        </span>
        <span className="topnav-beta">BETA</span>
      </div>

      <nav className="topnav-links lai-no-scrollbar" aria-label="Primary">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) => `topnav-link${isActive ? ' is-active' : ''}`}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <span className="topnav-divider" aria-hidden="true" />

        {STUDY_TOOL_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className="topnav-link topnav-link--ghost"
            onClick={() => openStudyTool(navigate, item.tab)}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="topnav-actions">
        <button
          type="button"
          className="topnav-icon-btn"
          onClick={() => navigate('/search')}
          aria-label="Search lectures"
        >
          <Search size={16} />
        </button>

        <button
          type="button"
          className="topnav-icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          type="button"
          className="topnav-profile"
          onClick={() => navigate('/settings')}
          aria-label="Profile & settings"
        >
          <span className="topnav-avatar">S</span>
          <span className="topnav-profile-name">Student</span>
          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
