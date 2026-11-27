# API contract – Learning paths (Phase 1)

Backend: `App\Http\Controllers\Api\V1\LearningPaths\*`, Resources in `App\Http\Resources\V1\LearningPaths\*`.
Frontend: `frontend/src/features/learning-paths` (`types.ts`, `schemas.ts`, `api/learningPaths.ts`).
All endpoints are under `/api/v1` and need `auth:sanctum`.

## Access rules
| Content | Read | Write |
|---|---|---|
| Own path (and its modules and topics) | ✓ | ✓ |
| System path (`is_system: true`, seeded) | ✓ | 403 |
| Another user's path | 404 | 404 |
| Resources | only your own, on any topic you can read | own only (else 404) |
| Topic progress | on any topic you can read | your own row only |

## Shapes

**LearningPath** (list item):
```json
{ "id": 1, "title": "Laravel Fundamentals", "description": "…", "level": "beginner", "color": null, "icon": null,
  "position": 0, "is_system": true, "can_edit": false,
  "modules_count": 4, "topics_count": 21, "completed_topics_count": 3,
  "created_at": "2026-11-27T12:00:00Z", "updated_at": "2026-11-27T12:00:00Z" }
```
On `GET /learning-paths/{id}` the three counts are replaced by `modules` (the tree):
```json
"modules": [{ "id": 10, "learning_path_id": 1, "title": "Eloquent ORM", "description": null, "level": null, "position": 0,
  "topics": [{ "id": 100, "module_id": 10, "parent_id": null, "title": "Relationships", "summary": null, "level": "beginner",
    "estimated_minutes": null, "position": 0,
    "progress": { "status": "in_progress", "mastery": 0, "last_studied_at": "…", "completed_at": null },
    "subtopics": [{ "id": 101, "parent_id": 100, "…": "same fields with progress, without subtopics" }] }] }]
```
**TopicDetail** (`GET /topics/{id}`) = Topic + `progress`, `subtopics` (with progress), `resources_count` (own), `breadcrumb { learning_path {id,title}, module {id,title}, parent {id,title}|null }`, `is_system`, `can_edit`.

**TopicProgress**: `status` (`not_started|in_progress|completed`), `mastery` (0–100, computed from Phase 6; 0 until then), `last_studied_at`, `completed_at`. A topic with no row reports `not_started`.

**LearningResource**: `id, topic_id, type (link|article|video|book|course|doc), title, url, description, position, created_at`.

Enums: `level` = `beginner|intermediate|advanced`.

## Endpoints
| Method | Path | Body / query | Success | Notes |
|---|---|---|---|---|
| GET | `/learning-paths` | `filter[title]` (partial), `filter[is_system]` (bool), `sort=position\|title\|created_at\|updated_at` (`-` = desc, default `position`), `per_page` 1–100 (default 20) | 200 paginated | Own + system. Unknown filter/sort → 400. The SPA loads one page of 100 (known limit) |
| POST | `/learning-paths` | `title`*, `level`*, `description`, `color`, `icon` | 201 | Appended at the end (`position`) |
| GET | `/learning-paths/{id}` | – | 200 with `modules` tree | 4 queries regardless of size |
| PATCH | `/learning-paths/{id}` | any of the POST fields | 200 | |
| DELETE | `/learning-paths/{id}` | – | 204 | Soft-deletes modules, topics and resources too |
| POST | `/learning-paths/reorder` | `ids`*: all of the user's own path ids in the new order | 204 | 422 if the list is not exactly the full set |
| POST | `/learning-paths/{id}/modules` | `title`*, `description`, `level` | 201 Module | |
| POST | `/learning-paths/{id}/modules/reorder` | `ids`*: all module ids of the path | 204 | |
| PATCH | `/modules/{id}` | any of the POST fields | 200 Module | |
| DELETE | `/modules/{id}` | – | 204 | With its topics and resources |
| POST | `/modules/{id}/topics` | `title`*, `level`*, `summary`, `estimated_minutes` (1–10000), `parent_id` | 201 Topic | `parent_id` must be a top-level topic of the same module (depth ≤ 2), else 422 on `parent_id` |
| POST | `/modules/{id}/topics/reorder` | `ids`*: all siblings (same parent) | 204 | 422 if mixed parents or incomplete |
| GET | `/topics/{id}` | – | 200 TopicDetail | |
| PATCH | `/topics/{id}` | `title`, `level`, `summary`, `estimated_minutes` | 200 Topic | Moving between modules/parents isn't supported |
| DELETE | `/topics/{id}` | – | 204 | With its subtopics and resources |
| PUT | `/topics/{id}/progress` | `status`* | 200 `{ data: TopicProgress }` | Allowed on system topics; `completed_at` set/cleared automatically |
| GET | `/topics/{id}/resources` | – | 200 `{ data: LearningResource[] }` | Own resources only |
| POST | `/topics/{id}/resources` | `type`*, `title`*, `url`* (http/https only, ≤ 2048), `description` | 201 | Allowed on system topics |
| PATCH | `/resources/{id}` | any of the POST fields | 200 | |
| DELETE | `/resources/{id}` | – | 204 | |

`*` = required. Errors follow [README.md](README.md): 401, 403 (system content), 404 (not visible), 422 (`errors` per field), 400 (unknown filter/sort).
