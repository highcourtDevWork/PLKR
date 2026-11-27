import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { LEVELS, STATUSES, type Level, type TopicStatus } from '../types'

const levelTone: Record<Level, BadgeTone> = { beginner: 'emerald', intermediate: 'amber', advanced: 'rose' }

export function LevelBadge({ level }: { level: Level | null }) {
  if (!level) return null
  return <Badge tone={levelTone[level]}>{LEVELS.find((l) => l.value === level)?.label}</Badge>
}

const statusDot: Record<TopicStatus, string> = {
  not_started: 'bg-slate-300 dark:bg-slate-600',
  in_progress: 'bg-amber-500',
  completed: 'bg-emerald-500',
}

export function StatusDot({ status }: { status: TopicStatus }) {
  const label = STATUSES.find((s) => s.value === status)?.label
  return <span className={`inline-block size-2.5 shrink-0 rounded-full ${statusDot[status]}`} title={label} aria-label={label} role="img" />
}
