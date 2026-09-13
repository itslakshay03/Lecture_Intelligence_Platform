import React from 'react';
import { User, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import Badge from '@/components/ui/Badge';

export default function UserProfileCard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        No active user session detected.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand-blue), var(--brand-cyan))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.15rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.name || 'LectraAI Student'}
              </span>
              <Badge tone="success" size="sm">
                Active
              </Badge>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {user.email}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          padding: '0.9rem',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <KeyRound size={12} /> Account ID
          </span>
          <code style={{ fontSize: '0.75rem', color: 'var(--text-main)', wordBreak: 'break-all', display: 'block', marginTop: 3 }}>
            {user.id || 'N/A'}
          </code>
        </div>
        <div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <ShieldCheck size={12} /> Security Tier
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)', display: 'block', marginTop: 3 }}>
            PBKDF2-HMAC-SHA256
          </span>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
        Your account identity is authenticated via cryptographic JSON Web Tokens (JWT) and permanently isolated in the database.
      </p>
    </div>
  );
}
