import React from 'react';
import RevisionSession from './RevisionSession';

/** Vertical timeline of revision sessions. */
export default function RevisionTimeline({ stages, done, expanded, onToggleDone, onToggleExpand, resolveTopic, onOpenTopic }) {
  return (
    <ol className="rv-timeline">
      {stages.map((stage, i) => (
        <RevisionSession
          key={stage.id}
          stage={stage}
          index={i}
          total={stages.length}
          done={done.has(i)}
          expanded={expanded.has(i)}
          onToggleDone={() => onToggleDone(i)}
          onToggleExpand={() => onToggleExpand(i)}
          resolveTopic={resolveTopic}
          onOpenTopic={onOpenTopic}
        />
      ))}
    </ol>
  );
}
