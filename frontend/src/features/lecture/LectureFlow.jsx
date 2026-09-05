import React, { useState, useEffect, useCallback } from 'react';
import DashboardHome from '@/features/dashboard/DashboardHome';
import ProcessingView from '@/components/ProcessingView';
import LectureWorkspace from '@/components/LectureWorkspace';
import { useToast } from '@/components/ui/Toast';
import { LoadingPanel } from '@/components/ui/Spinner';
import { submitYoutubeUrl, fetchTaskStatus, fetchTaskContent } from '@/api/client';
import {
  RECENTS_STORAGE_KEY,
  MAX_STORED_LECTURES,
  readRecentLectures,
} from '@/features/dashboard/lib/recentLectures';

/**
 * The end-to-end "paste a YouTube URL -> processing -> study workspace" flow.
 *
 * This is the original App.jsx experience preserved intact against the tested
 * backend contract (POST /youtube, GET /tasks/{id}, GET /tasks/{id}/content).
 * Only the outer chrome (sidebar / theme toggle) was lifted out to AppShell;
 * the request/poll/persist logic is unchanged.
 */
export default function LectureFlow() {
  const toast = useToast();

  const [view, setView] = useState('hero'); // 'hero' | 'processing' | 'dashboard'
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [studyPack, setStudyPack] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [recentLectures, setRecentLectures] = useState(readRecentLectures);
  // True only while reopening an already-completed lecture from Dashboard
  // (Continue Learning / Recent Lectures) — a lightweight loading state,
  // distinct from the full multi-stage ProcessingView used for a fresh
  // submission, so re-clicking a card mid-fetch can't fire a second fetch.
  const [isOpeningRecent, setIsOpeningRecent] = useState(false);

  const loadCompletedTask = useCallback(
    async (taskId) => {
      try {
        setTaskStatus({ status: 'processing', message: 'Loading Study Pack...' });
        const pack = await fetchTaskContent(taskId);
        setStudyPack(pack);
        setView('dashboard');

        setRecentLectures((prev) => {
          const existingIdx = prev.findIndex(
            (item) => item.taskId === taskId || item.videoId === pack.video_id,
          );
          const now = new Date();
          const newItem = {
            taskId,
            videoId: pack.video_id,
            title: pack.title || 'Lecture Study Guide',
            createdAt: now.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            createdAtISO: now.toISOString(),
            resources: ['notes', 'quiz', 'flashcards', 'revision', 'interview'],
          };

          let updated;
          if (existingIdx >= 0) {
            updated = [...prev];
            updated[existingIdx] = newItem;
          } else {
            updated = [newItem, ...prev].slice(0, MAX_STORED_LECTURES);
          }

          try {
            localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed saving recent lectures to localStorage:', e);
          }
          return updated;
        });
      } catch (err) {
        console.error('Failed loading task content:', err);
        setTaskStatus({ status: 'failed', error: 'Failed to retrieve generated Study Pack data.' });
        toast.error('Could not load study pack', err.message);
      }
    },
    [toast],
  );

  const handleSubmitUrl = useCallback(
    async (url, forceRefresh) => {
      setIsLoading(true);
      setTaskStatus({ status: 'pending', message: 'Submitting request...' });
      setView('processing');

      try {
        const res = await submitYoutubeUrl(url, forceRefresh);
        setCurrentTaskId(res.task_id);

        if (res.status === 'completed') {
          await loadCompletedTask(res.task_id);
        }
      } catch (err) {
        console.error('Submit error:', err);
        setTaskStatus({
          status: 'failed',
          error: err.message || 'Failed to connect to backend server.',
        });
        toast.error('Submission failed', err.message || 'Could not reach the backend.');
      } finally {
        setIsLoading(false);
      }
    },
    [loadCompletedTask, toast],
  );

  // Poll task status while processing.
  useEffect(() => {
    if (!currentTaskId || view !== 'processing') return undefined;

    const interval = setInterval(async () => {
      try {
        const status = await fetchTaskStatus(currentTaskId);
        setTaskStatus(status);

        if (status.status === 'completed') {
          clearInterval(interval);
          await loadCompletedTask(currentTaskId);
        } else if (status.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setTaskStatus({ status: 'failed', error: 'Lost connection to processing task.' });
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentTaskId, view, loadCompletedTask]);

  const handleNewPack = useCallback(() => {
    setCurrentTaskId(null);
    setTaskStatus(null);
    setStudyPack(null);
    setView('hero');
  }, []);

  const handleOpenRecentLecture = useCallback(
    async (item) => {
      if (!item.taskId || isOpeningRecent) return;
      setIsOpeningRecent(true);
      setCurrentTaskId(item.taskId);
      try {
        await loadCompletedTask(item.taskId);
      } finally {
        setIsOpeningRecent(false);
      }
    },
    [loadCompletedTask, isOpeningRecent],
  );

  return (
    <>
      {view === 'hero' && isOpeningRecent && <LoadingPanel label="Opening study pack…" minHeight="60vh" />}

      {view === 'hero' && !isOpeningRecent && (
        <DashboardHome
          onSubmitUrl={handleSubmitUrl}
          isLoading={isLoading}
          recentLectures={recentLectures}
          onOpenLecture={handleOpenRecentLecture}
        />
      )}

      {view === 'processing' && (
        <ProcessingView taskStatus={taskStatus} onCancel={handleNewPack} />
      )}

      {view === 'dashboard' && (
        <LectureWorkspace
          studyPack={studyPack}
          taskId={currentTaskId}
          onBack={handleNewPack}
          activeTabOverride={null}
        />
      )}
    </>
  );
}
