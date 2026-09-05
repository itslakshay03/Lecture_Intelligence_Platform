import React from 'react';
import { Loader2, CheckCircle2, Clock, Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ProcessingView({ taskStatus, onCancel }) {
  const statusMessage = taskStatus?.message || "Initializing task processing...";
  const isFailed = taskStatus?.status === 'failed';

  const stages = [
    { title: "Lecture Detected & URL Validated", stepMatch: 1 },
    { title: "Extracting Video Transcript (Strategy 1 & 2)", stepMatch: 1 },
    { title: "Analyzing Technical Content & Topic Segmentation", stepMatch: 2 },
    { title: "Generating Grounded Study Notes (Gemini AI Engine)", stepMatch: 2 },
    { title: "Formulating Interactive Quiz & Flashcards", stepMatch: 2 },
    { title: "Scheduling Spaced Repetition Revision Plan", stepMatch: 2 },
    { title: "Compiling Printable PDF Study Guide", stepMatch: 3 }
  ];

  // Determine stage progress
  let activeStep = 1;
  if (statusMessage.includes("Step 2/3") || statusMessage.includes("AI")) {
    activeStep = 4;
  } else if (statusMessage.includes("Step 3/3") || statusMessage.includes("Rendering")) {
    activeStep = 6;
  } else if (taskStatus?.status === 'completed') {
    activeStep = 7;
  }

  const progressPercent = Math.min(100, Math.max(15, (activeStep / 7) * 100));

  return (
    <div style={{ maxWidth: '680px', margin: '3rem auto', padding: '0 1.5rem' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {isFailed ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={36} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--danger)' }}>
              Processing Interrupted
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {taskStatus?.error || "The background task encountered an issue while generating study notes."}
            </p>
            <button
              onClick={onCancel}
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowLeft size={18} />
              Try Another Video
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-flex',
                padding: '0.875rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-primary)',
                marginBottom: '1rem'
              }}>
                <Sparkles size={32} className="animate-pulse" />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                Building Your Study Pack
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                LectraAI is converting the video lecture into a grounded study guide.
              </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem'
              }}>
                <span>Processing Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: 'var(--accent-primary)',
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease-in-out'
                }} />
              </div>
            </div>

            {/* Current Status Message Banner */}
            <div style={{
              backgroundColor: 'var(--accent-light)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '0.5rem',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '2rem'
            }}>
              <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
                {statusMessage}
              </span>
            </div>

            {/* Stage Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {stages.map((stage, idx) => {
                const isDone = idx < activeStep;
                const isCurrent = idx === activeStep - 1;
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    opacity: isDone || isCurrent ? 1 : 0.4
                  }}>
                    {isDone ? (
                      <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    ) : isCurrent ? (
                      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    ) : (
                      <Clock size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: isCurrent ? '700' : '500',
                      color: isCurrent ? 'var(--accent-primary)' : 'var(--text-main)'
                    }}>
                      {stage.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
