import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Minus, Plus, Copy, Check, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import useMediaQuery from '@/hooks/useMediaQuery';
import MarkdownBody from './MarkdownBody';
import NotesErrorBoundary from './NotesErrorBoundary';
import TableOfContents from './TableOfContents';
import ImportantTopics from './ImportantTopics';
import KeyMoments from './KeyMoments';
import NotesSearch from './NotesSearch';
import DownloadPdfButton from './DownloadPdfButton';
import { parseNotes, tocFromParsed } from './lib/notes';
import {
  NOTES_FONT_SIZE_MIN as FS_MIN,
  NOTES_FONT_SIZE_MAX as FS_MAX,
  readNotesFontSize,
  writeNotesFontSize,
} from './lib/fontSizePref';

export default function NotesWorkspace({ studyPack, taskId, onSeek }) {
  const toast = useToast();
  const contentRef = useRef(null);
  const isNarrow = useMediaQuery('(max-width: 1024px)');

  const markdown = studyPack?.notes_markdown || '';
  const parsed = useMemo(() => parseNotes(markdown), [markdown]);
  const toc = useMemo(() => tocFromParsed(parsed), [parsed]);
  const sectionSlugs = useMemo(() => new Set(parsed.sections.map((s) => s.slug)), [parsed]);

  const [activeId, setActiveId] = useState(toc[0]?.id || null);
  const [fontSize, setFontSize] = useState(readNotesFontSize);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  const readingMinutes = useMemo(() => {
    const words = (markdown.match(/\S+/g) || []).length;
    return Math.max(1, Math.round(words / 200));
  }, [markdown]);

  useEffect(() => {
    writeNotesFontSize(fontSize);
  }, [fontSize]);

  // Reading progress + scroll-spy against the workspace's scroll container.
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;
    const scroller = content.closest('main') || null;

    const onScroll = () => {
      const el = scroller || document.scrollingElement;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0);
    };
    (scroller || window).addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const ids = toc.map((t) => t.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { root: scroller, rootMargin: '-72px 0px -70% 0px', threshold: 0 },
    );
    ids.forEach((id) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });

    return () => {
      (scroller || window).removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [toc]);

  const handleNavigate = useCallback((id) => {
    const node = document.getElementById(id);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Copy failed', 'Your browser blocked clipboard access.');
    }
  }, [markdown, toast]);

  if (!markdown.trim()) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.25rem' }}>
        <EmptyState
          icon={FileText}
          title="Notes aren't available for this lecture"
          description="The study pack was created but no notes content came back. You can still download the PDF or explore the other tabs."
          action={taskId ? <DownloadPdfButton taskId={taskId} variant="primary" label="Download PDF" /> : null}
        />
      </div>
    );
  }

  const hasSections = parsed.sections.length > 0;

  return (
    <div className="sp-root">
      {/* Sticky toolbar */}
      <div className="sp-toolbar">
        <NotesSearch targetRef={contentRef} />
        <div className="sp-toolbar-actions">
          <div className="sp-fontctl" role="group" aria-label="Text size">
            <button type="button" onClick={() => setFontSize((s) => Math.max(FS_MIN, s - 1))} aria-label="Smaller text" disabled={fontSize <= FS_MIN}>
              <Minus size={14} />
            </button>
            <span>{fontSize}px</span>
            <button type="button" onClick={() => setFontSize((s) => Math.min(FS_MAX, s + 1))} aria-label="Larger text" disabled={fontSize >= FS_MAX}>
              <Plus size={14} />
            </button>
          </div>
          <button type="button" className="sp-tool-btn" onClick={handleCopy}>
            {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <DownloadPdfButton taskId={taskId} />
        </div>
        <div className="sp-progress" aria-hidden="true">
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="sp-body">
        {!isNarrow && <TableOfContents entries={toc} activeId={activeId} onNavigate={handleNavigate} variant="sidebar" />}

        <div className="sp-content" ref={contentRef} style={{ fontSize: `${fontSize}px` }}>
          {/* Notes meta strip */}
          <div className="sp-meta">
            <span className="sp-meta-eyebrow">
              <FileText size={13} /> AI study notes
            </span>
            {hasSections && <span>{parsed.sections.length} sections</span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {readingMinutes} min read
            </span>
          </div>

          {isNarrow && toc.length >= 2 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <TableOfContents entries={toc} activeId={activeId} onNavigate={handleNavigate} variant="inline" />
            </div>
          )}

          {!hasSections ? (
            <NotesErrorBoundary fallbackText={markdown}>
              <section id="sp-overview" className="sp-notes">
                <MarkdownBody>{parsed.intro || markdown}</MarkdownBody>
              </section>
            </NotesErrorBoundary>
          ) : (
            <>
              {parsed.intro && (
                <section id="sp-overview" className="sp-notes sp-intro">
                  <NotesErrorBoundary fallbackText={parsed.intro}>
                    <MarkdownBody>{parsed.intro}</MarkdownBody>
                  </NotesErrorBoundary>
                </section>
              )}

              {studyPack?.topics?.length > 0 && (
                <section className="sp-block">
                  <h2 className="sp-block-title">What this lecture covers</h2>
                  <ImportantTopics
                    topics={studyPack.topics}
                    sectionSlugs={sectionSlugs}
                    onJump={handleNavigate}
                  />
                </section>
              )}

              {Array.isArray(studyPack?.timestamps) && studyPack.timestamps.length > 1 && (
                <section className="sp-block">
                  <h2 className="sp-block-title">
                    Key moments <span className="sp-block-sub">— jump to the video</span>
                  </h2>
                  <KeyMoments
                    timestamps={studyPack.timestamps}
                    duration={studyPack.video_duration || 0}
                    onSeek={onSeek}
                  />
                </section>
              )}

              {parsed.sections.map((s, i) => (
                <section key={s.slug} id={s.slug} className="sp-section">
                  <div className="sp-section-head">
                    <span className="sp-section-num">{i + 1}</span>
                    <h2 className="sp-section-title">{s.heading}</h2>
                  </div>
                  <div className="sp-notes sp-section-body">
                    <NotesErrorBoundary fallbackText={s.body}>
                      <MarkdownBody>{s.body}</MarkdownBody>
                    </NotesErrorBoundary>
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
