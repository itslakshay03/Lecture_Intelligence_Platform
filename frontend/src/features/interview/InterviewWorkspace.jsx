import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Briefcase } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import InterviewHeader from './InterviewHeader';
import InterviewProgress from './InterviewProgress';
import QuestionNavigator from './QuestionNavigator';
import InterviewQuestion from './InterviewQuestion';
import InterviewNavigation from './InterviewNavigation';
import InterviewCompletion from './InterviewCompletion';
import { normalizeInterview, summarize } from './lib/interview';

const EMPTY_COPY = {
  missing: 'This lecture’s study pack did not include interview questions.',
  empty: 'No interview questions were generated for this lecture.',
  invalid: 'The interview-question data for this lecture is incomplete, so it can’t be shown.',
};

function firstFlagged(marks) {
  const keys = Object.keys(marks)
    .filter((k) => marks[k] === 'flagged')
    .map(Number)
    .sort((a, b) => a - b);
  return keys.length ? keys[0] : 0;
}

/**
 * Interview Questions feature. Questions come straight from
 * `studyPack.interview_questions` (flattened basic -> intermediate -> advanced).
 * Reviewed / flagged marks are local UI state only — nothing is persisted.
 */
export default function InterviewWorkspace({ interview, onBack }) {
  const rootRef = useRef(null);
  const norm = useMemo(() => normalizeInterview(interview), [interview]);
  const total = norm.questions.length;

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(() => new Set());
  const [marks, setMarks] = useState({});
  const [phase, setPhase] = useState('practice'); // 'practice' | 'done'

  const summary = useMemo(() => summarize(marks, total), [marks, total]);

  const scrollTop = useCallback(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goTo = useCallback((i) => setIndex(i), []);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => {
    if (index >= total - 1) {
      setPhase('done');
      scrollTop();
      return;
    }
    setIndex((i) => i + 1);
  }, [index, total, scrollTop]);

  const toggleReveal = useCallback((i) => {
    setRevealed((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(i)) nextSet.delete(i);
      else nextSet.add(i);
      return nextSet;
    });
  }, []);

  const mark = useCallback(
    (value) =>
      setMarks((m) => {
        const nextM = { ...m };
        if (value == null) delete nextM[index];
        else nextM[index] = value;
        return nextM;
      }),
    [index],
  );

  const practiceAgain = useCallback(() => {
    setIndex(0);
    setRevealed(new Set());
    setMarks({});
    setPhase('practice');
    scrollTop();
  }, [scrollTop]);

  const reviewFlagged = useCallback(() => {
    setPhase('practice');
    setIndex(firstFlagged(marks));
    scrollTop();
  }, [marks, scrollTop]);

  if (!norm.ok) {
    return (
      <div className="iv-root" ref={rootRef}>
        <EmptyState
          icon={Briefcase}
          title="Interview questions unavailable"
          description={EMPTY_COPY[norm.reason] || EMPTY_COPY.invalid}
          action={
            onBack ? (
              <button type="button" className="iv-linkbtn" onClick={onBack}>
                Back to Study Pack
              </button>
            ) : null
          }
        />
      </div>
    );
  }

  const { questions, counts } = norm;

  return (
    <div className="iv-root" ref={rootRef}>
      <InterviewHeader counts={counts} onBack={onBack} />

      {phase === 'done' ? (
        <InterviewCompletion
          total={total}
          summary={summary}
          onPracticeAgain={practiceAgain}
          onReviewFlagged={reviewFlagged}
          onBack={onBack}
        />
      ) : (
        <>
          <InterviewProgress index={index} total={total} summary={summary} />

          <QuestionNavigator
            questions={questions}
            currentIndex={index}
            marks={marks}
            revealed={revealed}
            onJump={goTo}
          />

          <InterviewQuestion
            question={questions[index]}
            index={index}
            total={total}
            revealed={revealed.has(index)}
            onToggleReveal={() => toggleReveal(index)}
            mark={marks[index]}
            onMark={mark}
          />

          <InterviewNavigation index={index} total={total} onPrev={prev} onNext={next} />
        </>
      )}
    </div>
  );
}
