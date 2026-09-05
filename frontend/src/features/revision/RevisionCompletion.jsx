import React from 'react';
import { CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

/** Shown once every session is marked done. */
export default function RevisionCompletion({ total, onReset, onBack }) {
  return (
    <section className="rv-complete" aria-live="polite">
      <div className="rv-complete-badge">
        <CheckCircle2 size={24} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p className="rv-complete-title">All {total} sessions marked done</p>
        <p className="rv-complete-msg">
          Nice — you’ve worked through the whole schedule. These marks reset when you leave this page.
        </p>
      </div>
      <div className="rv-complete-actions">
        <Button variant="outline" size="sm" icon={RotateCcw} onClick={onReset}>
          Reset progress
        </Button>
        {onBack && (
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack}>
            Back to Study Pack
          </Button>
        )}
      </div>
    </section>
  );
}
