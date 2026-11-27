import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/states'
import { useMe } from '@/features/auth/hooks/useAuth'

/** UX only: the API enforces auth on every request regardless. */
export function ProtectedRoute() {
  const { data: user, isPending, isError, error, refetch } = useMe()
  const location = useLocation()

  if (isPending) return <FullPageSpinner />
  if (isError) {
    return (
      <div className="mx-auto max-w-md p-8">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** Also performs the post-login/register redirect: once `me` resolves, it returns the user to where they were headed. */
export function GuestRoute() {
  const { data: user, isPending } = useMe()
  const location = useLocation()
  if (isPending) return <FullPageSpinner />
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />
  return <Outlet />
}
