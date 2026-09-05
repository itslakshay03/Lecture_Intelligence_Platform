/**
 * Settings' view of the app's local (device-only) data footprint. Reuses the
 * real, existing storage keys — nothing new is invented here:
 *   - lectra_recent_lectures  (Dashboard + Library history — Phase 1/7)
 *   - lectra_theme            (ThemeProvider)
 *   - lectra_notes_fontsize   (Notes reading font size)
 */
import { RECENTS_STORAGE_KEY, MAX_STORED_LECTURES, readRecentLectures } from '@/features/dashboard/lib/recentLectures';

export { MAX_STORED_LECTURES, readRecentLectures };

/**
 * Removes only the local lecture history. Deliberately scoped to this one
 * key — never touches theme or other preferences, and never calls a backend
 * endpoint (there is no delete API; this is a device-local reset only).
 */
export function clearLocalLectureHistory() {
  try {
    localStorage.removeItem(RECENTS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
