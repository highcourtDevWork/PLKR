import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

const components: Components = {
  // External links open in a new tab without giving the target page access to this one.
  a: ({ node: _node, href, ...props }) =>
    href?.startsWith('http') ? <a href={href} target="_blank" rel="noopener noreferrer" {...props} /> : <a href={href} {...props} />,
}

/**
 * Renders a note's Markdown safely. Raw HTML in the source is never rendered (react-markdown escapes it),
 * and rehype-sanitize strips anything unsafe (javascript: URLs, event handlers) before highlighting
 * adds its own classes.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown prose prose-slate max-w-none dark:prose-invert prose-pre:bg-slate-900 prose-pre:ring-1 prose-pre:ring-slate-800 prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize, rehypeHighlight]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
