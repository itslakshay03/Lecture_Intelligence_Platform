import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, Search, Sun, Moon, ChevronDown, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { PRIMARY_NAV, STUDY_TOOL_NAV } from './navConfig';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/features/auth/AuthContext';
import Dropdown from '@/components/ui/Dropdown';
import { openStudyTool } from '@/features/dashboard/lib/openStudyTool';

/**
 * Desktop top navigation bar (>1024px) — replaces the persistent left
 * sidebar. Mobile keeps the existing hamburger + drawer (Sidebar.jsx).
 *
 * Displays authenticated user initials and a menu with Settings & Sign Out.
 */
export default function TopNav() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const userName = user?.name || 'Student';
  const userInitial = (userName[0] || 'S').toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const profileMenuItems = [
    {
      label: user?.email || 'Logged In',
      disabled: true,
    },
    { type: 'divider' },
    {
      label: 'Settings',
      icon: SettingsIcon,
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      label: 'Sign Out',
      icon: LogOut,
      danger: true,
      onClick: handleLogout,
    },
  ];

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

        <Dropdown
          align="right"
          width={220}
          trigger={
            <div
              className="topnav-profile"
              role="button"
              tabIndex={0}
              aria-label="Profile & settings"
              style={{ cursor: 'pointer' }}
            >
              <span className="topnav-avatar">{userInitial}</span>
              <span className="topnav-profile-name">{userName}</span>
              <ChevronDown size={13} />
            </div>
          }
          items={profileMenuItems}
        />
      </div>
    </header>
  );
}
