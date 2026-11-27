import { useId, useState } from 'react'
import { usePath, usePaths } from '@/features/learning-paths/hooks/useLearningPaths'

export interface PickedTopic {
  id: number
  title: string
}

interface TopicPickerProps {
  value: PickedTopic | null
  onChange: (topic: PickedTopic | null) => void
  error?: string
}

const selectClass = 'rounded-md border-0 bg-white py-1.5 text-sm ring-1 ring-slate-300 ring-inset disabled:opacity-50 dark:bg-slate-900 dark:ring-slate-700'

/** Path → topic selects (own and built-in paths). Mounted only while choosing, so paths load on demand. */
function ChooseTopic({ onPick, onCancel }: { onPick: (topic: PickedTopic) => void; onCancel: () => void }) {
  const pathSelectId = useId()
  const topicSelectId = useId()
  const [pathId, setPathId] = useState(0)
  const { data: paths = [], isPending: pathsPending } = usePaths()
  const { data: tree, isFetching: treeFetching } = usePath(pathId, pathId > 0)

  const groups = tree?.modules.map((m) => ({
    module: m.title,
    topics: m.topics.flatMap((t) => [{ id: t.id, title: t.title, depth: 0 }, ...t.subtopics.map((s) => ({ id: s.id, title: s.title, depth: 1 }))]),
  }))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={pathSelectId} className="sr-only">
        Learning path
      </label>
      <select id={pathSelectId} value={pathId} onChange={(e) => setPathId(Number(e.target.value))} disabled={pathsPending} className={selectClass}>
        <option value={0}>Choose a learning path…</option>
        {paths.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <label htmlFor={topicSelectId} className="sr-only">
        Topic
      </label>
      <select
        id={topicSelectId}
        value=""
        disabled={!groups || treeFetching}
        onChange={(e) => {
          const topic = groups?.flatMap((g) => g.topics).find((t) => t.id === Number(e.target.value))
          if (topic) onPick({ id: topic.id, title: topic.title })
        }}
        className={selectClass}
      >
        <option value="">{treeFetching ? 'Loading topics…' : 'Choose a topic…'}</option>
        {groups?.map((g) => (
          <optgroup key={g.module} label={g.module}>
            {g.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.depth ? `— ${t.title}` : t.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:underline">
        Cancel
      </button>
    </div>
  )
}

/** Files a note under a topic: shows the current one, with Change and Remove. */
export function TopicPicker({ value, onChange, error }: TopicPickerProps) {
  const [choosing, setChoosing] = useState(false)

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium">Topic</span>
      {choosing ? (
        <ChooseTopic
          onCancel={() => setChoosing(false)}
          onPick={(topic) => {
            onChange(topic)
            setChoosing(false)
          }}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {value ? (
            <span className="rounded-md bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{value.title}</span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">Unfiled</span>
          )}
          <button type="button" onClick={() => setChoosing(true)} className="text-indigo-600 hover:underline dark:text-indigo-400">
            {value ? 'Change' : 'Choose a topic'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="text-slate-500 hover:underline">
              Remove
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
