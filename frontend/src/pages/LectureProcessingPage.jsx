import React from 'react';
import LectureFlow from '@/features/lecture/LectureFlow';

/**
 * Process Lecture route. Reuses the same real "paste URL -> processing ->
 * study workspace" flow as Dashboard (LectureFlow already owns that entire
 * lifecycle) — this route shows the actual input form (homeVariant="process"),
 * while Dashboard shows a lighter overview and links here for processing.
 */
export default function LectureProcessingPage() {
  return <LectureFlow homeVariant="process" />;
}
