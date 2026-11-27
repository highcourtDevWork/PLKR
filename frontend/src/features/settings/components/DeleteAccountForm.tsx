import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/fields'
import { Alert } from '@/components/ui/states'
import { applyServerErrors } from '@/lib/errors'
import { useDeleteAccount } from '../hooks/useSettings'
import { deleteAccountSchema, type DeleteAccountInput } from '../schemas'

export function DeleteAccountForm() {
  const navigate = useNavigate()
  const remove = useDeleteAccount()
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountInput>({ resolver: zodResolver(deleteAccountSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await remove.mutateAsync(values)
      navigate('/login', { replace: true })
    } catch (error) {
      setFormError(applyServerErrors(error, setError))
    }
  })

  if (!open) {
    return (
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-sm space-y-5">
      <Alert>This permanently deletes your account and all of your learning data. It cannot be undone.</Alert>
      {formError && <Alert>{formError}</Alert>}
      <TextField
        label="Confirm with your password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex gap-3">
        <Button type="submit" variant="danger" loading={isSubmitting}>
          Permanently delete
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
