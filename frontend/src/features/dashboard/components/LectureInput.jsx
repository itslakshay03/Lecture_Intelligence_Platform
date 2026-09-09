import React, { forwardRef, useImperativeHandle, useRef, useState, useId } from 'react';
import { Video, Sparkles, UploadCloud, Info, PlayCircle } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import Alert from '@/components/ui/Alert';

const SAMPLES = [
  { label: 'DBMS · 3-Schema Architecture', url: 'https://youtu.be/ZtVw2iuFI2w' },
  { label: 'OS · Multiprogramming vs Multitasking', url: 'https://www.youtube.com/watch?v=3MqyDWDpZoI' },
];

/** Lenient client-side check — the backend does the authoritative validation. */
function isLikelyYoutubeUrl(value) {
  const v = value.trim();
  if (!v) return false;
  let host;
  try {
    host = new URL(v.includes('://') ? v : `https://${v}`).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return false;
  }
  return (
    host === 'youtu.be' ||
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host.endsWith('.youtube.com')
  );
}

const LectureInput = forwardRef(function LectureInput({ onSubmit, isLoading }, ref) {
  const [url, setUrl] = useState('');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const inputId = useId();

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    const value = url.trim();
    if (!isLikelyYoutubeUrl(value)) {
      setError('Enter a valid YouTube link — for example https://youtu.be/… or https://www.youtube.com/watch?v=…');
      inputRef.current?.focus();
      return;
    }
    setError('');
    onSubmit(value, forceRefresh);
  };

  const prefill = (sampleUrl) => {
    setUrl(sampleUrl);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <Card
      style={{
        boxShadow: '0 0 0 1px var(--accent-border), var(--shadow-lg)',
        border: '1px solid var(--accent-border)',
      }}
    >
      <CardBody style={{ padding: 'clamp(1.15rem, 2.2vw, 1.5rem)' }}>
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor={inputId} style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Process a lecture
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Paste a YouTube lecture URL to generate its full study pack.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div style={{ position: 'relative', flex: '1 1 320px', display: 'flex', alignItems: 'center' }}>
              <Video
                size={18}
                style={{ position: 'absolute', left: '0.85rem', color: 'var(--danger)', pointerEvents: 'none' }}
              />
              <input
                id={inputId}
                ref={inputRef}
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://www.youtube.com/watch?v=…"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-error` : undefined}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.9rem 0.6rem 2.6rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)',
                }}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Sparkles}
              isLoading={isLoading}
              disabled={!url.trim() || isLoading}
              style={{ flexShrink: 0 }}
            >
              {isLoading ? 'Starting…' : 'Generate study pack'}
            </Button>
          </div>

          {error && (
            <Alert tone="danger" id={`${inputId}-error`}>
              {error}
            </Alert>
          )}

          <Switch
            checked={forceRefresh}
            onChange={setForceRefresh}
            disabled={isLoading}
            label="Force fresh AI regeneration"
            description="Ignore any cached study pack for this video and re-run the full pipeline."
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}
          >
            <Info size={13} style={{ flexShrink: 0 }} />
            AI processing usually takes 1–3 minutes. You can keep this tab open — progress updates live.
          </div>

          {/* Sample lectures — prefill only, user reviews before submitting */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Try a sample
            </span>
            {SAMPLES.map((s) => (
              <button
                key={s.url}
                type="button"
                onClick={() => prefill(s.url)}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.32rem 0.7rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'border-color var(--transition-fast), color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (isLoading) return;
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
              >
                <PlayCircle size={13} style={{ color: 'var(--accent-primary)' }} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Upload — not supported by the backend yet, shown disabled */}
          <div
            aria-disabled="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-light)',
              fontSize: '0.82rem',
              cursor: 'not-allowed',
              userSelect: 'none',
            }}
          >
            <UploadCloud size={16} />
            <span>Upload a recording</span>
            <Badge variant="slate" size="sm">Coming soon</Badge>
          </div>
        </form>
      </CardBody>
    </Card>
  );
});

export default LectureInput;
