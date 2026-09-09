import React from 'react';
import LectureLibrary from '@/features/library/LectureLibrary';

/**
 * Search route. Deliberately reuses Library's existing client-side search
 * (title / video id / task id) rather than a new search system — this is
 * just a dedicated, search-focused entry point into the same data Library
 * already browses. See research/reports/PHASE_UI_REDESIGN_1_AUDIT.md.
 */
export default function SearchPage() {
  return <LectureLibrary autoFocusSearch />;
}
