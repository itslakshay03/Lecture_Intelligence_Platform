import React from 'react';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import Button from '@/components/ui/Button';

/** Previous / Next. On the last question, Next becomes "Finish". */
export default function InterviewNavigation({ index, total, onPrev, onNext }) {
  const isLast = index >= total - 1;
  return (
    <div className="iv-nav-bar">
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
  );
}
