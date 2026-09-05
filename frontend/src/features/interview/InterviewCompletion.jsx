import React from 'react';
import { CheckCircle2, RotateCcw, ArrowLeft, Flag } from 'lucide-react';
import Button from '@/components/ui/Button';

function Stat({ label, value, tone }) {
  const color =
    tone === 'review' ? 'var(--success)' : tone === 'flag' ? 'var(--warning)' : tone === 'muted' ? 'var(--text-muted)' : 'var(--accent-primary)';
  return (
    <div className="iv-stat">
      <span className="iv-stat-value" style={{ color }}>{value}</span>
      <span className="iv-stat-label">{label}</span>
    </div>
  );
}

export default function InterviewCompletion({ total, summary, onPracticeAgain, onReviewFlagged, onBack }) {
  return (
    <section className="iv-complete" aria-live="polite">
      <div className="iv-complete-badge">
        <CheckCircle2 size={26} />
      </div>
      <p className="iv-complete-eyebrow">Practice complete</p>
      <p className="iv-complete-main">You went through all {total} question{total === 1 ? '' : 's'}.</p>
      <p className="iv-complete-msg">
        {summary.flagged > 0
          ? `You flagged ${summary.flagged} question${summary.flagged === 1 ? '' : 's'} to revisit. These marks reset when you leave this page.`
          : 'Marks are kept for this session only — practise again any time.'}
      </p>

      <div className="iv-stats-row">
        <Stat label="Questions" value={total} />
        <Stat label="Reviewed" value={summary.reviewed} tone="review" />
        <Stat label="Flagged" value={summary.flagged} tone="flag" />
        <Stat label="Not reviewed" value={summary.remaining} tone="muted" />
      </div>

      <div className="iv-complete-actions">
        <Button variant="primary" size="md" icon={RotateCcw} onClick={onPracticeAgain}>
          Practice again
        </Button>
        {summary.flagged > 0 && onReviewFlagged && (
          <Button variant="outline" size="md" icon={Flag} onClick={onReviewFlagged}>
            Review flagged
          </Button>
        )}
        {onBack && (
          <Button variant="ghost" size="md" icon={ArrowLeft} onClick={onBack}>
            Back to Study Pack
          </Button>
        )}
      </div>
    </section>
  );
}
