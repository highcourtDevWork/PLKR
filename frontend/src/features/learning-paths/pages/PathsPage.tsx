import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Badge, ProgressBar } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState, EmptyState } from '@/components/ui/states'
import { LevelBadge } from '../components/badges'
import { PathFormModal } from '../components/forms'
import { usePaths } from '../hooks/useLearningPaths'
import type { LearningPath } from '../types'

function PathCard({ path }: { path: LearningPath }) {
  const total = path.topics_count ?? 0
  const done = path.completed_topics_count ?? 0
  return (
    <Link
      to={`/paths/${path.id}`}
      className="group flex flex-col rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-400 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-indigo-600"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{path.title}</h3>
        <LevelBadge level={path.level} />
      </div>
      {path.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{path.description}</p>}
      <div className="mt-auto space-y-2 pt-5">
        <ProgressBar value={total ? (done / total) * 100 : 0} label={`${path.title} progress`} />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {path.modules_count ?? 0} {path.modules_count === 1 ? 'module' : 'modules'} · {done}/{total} topics completed
        </p>
      </div>
    </Link>
  )
}

function CardSkeleton() {
  return <div className="h-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
}

export default function PathsPage() {
  const { data: paths, isPending, isError, error, refetch } = usePaths()
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const own = paths?.filter((p) => !p.is_system) ?? []
  const system = paths?.filter((p) => p.is_system) ?? []

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Learning paths</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Subjects broken into modules and topics.</p>
        </div>
        <Button onClick={() => setCreating(true)}>+ New path</Button>
      </header>

      {isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}

      {paths && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">My paths</h2>
            {own.length === 0 ? (
              <EmptyState
                title="No learning paths yet"
                description="Create a path for any subject you want to learn, or start from a built-in one below."
                action={<Button onClick={() => setCreating(true)}>Create your first path</Button>}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {own.map((p) => (
                  <PathCard key={p.id} path={p} />
                ))}
              </div>
            )}
          </section>

          {system.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Built-in paths <Badge>read-only</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {system.map((p) => (
                  <PathCard key={p.id} path={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {creating && <PathFormModal onClose={() => setCreating(false)} onSaved={(p) => navigate(`/paths/${p.id}`)} />}
    </div>
  )
}
