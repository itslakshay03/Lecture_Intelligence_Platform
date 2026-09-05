import React from 'react';
import { CalendarClock } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function RevisionPage() {
  return (
    <PlaceholderPage
      icon={CalendarClock}
      title="Revision Plan"
      description="A spaced-repetition schedule mapping lecture topics to review checkpoints."
      bullets={[
        'Timed stages (24h, 3d, 7d, 14d, 30d)',
        'Per-stage topic focus and goals',
        'Check off completed review sessions',
      ]}
    />
  );
}
