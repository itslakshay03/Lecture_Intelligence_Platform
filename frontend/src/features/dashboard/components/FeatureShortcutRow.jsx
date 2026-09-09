import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Layers as TopicsIcon, HelpCircle, Layers, Calendar, Briefcase } from 'lucide-react';
import { openStudyTool } from '../lib/openStudyTool';

/**
 * Compact capability cards. These do not route to standalone pages — Notes/
 * Topics/Quiz/Flashcards/Revision/Interview only exist inside an open
 * lecture's Study Pack, so every card opens the most recent real lecture at
 * that tab via openStudyTool (or sends the user to Library if there isn't
 * one yet). Colors match the existing per-resource palette already used in
 * LectureWorkspace's Study Materials launcher, for visual consistency.
 */
const FEATURES = [
  { id: 'notes', tab: 'notes', label: 'Notes', desc: 'Structured & exam-ready notes', icon: FileText, color: 'var(--accent-primary)' },
  { id: 'topics', tab: 'topics', label: 'Topics', desc: 'Key concepts & important topics', icon: TopicsIcon, color: '#3b82f6' },
  { id: 'quiz', tab: 'quiz', label: 'Quiz', desc: 'MCQs to test your knowledge', icon: HelpCircle, color: '#10b981' },
  { id: 'flashcards', tab: 'flashcards', label: 'Flashcards', desc: 'Quick revision flashcards', icon: Layers, color: '#f59e0b' },
  { id: 'revision', tab: 'revision', label: 'Revision Plan', desc: 'Personalized study schedule', icon: Calendar, color: '#06b6d4' },
  { id: 'interview', tab: 'interview', label: 'Interview', desc: 'Practice interview questions', icon: Briefcase, color: '#8b5cf6' },
];

export default function FeatureShortcutRow() {
  const navigate = useNavigate();

  return (
    <div className="dash-features">
      {FEATURES.map(({ id, tab, label, desc, icon: Icon, color }) => (
        <button
          key={id}
          type="button"
          className="dash-feature-card"
          onClick={() => openStudyTool(navigate, tab)}
        >
          <span className="dash-feature-icon" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}>
            <Icon size={17} />
          </span>
          <span className="dash-feature-label">{label}</span>
          <span className="dash-feature-desc lai-line-clamp-2">{desc}</span>
        </button>
      ))}
    </div>
  );
}
