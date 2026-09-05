/**
 * Parsing + slug helpers for the Study Pack notes.
 * Works only on the real `notes_markdown` string the backend returns — no
 * synthetic sections are ever added.
 */

// Leading run of whitespace + any emoji / pictographic character and its
// components (skin-tone modifiers, variation selectors, ZWJ, keycap).
const EMOJI_LEAD = /^[\s\p{Extended_Pictographic}\p{Emoji_Component}]+/u;

/** Remove a leading run of emoji / symbols from a heading label. */
export function stripLeadingEmoji(text = '') {
  return String(text).replace(EMOJI_LEAD, '').trim() || String(text).trim();
}

/** URL-safe slug from arbitrary heading text. */
export function slugify(text = '') {
  return stripLeadingEmoji(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/** Slugger with de-duplication (section, section-2, section-3…). */
export function makeSlugger() {
  const seen = new Map();
  return (text) => {
    const base = slugify(text) || 'section';
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

/**
 * Known "###" callout headings the backend prompt can emit. Maps the heading
 * phrase to an existing callout-box class from index.css.
 */
const CALLOUTS = [
  { re: /in simple words/i, cls: 'definition-box', tone: 'info' },
  { re: /real-?life (analogy|example)/i, cls: 'analogy-box', tone: 'analogy' },
  { re: /common (mistakes|misconceptions)/i, cls: 'warning-box', tone: 'warning' },
  { re: /exam (tip|focus|questions?)/i, cls: 'exam-focus-box', tone: 'exam' },
  { re: /key takeaways/i, cls: 'revision-box', tone: 'revision' },
];

/** Returns { cls } when a heading looks like a supported callout, else null. */
export function matchCallout(text = '') {
  const clean = stripLeadingEmoji(text);
  for (const c of CALLOUTS) if (c.re.test(clean)) return { cls: c.cls, tone: c.tone };
  return null;
}

/**
 * Splits `notes_markdown` into a title, an intro block and `##` sections.
 * If the markdown has no `##` headings the whole body is returned as `intro`
 * and `sections` is empty — callers render it as one block.
 */
export function parseNotes(md) {
  if (!md || !md.trim()) return { title: '', intro: '', sections: [] };

  const text = md.replace(/\r\n/g, '\n');
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const title = titleMatch ? stripLeadingEmoji(titleMatch[1]) : '';

  const headingRe = /^##\s+(.+)$/gm;
  const marks = [];
  let m;
  while ((m = headingRe.exec(text))) marks.push({ idx: m.index, len: m[0].length, heading: m[1].trim() });

  const introStart = titleMatch ? titleMatch.index + titleMatch[0].length : 0;

  if (marks.length === 0) {
    const intro = text.slice(introStart).replace(/^\s*---\s*$/gm, '').trim();
    return { title, intro, sections: [] };
  }

  const intro = text.slice(introStart, marks[0].idx).replace(/^\s*---\s*$/gm, '').trim();

  const slugger = makeSlugger();
  const sections = marks.map((mark, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].idx : text.length;
    const body = text
      .slice(mark.idx + mark.len, end)
      .replace(/^\s*---\s*$/gm, '')
      .trim();
    return { heading: mark.heading, slug: slugger(mark.heading), body };
  });

  return { title, intro, sections };
}

/** Ordered TOC entries derived from a parsed-notes result. */
export function tocFromParsed(parsed, { introLabel = 'Overview', introId = 'sp-overview' } = {}) {
  const entries = [];
  if (parsed.intro) entries.push({ id: introId, text: introLabel });
  parsed.sections.forEach((s) => entries.push({ id: s.slug, text: stripLeadingEmoji(s.heading) }));
  return entries;
}
