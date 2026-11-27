import { useId, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { plainExcerpt } from '@/features/notes/excerpt'
import { kindLabel } from '@/features/notes/types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSearch } from '../hooks/useSearch'

interface Hit {
  key: string
  to: string
  group: 'Notes' | 'Topics'
  title: string
  detail: string
}

/** Global search: a combobox over grouped results, navigable with the arrow keys and Enter. */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const listId = useId()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const q = useDebouncedValue(text.trim(), 200)
  const { data, isFetching, isError } = useSearch(q)

  const hits: Hit[] = q && data
    ? [
        ...data.notes.map((n) => ({
          key: `note-${n.id}`,
          to: `/notes/${n.id}`,
          group: 'Notes' as const,
          title: n.title,
          detail: [kindLabel(n.kind), plainExcerpt(n.excerpt)].filter(Boolean).join(' · '),
        })),
        ...data.topics.map((t) => ({
          key: `topic-${t.id}`,
          to: `/topics/${t.id}`,
          group: 'Topics' as const,
          title: t.title,
          detail: t.learning_path.title,
        })),
      ]
    : []

  const open = (hit: Hit | undefined) => {
    if (!hit) return
    onClose()
    navigate(hit.to)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      open(hits[active])
    }
  }

  return (
    <Modal open title="Search" onClose={onClose}>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-label="Search notes and topics"
          aria-expanded={hits.length > 0}
          aria-controls={listId}
          aria-activedescendant={hits[active] ? `${listId}-${hits[active].key}` : undefined}
          aria-autocomplete="list"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search notes and topics…"
          className="block w-full rounded-md border-0 bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-slate-300 ring-inset focus:ring-2 focus:ring-indigo-600 dark:bg-slate-900 dark:ring-slate-700"
        />
        {isFetching && (
          <span className="absolute top-2.5 right-3">
            <Spinner />
          </span>
        )}
      </div>

      <div className="mt-4 max-h-96 overflow-y-auto">
        {!q ? (
          <p className="py-6 text-center text-sm text-slate-500">Type to search your notes and the topics of your paths.</p>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-red-600" role="alert">
            Search failed. Try again.
          </p>
        ) : data && hits.length === 0 && !isFetching ? (
          <p className="py-6 text-center text-sm text-slate-500">No results for “{q}”.</p>
        ) : (
          <ul id={listId} role="listbox" aria-label="Results" className="space-y-1">
            {hits.map((hit, i) => (
              <li key={hit.key} role="presentation">
                {(i === 0 || hits[i - 1].group !== hit.group) && (
                  <p className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase" aria-hidden="true">
                    {hit.group}
                  </p>
                )}
                <div
                  id={`${listId}-${hit.key}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => open(hit)}
                  className={`cursor-pointer rounded-md px-3 py-2 ${i === active ? 'bg-indigo-50 dark:bg-indigo-950' : ''}`}
                >
                  <p className="text-sm font-medium">{hit.title}</p>
                  {hit.detail && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{hit.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
