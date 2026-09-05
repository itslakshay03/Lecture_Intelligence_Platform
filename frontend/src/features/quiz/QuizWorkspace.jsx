import React, { useCallback, useMemo, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import QuizHeader from './QuizHeader';
import QuizProgress from './QuizProgress';
import QuestionNavigator from './QuestionNavigator';
import QuestionCard from './QuestionCard';
import QuizNavigation from './QuizNavigation';
import QuizResults from './QuizResults';
import { normalizeQuiz } from './lib/quiz';

const EMPTY_COPY = {
  missing: 'This lecture’s study pack did not include a quiz.',
  empty: 'No quiz questions were generated for this lecture.',
  invalid: 'The quiz data for this lecture is incomplete, so it can’t be shown.',
};

/**
 * Quiz feature. Evaluation is entirely frontend (the backend returns
 * `correct_index` per question and has no submission endpoint) — that existing
 * model is preserved.
 */
export default function QuizWorkspace({ quiz, onBack }) {
  const rootRef = useRef(null);
  const norm = useMemo(() => normalizeQuiz(quiz), [quiz]);

  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('take'); // 'take' | 'results'

  const scrollTop = useCallback(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const select = useCallback(
    (optIdx) => setAnswers((a) => ({ ...a, [index]: optIdx })),
    [index],
  );

  const goTo = useCallback((i) => setIndex(i), []);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, norm.questions.length - 1)), [norm.questions.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const submit = useCallback(() => {
    setPhase('results');
    scrollTop();
  }, [scrollTop]);

  const retry = useCallback(() => {
    setAnswers({});
    setIndex(0);
    setPhase('take');
    scrollTop();
  }, [scrollTop]);

  if (!norm.ok) {
    return (
      <div className="quiz-root" ref={rootRef}>
        <EmptyState
          icon={HelpCircle}
          title="Quiz unavailable"
          description={EMPTY_COPY[norm.reason] || EMPTY_COPY.invalid}
          action={
            onBack ? (
              <button type="button" className="quiz-linkbtn" onClick={onBack}>
                Back to Study Pack
              </button>
            ) : null
          }
        />
      </div>
    );
  }

  const { questions } = norm;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="quiz-root" ref={rootRef}>
      <QuizHeader total={questions.length} answered={answeredCount} phase={phase} />

      {phase === 'take' ? (
        <>
          <QuizProgress index={index} total={questions.length} answered={answeredCount} />

          <QuestionNavigator
            count={questions.length}
            currentIndex={index}
            answers={answers}
            questions={questions}
            mode="take"
            onJump={goTo}
          />

          <QuestionCard
            question={questions[index]}
            index={index}
            total={questions.length}
            selected={answers[index]}
            onSelect={select}
          />

          <QuizNavigation
            index={index}
            total={questions.length}
            answeredCount={answeredCount}
            onPrev={prev}
            onNext={next}
            onSubmit={submit}
          />
        </>
      ) : (
        <QuizResults questions={questions} answers={answers} onRetry={retry} onBack={onBack} />
      )}
    </div>
  );
}
