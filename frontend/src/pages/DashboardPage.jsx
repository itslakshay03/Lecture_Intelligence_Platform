import React from 'react';
import LectureFlow from '@/features/lecture/LectureFlow';

/**
 * Dashboard route. Hosts the preserved end-to-end lecture flow
 * (URL submit -> processing -> study workspace) against the live backend.
 */
export default function DashboardPage() {
  return <LectureFlow />;
}
