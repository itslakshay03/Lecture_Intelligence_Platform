import React from 'react';
import { Sparkles } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function LectureProcessingPage() {
  return (
    <PlaceholderPage
      icon={Sparkles}
      title="Lecture Processing"
      description="A dedicated, resumable view of a lecture as it moves through transcript extraction, AI note generation and PDF rendering."
      bullets={[
        'Live pipeline stages with per-step status from GET /tasks/{id}',
        'Graceful failure surface with the backend error message',
        'Resume / retry a task and jump to its study pack when complete',
      ]}
    />
  );
}
