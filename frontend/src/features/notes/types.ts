/** Mirrors app/Http/Resources/V1/Notes (docs/api/notes.md). */

export type NoteKind = 'general' | 'explanation' | 'example' | 'snippet' | 'mistake' | 'feynman' | 'summary'
export type ContentSource = 'manual' | 'ai'

export interface Tag {
  id: number
  name: string
  slug: string
  /** GET /tags only. */
  notes_count?: number
}

interface NoteBase {
  id: number
  title: string
  kind: NoteKind
  is_pinned: boolean
  source: ContentSource
  topic_id: number | null
  /** null when unfiled or when the topic was deleted. */
  topic: { id: number; title: string } | null
  tags: Tag[]
  created_at: string
  updated_at: string
}

/** GET /notes: the first 300 characters of the Markdown instead of the body. */
export interface NoteListItem extends NoteBase {
  excerpt: string
}

export interface Note extends NoteBase {
  body: string
}

export interface NoteFilters {
  topic_id?: number
  kind?: NoteKind
  tag_id?: number
  q?: string
  page?: number
}

export const NOTE_KINDS: { value: NoteKind; label: string; hint: string }[] = [
  { value: 'general', label: 'Note', hint: 'Anything worth keeping' },
  { value: 'explanation', label: 'Explanation', hint: 'How it works, in your words' },
  { value: 'example', label: 'Example', hint: 'A practical, real-world use' },
  { value: 'snippet', label: 'Snippet', hint: 'Code to reuse' },
  { value: 'mistake', label: 'Mistake', hint: 'What went wrong and the fix' },
  { value: 'feynman', label: 'Feynman', hint: 'Explain it as if to a beginner' },
  { value: 'summary', label: 'Summary', hint: 'The key points' },
]

export const kindLabel = (kind: NoteKind) => NOTE_KINDS.find((k) => k.value === kind)?.label ?? kind
