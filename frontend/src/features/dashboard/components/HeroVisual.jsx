import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Purely decorative — CSS + an inline SVG (no external assets, no new
 * dependency, no data). "Learn Smarter, Not Harder" with a soft glow and a
 * couple of abstract curved strokes.
 */
export default function HeroVisual() {
  return (
    <div className="dash-hero-visual" aria-hidden="true">
      <div className="dash-hero-glow" />

      <svg className="dash-hero-arcs" viewBox="0 0 220 140" fill="none">
        <path d="M10 120 C 70 20, 150 20, 210 90" stroke="var(--accent-primary)" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 40 C 80 100, 140 110, 200 30" stroke="var(--accent-primary)" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <span className="dash-hero-badge">
        <Sparkles size={16} />
      </span>

      <div className="dash-hero-slogan">
        <span>Learn Smarter</span>
        <span className="dash-hero-slogan-accent">Not Harder</span>
      </div>
    </div>
  );
}
