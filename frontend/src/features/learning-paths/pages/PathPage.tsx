import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Badge, ProgressBar } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { LevelBadge, StatusDot } from '../components/badges'
import { ModuleFormModal, PathFormModal, TopicFormModal } from '../components/forms'
import { IconButton } from '../components/IconButton'
import {
  useDeleteModule,
  useDeletePath,
  useDeleteTopic,
  usePath,
  useReorderModules,
  useReorderTopics,
} from '../hooks/useLearningPaths'
import type { LearningPathTree, Module, Topic } from '../types'

type Dialog =
  | { kind: 'editPath' }
  | { kind: 'deletePath' }
  | { kind: 'addModule' }
  | { kind: 'editModule'; module: Module }
  | { kind: 'deleteModule'; module: Module }
  | { kind: 'addTopic'; moduleId: number; parent?: Topic }
  | { kind: 'editTopic'; moduleId: number; topic: Topic }
  | { kind: 'deleteTopic'; topic: Topic }

/** The ids of `items` with the item at `index` moved one step up (-1) or down (+1). */
function moved(items: { id: number }[], index: number, step: -1 | 1): number[] {
  const ids = items.map((i) => i.id)
  ;[ids[index], ids[index + step]] = [ids[index + step], ids[index]]
  return ids
}

const actionsClass = 'flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100'

interface TopicRowProps {
  topic: Topic
  siblings: Topic[]
  index: number
  moduleId: number
  depth: 0 | 1
  editable: boolean
  busy: boolean
  onDialog: (dialog: Dialog) => void
  onMove: (moduleId: number, ids: number[]) => void
}

