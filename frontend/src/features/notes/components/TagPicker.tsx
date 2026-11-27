import { useId, useState, type KeyboardEvent } from 'react'
import { toApiError } from '@/lib/errors'
import { useCreateTag, useTags } from '../hooks/useNotes'
import type { Tag } from '../types'

interface TagPickerProps {
  value: number[]
  onChange: (ids: number[]) => void
  error?: string
}

const normalize = (s: string) => s.trim().toLowerCase()

/** Selected tags as removable chips, plus an input that suggests existing tags and creates a new one on Enter. */
export function TagPicker({ value, onChange, error }: TagPickerProps) {
  const id = useId()
  const { data: tags = [] } = useTags()
  const create = useCreateTag()
  const [query, setQuery] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const selected = value.map((tagId) => tags.find((t) => t.id === tagId)).filter((t): t is Tag => !!t)
  const q = normalize(query)
  const suggestions = q ? tags.filter((t) => !value.includes(t.id) && normalize(t.name).includes(q)).slice(0, 6) : []
  const exact = tags.find((t) => normalize(t.name) === q)

  const add = (tag: Tag) => {
    if (!value.includes(tag.id)) onChange([...value, tag.id])
    setQuery('')
    setCreateError(null)
  }

  const submit = () => {
    if (!q) return
    if (exact) return add(exact)
    create.mutate(
      { name: query.trim() },
      { onSuccess: add, onError: (e) => setCreateError(toApiError(e).errors.name?.[0] ?? toApiError(e).message) },
    )
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Backspace' && !query && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const message = createError ?? error

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        Tags
      </label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-white px-2 py-1.5 shadow-sm ring-1 ring-slate-300 ring-inset focus-within:ring-2 focus-within:ring-indigo-600 dark:bg-slate-900 dark:ring-slate-700">
        {selected.map((tag) => (
          <span key={tag.id} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pr-1 pl-2.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {tag.name}
            <button
              type="button"
              aria-label={`Remove tag ${tag.name}`}
              onClick={() => onChange(value.filter((v) => v !== tag.id))}
              className="rounded-full px-1 hover:bg-indigo-100 dark:hover:bg-indigo-900"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCreateError(null)
          }}
          onKeyDown={onKeyDown}
          disabled={create.isPending}
          placeholder={selected.length ? '' : 'Add a tag and press Enter'}
          aria-describedby={message ? `${id}-error` : undefined}
          className="min-w-32 flex-1 border-0 bg-transparent p-1 text-sm focus:ring-0 focus:outline-none"
        />
      </div>
      {(suggestions.length > 0 || (q && !exact)) && (
        <div className="flex flex-wrap gap-1.5" aria-label="Tag suggestions">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => add(tag)}
              className="rounded-full px-2.5 py-0.5 text-xs ring-1 ring-slate-300 hover:bg-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800"
            >
              {tag.name}
            </button>
          ))}
          {q && !exact && (
            <button
              type="button"
              onClick={submit}
              className="rounded-full px-2.5 py-0.5 text-xs text-indigo-700 ring-1 ring-indigo-300 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-800 dark:hover:bg-indigo-950"
            >
              + Create “{query.trim()}”
            </button>
          )}
        </div>
      )}
      {message && (
        <p id={`${id}-error`} className="text-xs text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </div>
  )
}
