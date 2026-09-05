import React from 'react';
import { Library, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LibraryHeader({ total, onProcessNew }) {
  return (
    <header className="lib-header">
      <div style={{ minWidth: 0 }}>
        <h1 className="lib-title">
          <Library size={18} style={{ color: 'var(--accent-primary)' }} />
          Lecture library
        </h1>
        <p className="lib-subtitle">
          {total} lecture{total === 1 ? '' : 's'} you’ve processed, stored on this device.
        </p>
      </div>
      <Button variant="primary" size="sm" icon={Sparkles} onClick={onProcessNew}>
        Process a lecture
      </Button>
    </header>
  );
}
