import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '@/layouts/AppShell';
import DashboardPage from '@/pages/DashboardPage';
import LectureProcessingPage from '@/pages/LectureProcessingPage';
import LibraryPage from '@/pages/LibraryPage';
import SearchPage from '@/pages/SearchPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Route table for the LectraAI shell.
 *
 * Primary navigation: Dashboard, Process Lecture, Library, Search, Settings
 * (Theme lives in the sidebar as a control, not a route). Study tools
 * (Notes, Topics, Quiz, Flashcards, Revision, Interview, Transcript) are not
 * routed here at all — they only render inside a lecture's Study Pack
 * (LectureWorkspace), reached from Dashboard, Process Lecture or Library.
 *
 * /notes, /quiz, /flashcards, /revision and /interview used to render
 * standalone placeholder stubs explaining that; they're kept here as plain
 * redirects to /dashboard so any old bookmark/link still lands somewhere
 * useful instead of 404ing. See research/reports/PHASE_UI_REDESIGN_1_AUDIT.md.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="process" element={<LectureProcessingPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Legacy deep links — redirect rather than 404 or dead-end stub. */}
        <Route path="notes" element={<Navigate to="/dashboard" replace />} />
        <Route path="quiz" element={<Navigate to="/dashboard" replace />} />
        <Route path="flashcards" element={<Navigate to="/dashboard" replace />} />
        <Route path="revision" element={<Navigate to="/dashboard" replace />} />
        <Route path="interview" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
