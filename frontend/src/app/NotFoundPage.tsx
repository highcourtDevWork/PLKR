import { Link } from 'react-router'
import { EmptyState } from '@/components/ui/states'

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you're looking for doesn't exist."
      action={
        <Link to="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          Back to dashboard
        </Link>
      }
    />
  )
}
