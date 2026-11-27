/** GET /search (docs/api/notes.md#search). Questions join in Phase 3. */
import type { NoteKind } from '@/features/notes/types'

export interface SearchResults {
  notes: { id: number; title: string; kind: NoteKind; excerpt: string; topic_id: number | null }[]
  topics: { id: number; title: string; learning_path: { id: number; title: string } }[]
}
