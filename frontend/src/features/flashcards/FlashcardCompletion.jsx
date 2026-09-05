import React from 'react';
import { CheckCircle2, RotateCcw, ArrowLeft, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';

function Stat({ label, value, tone }) {
  const color =
    tone === 'known' ? 'var(--success)' : tone === 'review' ? 'var(--warning)' : 'var(--accent-primary)';
  return (
    <div className="fc-stat">
      <span className="fc-stat-value" style={{ color }}>{value}</span>
      <span className="fc-stat-label">{label}</span>
    </div>
  );
}

export default function FlashcardCompletion({ total, summary, hasReview, onStudyAgain, onReview, onBack }) {
  return (
    <section className="fc-complete">
      <div className="fc-complete-badge">
        <CheckCircle2 size={26} />
      </div>
      <p className="fc-complete-eyebrow">Deck finished</p>
      <p className="fc-complete-main">You went through all {total} card{total === 1 ? '' : 's'}.</p>
      <p className="fc-complete-msg">
        {summary.review > 0
          ? `You flagged ${summary.review} card${summary.review === 1 ? '' : 's'} to review. These marks are only kept for this session.`
          : 'Nice work. Marks are only kept for this session — study again any time.'}
      </p>

      <div className="fc-stats-row">
        <Stat label="Cards" value={total} />
        <Stat label="Known" value={summary.known} tone="known" />
        <Stat label="To review" value={summary.review} tone="review" />
      </div>

      <div className="fc-complete-actions">
        <Button variant="primary" size="md" icon={RotateCcw} onClick={onStudyAgain}>
          Study again
        </Button>
        {hasReview && (
          <Button variant="outline" size="md" icon={Layers} onClick={onReview}>
            Review flagged cards
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
