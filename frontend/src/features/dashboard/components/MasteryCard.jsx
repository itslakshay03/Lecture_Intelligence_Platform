import React from 'react';
import { Flame } from 'lucide-react';

/**
 * Static, generic motivational card — no fabricated streak/mastery metric,
 * just encouragement copy with a decorative gradient/glow and an abstract
 * mountain/graph silhouette (pure CSS clip-path + inline SVG, no images).
 */
export default function MasteryCard() {
  return (
    <div className="dash-card dash-mastery">
      <div className="dash-mastery-glow" aria-hidden="true" />
      <div className="dash-mastery-glow dash-mastery-glow--top" aria-hidden="true" />
      <div className="dash-mastery-shape" aria-hidden="true" />
      <svg className="dash-mastery-shape--line" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          points="0,50 25,38 45,44 65,20 85,30 105,10 130,24 155,14 200,26"
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="dash-mastery-icon">
        <Flame size={20} />
      </span>
      <h2 className="dash-mastery-title">
        Consistency
        <br />
        Builds Mastery
      </h2>
      <p className="dash-mastery-desc">Keep going. You&rsquo;re doing great.</p>
    </div>
  );
}
