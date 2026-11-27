import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Markdown } from './Markdown'

type Mode = 'write' | 'split' | 'preview'

interface MarkdownEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}

interface Edit {
  text: string
  selectionStart: number
  selectionEnd: number
}

/** Wraps the selection (or a placeholder) in `before`/`after` and keeps the inner text selected. */
function wrap(text: string, start: number, end: number, before: string, after: string, placeholder: string): Edit {
  const inner = text.slice(start, end) || placeholder
  return {
    text: text.slice(0, start) + before + inner + after + text.slice(end),
    selectionStart: start + before.length,
    selectionEnd: start + before.length + inner.length,
  }
}

/** Prefixes every line touched by the selection (lists, quotes, headings). `numbered` counts 1., 2., … */
function prefixLines(text: string, start: number, end: number, prefix: string, numbered = false): Edit {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const lines = text.slice(lineStart, end).split('\n')
  const replaced = lines.map((line, i) => (numbered ? `${i + 1}. ` : prefix) + line).join('\n')
  return {
    text: text.slice(0, lineStart) + replaced + text.slice(end),
    selectionStart: lineStart,
    selectionEnd: lineStart + replaced.length,
  }
}

const ACTIONS: { label: string; glyph: string; shortcut?: string; apply: (t: string, s: number, e: number) => Edit }[] = [
  { label: 'Bold', glyph: 'B', shortcut: 'b', apply: (t, s, e) => wrap(t, s, e, '**', '**', 'bold text') },
  { label: 'Italic', glyph: 'I', shortcut: 'i', apply: (t, s, e) => wrap(t, s, e, '_', '_', 'italic text') },
  { label: 'Heading', glyph: 'H', apply: (t, s, e) => prefixLines(t, s, e, '## ') },
  { label: 'Inline code', glyph: '<>', apply: (t, s, e) => wrap(t, s, e, '`', '`', 'code') },
  { label: 'Code block', glyph: '{ }', apply: (t, s, e) => wrap(t, s, e, '\n```\n', '\n```\n', 'code') },
  { label: 'Link', glyph: '🔗', apply: (t, s, e) => wrap(t, s, e, '[', '](https://)', 'link text') },
  { label: 'Bulleted list', glyph: '•', apply: (t, s, e) => prefixLines(t, s, e, '- ') },
  { label: 'Numbered list', glyph: '1.', apply: (t, s, e) => prefixLines(t, s, e, '', true) },
  { label: 'Quote', glyph: '❝', apply: (t, s, e) => prefixLines(t, s, e, '> ') },
]

/** Markdown textarea with a formatting toolbar and a live, sanitized preview. Markdown stays the stored format. */
export function MarkdownEditor({ label, value, onChange, error }: MarkdownEditorProps) {
  const id = useId()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<Mode>('split')

  const apply = (action: (typeof ACTIONS)[number]) => {
    const el = textarea.current
    if (!el) return
    const edit = action.apply(el.value, el.selectionStart, el.selectionEnd)
    onChange(edit.text)
    // Restore focus and selection once React has written the new value.
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(edit.selectionStart, edit.selectionEnd)
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return
    const action = ACTIONS.find((a) => a.shortcut === e.key.toLowerCase())
    if (action) {
      e.preventDefault()
      apply(action)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="inline-flex rounded-md ring-1 ring-slate-300 dark:ring-slate-700" role="group" aria-label="Editor layout">
          {(['write', 'split', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-xs font-medium capitalize first:rounded-l-md last:rounded-r-md ${
                mode === m ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-4 ${mode === 'split' ? 'lg:grid-cols-2' : ''}`}>
        <div className={mode === 'preview' ? 'hidden' : ''}>
          <div
            className="flex flex-wrap gap-0.5 rounded-t-md border border-b-0 border-slate-300 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50"
            role="toolbar"
            aria-label="Formatting"
            aria-controls={id}
          >
            {ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                title={a.shortcut ? `${a.label} (Ctrl+${a.shortcut.toUpperCase()})` : a.label}
                aria-label={a.label}
                onClick={() => apply(a)}
                className="min-w-8 rounded px-2 py-1 font-mono text-xs text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                {a.glyph}
              </button>
            ))}
          </div>
          <textarea
            id={id}
            ref={textarea}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={20}
            spellCheck
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            placeholder={'Write in Markdown…\n\n## A heading\n- a list item\n\n```php\n$code = true;\n```'}
            className="block min-h-80 w-full resize-y rounded-b-md border-0 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 aria-invalid:ring-red-500 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
          />
        </div>

        {mode !== 'write' && (
          <section
            aria-label="Preview"
            className="min-h-80 overflow-auto rounded-md bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-slate-400">Nothing to preview yet.</p>}
          </section>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
