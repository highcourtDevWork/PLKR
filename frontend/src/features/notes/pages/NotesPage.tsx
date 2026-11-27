import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { NoteList } from '../components/NoteList'
import { useNotes, useTags } from '../hooks/useNotes'
import { NOTE_KINDS, type NoteFilters, type NoteKind } from '../types'

const selectClass = 'rounded-md border-0 bg-white py-2 text-sm ring-1 ring-slate-300 ring-inset dark:bg-slate-900 dark:ring-slate-700'

/** Knowledge base: every note, searchable and filterable. Filters live in the URL so they survive reloads and links. */
export default function NotesPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const q = useDebouncedValue(search.trim())
  const { data: tags = [] } = useTags()
  const navigate = useNavigate()

  const filters: NoteFilters = {
    q: params.get('q') || undefined,
    kind: (params.get('kind') as NoteKind | null) || undefined,
    tag_id: Number(params.get('tag')) || undefined,
    page: Number(params.get('page')) || undefined,
  }
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useNotes(filters)

  const update = (changes: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        if (!('page' in changes)) next.delete('page') // a new filter starts from the first page
        return next
      },
      { replace: true },
    )

  // Push the debounced search text into the URL. The equality check stops the loop once the URL has caught up.
  const urlQ = params.get('q') ?? ''
  useEffect(() => {
    if (q === urlQ) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (q) next.set('q', q)
        else next.delete('q')
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }, [q, urlQ, setParams])

  const filtered = !!(filters.q || filters.kind || filters.tag_id)
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your knowledge base, in your own words.</p>
        </div>
        <Button onClick={() => navigate('/notes/new')}>+ New note</Button>
      </header>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search titles and text…"
          aria-label="Search notes"
          className={`${selectClass} min-w-56 flex-1 px-3`}
        />
        <select aria-label="Kind" value={filters.kind ?? ''} onChange={(e) => update({ kind: e.target.value || undefined })} className={selectClass}>
          <option value="">All kinds</option>
          {NOTE_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <select aria-label="Tag" value={filters.tag_id ?? ''} onChange={(e) => update({ tag: e.target.value || undefined })} className={selectClass}>
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.name} ({t.notes_count ?? 0})
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        filtered ? (
          <EmptyState title="No matching notes" description="Try other words or clear the filters." />
        ) : (
          <EmptyState
            title="No notes yet"
            description="Write explanations, examples, snippets and mistakes in your own words."
            action={<Button onClick={() => navigate('/notes/new')}>Write your first note</Button>}
          />
        )
      ) : (
        <div className={`space-y-4 ${isPlaceholderData ? 'opacity-60' : ''}`}>
          <NoteList notes={data.data} />
          {meta && meta.last_page > 1 && (
            <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
              <Button variant="secondary" disabled={meta.current_page <= 1} onClick={() => update({ page: String(meta.current_page - 1) })}>
                ← Previous
              </Button>
              <span className="text-slate-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} notes
              </span>
              <Button variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => update({ page: String(meta.current_page + 1) })}>
                Next →
              </Button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
