# API contract – Auth & account (Phase 0)

Backend: Fortify (headless, prefix `api/v1/auth`) + `App\Http\Controllers\Api\V1\Me\*`.
Frontend: `frontend/src/features/auth`, `frontend/src/features/settings`.

Before any POST/PUT/PATCH/DELETE the SPA calls `GET /sanctum/csrf-cookie` once (the Axios interceptor in `lib/http.ts` does this).

## User object
`App\Http\Resources\V1\UserResource` ↔ `features/auth/types.ts`
```json
{
  "id": 1,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "timezone": "UTC",
  "desired_retention": 0.9,
  "daily_new_limit": 20,
  "daily_review_limit": 200,
  "ai_use_notes_context": true,
  "settings": {},
  "created_at": "2026-11-27T10:00:00Z"
}
```

## Fortify endpoints (`/api/v1/auth/*`, guest unless noted)
| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| POST | `/auth/register` | `name, email, password, password_confirmation` | 201 (session started). Route absent when `REGISTRATION_ENABLED=false` | 422 |
| POST | `/auth/login` | `email, password, remember?` | 200 `{ "two_factor": false }` | 422 on `email`; 429 after 5/min per email+IP |
| POST | `/auth/logout` | – | 204 | – |
| POST | `/auth/forgot-password` | `email` | 200 `{ message }` (emails a link to `FRONTEND_URL/reset-password?token=…&email=…`) | 422 |
| POST | `/auth/reset-password` | `token, email, password, password_confirmation` | 200 `{ message }` | 422 |
| PUT | `/auth/user/password` 🔒 | `current_password, password, password_confirmation` | 200 | 422 |
| PUT | `/auth/user/profile-information` 🔒 | `name, email` | 200 | 422 |

Rules: password = Laravel `Password::default()` (min 8) + `confirmed`; email unique, lowercased.

## Account endpoints (🔒 `auth:sanctum`)
| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| GET | `/me` | – | 200 `{ data: User }` | 401 |
| PATCH | `/me/settings` | any of: `timezone` (IANA), `desired_retention` (0.70–0.97), `daily_new_limit` (0–500), `daily_review_limit` (0–2000), `ai_use_notes_context` (bool), `settings` (object) | 200 `{ data: User }`; unknown fields ignored | 401, 422 |
| DELETE | `/me` | `password` | 204; session ended, all user data cascades | 401, 422 on `password` |
