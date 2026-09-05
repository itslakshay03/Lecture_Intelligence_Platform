import React from 'react';
import { Check, X } from 'lucide-react';
import { OPTION_LETTERS } from './lib/quiz';

/**
 * Radio group of answer options.
 *
 * mode "take"   — selectable, changeable.
 * mode "review" — static, reveals the correct answer and the user's pick with
 *                 icons + text labels (colour is never the only signal).
 */
export default function QuizOptions({ question, qIndex, selected, onSelect, mode = 'take', labelledBy }) {
  const review = mode === 'review';

  return (
    <div className="quiz-options" role="radiogroup" aria-labelledby={labelledBy}>
      {question.options.map((opt, optIdx) => {
        const isSelected = selected === optIdx;
        const isCorrect = optIdx === question.correctIndex;

        let state = 'idle';
        if (review) {
          if (isCorrect) state = 'correct';
          else if (isSelected) state = 'wrong';
        } else if (isSelected) {
          state = 'selected';
        }

        return (
          <label key={optIdx} className="quiz-opt" data-state={state} data-review={review ? '1' : undefined}>
            <input
              type="radio"
              name={`quiz-q-${qIndex}`}
              className="quiz-opt-input"
              checked={isSelected}
              disabled={review}
              onChange={() => onSelect?.(optIdx)}
            />
            <span className="quiz-opt-letter" aria-hidden="true">
              {OPTION_LETTERS[optIdx] || optIdx + 1}
            </span>
            <span className="quiz-opt-text">{opt}</span>

            {review && isCorrect && (
              <span className="quiz-opt-tag quiz-opt-tag--correct">
                <Check size={14} />
                {isSelected ? 'Your answer · correct' : 'Correct answer'}
              </span>
            )}
            {review && !isCorrect && isSelected && (
              <span className="quiz-opt-tag quiz-opt-tag--wrong">
                <X size={14} />
                Your answer
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
