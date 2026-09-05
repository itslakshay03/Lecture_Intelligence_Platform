import React, { useMemo, useRef } from 'react';
import { RotateCcw, ArrowLeft, ListChecks, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';
import QuestionNavigator from './QuestionNavigator';
import QuestionReview from './QuestionReview';
import { scoreQuiz, performanceMessage } from './lib/quiz';

function Stat({ label, value, tone }) {
  const color =
    tone === 'good' ? 'var(--success)' : tone === 'bad' ? 'var(--danger)' : tone === 'muted' ? 'var(--text-muted)' : 'var(--accent-primary)';
  return (
    <div className="quiz-stat">
      <span className="quiz-stat-value" style={{ color }}>{value}</span>
      <span className="quiz-stat-label">{label}</span>
    </div>
  );
}

export default function QuizResults({ questions, answers, onRetry, onBack }) {
  const reviewRef = useRef(null);
  const s = useMemo(() => scoreQuiz(questions, answers), [questions, answers]);

  const jumpToReview = (i) => {
    const el = document.getElementById(`quiz-review-${i}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="quiz-results">
      <section className="quiz-score-card">
        <div className="quiz-score-badge">
          <Trophy size={26} />
        </div>
        <p className="quiz-score-eyebrow">Quiz complete</p>
        <p className="quiz-score-main">
          <strong>{s.correct}</strong> / {s.total} correct
        </p>
        <p className="quiz-score-pct">{s.percent}%</p>
        <p className="quiz-score-msg">{performanceMessage(s.percent)}</p>

        <div className="quiz-stats-row">
          <Stat label="Correct" value={s.correct} tone="good" />
          <Stat label="Incorrect" value={s.incorrect} tone="bad" />
          <Stat label="Unanswered" value={s.unanswered} tone="muted" />
        </div>

        <div className="quiz-results-actions">
          <Button variant="primary" size="md" icon={RotateCcw} onClick={onRetry}>
            Retry quiz
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={ListChecks}
            onClick={() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Review answers
          </Button>
          {onBack && (
            <Button variant="ghost" size="md" icon={ArrowLeft} onClick={onBack}>
              Back to Study Pack
            </Button>
          )}
        </div>
      </section>

      <section ref={reviewRef} style={{ scrollMarginTop: 80 }}>
        <h2 className="quiz-review-heading">Question review</h2>
        <QuestionNavigator
          count={questions.length}
          answers={answers}
          questions={questions}
          mode="result"
          onJump={jumpToReview}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.1rem' }}>
          {questions.map((q, i) => (
            <QuestionReview
              key={q.id || i}
              id={`quiz-review-${i}`}
              question={q}
              index={i}
              total={questions.length}
              answer={answers[i]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
