import React from 'react';
import AppRoutes from './routes';

/**
 * App root. Providers (Router, Theme, Toast) are mounted in main.jsx so this
 * stays a thin composition point.
 *
 * The original single-file state-machine app now lives in
 * features/lecture/LectureFlow.jsx and renders on the /dashboard route.
 */
export default function App() {
  return <AppRoutes />;
}
