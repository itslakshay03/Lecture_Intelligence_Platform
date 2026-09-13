import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, SearchX, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { LoadingPanel } from '@/components/ui/Spinner';
import LectureWorkspace from '@/components/LectureWorkspace';
import { fetchTaskContent } from '@/api/client';
import { useLectures } from '@/features/lecture/LectureContext';
import LibraryHeader from './LibraryHeader';
import LibrarySearch from './LibrarySearch';
import LibrarySort from './LibrarySort';
import LibraryGrid from './LibraryGrid';
import { filterAndSortLectures } from './lib/library';

/**
 * Lecture Library — browses the persistent database-backed lecture history
 * provided by LectureContext (GET /lectures). Reopens a lecture's real,
 * already-generated study pack by its real taskId via fetchTaskContent.
 *
 * Also the real landing spot for the global Study Pack / Quiz / Flashcards /
 * Revision / Interview shortcuts (TopNav + mobile drawer): those navigate
 * here with `location.state = { openTaskId, tab }` (see
 * features/dashboard/lib/openStudyTool.js).
 */
export default function LectureLibrary({ autoFocusSearch = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lectures, isLoading, error: fetchError, refreshLectures } = useLectures();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');

  // null = grid view. Otherwise { taskId, phase: 'loading'|'ready'|'error', studyPack?, error? }
  const [opened, setOpened] = useState(null);
  const [openTab, setOpenTab] = useState(null);

  const filtered = useMemo(
    () => filterAndSortLectures(lectures, { query, sort }),
    [lectures, query, sort],
  );

  const openLecture = useCallback(async (item, tab = null) => {
    setOpenTab(tab);
    setOpened({ taskId: item.taskId, phase: 'loading' });
    try {
      const studyPack = await fetchTaskContent(item.taskId);
      setOpened({ taskId: item.taskId, phase: 'ready', studyPack });
    } catch (err) {
      setOpened({ taskId: item.taskId, phase: 'error', error: err.message });
    }
  }, []);

  // A global Study Pack / Quiz / Flashcards / Revision / Interview shortcut
  // navigated here with a task + tab to open — consume it once, then clear
  // the state so back/forward or a later mount can't re-trigger it.
  useEffect(() => {
    const openTaskId = location.state?.openTaskId;
    if (!openTaskId) return;
    openLecture({ taskId: openTaskId }, location.state?.tab || null);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeLecture = useCallback(() => {
    setOpened(null);
    setOpenTab(null);
  }, []);
  const goProcessNew = useCallback(() => navigate('/process'), [navigate]);

  if (opened?.phase === 'loading') {
    return <LoadingPanel label="Opening study pack…" minHeight="60vh" />;
  }

  if (opened?.phase === 'error') {
    return (
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <ErrorState
          title="Couldn't open this study pack"
          description={opened.error || 'The task may no longer exist on the backend.'}
          onRetry={() => openLecture({ taskId: opened.taskId }, openTab)}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <Button variant="ghost" size="sm" onClick={closeLecture}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  if (opened?.phase === 'ready') {
    return (
      <LectureWorkspace
        studyPack={opened.studyPack}
        taskId={opened.taskId}
        onBack={closeLecture}
        activeTabOverride={openTab}
        backLabel="Back to Library"
      />
    );
  }

  if (isLoading && lectures.length === 0) {
    return (
      <div className="lib-root">
        <LoadingPanel label="Loading your lecture library…" minHeight="50vh" />
      </div>
    );
  }

  if (fetchError && lectures.length === 0) {
    return (
      <div className="lib-root" style={{ maxWidth: 620, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <ErrorState
          title="Could not load your library"
          description={fetchError}
          onRetry={refreshLectures}
        />
      </div>
    );
  }

  return (
    <div className="lib-root">
      <LibraryHeader total={lectures.length} onProcessNew={goProcessNew} />

      {lectures.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Your learning history will appear here"
          description="Every lecture you process gets a real study pack — notes, quiz, flashcards, revision plan and interview questions — that stays available here so you can reopen it any time."
          action={
            <Button variant="primary" size="sm" icon={Sparkles} onClick={goProcessNew}>
              Process a lecture
            </Button>
          }
        />
      ) : (
        <>
          <div className="lib-toolbar">
            <LibrarySearch value={query} onChange={setQuery} autoFocus={autoFocusSearch} />
            <LibrarySort value={sort} onChange={setSort} />
          </div>

          <p className="lib-result-count" aria-live="polite">
            {query
              ? `${filtered.length} of ${lectures.length} lecture${lectures.length === 1 ? '' : 's'}`
              : `${lectures.length} lecture${lectures.length === 1 ? '' : 's'}`}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              compact
              title="No lectures found"
              description={`Nothing matches "${query}". Try a different title or video ID.`}
              action={
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <LibraryGrid items={filtered} onOpen={openLecture} />
          )}
        </>
      )}
    </div>
  );
}
