import type { User } from '@/features/auth/types'
import { http } from '@/lib/http'
import type { Resource } from '@/types/api'
import type { ChangePasswordInput, DeleteAccountInput, StudySettingsInput } from '../schemas'

export async function updateSettings(input: Partial<StudySettingsInput>): Promise<User> {
  const { data } = await http.patch<Resource<User>>('/me/settings', input)
  return data.data
}

export const changePassword = (input: ChangePasswordInput) => http.put('/auth/user/password', input)

export const deleteAccount = (input: DeleteAccountInput) => http.delete('/me', { data: input })
