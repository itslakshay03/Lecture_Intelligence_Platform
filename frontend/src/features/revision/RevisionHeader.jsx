import React from 'react';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Plan header — what it is, how many sessions, and a way back to the workspace.
 * The stage labels / timings / goals come from the backend as a fixed
 * spaced-repetition template; only the topics are lecture-specific.
 */
export default function RevisionHeader({ total, onBack }) {
  return (
    <header className="rv-header">
      <div style={{ minWidth: 0 }}>
        <h1 className="rv-title">
          <CalendarClock size={18} style={{ color: 'var(--accent-primary)' }} />
          Revision plan
        </h1>
        <p className="rv-subtitle">
          A spaced-repetition schedule of {total} session{total === 1 ? '' : 's'} — revise the listed
          topics at each interval to move them into long-term memory.
        </p>
      </div>
      {onBack && (
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>
          Back to Study Pack
        </Button>
      )}
    </header>
  );
}
