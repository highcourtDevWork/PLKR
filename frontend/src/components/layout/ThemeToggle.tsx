import { useThemeStore, type Theme } from '@/stores/theme'

const next: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
const icons: Record<Theme, string> = { light: '☀', dark: '☾', system: '◐' }

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  return (
    <button
      type="button"
      onClick={() => setTheme(next[theme])}
      className="rounded-md p-2 text-lg leading-none text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      title={`Theme: ${theme} (click to change)`}
      aria-label={`Theme: ${theme}. Switch to ${next[theme]}`}
    >
      <span aria-hidden="true">{icons[theme]}</span>
    </button>
  )
}
