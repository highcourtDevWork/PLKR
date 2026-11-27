# LearnOS API – Conventions

This folder is the **API contract** between `backend/` and `frontend/`.
- [endpoints.md](endpoints.md) is the full endpoint map (design phase).
- `<module>.md` files (added in each implementation phase) hold the exact request and response shapes. The backend Resources, the frontend `types.ts` and `schemas.ts`, and these files must agree. The `contract-auditor` agent checks this.

## Base
- Base URL: `/api/v1`. JSON only (`Accept: application/json`).
- Auth: Sanctum SPA session. The client first calls `GET /sanctum/csrf-cookie`, then sends the `X-XSRF-TOKEN` header (Axios `withXSRFToken: true`, `withCredentials: true`).
- All endpoints require authentication except `auth/login`, `auth/register`, `auth/forgot-password` and `auth/reset-password`.

## Response shapes

Single resource:
```json
{ "data": { "id": 12, "title": "Eloquent relationships", "...": "..." } }
```

Paginated collection (Laravel default):
```json
{
  "data": [ { "id": 1 } ],
  "links": { "first": "…", "last": "…", "prev": null, "next": "…" },
  "meta": { "current_page": 1, "last_page": 4, "per_page": 20, "total": 73 }
}
```

Errors:
```json
{ "message": "The given data was invalid.", "errors": { "title": ["The title field is required."] } }
```
| Status | Meaning |
|---|---|
| 401 | Not authenticated (SPA redirects to login) |
| 403 | Authenticated but not allowed (e.g. editing system content) |
| 404 | Not found **or not visible to this user** (we don't leak existence) |
| 409 | State conflict (e.g. submitting an already-submitted attempt) |
| 419 | CSRF token mismatch (SPA refreshes the cookie and retries once) |
| 422 | Validation failed (`errors` keyed by field) |
| 429 | Rate limit or AI daily budget exceeded (`retry_after` when known) |

## Lists
- Pagination: `?page=2&per_page=20` (default 20, max 100).
- Filtering: `?filter[topic_id]=5&filter[difficulty]=3`. Only documented filters are accepted; unknown filters return 400.
- Sorting: `?sort=-created_at,title` (`-` means descending). Only documented sorts are allowed.
- Includes: `?include=options,tags` for documented relations only.
- Search: `?filter[q]=eager loading` where documented (FULLTEXT).

## Conventions
- Field names are `snake_case`. Dates are ISO-8601 UTC (`2026-11-27T09:30:00Z`); user-local dates (`study_days`) are `YYYY-MM-DD`.
- IDs are integers. Enum values are lowercase snake_case strings.
- `user_id` is never accepted from the client. System content has `"is_system": true` and `"can_edit": false`.
- Nested routes are scope-bound: a child that doesn't belong to its parent returns 404.
- Async work returns `202 Accepted` with `{ "data": { "generation_id": 41, "status": "queued" } }`; poll `GET /ai/generations/41`.
