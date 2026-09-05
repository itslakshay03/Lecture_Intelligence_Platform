import React from 'react';
import ErrorState from '@/components/ui/ErrorState';

/**
 * Guards the Markdown renderer. A malformed diagram / math expression should
 * degrade to a clear message, never a blank workspace.
 */
export default class NotesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the real detail in the console for developers.
    console.error('Notes render failed:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '1.5rem' }}>
          <ErrorState
            title="These notes couldn't be displayed"
            description="Something in the generated notes failed to render. The raw notes are still available to download as a PDF."
            onRetry={this.reset}
            retryLabel="Try again"
          />
          {this.props.fallbackText && (
            <pre
              style={{
                marginTop: '1rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                maxHeight: 320,
                overflow: 'auto',
              }}
            >
              {this.props.fallbackText}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
