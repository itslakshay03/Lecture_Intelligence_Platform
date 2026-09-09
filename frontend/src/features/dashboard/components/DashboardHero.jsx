import React from 'react';
import { Video, ScrollText, Sparkles } from 'lucide-react';
import HeroVisual from './HeroVisual';
import DashboardTip from './DashboardTip';

/** Only real, implemented capabilities — no upload/OCR claims. */
const CAPABILITIES = [
  { label: 'YouTube', icon: Video },
  { label: 'Auto transcript', icon: ScrollText },
  { label: 'AI study pack', icon: Sparkles },
];

/**
 * Real, computed greeting (time-of-day) — not a fake personalized name.
 * LectraAI has no user/profile-name field anywhere in the app.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Hero: greeting + tagline + capability pills on the left; a decorative
 * "Learn Smarter, Not Harder" panel + a small supporting tip on the right.
 * No CTA button here — the primary action lives in the Process Lecture
 * card directly below (see DashboardHome).
 */
export default function DashboardHero() {
  return (
    <header className="dash-hero lai-animate-fade-in">
      <div className="dash-hero-text">
        <span className="dash-hero-eyebrow">{getGreeting()} <span aria-hidden="true">👋</span></span>

        <h1 className="dash-hero-title">
          Turn any lecture into a complete study pack with the power of AI.
        </h1>

        <p className="dash-hero-desc">
          Paste a lecture video and LectraAI reads the transcript, then generates grounded notes,
          a quiz, flashcards, a revision plan and interview questions.
        </p>

        <div className="dash-hero-pills">
          {CAPABILITIES.map(({ label, icon: Icon }) => (
            <span key={label} className="dash-hero-pill">
              <Icon size={12} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="dash-hero-side">
        <HeroVisual />
        <DashboardTip compact />
      </div>
    </header>
  );
}
