import { EmptyState } from '@/components/ui/states'
import { useMe } from '@/features/auth/hooks/useAuth'

export default function DashboardPage() {
  const { data: user } = useMe()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome{user ? `, ${user.name}` : ''}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your reviews, goals and progress will appear here.</p>
      </header>
      <EmptyState
        title="Nothing to review yet"
        description="Once you create learning paths and flashcards, your daily review queue and progress will show up here."
      />
    </div>
  )
}
