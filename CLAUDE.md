# LearnOS

A personal learning and knowledge-retention platform. It combines learning paths, notes, spaced repetition, a question bank and quizzes, interview prep, English practice, and an AI assistant.
The full product spec is in [docs/requirements.md](docs/requirements.md). Read the relevant module section before working on that module.

## Current status

**Design approved 2026-11-27. Phase 1 (Learning paths) complete on branch `phase-1-learning-paths`, awaiting review. Next: Phase 2 (Knowledge base + tags).** Decisions are in [docs/prd.md](docs/prd.md). Phases are in [docs/roadmap.md](docs/roadmap.md).
Build one phase at a time, and get the user's approval before starting the next one.

## Resolved spec conflicts

- **Frontend is React, not Blade.** Spec §11 overrides §2. Laravel is a standalone JSON API and serves no Blade views (apart from framework defaults such as mail).
- Spec §9 ("Rules for OpenCode") applies to Claude. See "Before implementing anything" below.

## Stack

| Layer | Choice |
|---|---|
| Backend | Laravel 13, PHP 8.4+ (local: PHP 8.5), REST API under `/api/v1` |
| Database | MySQL 8+ (local XAMPP: MySQL 9.7). Target MySQL 8 features only |
| Auth | Laravel Sanctum, SPA cookie-based (same-site), CSRF via `/sanctum/csrf-cookie` |
| Jobs / cache | Laravel Queues (database driver in dev); Redis optional |
| Frontend | React + TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form + Zod, Axios |
| AI | Provider-independent LLM layer in Laravel only; keys never reach the frontend |

## Repo layout (monorepo)

```
backend/    Laravel 13 API
frontend/   React + Vite SPA
docs/       requirements, design package, API contract
.claude/    agents
```

## Design docs (first deliverable, under `docs/`)

1. `prd.md`: product requirements, MVP vs future scope, missing requirements
2. `modules.md`: module breakdown and dependencies
3. `erd.md`: ER diagram (Mermaid) and table definitions
4. `architecture.md`: system architecture, key decisions, backend and frontend folder structure
5. `api/`: `README.md` (conventions), `endpoints.md` (full map), and `<module>.md` with exact request and response shapes, added in each phase (this is the API contract)
6. `ui.md`: pages, navigation and user workflows
7. `roadmap.md`: phase-by-phase plan
8. `testing.md`: testing strategy
9. `risks.md`: technical challenges

Keep these in sync with the code. A change to the API contract updates `docs/api/` and the frontend types in the same change.

## Backend conventions

