import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/fields'
import { Alert } from '@/components/ui/states'
import { applyServerErrors } from '@/lib/errors'
import { useResetPassword } from '../hooks/useAuth'
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas'

/** Opened from the emailed link: /reset-password?token=…&email=… */
export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const reset = useResetPassword()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: params.get('token') ?? '', email: params.get('email') ?? '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await reset.mutateAsync(values)
    } catch (error) {
      setFormError(applyServerErrors(error, setError))
    }
  })

  if (reset.isSuccess) {
    return (
      <div className="space-y-5">
        <Alert tone="success">Your password has been reset.</Alert>
        <Link to="/login" className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      {(formError || errors.token) && <Alert>{formError ?? 'This reset link is invalid. Request a new one.'}</Alert>}
      <input type="hidden" {...register('token')} />
      <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Reset password
      </Button>
    </form>
  )
}
