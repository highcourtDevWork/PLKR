import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/hooks/useAuth'
import * as api from '../api/settings'

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (user) => queryClient.setQueryData(authKeys.me, user),
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: api.changePassword })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      queryClient.clear()
      queryClient.setQueryData(authKeys.me, null)
    },
  })
}
