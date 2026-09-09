import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * One subtle, generic supporting card — no fake streaks, no personalized
 * claims, no fabricated numbers. `compact` renders the smaller version used
 * inside the hero's right column.
 */
export default function DashboardTip({ compact = false }) {
  return (
    <div className={`dash-tip${compact ? ' dash-tip--compact' : ''}`}>
      <div className="dash-tip-glow" aria-hidden="true" />
      <span className="dash-tip-icon">
        <Sparkles size={compact ? 15 : 18} />
      </span>
      <div>
        <p className="dash-tip-title">Small steps every day lead to big results.</p>
        <p className="dash-tip-desc">Keep Learning <span aria-hidden="true">✨</span></p>
      </div>
    </div>
  );
}
