import React from 'react';
import { Video, Sparkles, Clock, LineChart } from 'lucide-react';
import { deriveStats } from '../lib/recentLectures';

/**
 * Real stats only, derived from `lectra_recent_lectures` — no hours-saved,
 * accuracy, streak or XP figures, since none of that data exists. When
 * there's no history yet, shows a polished empty state instead of zeros.
 */
export default function ProgressPanel({ recentLectures = [] }) {
  const hasHistory = recentLectures.length > 0;
  const s = deriveStats(recentLectures);

  return (
    <div className="dash-progress">
      {!hasHistory ? (
        <div className="dash-progress-empty">
          <LineChart size={22} style={{ color: 'var(--text-light)' }} />
          <p>Process your first lecture to see progress here.</p>
        </div>
      ) : (
        <div className="dash-progress-list">
          <div className="dash-progress-row">
            <span className="dash-progress-icon">
              <Video size={16} />
            </span>
            <div className="dash-progress-meta">
              <span className="dash-progress-value">{s.lectures}</span>
              <span className="dash-progress-label">Lectures processed</span>
            </div>
          </div>

          <div className="dash-progress-row">
            <span className="dash-progress-icon">
              <Sparkles size={16} />
            </span>
            <div className="dash-progress-meta">
              <span className="dash-progress-value">{s.studyTools}</span>
              <span className="dash-progress-label" title="Notes, quiz, flashcards, revision plan and interview questions — 5 per completed lecture.">
                Study tools generated
              </span>
            </div>
          </div>

          <div className="dash-progress-row">
            <span className="dash-progress-icon">
              <Clock size={16} />
            </span>
            <div className="dash-progress-meta">
              <span className="dash-progress-value dash-progress-value--sm">{s.lastActivity || '—'}</span>
              <span className="dash-progress-label">Last activity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
