import React, { useState } from 'react';
import { Clock, ArrowRight, PlayCircle, FileText, HelpCircle, Layers, ExternalLink } from 'lucide-react';
import { youtubeThumb, formatWhen } from '@/features/dashboard/lib/recentLectures';
import { youtubeWatchUrl } from './lib/library';

const RESOURCE_ICONS = { notes: FileText, quiz: HelpCircle, flashcards: Layers };

function Thumb({ videoId, title }) {
  const src = youtubeThumb(videoId);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="lib-card-thumb lib-card-thumb--fallback" aria-hidden="true">
        <PlayCircle size={26} />
      </div>
    );
  }

  return (
    <img
      className="lib-card-thumb"
      src={src}
      alt={title ? `Thumbnail for ${title}` : 'Lecture thumbnail'}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** One lecture in the Library grid. Opens the real, existing study pack by taskId. */
export default function LectureCard({ item, onOpen }) {
  const resources = Array.isArray(item.resources) ? item.resources : [];
  const watchUrl = youtubeWatchUrl(item.videoId);
  const title = item.title || 'Lecture study guide';

  return (
    <div className="lib-card">
      <button
        type="button"
        className="lib-card-open"
        onClick={() => onOpen(item)}
        aria-label={`Open study pack: ${title}`}
      >
        <Thumb videoId={item.videoId} title={title} />

        <div className="lib-card-body">
          <h3 className="lib-card-title lai-line-clamp-2">{title}</h3>

          <span className="lib-card-meta">
            <Clock size={12} /> {formatWhen(item)}
          </span>

          {resources.length > 0 && (
            <div className="lib-card-resources">
              {resources
                .filter((r) => RESOURCE_ICONS[r])
                .map((r) => {
                  const Icon = RESOURCE_ICONS[r];
                  return (
                    <span key={r} className="lib-card-resource">
                      <Icon size={12} /> {r}
                    </span>
                  );
                })}
            </div>
          )}

          <span className="lib-card-cta">
            Open Study Pack <ArrowRight size={14} />
          </span>
        </div>
      </button>

      {watchUrl && (
        <a
          className="lib-card-yt"
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open "${title}" on YouTube in a new tab`}
          title="View on YouTube"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}
