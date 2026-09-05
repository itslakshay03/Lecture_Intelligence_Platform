import React from 'react';
import { Clock, ChevronDown, Check, Circle, Target, ArrowUpRight } from 'lucide-react';

/** One revision session on the timeline. */
export default function RevisionSession({
  stage,
  index,
  done,
  expanded,
  onToggleDone,
  onToggleExpand,
  resolveTopic,
  onOpenTopic,
}) {
  const headingId = `${stage.id}-label`;
  const bodyId = `${stage.id}-body`;

  return (
    <li className={`rv-session${done ? ' is-done' : ''}`}>
      <span className="rv-node" aria-hidden="true">
        {done ? <Check size={15} /> : index + 1}
      </span>

      <div className="rv-card">
        <div className="rv-card-head">
          <div className="rv-card-headmain" style={{ minWidth: 0 }}>
            <h2 id={headingId} className="rv-stage">{stage.stage}</h2>
            <div className="rv-meta">
              {stage.interval && (
                <span className="rv-interval">
                  <Clock size={12} /> {stage.interval}
                </span>
              )}
              {stage.priority && (
                <span className={`rv-prio rv-prio--${stage.priority.key}`}>
                  {stage.priority.label} priority
                </span>
              )}
              <span className={`rv-state ${done ? 'rv-state--done' : 'rv-state--pending'}`}>
                {done ? <Check size={12} /> : <Circle size={10} />}
                {done ? 'Done' : 'Pending'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="rv-collapse"
            aria-expanded={expanded}
            aria-controls={bodyId}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${stage.stage}`}
            onClick={onToggleExpand}
          >
            <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
          </button>
        </div>

        {expanded && (
          <div id={bodyId} className="rv-card-body">
            {stage.goal && (
              <p className="rv-goal">
                <Target size={14} style={{ flexShrink: 0, color: 'var(--accent-primary)', marginTop: 2 }} />
                <span>{stage.goal}</span>
              </p>
            )}

            {stage.topics.length > 0 && (
              <div className="rv-topics" aria-label="Topics to revise">
                {stage.topics.map((topic, tIdx) => {
                  const slug = resolveTopic ? resolveTopic(topic) : null;
                  if (slug && onOpenTopic) {
                    return (
                      <button
                        key={tIdx}
                        type="button"
                        className="rv-topic rv-topic--link"
                        onClick={() => onOpenTopic(slug)}
                      >
                        {topic}
                        <ArrowUpRight size={12} />
                      </button>
                    );
                  }
                  return (
                    <span key={tIdx} className="rv-topic">
                      {topic}
                    </span>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className={`rv-done-btn${done ? ' is-done' : ''}`}
              aria-pressed={done}
              onClick={onToggleDone}
            >
              {done ? <Circle size={14} /> : <Check size={14} />}
              {done ? 'Mark as pending' : 'Mark session done'}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
