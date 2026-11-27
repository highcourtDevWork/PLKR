import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, applyServerErrors, toApiError } from './errors'

function axiosError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('Request failed', 'ERR', config, null, { status, statusText: '', headers: {}, config, data })
}

describe('toApiError', () => {
  it('keeps the Laravel message, status and field errors', () => {
    const error = toApiError(axiosError(422, { message: 'Invalid.', errors: { email: ['Taken.'] } }))
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, message: 'Invalid.', errors: { email: ['Taken.'] } })
  })

  it('gives a friendly message for rate limits', () => {
    expect(toApiError(axiosError(429, { message: 'Too Many Attempts.' })).message).toMatch(/too many attempts/i)
  })
})

describe('applyServerErrors', () => {
  it('maps 422 errors onto form fields and returns null', () => {
    const setError = vi.fn()
    const result = applyServerErrors(new ApiError('Invalid.', 422, { email: ['Taken.', 'Other.'] }), setError)
    expect(result).toBeNull()
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Taken.' })
  })

  it('returns the message for errors that are not field errors', () => {
    const setError = vi.fn()
    expect(applyServerErrors(new ApiError('Server error.', 500), setError)).toBe('Server error.')
    expect(setError).not.toHaveBeenCalled()
  })
})
