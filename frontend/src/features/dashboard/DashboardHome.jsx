import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import DashboardHero from './components/DashboardHero';
import LectureInput from './components/LectureInput';
import ContinueLearningCard from './components/ContinueLearningCard';
import FeatureShortcutRow from './components/FeatureShortcutRow';
import ProgressPanel from './components/ProgressPanel';
import RecentLectures from './components/RecentLectures';
import MasteryCard from './components/MasteryCard';

/** The bottom "Recent lectures" column shows a small preview — Library is the full browser. */
const RECENT_PREVIEW_COUNT = 4;

/**
 * The Dashboard home screen — a premium, high-density overview.
 *
 * Layout (Phase 5): hero -> [Continue Learning | Process Lecture] (two
 * large cards) -> a compact Notes/Topics/Quiz/Flashcards/Revision/Interview
 * shortcut row -> [Your Progress | Recent Lectures | motivational card]
 * (three columns). All lecture submission / polling / persistence lives in
 * LectureFlow and is passed in as props; every number shown here is
 * derived from the real `lectra_recent_lectures` history.
 */
export default function DashboardHome({ recentLectures = [], onOpenLecture, onSubmitUrl, isLoading }) {
  const navigate = useNavigate();
  const hasHistory = recentLectures.length > 0;

  return (
    <div className="dash-root">
      <DashboardHero />

      <div className="dash-grid-2">
        <ContinueLearningCard recentLectures={recentLectures} onOpen={onOpenLecture} />
        <LectureInput onSubmit={onSubmitUrl} isLoading={isLoading} />
      </div>

      <FeatureShortcutRow />

      <div className="dash-grid-3">
        <section className="dash-card">
          <h2 className="dash-card-title">Your Progress</h2>
          <ProgressPanel recentLectures={recentLectures} />
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <h2 className="dash-card-title">Recent Lectures</h2>
            {hasHistory && (
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/library')}>
                View All
              </Button>
            )}
          </div>
          <RecentLectures
            recentLectures={recentLectures.slice(0, RECENT_PREVIEW_COUNT)}
            onOpen={onOpenLecture}
          />
        </section>

        <MasteryCard />
      </div>
    </div>
  );
}