function TopicRow({ topic, siblings, index, moduleId, depth, editable, busy, onDialog, onMove }: TopicRowProps) {
  return (
    <div className={`group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${depth ? 'ml-6' : ''}`}>
      <StatusDot status={topic.progress?.status ?? 'not_started'} />
      <Link to={`/topics/${topic.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-indigo-600 dark:hover:text-indigo-400">
        {topic.title}
      </Link>
      <LevelBadge level={topic.level} />
      {editable && (
        <div className={actionsClass}>
          <IconButton label="Move up" disabled={index === 0 || busy} onClick={() => onMove(moduleId, moved(siblings, index, -1))}>
            ↑
          </IconButton>
          <IconButton label="Move down" disabled={index === siblings.length - 1 || busy} onClick={() => onMove(moduleId, moved(siblings, index, 1))}>
            ↓
          </IconButton>
          {depth === 0 && (
            <IconButton label="Add subtopic" onClick={() => onDialog({ kind: 'addTopic', moduleId, parent: topic })}>
              ＋
            </IconButton>
          )}
          <IconButton label="Edit topic" onClick={() => onDialog({ kind: 'editTopic', moduleId, topic })}>
            ✎
          </IconButton>
          <IconButton label="Delete topic" onClick={() => onDialog({ kind: 'deleteTopic', topic })}>
            ✕
          </IconButton>
        </div>
      )}
    </div>
  )
}

function countTopics(path: LearningPathTree) {
  let total = 0
  let done = 0
  for (const m of path.modules)
    for (const t of m.topics)
      for (const x of [t, ...t.subtopics]) {
        total++
        if (x.progress.status === 'completed') done++
      }
  return { total, done }
}

export default function PathPage() {
  const pathId = Number(useParams().pathId)
  const navigate = useNavigate()
  const { data: path, isPending, isError, error, refetch } = usePath(pathId)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const close = () => setDialog(null)

  const deletePath = useDeletePath()
  const deleteModule = useDeleteModule()
  const deleteTopic = useDeleteTopic()
  const reorderModules = useReorderModules()
  const reorderTopics = useReorderTopics()

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
    )
  }
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />

  const editable = path.can_edit
  const { total, done } = countTopics(path)
  const busy = reorderModules.isPending || reorderTopics.isPending
  const rowProps = {
    editable,
    busy,
    onDialog: setDialog,
    onMove: (moduleId: number, ids: number[]) => reorderTopics.mutate({ moduleId, ids }),
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/paths" className="hover:text-indigo-600">
          Learning paths
        </Link>{' '}
        / <span className="text-slate-900 dark:text-slate-100">{path.title}</span>
      </nav>

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{path.title}</h1>
              <LevelBadge level={path.level} />
              {path.is_system && <Badge>Built-in · read-only</Badge>}
            </div>
            {path.description && <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">{path.description}</p>}
          </div>
          {editable && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDialog({ kind: 'editPath' })}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setDialog({ kind: 'deletePath' })}>
                Delete
              </Button>
            </div>
          )}
        </div>
        <div className="max-w-md space-y-1">
          <ProgressBar value={total ? (done / total) * 100 : 0} label="Path progress" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {done} of {total} topics completed
          </p>
        </div>
      </header>

      {path.modules.length === 0 ? (
        <EmptyState
          title="No modules yet"
          description="Split this subject into modules, then add topics to each module."
          action={editable && <Button onClick={() => setDialog({ kind: 'addModule' })}>Add the first module</Button>}
        />
      ) : (
        <ol className="space-y-4">
          {path.modules.map((module, mIndex) => (
            <li key={module.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <div className="group flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">{String(mIndex + 1).padStart(2, '0')}</span>
                <h2 className="flex-1 font-semibold">{module.title}</h2>
                {editable && (
                  <div className={actionsClass}>
                    <IconButton label="Move module up" disabled={mIndex === 0 || busy} onClick={() => reorderModules.mutate({ pathId, ids: moved(path.modules, mIndex, -1) })}>
                      ↑
                    </IconButton>
                    <IconButton
                      label="Move module down"
                      disabled={mIndex === path.modules.length - 1 || busy}
                      onClick={() => reorderModules.mutate({ pathId, ids: moved(path.modules, mIndex, 1) })}
                    >
                      ↓
                    </IconButton>
                    <IconButton label="Edit module" onClick={() => setDialog({ kind: 'editModule', module })}>
                      ✎
                    </IconButton>
                    <IconButton label="Delete module" onClick={() => setDialog({ kind: 'deleteModule', module })}>
                      ✕
                    </IconButton>
                  </div>
                )}
              </div>
              {module.description && <p className="mt-1 ml-8 text-sm text-slate-500 dark:text-slate-400">{module.description}</p>}

              <div className="mt-3 space-y-0.5">
                {module.topics.length === 0 && <p className="ml-2 text-sm text-slate-400">No topics yet.</p>}
                {module.topics.map((topic, tIndex) => (
                  <div key={topic.id}>
                    <TopicRow {...rowProps} topic={topic} siblings={module.topics} index={tIndex} moduleId={module.id} depth={0} />
                    {topic.subtopics.map((sub, sIndex) => (
                      <TopicRow {...rowProps} key={sub.id} topic={sub} siblings={topic.subtopics} index={sIndex} moduleId={module.id} depth={1} />
                    ))}
                  </div>
                ))}
              </div>

              {editable && (
                <button
                  type="button"
                  className="mt-2 ml-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  onClick={() => setDialog({ kind: 'addTopic', moduleId: module.id })}
                >
                  + Add topic
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {editable && path.modules.length > 0 && (
        <Button variant="secondary" onClick={() => setDialog({ kind: 'addModule' })}>
          + Add module
        </Button>
      )}

      {dialog?.kind === 'editPath' && <PathFormModal path={path} onClose={close} />}
      {dialog?.kind === 'addModule' && <ModuleFormModal pathId={pathId} onClose={close} />}
      {dialog?.kind === 'editModule' && <ModuleFormModal pathId={pathId} module={dialog.module} onClose={close} />}
      {dialog?.kind === 'addTopic' && <TopicFormModal moduleId={dialog.moduleId} parent={dialog.parent} onClose={close} />}
      {dialog?.kind === 'editTopic' && <TopicFormModal moduleId={dialog.moduleId} topic={dialog.topic} onClose={close} />}

      <ConfirmDialog
        open={dialog?.kind === 'deletePath'}
        title="Delete learning path?"
        message={`“${path.title}” and all of its modules, topics and resources will be deleted.`}
        loading={deletePath.isPending}
        onClose={close}
        onConfirm={() => deletePath.mutate(pathId, { onSuccess: () => navigate('/paths', { replace: true }) })}
      />
      <ConfirmDialog
        open={dialog?.kind === 'deleteModule'}
        title="Delete module?"
        message={dialog?.kind === 'deleteModule' && `“${dialog.module.title}” and all of its topics will be deleted.`}
        loading={deleteModule.isPending}
        onClose={close}
        onConfirm={() => dialog?.kind === 'deleteModule' && deleteModule.mutate(dialog.module.id, { onSuccess: close })}
      />
      <ConfirmDialog
        open={dialog?.kind === 'deleteTopic'}
        title="Delete topic?"
        message={dialog?.kind === 'deleteTopic' && `“${dialog.topic.title}”, its subtopics and your resources on it will be deleted.`}
        loading={deleteTopic.isPending}
        onClose={close}
        onConfirm={() => dialog?.kind === 'deleteTopic' && deleteTopic.mutate(dialog.topic.id, { onSuccess: close })}
      />
    </div>
  )
}
