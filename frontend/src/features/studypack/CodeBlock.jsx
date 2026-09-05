import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/** Fenced code block with a language label and a copy button. Theme-agnostic. */
export default function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        margin: '1.1rem 0',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #1e293b',
        background: '#0b1120',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.7rem',
          borderBottom: '1px solid #1e293b',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#64748b',
        }}
      >
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: 'transparent',
            border: 'none',
            color: copied ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 700,
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '0.9rem 1rem',
          overflowX: 'auto',
          fontSize: '0.82rem',
          lineHeight: 1.6,
          color: '#e2e8f0',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
