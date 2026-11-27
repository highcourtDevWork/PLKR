import { ApiError } from '@/lib/errors'
import { http } from '@/lib/http'
import type { Resource } from '@/types/api'
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from '../schemas'
import type { User } from '../types'

/** Returns null when not signed in (401) instead of throwing. */
export async function getMe(): Promise<User | null> {
  try {
    const { data } = await http.get<Resource<User>>('/me')
    return data.data
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export const login = (input: LoginInput) => http.post('/auth/login', input)
export const register = (input: RegisterInput) => http.post('/auth/register', input)
export const logout = () => http.post('/auth/logout')
export const forgotPassword = (input: ForgotPasswordInput) => http.post('/auth/forgot-password', input)
export const resetPassword = (input: ResetPasswordInput) => http.post('/auth/reset-password', input)
