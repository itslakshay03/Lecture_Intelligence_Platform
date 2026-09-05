import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, Info } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import QuizOptions from './QuizOptions';

const STATUS = {
  correct: { label: 'Correct', icon: CheckCircle2, cls: 'quiz-status--correct' },
  wrong: { label: 'Incorrect', icon: XCircle, cls: 'quiz-status--wrong' },
  skipped: { label: 'Not answered', icon: MinusCircle, cls: 'quiz-status--skipped' },
};

export default function QuestionReview({ question, index, total, answer, id }) {
  const answered = answer !== undefined && answer !== null;
  const status = !answered ? STATUS.skipped : answer === question.correctIndex ? STATUS.correct : STATUS.wrong;
  const StatusIcon = status.icon;
  const headingId = `quiz-review-${index}-prompt`;

  return (
    <article id={id} className="quiz-review" style={{ scrollMarginTop: 96 }}>
      <div className="quiz-review-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', minWidth: 0 }}>
          <span className="quiz-review-num">Question {index + 1} of {total}</span>
          {question.topic && <Badge variant="slate" size="sm">{question.topic}</Badge>}
        </div>
        <span className={`quiz-status ${status.cls}`}>
          <StatusIcon size={14} />
          {status.label}
        </span>
      </div>

      <h3 id={headingId} className="quiz-review-question">
        {question.question}
      </h3>

      <QuizOptions question={question} qIndex={index} selected={answered ? answer : undefined} mode="review" labelledBy={headingId} />

      {question.explanation && (
        <div className="quiz-explanation">
          <Info size={15} style={{ flexShrink: 0, color: 'var(--accent-primary)', marginTop: 1 }} />
          <p>{question.explanation}</p>
        </div>
      )}
    </article>
  );
}
