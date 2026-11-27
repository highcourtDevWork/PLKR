import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/fields'
import { Alert } from '@/components/ui/states'
import { applyServerErrors } from '@/lib/errors'
import { useForgotPassword } from '../hooks/useAuth'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas'

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await forgot.mutateAsync(values)
    } catch (error) {
      setFormError(applyServerErrors(error, setError))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <h1 className="text-xl font-semibold">Reset your password</h1>
      {forgot.isSuccess ? (
        <Alert tone="success">If that email has an account, a reset link is on its way.</Alert>
      ) : (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">We'll email you a link to choose a new password.</p>
          {formError && <Alert>{formError}</Alert>}
          <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Send reset link
          </Button>
        </>
      )}
      <p className="text-center text-sm">
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
