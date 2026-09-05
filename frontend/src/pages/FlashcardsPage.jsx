import React from 'react';
import { Layers } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function FlashcardsPage() {
  return (
    <PlaceholderPage
      icon={Layers}
      title="Flashcards"
      description="Active-recall flashcards over the lecture's key terms and concepts."
      bullets={[
        'Flip-card deck with keyboard navigation',
        'Mark cards as known / needs review',
        'Session progress tracking',
      ]}
    />
  );
}
