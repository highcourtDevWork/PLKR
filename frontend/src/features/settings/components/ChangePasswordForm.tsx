import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/fields'
import { Alert } from '@/components/ui/states'
import { applyServerErrors } from '@/lib/errors'
import { useChangePassword } from '../hooks/useSettings'
import { changePasswordSchema, type ChangePasswordInput } from '../schemas'

export function ChangePasswordForm() {
  const change = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSaved(false)
    try {
      await change.mutateAsync(values)
      reset()
      setSaved(true)
    } catch (error) {
      setFormError(applyServerErrors(error, setError))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-sm space-y-5">
      {formError && <Alert>{formError}</Alert>}
      {saved && <Alert tone="success">Password updated.</Alert>}
      <TextField
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.current_password?.message}
        {...register('current_password')}
      />
      <TextField label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />
      <Button type="submit" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  )
}
