import { Card } from '@/components/ui/states'
import { useMe } from '@/features/auth/hooks/useAuth'
import { useThemeStore, type Theme } from '@/stores/theme'
import { ChangePasswordForm } from '../components/ChangePasswordForm'
import { DeleteAccountForm } from '../components/DeleteAccountForm'
import { StudySettingsForm } from '../components/StudySettingsForm'

const themes: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export default function SettingsPage() {
  const { data: user } = useMe()
  const { theme, setTheme } = useThemeStore()

  // ProtectedRoute guarantees a user; this only narrows the type.
  if (!user) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card title="Study" description="How your reviews are scheduled and how your day is counted.">
        <StudySettingsForm user={user} />
      </Card>

      <Card title="Appearance">
        <div className="flex gap-2" role="radiogroup" aria-label="Theme">
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={theme === t.value}
              onClick={() => setTheme(t.value)}
              className={`rounded-md px-4 py-2 text-sm font-medium ring-1 ${
                theme === t.value
                  ? 'bg-indigo-600 text-white ring-indigo-600'
                  : 'ring-slate-300 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Password">
        <ChangePasswordForm />
      </Card>

      <Card title="Delete account" description={`Signed in as ${user.email}.`}>
        <DeleteAccountForm />
      </Card>
    </div>
  )
}
