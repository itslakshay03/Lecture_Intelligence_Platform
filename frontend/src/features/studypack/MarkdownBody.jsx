import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ExternalLink } from 'lucide-react';
import MermaidRenderer from '@/components/MermaidRenderer';
import CodeBlock from './CodeBlock';
import { matchCallout, slugify, stripLeadingEmoji } from './lib/notes';

const REMARK = [remarkGfm, remarkMath];
const REHYPE = [rehypeKatex];

function flatten(children) {
  return React.Children.toArray(children)
    .map((c) => (typeof c === 'string' ? c : typeof c === 'number' ? String(c) : c?.props?.children ? flatten(c.props.children) : ''))
    .join('');
}

const components = {
  // react-markdown v10 wraps fenced code in <pre>; we render our own container.
  pre: ({ children }) => <>{children}</>,

  code({ node, className, children, ...props }) {
    void node;
    const match = /language-(\w+)/.exec(className || '');
    const raw = String(children).replace(/\n$/, '');
    const isBlock = Boolean(match) || raw.includes('\n');

    if (match && match[1] === 'mermaid') return <MermaidRenderer code={raw} />;

    if (!isBlock) {
      return (
        <code className="sp-inline-code" {...props}>
          {children}
        </code>
      );
    }
    return <CodeBlock code={raw} language={match ? match[1] : ''} />;
  },

  h3({ children }) {
    const text = flatten(children);
    const callout = matchCallout(text);
    if (callout) {
      return (
        <div className={`callout-box ${callout.cls} sp-callout`}>
          <h4 className="sp-callout-title">{text}</h4>
        </div>
      );
    }
    return (
      <h3 id={`sp-${slugify(text)}`} className="sp-h3">
        {stripLeadingEmoji(text) === text ? children : text}
      </h3>
    );
  },

  h4: ({ children }) => <h4 className="sp-h4">{children}</h4>,

  table: ({ children }) => (
    <div className="sp-table-wrap">
      <table>{children}</table>
    </div>
  ),

  a({ href, children }) {
    const external = /^https?:\/\//i.test(href || '');
    return (
      <a
        href={href}
        className="sp-link"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
        {external && <ExternalLink size={12} style={{ marginLeft: 2, verticalAlign: 'middle' }} />}
      </a>
    );
  },

  blockquote: ({ children }) => <blockquote className="sp-quote">{children}</blockquote>,
};

/** Renders one chunk of study-pack markdown with the Study Pack styling. */
export default function MarkdownBody({ children }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK} rehypePlugins={REHYPE} components={components}>
      {children}
    </ReactMarkdown>
  );
}
