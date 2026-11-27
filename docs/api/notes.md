# API contract – Knowledge base: notes, tags, search (Phase 2)

Backend: `App\Http\Controllers\Api\V1\Notes\*`, `App\Http\Controllers\Api\V1\SearchController`, Resources in `App\Http\Resources\V1\Notes\*`.
Frontend: `frontend/src/features/notes` (`types.ts`, `schemas.ts`, `api/notes.ts`) and `frontend/src/features/search`.
All endpoints are under `/api/v1` and need `auth:sanctum`.

## Access rules
| Content | Read | Write |
|---|---|---|
| Notes | own only (else 404) | own only (else 404) |
| Tags | own only | own only (else 404) |
| `topic_id` on a note | – | any topic you can read (own or system); otherwise 422 on `topic_id` |
| `tag_ids` on a note | – | your own tags only; otherwise 422 on `tag_ids.N` |

## Shapes

**Note** (show / store / update):
```json
{ "id": 1, "title": "Eager loading", "kind": "snippet", "body": "Use `with()`…", "is_pinned": false, "source": "manual",
  "topic_id": 100, "topic": { "id": 100, "title": "Relationships" },
  "tags": [{ "id": 3, "name": "Eloquent", "slug": "eloquent" }],
  "created_at": "2026-11-27T12:00:00Z", "updated_at": "2026-11-27T12:00:00Z" }
```
**NoteListItem** (`GET /notes`): the same, but `excerpt` (first 300 characters of the raw Markdown) replaces `body`.
`topic` is `null` for unfiled notes and when the topic was deleted (the `topic_id` is kept).

- `kind` = `general|explanation|example|snippet|mistake|feynman|summary` (default `general`).
- `source` = `manual|ai`. It is read-only; AI-written notes arrive in Phase 7.
- `body` is Markdown (≤ 200 000 characters). It's stored and returned as is. Clients must render it sanitized and never as raw HTML.

**Tag**: `id, name, slug` plus `notes_count` on `GET /tags`. `slug` is derived from `name` and is unique per user ("Query Builder" → `query-builder`).

## Endpoints
| Method | Path | Body / query | Success | Notes |
|---|---|---|---|---|
| GET | `/notes` | `filter[topic_id]`, `filter[kind]`, `filter[tag_id]`, `filter[pinned]` (bool), `filter[q]` (full-text), `sort=updated_at\|created_at\|title` (`-` = desc, default `-updated_at`), `per_page` 1–100 (default 20) | 200 paginated NoteListItem | Pinned notes always come first. With `filter[q]`, better matches come before the sort. Unknown filter/sort → 400 |
| POST | `/notes` | `title`* (≤ 200), `body`, `kind`, `topic_id`, `tag_ids[]` (≤ 20), `is_pinned` | 201 Note | `body` defaults to `""` |
| GET | `/notes/{id}` | – | 200 Note | |
| PATCH | `/notes/{id}` | any of the POST fields | 200 Note | `tag_ids` replaces the whole set; leave it out to keep the tags |
| DELETE | `/notes/{id}` | – | 204 | Soft delete; tag links are kept for a restore |
| GET | `/tags` | – | 200 `{ data: Tag[] }` | All of the user's tags, sorted by name (not paginated) |
| POST | `/tags` | `name`* (≤ 50, must contain a letter or digit) | 201 Tag | 422 on `name` if you already have a tag with the same slug |
| PATCH | `/tags/{id}` | `name`* | 200 Tag | |
| DELETE | `/tags/{id}` | – | 204 | Removes the tag from every note |
| GET | `/search` | `q`* (≤ 100) | 200 SearchResults | Up to 5 results per group |

**SearchResults**:
```json
{ "data": {
  "notes": [{ "id": 1, "title": "Eager loading", "kind": "snippet", "excerpt": "first 160 characters", "is_pinned": false,
              "source": "manual", "topic_id": 100, "created_at": "…", "updated_at": "…" }],
  "topics": [{ "id": 100, "title": "Relationships", "learning_path": { "id": 1, "title": "Laravel Fundamentals" } }]
} }
```
Questions join the results in Phase 3.

### How matching works
- **Notes** use the MySQL FULLTEXT index on `(title, body)` in boolean mode. Every word must match, and each word is treated as a prefix (`queue superv` finds "Supervisor keeps queue workers running"). Results are ranked by relevance.
  - Punctuation and boolean operators in `q` are stripped.
  - InnoDB stopwords ("the", "with", …) and words shorter than 3 characters are dropped.
  - If no word is left, the search falls back to a title `LIKE`, so `go` still finds "Go channels".
- **Topics** match on the title (`LIKE`, case-insensitive), among the topics the user can see.

`*` = required. Errors follow [README.md](README.md): 401, 404 (not yours), 422 (`errors` per field), 400 (unknown filter/sort).
