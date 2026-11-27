/** Mirrors App\Http\Resources\V1\UserResource (docs/api/auth.md). */
export interface User {
  id: number
  name: string
  email: string
  timezone: string
  desired_retention: number
  daily_new_limit: number
  daily_review_limit: number
  ai_use_notes_context: boolean
  settings: Record<string, unknown>
  created_at: string
}
