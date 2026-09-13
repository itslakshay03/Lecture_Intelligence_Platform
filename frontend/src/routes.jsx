import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '@/layouts/AppShell';
import DashboardPage from '@/pages/DashboardPage';
import LectureProcessingPage from '@/pages/LectureProcessingPage';
import LibraryPage from '@/pages/LibraryPage';
import SearchPage from '@/pages/SearchPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import PublicOnlyRoute from '@/features/auth/PublicOnlyRoute';

/**
 * Route table for LectraAI.
 *
 * Public routes:
 * - /login: Authentication entry point
 * - /register: User account creation
 *
 * Protected workspace routes (AppShell):
 * - /dashboard, /process, /library, /search, /settings
 *
 * Legacy deep links (/notes, /quiz, etc.) safely redirect to /dashboard.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected App Workspace */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
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
