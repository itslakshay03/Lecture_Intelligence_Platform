import { readRecentLectures } from './recentLectures';

/**
 * Opens a study-tool tab (Notes/Topics/Quiz/Flashcards/Revision/Interview)
 * from anywhere in the app — these have no standalone pages, they only
 * exist inside a lecture's Study Pack. This opens the most recently
 * processed lecture's real Study Pack at the requested tab via Library's
 * existing fetchTaskContent + LectureWorkspace machinery (see
 * LectureLibrary.jsx's handling of location.state). With no lecture history
 * yet, it just sends the user to Library, whose own empty state explains
 * why — never a fabricated page.
 */
export function openStudyTool(navigate, tab) {
  const recent = readRecentLectures();
  if (recent.length === 0) {
    navigate('/library');
    return;
  }
  navigate('/library', { state: { openTaskId: recent[0].taskId, tab } });
}
