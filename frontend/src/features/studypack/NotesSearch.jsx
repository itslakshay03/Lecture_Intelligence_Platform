import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'MARK', 'TEXTAREA', 'CODE']);
const SKIP_CLASS = /katex|mermaid/;

function clearHighlights(root) {
  if (!root) return;
  root.querySelectorAll('mark.sp-hl').forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

function applyHighlights(root, query) {
  if (!root || !query) return [];
  const q = query.toLowerCase();
  const marks = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.toLowerCase().includes(q)) return NodeFilter.FILTER_REJECT;
      let el = node.parentElement;
      while (el && el !== root) {
        if (SKIP_TAGS.has(el.tagName) || SKIP_CLASS.test(el.className || '')) return NodeFilter.FILTER_REJECT;
        el = el.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets = [];
  let n = walker.nextNode();
  while (n) {
    targets.push(n);
    n = walker.nextNode();
  }

  targets.forEach((textNode) => {
    const text = textNode.nodeValue;
    const lower = text.toLowerCase();
    const frag = document.createDocumentFragment();
    let last = 0;
    let idx = lower.indexOf(q);
    while (idx !== -1) {
      if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const mark = document.createElement('mark');
      mark.className = 'sp-hl';
      mark.textContent = text.slice(idx, idx + q.length);
      frag.appendChild(mark);
      marks.push(mark);
      last = idx + q.length;
      idx = lower.indexOf(q, last);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(frag, textNode);
  });

  return marks;
}

/**
 * Find-in-notes. Operates purely on the already-rendered DOM inside `targetRef`
 * (no dependency, no re-render). Cleans up its highlights on unmount / clear.
 */
export default function NotesSearch({ targetRef }) {
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const marksRef = useRef([]);
  const debounceRef = useRef(null);

  const focusMark = useCallback((i, list) => {
    list.forEach((m) => m.classList.remove('sp-hl-current'));
    const m = list[i];
    if (m) {
      m.classList.add('sp-hl-current');
      m.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);

  const run = useCallback(
    (value) => {
      const root = targetRef.current;
      clearHighlights(root);
      marksRef.current = [];
      if (!value || value.trim().length < 2 || !root) {
        setCount(0);
        setCurrent(0);
        return;
      }
      const marks = applyHighlights(root, value.trim());
      marksRef.current = marks;
      setCount(marks.length);
      setCurrent(marks.length ? 1 : 0);
      if (marks.length) focusMark(0, marks);
    },
    [targetRef, focusMark],
  );

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => run(query), 160);
    return () => window.clearTimeout(debounceRef.current);
  }, [query, run]);

  useEffect(() => () => clearHighlights(targetRef.current), [targetRef]);

  const step = (dir) => {
    const list = marksRef.current;
    if (!list.length) return;
    const next = (current - 1 + dir + list.length) % list.length;
    setCurrent(next + 1);
    focusMark(next, list);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        flex: '1 1 220px',
        maxWidth: 360,
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        padding: '0 0.4rem 0 0.6rem',
      }}
    >
      <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes…"
        aria-label="Search within notes"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            step(e.shiftKey ? -1 : 1);
          }
        }}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--text-main)',
          fontSize: '0.82rem',
          padding: '0.42rem 0',
        }}
      />
      {query.trim().length >= 2 && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {count ? `${current}/${count}` : 'No matches'}
        </span>
      )}
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={!count}
        aria-label="Previous match"
        style={{ background: 'transparent', border: 'none', cursor: count ? 'pointer' : 'default', color: 'var(--text-muted)', padding: 2, opacity: count ? 1 : 0.4 }}
      >
        <ChevronUp size={14} />
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={!count}
        aria-label="Next match"
        style={{ background: 'transparent', border: 'none', cursor: count ? 'pointer' : 'default', color: 'var(--text-muted)', padding: 2, opacity: count ? 1 : 0.4 }}
      >
        <ChevronDown size={14} />
      </button>
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          aria-label="Clear search"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
