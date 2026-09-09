import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import LectureInput from './components/LectureInput';

/**
 * The real lecture-processing surface (/process). Owns the URL input, sample
 * links and submit — moved off the Dashboard in Phase 4 so Home reads as an
 * overview rather than a processing form. `onSubmitUrl`/`isLoading` are
 * LectureFlow's real submit/poll state, unchanged.
 */
export default function ProcessLectureHome({ onSubmitUrl, isLoading }) {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(1.25rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2rem) 4rem',
      }}
    >
      <PageHeader
        badgeText="Lecture Intelligence"
        title="Process a lecture"
        description="Paste a YouTube lecture URL and LectraAI generates a complete study pack — notes, quiz, flashcards, a revision plan and interview questions."
      />
      <LectureInput onSubmit={onSubmitUrl} isLoading={isLoading} />
    </div>
  );
}
