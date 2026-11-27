import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { NoteList } from '@/features/notes/components/NoteList'
import { useNotes } from '@/features/notes/hooks/useNotes'
import { LevelBadge, StatusDot } from '../components/badges'
import { ResourceFormModal, TopicFormModal } from '../components/forms'
import { IconButton } from '../components/IconButton'
import { useDeleteResource, useResources, useSetTopicStatus, useTopic } from '../hooks/useLearningPaths'
import { RESOURCE_TYPES, STATUSES, type LearningResource, type TopicDetail } from '../types'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'notes', label: 'Notes' },
  { key: 'resources', label: 'Resources' },
  { key: 'flashcards', label: 'Flashcards', soon: true },
  { key: 'questions', label: 'Questions', soon: true },
] as const

function StatusControl({ topic }: { topic: TopicDetail }) {
  const setStatus = useSetTopicStatus()
  return (
    <div className="inline-flex rounded-md shadow-sm ring-1 ring-slate-300 dark:ring-slate-700" role="radiogroup" aria-label="Your status">
      {STATUSES.map((s, i) => {
        const active = topic.progress.status === s.value
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={setStatus.isPending}
            onClick={() => !active && setStatus.mutate({ id: topic.id, status: s.value })}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${i > 0 ? 'border-l border-slate-300 dark:border-slate-700' : ''} ${
              active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
            } ${i === 0 ? 'rounded-l-md' : ''} ${i === STATUSES.length - 1 ? 'rounded-r-md' : ''}`}
          >
            {!active && (
              <span aria-hidden="true">
                <StatusDot status={s.value} />
              </span>
            )}
            {s.label}
          </button>
        )
      })}
    </div>
  )
}

function Overview({ topic, onEdit }: { topic: TopicDetail; onEdit: () => void }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-semibold">Summary</h2>
          {topic.can_edit && (
            <Button variant="ghost" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
        {topic.summary ? (
          <p className="mt-2 text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">{topic.summary}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No summary yet.</p>
        )}
        {topic.estimated_minutes && <p className="mt-3 text-xs text-slate-500">Estimated time: {topic.estimated_minutes} min</p>}
      </section>

      {topic.subtopics.length > 0 && (
        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="font-semibold">Subtopics</h2>
          <ul className="mt-3 space-y-1">
            {topic.subtopics.map((sub) => (
              <li key={sub.id} className="flex items-center gap-3">
                <StatusDot status={sub.progress?.status ?? 'not_started'} />
                <Link to={`/topics/${sub.id}`} className="text-sm hover:text-indigo-600 dark:hover:text-indigo-400">
                  {sub.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** The user's own notes on this topic (newest first, one page). */
function Notes({ topicId }: { topicId: number }) {
  const navigate = useNavigate()
  const { data, isPending, isError, error, refetch } = useNotes({ topic_id: topicId })
  const newNote = () => navigate(`/notes/new?topic_id=${topicId}`)

  if (isPending) return <div className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" aria-busy="true" />
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />

  if (data.data.length === 0) {
    return (
      <EmptyState
        title="No notes on this topic yet"
        description="Explain it in your own words, save examples and the mistakes you made. Only you can see your notes."
        action={<Button onClick={newNote}>Write a note</Button>}
      />
    )
  }

  return (
    <div className="space-y-4">
      <NoteList notes={data.data} showTopic={false} />
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" onClick={newNote}>
          + New note
        </Button>
        {data.meta.total > data.data.length && (
          <span className="text-sm text-slate-500">
            Showing the {data.data.length} most recent of {data.meta.total} notes.
          </span>
        )}
      </div>
    </div>
  )
}

function Resources({ topicId }: { topicId: number }) {
  const { data: resources, isPending, isError, error, refetch } = useResources(topicId)
  const remove = useDeleteResource()
  const [editing, setEditing] = useState<LearningResource | 'new' | null>(null)
  const [deleting, setDeleting] = useState<LearningResource | null>(null)

  if (isPending) return <div className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" aria-busy="true" />
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />

  return (
    <div className="space-y-4">
      {resources.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="Save the articles, videos and docs you learn this topic from. Only you can see them."
          action={<Button onClick={() => setEditing('new')}>Add a resource</Button>}
        />
      ) : (
        <>
          <ul className="divide-y divide-slate-200 rounded-lg bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-800">
            {resources.map((r) => (
              <li key={r.id} className="group flex items-start gap-3 p-4">
                <Badge tone="indigo">{RESOURCE_TYPES.find((t) => t.value === r.type)?.label}</Badge>
                <div className="min-w-0 flex-1">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400">
                    {r.title} <span aria-hidden="true">↗</span>
                  </a>
                  <p className="truncate text-xs text-slate-500">{r.url}</p>
                  {r.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.description}</p>}
                </div>
                <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                  <IconButton label="Edit resource" onClick={() => setEditing(r)}>
                    ✎
                  </IconButton>
                  <IconButton label="Delete resource" onClick={() => setDeleting(r)}>
                    ✕
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="secondary" onClick={() => setEditing('new')}>
            + Add resource
          </Button>
        </>
      )}

      {editing && <ResourceFormModal topicId={topicId} resource={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        title="Delete resource?"
        message={deleting && `“${deleting.title}” will be removed from this topic.`}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}

export default function TopicPage() {
  const topicId = Number(useParams().topicId)
  const { data: topic, isPending, isError, error, refetch } = useTopic(topicId)
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab = tabParam === 'resources' || tabParam === 'notes' ? tabParam : 'overview'
  const [editing, setEditing] = useState(false)

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
    )
  }
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />

  const { breadcrumb } = topic

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/paths" className="hover:text-indigo-600">
          Learning paths
        </Link>
        <span>/</span>
        <Link to={`/paths/${breadcrumb.learning_path.id}`} className="hover:text-indigo-600">
          {breadcrumb.learning_path.title}
        </Link>
        <span>/</span>
        <span>{breadcrumb.module.title}</span>
        {breadcrumb.parent && (
          <>
            <span>/</span>
            <Link to={`/topics/${breadcrumb.parent.id}`} className="hover:text-indigo-600">
              {breadcrumb.parent.title}
            </Link>
          </>
        )}
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{topic.title}</h1>
          <LevelBadge level={topic.level} />
          {topic.is_system && <Badge>Built-in</Badge>}
        </div>
        <StatusControl topic={topic} />
      </header>

      <div className="border-b border-slate-200 dark:border-slate-800" role="tablist" aria-label="Topic sections">
        <div className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key
            const soon = 'soon' in t && t.soon
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={soon}
                onClick={() => setParams(t.key === 'overview' ? {} : { tab: t.key }, { replace: true })}
                className={`border-b-2 pb-3 text-sm font-medium whitespace-nowrap ${
                  active
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-slate-500 dark:hover:text-slate-100'
                }`}
                title={soon ? 'Coming soon' : undefined}
              >
                {t.label}
                {t.key === 'resources' && topic.resources_count > 0 && <span className="ml-1.5 text-xs text-slate-400">{topic.resources_count}</span>}
                {t.key === 'notes' && topic.notes_count > 0 && <span className="ml-1.5 text-xs text-slate-400">{topic.notes_count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div role="tabpanel">
        {tab === 'resources' ? (
          <Resources topicId={topic.id} />
        ) : tab === 'notes' ? (
          <Notes topicId={topic.id} />
        ) : (
          <Overview topic={topic} onEdit={() => setEditing(true)} />
        )}
      </div>

      {editing && <TopicFormModal moduleId={topic.module_id} topic={topic} onClose={() => setEditing(false)} />}
    </div>
  )
}
