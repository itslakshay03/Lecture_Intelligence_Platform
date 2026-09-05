import React from 'react';
import { FileText } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function NotesPage() {
  return (
    <PlaceholderPage
      icon={FileText}
      title="Study Notes"
      description="The full structured study pack: grounded markdown notes, diagrams, key topics and timestamp-linked sections."
      bullets={[
        'Markdown notes with Mermaid + KaTeX rendering',
        'Topic outline and timestamp jump-links',
        'Download the printable PDF study guide',
      ]}
    />
  );
}
