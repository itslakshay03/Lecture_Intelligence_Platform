import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, BookOpen, PlayCircle, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { youtubeThumb, formatWhen } from '../lib/recentLectures';

function RowThumb({ videoId }) {
  const src = youtubeThumb(videoId);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="dash-recent-thumb dash-recent-thumb--fallback">
        <PlayCircle size={18} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="dash-recent-thumb"
    />
  );
}

/**
 * Compact row list — a small preview of real history only (caller passes an
 * already-capped slice). Every item was persisted only after its study pack
 * finished generating, so "Completed" is accurate, not fabricated.
 */
export default function RecentLectures({ recentLectures = [], onOpen }) {
  const navigate = useNavigate();

  if (recentLectures.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        compact
        title="Your learning history will appear here"
        description="Process a YouTube lecture and its study pack shows up here for one-click access."
        action={
          <Button variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/process')}>
            Process your first lecture
          </Button>
        }
      />
    );
  }

  return (
    <div className="dash-recent-list">
      {recentLectures.map((item, idx) => (
        <div key={item.taskId || item.videoId || idx} className="dash-recent-row">
          <RowThumb videoId={item.videoId} />

          <div className="dash-recent-info">
            <span className="dash-recent-title lai-line-clamp-1">{item.title || 'Lecture study guide'}</span>
            <span className="dash-recent-meta">
              <Badge variant="success" size="sm">Completed</Badge>
              <span className="dash-recent-when">
                <Clock size={11} /> {formatWhen(item)}
              </span>
            </span>
          </div>

          <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => onOpen(item)}>
            Open
          </Button>
        </div>
      ))}
    </div>
  );
}
