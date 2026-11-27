import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { User } from '@/features/auth/types'

export const testUser: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  timezone: 'UTC',
  desired_retention: 0.9,
  daily_new_limit: 20,
  daily_review_limit: 200,
  ai_use_notes_context: true,
  settings: {},
  created_at: '2026-11-27T10:00:00Z',
}

/** Handlers every test gets; tests override per case with server.use(...). */
export const server = setupServer(
  http.get('/sanctum/csrf-cookie', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/me', () => HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })),
)
