import React from 'react';
import { Check, Flag } from 'lucide-react';
import InterviewAnswer from './InterviewAnswer';

const DIFF_CLASS = { basic: 'iv-diff--basic', intermediate: 'iv-diff--intermediate', advanced: 'iv-diff--advanced' };

/** One interview question with its reveal-able answer and session-only marks. */
export default function InterviewQuestion({ question, index, total, revealed, onToggleReveal, mark, onMark }) {
  const promptId = `${question.id}-prompt`;

  return (
    <article className="iv-card" aria-labelledby={promptId}>
      <div className="iv-card-head">
        <span className={`iv-diff ${DIFF_CLASS[question.difficulty] || ''}`}>{question.difficultyLabel}</span>
        <span className="iv-card-count">Question {index + 1} of {total}</span>
      </div>

      <h2 id={promptId} className="iv-question">{question.question}</h2>

      <InterviewAnswer
        id={question.id}
        answer={question.answer}
        revealed={revealed}
        onToggle={onToggleReveal}
      />

      <div className="iv-mark-group" role="group" aria-label="Mark this question (this session only)">
        <button
          type="button"
          className={`iv-mark-btn iv-mark-btn--flag${mark === 'flagged' ? ' is-active' : ''}`}
          aria-pressed={mark === 'flagged'}
          onClick={() => onMark(mark === 'flagged' ? null : 'flagged')}
        >
          <Flag size={14} /> Flag for review
        </button>
        <button
          type="button"
          className={`iv-mark-btn iv-mark-btn--review${mark === 'reviewed' ? ' is-active' : ''}`}
          aria-pressed={mark === 'reviewed'}
          onClick={() => onMark(mark === 'reviewed' ? null : 'reviewed')}
        >
          <Check size={14} /> Mark reviewed
        </button>
      </div>
    </article>
  );
}
