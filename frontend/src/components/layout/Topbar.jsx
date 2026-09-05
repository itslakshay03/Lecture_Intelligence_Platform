import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { useTheme } from '@/theme/ThemeProvider';

export default function Topbar({ title, subtitle, onOpenNav, showMenuButton = false }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0 1.25rem',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header)',
      }}
    >
      {showMenuButton && (
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-main)',
            padding: 6,
            display: 'flex',
            cursor: 'pointer',
          }}
        >
          <Menu size={18} />
        </button>
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <h1
          style={{
            margin: 0,
            fontSize: '1.02rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--text-main)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: 0,
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <Tooltip label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              padding: 7,
              display: 'flex',
              cursor: 'pointer',
            }}
          >
            {isDark ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} />}
          </button>
        </Tooltip>

        <Button size="sm" variant="primary" icon={Plus} onClick={() => navigate('/dashboard')}>
          New Lecture
        </Button>
      </div>
    </header>
  );
}
