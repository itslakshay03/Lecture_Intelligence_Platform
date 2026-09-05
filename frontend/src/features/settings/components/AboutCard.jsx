import React from 'react';
import { GraduationCap, Server } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { API_BASE_URL } from '@/api/client';

/**
 * Application-level identity, in place of a user profile: LectraAI has no
 * authentication or account system, so this deliberately shows real,
 * app-level information only — no invented name, email, avatar or plan.
 * The description below is the same real copy used on the Dashboard hero.
 */
export default function AboutCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4338ca)',
            color: '#fff',
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(79,70,229,0.35)',
            flexShrink: 0,
          }}
        >
          <GraduationCap size={22} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
              LectraAI
            </span>
            <Badge variant="indigo" size="sm">Beta</Badge>
          </div>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            AI-powered lecture intelligence platform
          </p>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
        Paste a lecture video and LectraAI reads the transcript, then generates a complete study pack — grounded
        notes, quizzes, flashcards, a spaced-repetition revision plan, and interview questions.
      </p>

      <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--text-muted)' }}>
        There's no account or sign-in — this is a single local workspace. Your lecture history and preferences live
        only in this browser, as described in Local Data below.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.65rem 0.9rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-main)',
          fontSize: '0.82rem',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          color: 'var(--text-main)',
        }}
      >
        <Server size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{API_BASE_URL}</span>
      </div>
    </div>
  );
}
