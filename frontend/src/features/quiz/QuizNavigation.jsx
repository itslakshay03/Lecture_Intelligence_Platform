import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Flag, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Prev / Next + a guarded "Submit Quiz". Submitting always requires a second
 * confirming click so it can't happen by accident.
 */
export default function QuizNavigation({ index, total, answeredCount, onPrev, onNext, onSubmit }) {
  const [confirming, setConfirming] = useState(false);
  const remaining = total - answeredCount;

  if (confirming) {
    return (
      <div className="quiz-submit-confirm" role="alertdialog" aria-label="Confirm submit">
        <div className="quiz-submit-confirm-msg">
          <AlertTriangle size={16} style={{ flexShrink: 0, color: 'var(--warning)' }} />
          <span>
            {remaining > 0
              ? `${remaining} question${remaining === 1 ? '' : 's'} still unanswered. Submit anyway?`
              : `Submit your ${total} answer${total === 1 ? '' : 's'}? You can review afterwards.`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" icon={Flag} onClick={onSubmit}>
            Submit quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-nav-bar">
      <Button variant="outline" size="md" icon={ArrowLeft} onClick={onPrev} disabled={index === 0}>
        Previous
      </Button>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="md" icon={Flag} onClick={() => setConfirming(true)}>
          Submit quiz
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={ArrowRight}
          iconPosition="right"
          onClick={onNext}
          disabled={index >= total - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
