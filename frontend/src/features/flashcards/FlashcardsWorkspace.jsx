import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Flashcard from './Flashcard';
import FlashcardProgress from './FlashcardProgress';
import FlashcardNavigation from './FlashcardNavigation';
import FlashcardCompletion from './FlashcardCompletion';
import CardNavigator from './CardNavigator';
import { normalizeFlashcards, summarize, firstReviewIndex } from './lib/flashcards';

const EMPTY_COPY = {
  missing: 'This lecture’s study pack did not include flashcards.',
  empty: 'No flashcards were generated for this lecture.',
  invalid: 'The flashcard data for this lecture is incomplete, so it can’t be shown.',
};

/**
 * Flashcards feature. The cards come straight from `studyPack.flashcards`.
 * "Known" / "Need review" are local UI state only — the backend has no review
 * tracking and nothing is persisted.
 */
export default function FlashcardsWorkspace({ flashcards, onBack }) {
  const rootRef = useRef(null);
  const norm = useMemo(() => normalizeFlashcards(flashcards), [flashcards]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [marks, setMarks] = useState({}); // { [i]: 'known' | 'review' }
  const [phase, setPhase] = useState('study'); // 'study' | 'done'

  const total = norm.cards.length;
  const summary = useMemo(() => summarize(marks, total), [marks, total]);

  const scrollTop = useCallback(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goTo = useCallback((i) => {
    setIndex(i);
    setFlipped(false);
  }, []);

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const prev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const next = useCallback(() => {
    if (index >= total - 1) {
      setPhase('done');
      scrollTop();
      return;
    }
    setFlipped(false);
    setIndex((i) => i + 1);
  }, [index, total, scrollTop]);

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

  const studyAgain = useCallback(() => {
    setIndex(0);
    setFlipped(false);
    setMarks({});
    setPhase('study');
    scrollTop();
  }, [scrollTop]);

  const review = useCallback(() => {
    setPhase('study');
    goTo(firstReviewIndex(marks));
    scrollTop();
  }, [marks, goTo, scrollTop]);

  if (!norm.ok) {
    return (
      <div className="fc-root" ref={rootRef}>
        <EmptyState
          icon={Layers}
          title="Flashcards unavailable"
          description={EMPTY_COPY[norm.reason] || EMPTY_COPY.invalid}
          action={
            onBack ? (
              <button type="button" className="fc-linkbtn" onClick={onBack}>
                Back to Study Pack
              </button>
            ) : null
          }
        />
      </div>
    );
  }

  const { cards } = norm;

  return (
    <div className="fc-root" ref={rootRef}>
      <header className="fc-header">
        <div style={{ minWidth: 0 }}>
          <h1 className="fc-title">Flashcards</h1>
          <p className="fc-subtitle">
            {total} card{total === 1 ? '' : 's'} from this lecture · click a card to flip it.
          </p>
        </div>
        <span className="fc-session-note">Known / review marks are kept for this session only</span>
      </header>

      {phase === 'done' ? (
        <FlashcardCompletion
          total={total}
          summary={summary}
          hasReview={summary.review > 0}
          onStudyAgain={studyAgain}
          onReview={review}
          onBack={onBack}
        />
      ) : (
        <>
          <FlashcardProgress index={index} total={total} summary={summary} />

          <CardNavigator total={total} currentIndex={index} marks={marks} onJump={goTo} />

          <Flashcard
            card={cards[index]}
            index={index}
            total={total}
            flipped={flipped}
            onFlip={flip}
            mark={marks[index]}
          />

          <FlashcardNavigation
            index={index}
            total={total}
            flipped={flipped}
            mark={marks[index]}
            onPrev={prev}
            onNext={next}
            onFlip={flip}
            onMark={mark}
          />
        </>
      )}
    </div>
  );
}