- Thin controllers: validate with a **Form Request**, authorize with a **Policy**, delegate to a **Service** (`app/Services/...`) for non-trivial logic, and return an **API Resource**.
- No repository layer or interfaces unless there are two real implementations (the LLM providers are one such case). Avoid speculative abstraction.
- Routes live in `routes/api.php`, prefixed `v1`, behind `auth:sanctum`. Use resource controllers where they fit.
- Every user-owned query is scoped to the authenticated user. Authorization is enforced on the backend whatever the frontend does.
- Eager-load relationships to avoid N+1. In non-production, call `Model::preventLazyLoading()` in `AppServiceProvider`.
- Wrap multi-table writes in `DB::transaction`. Send slow work (AI calls, bulk generation, analytics rollups) to queued jobs.
- Lists support pagination, filtering and sorting through validated query params. Whitelist sortable and filterable columns.
- Errors are centralized in `bootstrap/app.php`. Use a consistent JSON error shape (`message`, `errors`) and correct HTTP status codes.
- Migrations: FKs with explicit `onDelete` behavior, indexes chosen from actual query patterns, unique constraints for business rules, and soft deletes on user-authored content (notes, questions, flashcards, learning paths).
- **Keep reusable content separate from user performance data.** Content tables (topics, questions, flashcards) never store per-user progress. Progress lives in user-scoped tables (revision schedules and logs, attempts, answers).
- The **FSRS-inspired scheduler** is a pure PHP class with no Eloquent or HTTP dependencies, and is fully unit-tested. Controllers and jobs call it through a service.
- **The AI layer** has one `LlmClient` contract with provider drivers selected by config. Prompts live in versioned templates. Save responses where useful (`ai_conversations`). AI-generated questions land in a review state and enter the bank only after user approval.
- Tests use Pest (or PHPUnit if chosen at scaffold time). Each endpoint gets feature tests (happy path, validation, authorization or 403 for another user's data). Services and the scheduler get unit tests.

## Frontend conventions

- Organize code by feature: `src/features/<feature>/{api,hooks,components,pages,types.ts,schemas.ts}`. Shared code goes in `src/components`, `src/lib`, `src/hooks`.
- API calls live only in `features/*/api` and use the shared Axios instance (`withCredentials`, CSRF handling, 401 → login redirect, central error mapping). Components never call Axios directly.
- Server state goes through TanStack Query hooks. Zustand is only for true client-global state (theme, UI shell, auth user snapshot). Don't copy server data into Zustand.
- Forms use React Hook Form with Zod schemas that mirror the backend validation rules. Backend 422 errors are mapped back onto form fields.
- TypeScript interfaces match the API Resource shapes in `docs/api/`.
- Every data view handles loading, error and empty states.
- Lazy-load each major module route. Use a protected-route wrapper for authenticated pages.
- Layouts are responsive, with dark and light themes (Tailwind `dark:` class strategy).

## Security

- Never touch `.env` or secrets without asking. Never commit secrets. Backend and frontend have separate env files.
- LLM keys exist only in the backend `.env`. All AI requests go through Laravel.
- Set CORS and Sanctum stateful domains explicitly for the SPA origin. Don't use `*` with credentials.
- Rate-limit auth and AI endpoints.

## Before implementing anything

1. Inspect the existing code and architecture, and identify the affected files and dependencies.
2. Explain the proposed solution. If it touches more than about 3 files, outline it and get approval first.
3. Consider database performance (indexes, query count) and time and space complexity where relevant.
4. Implement the smallest maintainable solution. No unnecessary files and no duplicate functionality.
5. Run the existing tests to check for regressions.

## Per-phase checklist

For each phase: state the objective → list the affected modules and tables → explain the implementation → write the code → add migrations and seeders → add validation and authorization → add tests → review performance and security → update `docs/` (including `docs/api/`). Don't modify unrelated modules without explaining why.

## Agents (`.claude/agents/`)

- `laravel-backend`: builds backend slices to the conventions above
- `react-frontend`: builds frontend feature modules
- `schema-reviewer`: read-only review of migrations, models and queries (normalization, FKs, indexes, N+1)
- `contract-auditor`: read-only check that the Laravel routes and resources, `docs/api/` and the frontend types agree

## Commands

| Where | Command | What |
|---|---|---|
| `backend/` | `composer run dev` | API on :8000 + queue listener |
| `backend/` | `php artisan test` | Pest suite (MySQL database `learnos_test`, must exist) |
| `backend/` | `vendor/bin/pint` · `vendor/bin/phpstan analyse --memory-limit=1G` | Format · static analysis (Larastan level 6) |
| `backend/` | `php artisan migrate` | Database `learnos` |
| `frontend/` | `npm run dev` | SPA on :5173, proxies `/api` and `/sanctum` to :8000. Open **http://localhost:5173** (not 127.0.0.1, or the cookies break) |
| `frontend/` | `npm test` · `npx tsc -b` · `npm run lint` · `npm run build` | Vitest · typecheck · oxlint · production build |

Windows: run `npm test` from PowerShell or cmd, not Git Bash. Under Git Bash's `/c/...` paths Vitest loads twice ("failed to find the runner").

Tool versions are newer than the usual references: Laravel 13, Fortify 1.44, Pest 5, React 19, React Router 8 (import from `react-router`), Zod 4 (`z.email()`), MSW 3 (`onUnhandledFrame`), Vitest 5, TypeScript 7, Tailwind 4 (CSS-first config, class-based `dark` variant in `src/index.css`). Check the installed package's types before relying on an older API.
