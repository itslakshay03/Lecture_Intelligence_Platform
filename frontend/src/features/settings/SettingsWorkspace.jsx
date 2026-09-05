import React, { useCallback, useState } from 'react';
import { Palette, SlidersHorizontal, Database, Info, Minus, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SettingsSection from './components/SettingsSection';
import PreferenceRow from './components/PreferenceRow';
import ThemeSelector from './components/ThemeSelector';
import LocalDataCard from './components/LocalDataCard';
import AboutCard from './components/AboutCard';
import {
  NOTES_FONT_SIZE_MIN,
  NOTES_FONT_SIZE_MAX,
  readNotesFontSize,
  writeNotesFontSize,
} from '@/features/studypack/lib/fontSizePref';

/**
 * Settings — appearance, the one real app preference (Notes text size),
 * local data, and an about section. Everything here reads/writes the
 * app's existing, real storage: `lectra_theme` (via ThemeProvider),
 * `lectra_notes_fontsize`, and `lectra_recent_lectures`. No fake account,
 * subscription, or backend preferences.
 */
export default function SettingsWorkspace() {
  const [fontSize, setFontSize] = useState(readNotesFontSize);

  const changeFontSize = useCallback((next) => {
    const clamped = Math.max(NOTES_FONT_SIZE_MIN, Math.min(NOTES_FONT_SIZE_MAX, next));
    setFontSize(clamped);
    writeNotesFontSize(clamped);
  }, []);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <PageHeader title="Settings" description="Appearance and local data. Everything here is stored on this device." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <SettingsSection
          icon={Palette}
          title="Appearance"
          description="Choose how LectraAI looks. Applies everywhere — Dashboard, Library and every study tool."
        >
          <ThemeSelector />
        </SettingsSection>

        <SettingsSection
          icon={SlidersHorizontal}
          title="Preferences"
          description="Saved on this device and applied the next time you open a study pack."
        >
          <PreferenceRow label="Notes text size" description="Reading size for Study Pack / Notes content." last>
            <div
              role="group"
              aria-label="Notes text size"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.3rem 0.5rem',
                backgroundColor: 'var(--bg-main)',
              }}
            >
              <button
                type="button"
                onClick={() => changeFontSize(fontSize - 1)}
                aria-label="Smaller text"
                disabled={fontSize <= NOTES_FONT_SIZE_MIN}
                style={iconBtnStyle(fontSize <= NOTES_FONT_SIZE_MIN)}
              >
                <Minus size={14} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', minWidth: 34, textAlign: 'center' }}>
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => changeFontSize(fontSize + 1)}
                aria-label="Larger text"
                disabled={fontSize >= NOTES_FONT_SIZE_MAX}
                style={iconBtnStyle(fontSize >= NOTES_FONT_SIZE_MAX)}
              >
                <Plus size={14} />
              </button>
            </div>
          </PreferenceRow>
        </SettingsSection>

        <SettingsSection icon={Database} title="Local Data" description="What LectraAI stores in this browser.">
          <LocalDataCard />
        </SettingsSection>

        <SettingsSection icon={Info} title="About">
          <AboutCard />
        </SettingsSection>
      </div>
    </div>
  );
}

function iconBtnStyle(disabled) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-main)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
