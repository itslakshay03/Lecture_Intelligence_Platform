import React from 'react';
import { Moon, Sun } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useTheme } from '@/theme/ThemeProvider';

// The ThemeProvider only tracks 'light' | 'dark' (persisted, and applied
// globally via the `.dark` class on <html>). It reads the OS preference once
// as the *first-run default* but doesn't keep following OS changes live and
// has no persisted "system" mode — so a "System" option isn't offered here;
// offering one would be a control that doesn't actually do what it implies.
const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/**
 * Controls the SAME global theme as everywhere else in the app — reads and
 * writes through useTheme() (ThemeProvider), the one source of truth used by
 * the sidebar toggle, Dashboard, Library and every LectureWorkspace tab.
 */
export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label="Theme" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.7rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              backgroundColor: active ? 'var(--accent-light)' : 'var(--bg-card)',
              color: active ? 'var(--accent-primary)' : 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Icon size={16} />
            {opt.label}
            {active && <Badge variant="indigo" size="sm">Active</Badge>}
          </button>
        );
      })}
    </div>
  );
}
