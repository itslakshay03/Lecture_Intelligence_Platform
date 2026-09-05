import React from 'react';
import { Briefcase } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function InterviewPage() {
  return (
    <PlaceholderPage
      icon={Briefcase}
      title="Interview Questions"
      description="Practice questions derived from the lecture, grouped by difficulty."
      bullets={[
        'Basic / intermediate / advanced tabs',
        'Expandable model answers',
        'Copy a question set for practice',
      ]}
    />
  );
}
