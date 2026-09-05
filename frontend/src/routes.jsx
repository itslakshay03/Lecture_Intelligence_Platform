import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '@/layouts/AppShell';
import DashboardPage from '@/pages/DashboardPage';
import LectureProcessingPage from '@/pages/LectureProcessingPage';
import NotesPage from '@/pages/NotesPage';
import QuizPage from '@/pages/QuizPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import RevisionPage from '@/pages/RevisionPage';
import InterviewPage from '@/pages/InterviewPage';
import LibraryPage from '@/pages/LibraryPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Route table for the LectraAI shell.
 * Dashboard hosts the working end-to-end lecture flow; the rest are
 * Phase 0 placeholders with their routing + layout already wired.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="process" element={<LectureProcessingPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="revision" element={<RevisionPage />} />
        <Route path="interview" element={<InterviewPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
