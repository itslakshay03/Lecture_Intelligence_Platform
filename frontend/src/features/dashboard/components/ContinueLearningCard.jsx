import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { youtubeThumb, formatWhen } from '../lib/recentLectures';

/**
 * Large "resume" card for the most recent real lecture. Only fields that
 * actually exist in `lectra_recent_lectures` are shown — no duration or
 * subject/category, since neither is stored locally (only the full study
 * pack, fetched on open, has those, and fetching every recent item just for
 * a label isn't worth the extra request).
 */
export default function ContinueLearningCard({ recentLectures = [], onOpen }) {
  const navigate = useNavigate();
  const [thumbFailed, setThumbFailed] = useState(false);
  const lecture = recentLectures[0];

  return (
    <section className="dash-card dash-continue">
      <div className="dash-card-head">
        <h2 className="dash-card-title">Continue Learning</h2>
        {lecture && (
          <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/library')}>
            View All
          </Button>
        )}
      </div>

      {!lecture ? (
        <div className="dash-continue-empty">
          <PlayCircle size={26} style={{ color: 'var(--text-light)' }} />
          <p>No lectures yet. Process your first one to see it here.</p>
        </div>
      ) : (
        <div className="dash-continue-body">
          <div className="dash-continue-thumb">
            {youtubeThumb(lecture.videoId) && !thumbFailed ? (
              <img
                src={youtubeThumb(lecture.videoId)}
                alt=""
                loading="lazy"
                onError={() => setThumbFailed(true)}
              />
            ) : (
              <PlayCircle size={30} />
            )}
          </div>

          <div className="dash-continue-info">
            <div className="dash-continue-badges">
              <Badge variant="indigo" size="sm">YouTube Lecture</Badge>
              <Badge variant="success" size="sm">Completed</Badge>
            </div>
            <h3 className="dash-continue-lecture-title lai-line-clamp-2">
              {lecture.title || 'Lecture study guide'}
            </h3>
            <span className="dash-continue-when">Last processed {formatWhen(lecture)}</span>

            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onOpen(lecture)}
              style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }}
            >
              Resume
            </Button>
          </div>
        </div>
      )}

      {!lecture && (
        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={() => navigate('/process')}
          style={{ alignSelf: 'flex-start' }}
        >
          Process a lecture
        </Button>
      )}
    </section>
  );
}
