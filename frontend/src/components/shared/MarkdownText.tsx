import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownTextProps {
  text: string
  size?: 'sm' | 'md'
  maxHeight?: number
}

export function MarkdownText({ text, size = 'md', maxHeight }: MarkdownTextProps) {
  const fontSize = size === 'sm' ? 13 : 14
  return (
    <div
      className="md-body"
      style={{
        fontSize,
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
        maxHeight,
        overflowY: maxHeight ? 'auto' : undefined,
        wordBreak: 'break-word',
      }}
    >
      <style>{`
        .md-body > *:first-child { margin-top: 0; }
        .md-body > *:last-child { margin-bottom: 0; }
        .md-body p { margin: 0 0 12px; }
        .md-body h1, .md-body h2, .md-body h3, .md-body h4, .md-body h5, .md-body h6 {
          color: var(--text-primary);
          font-weight: 700;
          line-height: 1.3;
          margin: 18px 0 8px;
        }
        .md-body h1 { font-size: 1.25em; }
        .md-body h2 { font-size: 1.15em; }
        .md-body h3 { font-size: 1.05em; }
        .md-body h4, .md-body h5, .md-body h6 { font-size: 1em; }
        .md-body strong { color: var(--text-primary); font-weight: 700; }
        .md-body em { font-style: italic; }
        .md-body ul, .md-body ol { margin: 0 0 12px; padding-left: 22px; }
        .md-body li { margin: 4px 0; }
        .md-body li > p { margin: 0; }
        .md-body a { color: var(--accent-blue); text-decoration: underline; }
        .md-body code {
          font-family: var(--font-mono);
          font-size: 0.92em;
          background: var(--bg-secondary);
          padding: 1px 5px;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
        }
        .md-body pre {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          margin: 0 0 12px;
          overflow-x: auto;
          font-size: 0.9em;
          line-height: 1.55;
        }
        .md-body pre code {
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        .md-body blockquote {
          border-left: 3px solid var(--border);
          color: var(--text-muted);
          margin: 0 0 12px;
          padding: 2px 12px;
        }
        .md-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 12px;
          font-size: 0.95em;
        }
        .md-body th, .md-body td {
          border: 1px solid var(--border);
          padding: 6px 10px;
          text-align: left;
          vertical-align: top;
        }
        .md-body th { background: var(--bg-secondary); color: var(--text-primary); font-weight: 700; }
        .md-body hr { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
      `}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}
