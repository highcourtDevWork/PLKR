import { isAxiosError } from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiErrorBody } from '@/types/api'

/** Normalized error thrown by every API call (see lib/http.ts). */
export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status ?? 0
    const body = error.response?.data
    if (status === 0) return new ApiError('Cannot reach the server. Check your connection.', 0)
    if (status === 429) return new ApiError('Too many attempts. Please wait a moment and try again.', 429)
    return new ApiError(body?.message || 'Something went wrong.', status, body?.errors ?? {})
  }
  return new ApiError(error instanceof Error ? error.message : 'Something went wrong.', 0)
}

/**
 * Puts Laravel 422 field errors onto the matching form fields.
 * Returns a message to show above the form when the error isn't tied to a field (or null if it was).
 */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): string | null {
  const apiError = toApiError(error)
  const fields = Object.entries(apiError.errors)
  if (apiError.status !== 422 || fields.length === 0) return apiError.message

  for (const [field, messages] of fields) {
    setError(field as Path<T>, { type: 'server', message: messages[0] })
  }
  return null
}
