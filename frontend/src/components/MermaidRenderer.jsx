import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;

export default function MermaidRenderer({ code }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!code) return;

    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        suppressErrorRendering: true,
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' }
      });
      mermaidInitialized = true;
    }

    const renderDiagram = async () => {
      if (!containerRef.current) return;
      try {
        const id = 'mermaid-svg-' + Math.random().toString(36).substr(2, 9);
        const { svg } = await mermaid.render(id, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.warn("Mermaid render error suppressed:", err);
        if (containerRef.current) {
          containerRef.current.style.display = 'none';
        }
      }
    };

    renderDiagram();
  }, [code]);

  if (!code) return null;

  return (
    <div className="mermaid-container">
      <div ref={containerRef} className="mermaid" />
    </div>
  );
}
