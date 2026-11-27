import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/auth'

export const authKeys = { me: ['me'] as const }

/** The signed-in user (null = guest). This query is the single source of truth for auth state. */
export function useMe() {
  return useQuery({ queryKey: authKeys.me, queryFn: api.getMe, staleTime: 5 * 60_000 })
}

/** Login and register resolve only after the user has been reloaded, so callers can navigate right away. */
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.login,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.register,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(authKeys.me, null)
    },
  })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: api.forgotPassword })
}

export function useResetPassword() {
  return useMutation({ mutationFn: api.resetPassword })
}
