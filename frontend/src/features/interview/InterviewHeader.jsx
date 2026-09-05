import React from 'react';
import { ArrowLeft, Briefcase } from 'lucide-react';
import Button from '@/components/ui/Button';

/** Title + total + difficulty breakdown + a way back to the workspace. */
export default function InterviewHeader({ counts, onBack }) {
  const parts = [];
  if (counts.basic) parts.push(`${counts.basic} basic`);
  if (counts.intermediate) parts.push(`${counts.intermediate} intermediate`);
  if (counts.advanced) parts.push(`${counts.advanced} advanced`);

  return (
    <header className="iv-header">
      <div style={{ minWidth: 0 }}>
        <h1 className="iv-title">
          <Briefcase size={18} style={{ color: 'var(--accent-primary)' }} />
          Interview questions
        </h1>
        <p className="iv-subtitle">
          {counts.total} question{counts.total === 1 ? '' : 's'} generated from this lecture
          {parts.length > 0 && <span className="iv-breakdown"> · {parts.join(' · ')}</span>}
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
