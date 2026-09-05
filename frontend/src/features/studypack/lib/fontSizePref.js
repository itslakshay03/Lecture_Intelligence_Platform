/**
 * The real, existing "Notes reading font size" preference. Originally lived
 * only inside NotesWorkspace; extracted here so Settings (Phase 8) can read
 * and control the exact same localStorage key instead of inventing a second
 * one — single source of truth, same pattern as recentLectures.js (Phase 7).
 */

export const NOTES_FONT_SIZE_KEY = 'lectra_notes_fontsize';
export const NOTES_FONT_SIZE_MIN = 13;
export const NOTES_FONT_SIZE_MAX = 20;
export const NOTES_FONT_SIZE_DEFAULT = 15;

/** Reads the stored notes font size, clamped/validated. Never throws. */
export function readNotesFontSize() {
  try {
    const v = parseInt(localStorage.getItem(NOTES_FONT_SIZE_KEY), 10);
    if (v >= NOTES_FONT_SIZE_MIN && v <= NOTES_FONT_SIZE_MAX) return v;
  } catch {
    /* localStorage unavailable */
  }
  return NOTES_FONT_SIZE_DEFAULT;
}

/** Persists a notes font size. Never throws. */
export function writeNotesFontSize(size) {
  try {
    localStorage.setItem(NOTES_FONT_SIZE_KEY, String(size));
  } catch {
    /* ignore persistence failures */
  }
}
