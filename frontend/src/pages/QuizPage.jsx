import React from 'react';
import { HelpCircle } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function QuizPage() {
  return (
    <PlaceholderPage
      icon={HelpCircle}
      title="Quiz"
      description="Interactive multiple-choice quiz generated from the lecture, with instant scoring and explanations."
      bullets={[
        'Question-by-question flow with answer feedback',
        'Score summary and per-topic breakdown',
        'Retake and review incorrect answers',
      ]}
    />
  );
}
