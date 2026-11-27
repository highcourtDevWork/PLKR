# LearnOS – Testing Strategy

## Principles
- Test behaviour through public seams (HTTP endpoints, service methods, React components as a user sees them), not internals.
- Every phase ships with tests. A phase isn't done while any test fails.
- Tests are deterministic: no real LLM calls, and no wall-clock dependence (`travelTo`, fixed seeds for shuffling and fuzz).

## Backend (Pest)

| Layer | What | Examples |
|---|---|---|
| **Unit (pure)** | `FsrsScheduler`, `MasteryCalculator`, `StreakCalculator`, grading rules, prompt builders | Reference vectors for FSRS (S, D and interval after a rating sequence, compared with the open-spaced-repetition reference implementation within 1e-4); interval clamps; streak across a timezone boundary |
| **Feature (HTTP)** | Every endpoint | Happy path; 422 validation; 401 guest; **403/404 for another user's resource**; 403 editing system content; pagination, filter and sort allow-lists; response JSON shape (`assertJsonStructure`) |
| **Service / integration** | Transactions and jobs | Review writes schedule + log + study_day atomically (simulated failure rolls everything back); `GenerateQuestionsJob` with `FakeLlmClient` producing valid and malformed JSON |
| **Query budget** | Hot endpoints | `DB::enableQueryLog` asserts ≤ N queries for the tree, review queue and dashboard; `preventLazyLoading` makes N+1 fail tests |
| **Static** | Larastan (level 6 at first, raised over time), Pint | Run in CI and before a phase is closed |

- **Database:** MySQL `learnos_test` (not SQLite, because FULLTEXT, CHECK constraints and JSON behaviour must match production) with `RefreshDatabase`.
- **Fakes:** `Queue::fake()` where dispatch is asserted, `Http::preventStrayRequests()`, and `FakeLlmClient` bound in `TestCase` with scripted responses.
- **Factories** exist for every model, with states (`system()`, `pendingReview()`, `due()`, `expired()`).

## Frontend (Vitest + React Testing Library + MSW)

| Layer | What |
|---|---|
| Unit | Zod schemas (match backend rules), `lib/errors` (422 mapping), query-key factories, small pure utils |
| Component | Forms (validation messages, server 422 errors shown on fields), loading, error and empty states, review card keyboard shortcuts, quiz timer display |
| Integration | Feature pages against MSW handlers built from `docs/api` examples; ProtectedRoute redirects; 401 → login, 419 → CSRF refresh + retry |
| Type safety | `tsc --noEmit` in the build; no `any` in feature `types.ts` |

## End-to-end (Playwright, from Phase 10; smoke earlier if useful)
Core flows against a seeded backend: register/login · create path → topic → note → card → review · quick quiz → results · AI generation → review queue (fake LLM driver enabled via `AI_DRIVER=fake`).

## Contract
- The `contract-auditor` agent runs at the end of every phase that touches the API.
- Backend feature tests assert Resource JSON structure, and frontend MSW handlers use the same documented examples. A drift on either side fails its own test suite.

## Security checks per phase
Authorization matrix tests (owner, other user, guest, system content), mass-assignment (`user_id` in a payload is ignored), Markdown XSS rendering, rate limits on auth and AI, and no secrets in the `frontend/dist` bundle (grep in CI).
