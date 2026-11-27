import { Link } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { plainExcerpt } from '../excerpt'
import { kindLabel, type NoteListItem } from '../types'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

/** Note rows for the knowledge base and the topic Notes tab. */
export function NoteList({ notes, showTopic = true }: { notes: NoteListItem[]; showTopic?: boolean }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-lg bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-800">
      {notes.map((note) => {
        const excerpt = plainExcerpt(note.excerpt)
        return (
          <li key={note.id}>
            <Link to={`/notes/${note.id}`} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex flex-wrap items-center gap-2">
                {note.is_pinned && (
                  <span className="text-amber-500" title="Pinned" aria-label="Pinned">
                    ★
                  </span>
                )}
                <h3 className="font-medium">{note.title}</h3>
                <Badge tone="indigo">{kindLabel(note.kind)}</Badge>
                {note.source === 'ai' && <Badge tone="amber">AI</Badge>}
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">{dateFormat.format(new Date(note.updated_at))}</span>
              </div>
              {excerpt && <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{excerpt}</p>}
              {((showTopic && note.topic) || note.tags.length > 0) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {showTopic && note.topic && <span>▤ {note.topic.title}</span>}
                  {note.tags.map((t) => (
                    <span key={t.id} className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
