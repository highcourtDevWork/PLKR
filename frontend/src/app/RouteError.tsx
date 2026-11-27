import { useRouteError } from 'react-router'
import { ErrorState } from '@/components/ui/states'

/** Last-resort boundary for render errors and failed chunk loads. */
export function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : 'Something went wrong.'
  return (
    <div className="mx-auto max-w-md p-8">
      <ErrorState message={message} onRetry={() => window.location.reload()} />
    </div>
  )
}
