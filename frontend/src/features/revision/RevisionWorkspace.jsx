import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CalendarClock, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import RevisionHeader from './RevisionHeader';
import RevisionProgress from './RevisionProgress';
import RevisionTimeline from './RevisionTimeline';
import RevisionCompletion from './RevisionCompletion';
import { normalizeRevision, summarize } from './lib/revision';

const EMPTY_COPY = {
  missing: 'This lecture’s study pack did not include a revision plan.',
  empty: 'No revision schedule was generated for this lecture.',
  invalid: 'The revision-plan data for this lecture is incomplete, so it can’t be shown.',
};

/**
 * Revision Plan feature. The schedule comes straight from
 * `studyPack.revision_plan`. "Done" marks are local UI state only — the backend
 * has no revision persistence and nothing is stored.
 */
export default function RevisionWorkspace({ revision, onBack, onResolveTopic, onOpenNotesAnchor }) {
  const rootRef = useRef(null);
  const norm = useMemo(() => normalizeRevision(revision), [revision]);
  const total = norm.stages.length;

  const [done, setDone] = useState(() => new Set());
  const [expanded, setExpanded] = useState(() => new Set(norm.stages.map((_, i) => i)));

  const summary = useMemo(() => summarize(done, total), [done, total]);

  const toggleDone = useCallback((i) => {
    setDone((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(i)) nextSet.delete(i);
      else nextSet.add(i);
      return nextSet;
    });
  }, []);

  const toggleExpand = useCallback((i) => {
    setExpanded((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(i)) nextSet.delete(i);
      else nextSet.add(i);
      return nextSet;
    });
  }, []);

  const expandAll = useCallback(() => setExpanded(new Set(norm.stages.map((_, i) => i))), [norm.stages]);
  const collapseAll = useCallback(() => setExpanded(new Set()), []);
  const reset = useCallback(() => setDone(new Set()), []);

  if (!norm.ok) {
    return (
      <div className="rv-root" ref={rootRef}>
        <EmptyState
          icon={CalendarClock}
          title="Revision plan unavailable"
          description={EMPTY_COPY[norm.reason] || EMPTY_COPY.invalid}
          action={
            onBack ? (
              <button type="button" className="rv-linkbtn" onClick={onBack}>
                Back to Study Pack
              </button>
            ) : null
          }
        />
      </div>
    );
  }

  const allExpanded = expanded.size === total;

  return (
    <div className="rv-root" ref={rootRef}>
      <RevisionHeader total={total} onBack={onBack} />
      <RevisionProgress summary={summary} />

      {summary.completed === total && total > 0 && (
        <RevisionCompletion total={total} onReset={reset} onBack={onBack} />
      )}

      <div className="rv-toolbar">
        <button
          type="button"
          className="rv-toolbtn"
          onClick={allExpanded ? collapseAll : expandAll}
        >
          {allExpanded ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <RevisionTimeline
        stages={norm.stages}
        done={done}
        expanded={expanded}
        onToggleDone={toggleDone}
        onToggleExpand={toggleExpand}
        resolveTopic={onResolveTopic}
        onOpenTopic={onOpenNotesAnchor}
      />
    </div>
  );
}
