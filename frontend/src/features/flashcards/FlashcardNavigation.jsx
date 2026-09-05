import React from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Check, RotateCcw, Flag } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Flip + Known / Need-review (session-only) + Previous / Next.
 * On the last card, Next becomes "Finish" and ends the session.
 */
export default function FlashcardNavigation({ index, total, flipped, mark, onPrev, onNext, onFlip, onMark }) {
  const isLast = index >= total - 1;

  return (
    <div className="fc-nav">
      <div className="fc-nav-row fc-nav-row--study">
        <Button variant="outline" size="md" icon={RotateCw} onClick={onFlip}>
          {flipped ? 'Show question' : 'Show answer'}
        </Button>

        <div className="fc-mark-group" role="group" aria-label="Mark this card (this session only)">
          <button
            type="button"
            className={`fc-mark-btn fc-mark-btn--review${mark === 'review' ? ' is-active' : ''}`}
            aria-pressed={mark === 'review'}
            onClick={() => onMark(mark === 'review' ? null : 'review')}
          >
            <RotateCcw size={15} /> Need review
          </button>
          <button
            type="button"
            className={`fc-mark-btn fc-mark-btn--known${mark === 'known' ? ' is-active' : ''}`}
            aria-pressed={mark === 'known'}
            onClick={() => onMark(mark === 'known' ? null : 'known')}
          >
            <Check size={15} /> Known
          </button>
        </div>
      </div>

      <div className="fc-nav-row fc-nav-row--move">
        <Button variant="ghost" size="md" icon={ArrowLeft} onClick={onPrev} disabled={index === 0}>
          Previous
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={isLast ? Flag : ArrowRight}
          iconPosition="right"
          onClick={onNext}
        >
          {isLast ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
