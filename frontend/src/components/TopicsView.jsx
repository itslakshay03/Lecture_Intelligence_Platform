import React from 'react';
import { Layers, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import MermaidRenderer from './MermaidRenderer';

export default function TopicsView({ topics, onSelectTopic }) {
  if (!topics || topics.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Layers size={40} style={{ marginBottom: '1rem' }} />
        <h3>No specific topic breakdowns available.</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 2.5rem', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Important Lecture Topics
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Extracted technical subtopics and core definitions identified from the lecture transcript.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {topics.map((topic, idx) => (
          <div
            key={topic.id || idx}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent-primary)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  Topic {idx + 1}
                </span>

                {topic.timestamp && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} />
                    {topic.timestamp}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                {topic.title}
              </h3>

              {topic.key_points && topic.key_points.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Key Concepts Covered
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {topic.key_points.map((pt, pIdx) => (
                      <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <CheckCircle2 size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {topic.diagram && (
                <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                  <MermaidRenderer code={topic.diagram} />
                </div>
              )}
            </div>

            <button
              onClick={() => onSelectTopic(topic)}
              style={{
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-primary)',
                border: '1px solid var(--accent-primary)',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '1rem'
              }}
            >
              <span>View Full Notes</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
