import { useNavigate } from 'react-router'
import { useLogout, useMe } from '@/features/auth/hooks/useAuth'
import { useUiStore } from '@/stores/ui'
import { Button } from '../ui/Button'
import { ThemeToggle } from './ThemeToggle'

export function Topbar() {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen)
  const { data: user } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      <button
        type="button"
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        ☰
      </button>
      <div className="flex-1" />
      <ThemeToggle />
      {user && <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">{user.name}</span>}
      <Button variant="ghost" loading={logout.isPending} onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}>
        Log out
      </Button>
    </header>
  )
}
