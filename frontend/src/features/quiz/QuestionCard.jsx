import React from 'react';
import Badge from '@/components/ui/Badge';
import QuizOptions from './QuizOptions';

/**
 * The active question during the "take" phase.
 */
export default function QuestionCard({ question, index, total, selected, onSelect }) {
  const headingId = `quiz-q-${index}-prompt`;

  return (
    <div className="quiz-card">
      <div className="quiz-card-head">
        {question.topic ? (
          <Badge variant="indigo" size="sm">{question.topic}</Badge>
        ) : (
          <span />
        )}
        <span className="quiz-card-count">
          Question {index + 1} of {total}
        </span>
      </div>

      <h2 id={headingId} className="quiz-question">
        {question.question}
      </h2>

      <QuizOptions
        question={question}
        qIndex={index}
        selected={selected}
        onSelect={onSelect}
        mode="take"
        labelledBy={headingId}
      />
    </div>
  );
}
