import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { User } from '@/features/auth/types'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui/fields'
import { Alert } from '@/components/ui/states'
import { applyServerErrors } from '@/lib/errors'
import { useUpdateSettings } from '../hooks/useSettings'
import { studySettingsSchema, type StudySettingsInput } from '../schemas'

export function StudySettingsForm({ user }: { user: User }) {
  const update = useUpdateSettings()
  const [formError, setFormError] = useState<string | null>(null)
  const timezones = useMemo(() => Intl.supportedValuesOf('timeZone'), [])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful, isDirty },
    reset,
  } = useForm<StudySettingsInput>({
    resolver: zodResolver(studySettingsSchema),
    defaultValues: {
      timezone: user.timezone,
      desired_retention: user.desired_retention,
      daily_new_limit: user.daily_new_limit,
      daily_review_limit: user.daily_review_limit,
      ai_use_notes_context: user.ai_use_notes_context,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const saved = await update.mutateAsync(values)
      reset({ ...values, ...saved })
    } catch (error) {
      setFormError(applyServerErrors(error, setError))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      {formError && (
        <div className="sm:col-span-2">
          <Alert>{formError}</Alert>
        </div>
      )}
      <SelectField label="Timezone" hint="Defines your study day for streaks and goals." error={errors.timezone?.message} {...register('timezone')}>
        {!timezones.includes(user.timezone) && <option value={user.timezone}>{user.timezone}</option>}
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Target retention"
        type="number"
        step="0.01"
        min={0.7}
        max={0.97}
        hint="Higher means more frequent reviews (0.70–0.97)."
        error={errors.desired_retention?.message}
        {...register('desired_retention', { valueAsNumber: true })}
      />
      <TextField
        label="New items per day"
        type="number"
        min={0}
        error={errors.daily_new_limit?.message}
        {...register('daily_new_limit', { valueAsNumber: true })}
      />
      <TextField
        label="Max reviews per day"
        type="number"
        min={0}
        error={errors.daily_review_limit?.message}
        {...register('daily_review_limit', { valueAsNumber: true })}
      />
      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input type="checkbox" className="mt-0.5 rounded" {...register('ai_use_notes_context')} />
        <span>
          <span className="font-medium">Let the AI assistant read my notes</span>
          <span className="block text-slate-500 dark:text-slate-400">
            Relevant notes are sent to the AI provider as context when you ask questions.
          </span>
        </span>
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save settings
        </Button>
        {isSubmitSuccessful && !isDirty && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
    </form>
  )
}
