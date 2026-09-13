import { readRecentLectures } from './recentLectures';

/**
 * Opens a study-tool tab (Notes/Topics/Quiz/Flashcards/Revision/Interview)
 * from anywhere in the app. Opens the most recently processed lecture's
 * real Study Pack at the requested tab via Library's existing fetchTaskContent.
 */
export function openStudyTool(navigate, tab, lecturesList = null) {
  const list = Array.isArray(lecturesList) && lecturesList.length > 0 ? lecturesList : readRecentLectures();
  if (!list || list.length === 0) {
    navigate('/library');
    return;
  }
  const first = list[0];
  const taskId = first.taskId || first.task_id;
  navigate('/library', { state: { openTaskId: taskId, tab } });
}
