import { QueryCache, QueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/hooks/useAuth'
import { ApiError } from '@/lib/errors'

export function createQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      // Session expired mid-use: mark the user as signed out so ProtectedRoute sends them to /login.
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) queryClient.setQueryData(authKeys.me, null)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retry network/server errors only; 4xx answers won't change on retry.
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      },
    },
  })
  return queryClient
}
