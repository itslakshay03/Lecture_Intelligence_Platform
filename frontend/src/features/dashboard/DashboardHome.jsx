import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import DashboardHero from './components/DashboardHero';
import LectureInput from './components/LectureInput';
import QuickActions from './components/QuickActions';
import StatsRow from './components/StatsRow';
import ContinueLearning from './components/ContinueLearning';
import RecentLectures from './components/RecentLectures';
import DashboardSection from './components/DashboardSection';

/**
 * The Dashboard home screen (the "hero" view of the lecture flow).
 *
 * All lecture submission / polling / persistence lives in LectureFlow and is
 * passed in as props — this component only composes the presentation and
 * derives display data from the real `lectra_recent_lectures` history.
 */
export default function DashboardHome({ onSubmitUrl, isLoading, recentLectures = [], onOpenLecture }) {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  const hasHistory = recentLectures.length > 0;

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: 'clamp(1.25rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2rem) 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(1.75rem, 4vw, 2.75rem)',
      }}
    >
      <DashboardHero />

      <LectureInput ref={inputRef} onSubmit={onSubmitUrl} isLoading={isLoading} />

      {hasHistory && <StatsRow recentLectures={recentLectures} />}

      {hasHistory && (
        <ContinueLearning lecture={recentLectures[0]} onOpen={onOpenLecture} />
      )}

      <DashboardSection
        title="Quick actions"
        description="Jump straight into a tool. Feature pages open as you build them out."
      >
        <QuickActions onFocusInput={focusInput} />
      </DashboardSection>

      <DashboardSection
        title="Recent lectures"
        description={
          hasHistory
            ? 'Reopen a study pack and its workspace.'
            : undefined
        }
        action={
          hasHistory && (
            <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/library')}>
              View all in Library
            </Button>
          )
        }
      >
        <RecentLectures
          recentLectures={recentLectures}
          onOpen={onOpenLecture}
          onFocusInput={focusInput}
        />
      </DashboardSection>
    </div>
  );
}
