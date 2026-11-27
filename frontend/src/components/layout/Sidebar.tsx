import { NavLink } from 'react-router'
import { useUiStore } from '@/stores/ui'

interface NavItem {
  label: string
  to?: string // undefined = module not built yet
  icon: string
}

const main: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: '▣' },
  { label: 'Review', icon: '◷' },
  { label: 'Learning paths', icon: '▤' },
  { label: 'Notes', icon: '✎' },
  { label: 'Questions', icon: '?' },
  { label: 'Quizzes', icon: '✓' },
  { label: 'Interviews', icon: '☺' },
  { label: 'English', icon: 'Aa' },
  { label: 'Assistant', icon: '✦' },
  { label: 'Analytics', icon: '▥' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

function Item({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const icon = <span className="w-5 text-center" aria-hidden="true">{item.icon}</span>
  if (!item.to) {
    return (
      <span className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 dark:text-slate-600" title="Coming soon">
        {icon}
        {item.label}
        <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
      </span>
    )
  }
  return (
    <NavLink to={item.to} end className={linkClass} onClick={onNavigate}>
      {icon}
      {item.label}
    </NavLink>
  )
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const close = () => setSidebarOpen(false)

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={close} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center px-5 text-lg font-bold tracking-tight">
          Learn<span className="text-indigo-600">OS</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Main navigation">
          {main.map((item) => (
            <Item key={item.label} item={item} onNavigate={close} />
          ))}
        </nav>
        <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
          <Item item={{ label: 'Settings', to: '/settings', icon: '⚙' }} onNavigate={close} />
        </div>
      </aside>
    </>
  )
}
