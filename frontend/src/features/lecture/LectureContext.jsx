import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchUserLecturesApi, claimLocalLecturesApi } from '@/api/client';
import {
  RECENTS_STORAGE_KEY,
  MAX_STORED_LECTURES,
  readRecentLectures,
  formatWhen,
} from '@/features/dashboard/lib/recentLectures';

const LectureContext = createContext(null);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normalizes a lecture record to ensure consistent camelCase and snake_case properties
 * so all legacy and modern components (Library, Dashboard, Workspace) work identically.
 */
export function normalizeLecture(item) {
  if (!item) return null;

  const taskId = item.task_id || item.taskId;
  const videoId = item.video_id || item.videoId;
  const title = item.title || (videoId ? `Lecture Study Guide (${videoId})` : 'Lecture Study Guide');
  const rawCreated = item.created_at || item.createdAtISO || item.createdAt;

  let isoString;
  try {
    isoString = rawCreated ? new Date(rawCreated).toISOString() : new Date().toISOString();
  } catch {
    isoString = new Date().toISOString();
  }

  return {
    taskId,
    task_id: taskId,
    videoId,
    video_id: videoId,
    title,
    status: item.status || 'completed',
    message: item.message || null,
    createdAt: item.createdAt || formatWhen({ createdAtISO: isoString }),
    createdAtISO: isoString,
    created_at: isoString,
    hasPdf: Boolean(item.has_pdf ?? item.hasPdf),
    has_pdf: Boolean(item.has_pdf ?? item.hasPdf),
    resources: Array.isArray(item.resources) && item.resources.length > 0
      ? item.resources
      : (item.status === 'completed' ? ['notes', 'quiz', 'flashcards', 'revision', 'interview'] : []),
  };
}

export function LectureProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [lectures, setLectures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMigratedLocal, setHasMigratedLocal] = useState(false);

  /**
   * Fetches user lectures directly from the server (GET /lectures).
   */
  const refreshLectures = useCallback(async () => {
    if (!isAuthenticated) {
      setLectures([]);
      setIsLoading(false);
      return [];
    }

    try {
      setError(null);
      const data = await fetchUserLecturesApi();
      const serverList = Array.isArray(data?.lectures) ? data.lectures : [];
      const normalized = serverList.map(normalizeLecture).filter(Boolean);

      setLectures(normalized);

      // Keep localStorage synchronized as an offline cache
      try {
        localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(normalized.slice(0, MAX_STORED_LECTURES)));
      } catch {
        /* ignore storage quota warnings */
      }

      return normalized;
    } catch (err) {
      console.warn('Failed to fetch user lectures from server:', err.message);
      setError(err.message || 'Failed to load lectures.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Idempotently claims any legacy tasks stored in local browser storage
   * and associates unowned tasks (user_id IS NULL) with the authenticated user.
   */
  const claimLocalTasks = useCallback(async () => {
    if (!isAuthenticated || hasMigratedLocal) return;

    try {
      const localItems = readRecentLectures();
      const candidateTaskIds = localItems
        .map((item) => item?.taskId || item?.task_id)
        .filter((tid) => typeof tid === 'string' && UUID_RE.test(tid));

      if (candidateTaskIds.length > 0) {
        console.info(`Submitting ${candidateTaskIds.length} local task IDs to claim-local...`);
        const res = await claimLocalLecturesApi(candidateTaskIds);
        console.info(`Claimed ${res?.claimed_count || 0} tasks into cloud library.`);
      }

      setHasMigratedLocal(true);
    } catch (err) {
      console.warn('LocalStorage migration encountered an issue:', err.message);
      // Mark as migrated to prevent spamming the claim endpoint on every render
      setHasMigratedLocal(true);
    }
  }, [isAuthenticated, hasMigratedLocal]);

  /**
   * Optimistically prepends or updates a lecture in active state
   * (e.g. when LectureFlow finishes a task).
   */
  const addOrUpdateLecture = useCallback((newItem) => {
    const normalized = normalizeLecture(newItem);
    if (!normalized || !normalized.taskId) return;

    setLectures((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.taskId === normalized.taskId || (normalized.videoId && item.videoId === normalized.videoId),
      );

      let next;
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...normalized };
      } else {
        next = [normalized, ...prev];
      }

      try {
        localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(next.slice(0, MAX_STORED_LECTURES)));
      } catch {
        /* ignore */
      }

      return next;
    });
  }, []);

  // Initialize and migrate on authentication state change
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!isAuthenticated) {
        if (isMounted) {
          setLectures([]);
          setIsLoading(false);
          setHasMigratedLocal(false);
        }
        return;
      }

      setIsLoading(true);

      // 1. One-time claim of unowned local storage task IDs
      await claimLocalTasks();

      // 2. Fetch authoritative database lecture list
      if (isMounted) {
        await refreshLectures();
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id, claimLocalTasks, refreshLectures]);

  const value = useMemo(
    () => ({
      lectures,
      isLoading,
      error,
      refreshLectures,
      claimLocalTasks,
      addOrUpdateLecture,
    }),
    [lectures, isLoading, error, refreshLectures, claimLocalTasks, addOrUpdateLecture],
  );

  return <LectureContext.Provider value={value}>{children}</LectureContext.Provider>;
}

export function useLectures() {
  const context = useContext(LectureContext);
  if (!context) {
    throw new Error('useLectures must be used within a <LectureProvider>');
  }
  return context;
}

export default LectureContext;
