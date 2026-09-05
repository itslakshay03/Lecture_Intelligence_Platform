import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LibraryBig } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

/**
 * Scaffold for the sidebar's standalone study-tool routes (/notes, /quiz,
 * /flashcards, /revision, /interview, /process). These tools are real and
 * fully built, but only render inside a specific lecture's Study Pack
 * (LectureWorkspace) — reached from Dashboard or the Library, never from a
 * bare URL with no lecture selected. This screen explains that and hands the
 * user straight to both real entry points, instead of leaving them stranded.
 */
export default function PlaceholderPage({ icon, title, description, bullets = [] }) {
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <PageHeader title={title} description={description} />

      <EmptyState
        icon={icon}
        title={`${title} opens from a lecture`}
        description={
          bullets.length
            ? `${title} is part of every lecture's Study Pack. Process a new lecture, or reopen one from your Library, and it will include:`
            : `${title} is part of every lecture's Study Pack. Process a new lecture, or reopen one from your Library, to use it.`
        }
        action={
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/library" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm" icon={LibraryBig}>
                Open from Library
              </Button>
            </Link>
          </div>
        }
      />

      {bullets.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: '1.25rem auto 0',
            padding: 0,
            maxWidth: 520,
            display: 'grid',
            gap: '0.6rem',
          }}
        >
          {bullets.map((b) => (
            <li
              key={b}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                padding: '0.6rem 0.8rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '9999px',
                  backgroundColor: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
