# LearnOS – Application Architecture

## 1. System overview

```mermaid
flowchart LR
  subgraph Browser
    SPA[React SPA<br/>TanStack Query · Zustand · Router]
  end
  subgraph Web["Nginx / Apache (one origin, HTTPS)"]
    STATIC[/static SPA build/]
    PROXY["/api/* · /sanctum/*"]
  end
  subgraph API[Laravel 13 API]
    MW[Sanctum session · CSRF · throttle]
    CTRL[Controllers v1]
    SVC[Services · Policies]
    AI[AI layer: LlmClient]
    JOBS[Queued jobs]
  end
  DB[(MySQL 8)]
  Q[(Queue: database → Redis)]
  LLM[[LLM provider(s)]]

  SPA -->|HTML/JS| STATIC
  SPA -->|JSON + cookies| PROXY --> MW --> CTRL --> SVC --> DB
  SVC --> Q --> JOBS --> AI --> LLM
  JOBS --> DB
  SVC --> AI
```

The React SPA and the Laravel API are built, configured and deployed independently. In production the web server serves the SPA's static build and routes `/api/*` and `/sanctum/*` to Laravel, so the browser sees **one origin**.

## 2. Key architectural decisions

| # | Decision | Why | Trade-off |
|---|---|---|---|
| AD-1 | **Same-origin deployment** (SPA at `/`, API at `/api`), with a Vite dev proxy in development | Sanctum cookie auth with no CORS preflights and no `SameSite` edge cases; CSRF via the `XSRF-TOKEN` cookie works automatically with Axios | API and SPA share a hostname. A subdomain split (`api.` + stateful domains + CORS) remains possible by config only |
| AD-2 | **Sanctum SPA (session cookie) auth + Fortify headless** with `prefix = api/v1/auth` | Battle-tested login, registration, password reset and throttling with no Blade views | Fortify adds a package, but avoids hand-rolling security flows |
| AD-3 | **Layered Laravel (Controllers → Requests/Policies → Services → Models)**, grouped by domain subfolder. No repositories or DDD modules | Spec asks for thin controllers and no over-engineering; Eloquent is already the data layer | Domain boundaries are kept by convention, not enforced by tooling |
| AD-4 | **Content vs progress split**, with nullable `user_id` meaning system content | Seeded interview banks, vocabulary and English paths are shared once while progress stays per user | Policies must handle the "visible if own or system, editable if own" rule |
| AD-5 | **FSRS scheduler as a pure PHP class** with default FSRS-5 weights in `config/fsrs.php` | Testable against reference vectors; easy to swap or tune parameters later | No per-user parameter optimization in MVP |
| AD-6 | **Rollup tables** (`study_days`, `user_topic_progress`) written on events | The dashboard reads O(1) rows instead of scanning logs and answers | Rollups must be recalculable; an `artisan learnos:rebuild-progress` command is provided |
| AD-7 | **Own thin `LlmClient` contract** with one driver that wraps a provider-independent package (Prism PHP or the official Laravel AI SDK, chosen in phase 7) and a `FakeLlmClient` for tests | Provider independence and deterministic tests; the package does the per-provider work | One small interface to maintain |
| AD-8 | **AI output is data, never code**: structured JSON validated against a schema, generated questions land as `pending_review`, Markdown is sanitized on render | Safety, the review requirement, and protection from prompt injection | Extra review step for the user (intended) |
| AD-9 | **No code execution** for coding questions; the AI evaluates correctness and complexity | Running untrusted code needs a hardened sandbox, which is out of scope | Evaluation is probabilistic; marked "AI assessment" in the UI |
| AD-10 | **Markdown as the stored note format**; CodeMirror 6 editor + `react-markdown` / `remark-gfm` / `rehype-sanitize` / Shiki | Portable, diffable, searchable, safe | No true WYSIWYG; a toolbar and live preview cover the "rich text" need |
| AD-11 | **MySQL FULLTEXT** for search (notes, questions) behind `KnowledgeSearch` | No extra infrastructure | Weak on short tokens and synonyms; semantic search is future |
| AD-12 | **Lists through `spatie/laravel-query-builder`** for `filter[]`, `sort`, `include` with explicit allow-lists | Consistent pagination, filtering and sorting without bespoke code per controller | One dependency; allow-lists are mandatory |
| AD-13 | **Queue: `database` driver in dev, Redis in prod**; frontend polls job status | Works on XAMPP/Windows with no Redis | Polling latency of ~2 s; Reverb/websockets are future |
| AD-14 | **Enums as VARCHAR + PHP backed enums** | Adding a value needs no `ALTER TABLE` | DB doesn't enforce the value set; Form Requests and enum casts do |

## 3. Request lifecycle (backend)

```
Route (routes/api.php, prefix v1, auth:sanctum, throttle)
 → FormRequest  (rules + authorize() → Policy)
 → Controller   (≤ ~15 lines per action; no queries beyond simple find/paginate)
 → Service      (business logic, DB::transaction, dispatch jobs)
 → Model        (relations, casts, scopes such as visibleTo($user))
 → JsonResource (response shape = the API contract)
Errors → bootstrap/app.php renderer → { message, errors? } with the correct status
```

## 4. Backend folder structure (`backend/`)

```
app/
  Enums/                       QuestionType, QuestionCategory, ReviewRating, CardState, …
  Http/
    Controllers/Api/V1/
      Auth/ (Fortify handles most)  Me/ SettingsController
      LearningPaths/  LearningPathController, ModuleController, TopicController, ResourceController, TopicProgressController
      Knowledge/      NoteController, SearchController, TagController
      Questions/      QuestionController, QuestionReviewController (AI approval)
      Revision/       FlashcardController, ReviewQueueController, ReviewController, ScheduleController
      Quizzes/        QuizController, QuizAttemptController, AttemptAnswerController
      Dashboard/      DashboardController, AnalyticsController, GoalController
      Ai/             ConversationController, MessageController, GenerationController
      Interviews/     InterviewProfileController, InterviewSessionController, InterviewResponseController
      English/        VocabularyController, DailyWordsController, PracticePromptController, PracticeSubmissionController
    Requests/V1/<Domain>/       Store*/Update*/Index* requests
    Resources/V1/<Domain>/      *Resource
  Models/
  Policies/
  Services/
    Revision/   FsrsScheduler.php (pure), FsrsParameters.php, ReviewService.php, ReviewQueueService.php
    Progress/   ProgressRecorder.php, MasteryCalculator.php (pure), StreakCalculator.php (pure)
    Quiz/       QuizBuilder.php, AnswerGrader.php, AttemptService.php
    Knowledge/  KnowledgeSearch.php
    Interview/  InterviewConductor.php, InterviewReportBuilder.php
    English/    DailyVocabularyService.php
  Ai/
    Contracts/LlmClient.php     chat(Messages, Options): LlmResponse; structured(Messages, JsonSchema): array
    Drivers/                    <Package>LlmClient.php, FakeLlmClient.php
    Prompts/                    versioned prompt templates (Blade-free PHP or .md)
    Tasks/                      ExplainTopic, GenerateQuestions, EvaluateAnswer, GenerateNotes, InterviewTurn, …
    AiBudget.php                per-user daily token cap
  Jobs/                         GenerateQuestionsJob, EvaluateAnswerJob, RecalculateTopicMastery, BuildInterviewReport, …
  Console/Commands/             learnos:rebuild-progress
config/ fsrs.php  ai.php
database/ migrations/  factories/  seeders/ (System*Seeder for interview bank, vocabulary, English path)
routes/ api.php
tests/ Unit/  Feature/Api/V1/<Domain>/
```

## 5. Frontend folder structure (`frontend/`)

```
src/
  app/
    router.tsx            lazy routes per feature; <ProtectedRoute>, <GuestRoute>
    providers.tsx         QueryClientProvider, ThemeProvider, Toaster
    layouts/              AppLayout (sidebar + topbar), AuthLayout
  components/
    ui/                   Button, Input, Select, Card, Modal, Tabs, Badge, Skeleton, EmptyState, ErrorState, Pagination, ConfirmDialog
    layout/               Sidebar, Topbar, ThemeToggle, CommandSearch
    markdown/             MarkdownView (sanitized), MarkdownEditor (CodeMirror)
  features/
    auth/ dashboard/ learning-paths/ notes/ questions/ revision/ quizzes/
    analytics/ assistant/ interviews/ english/ settings/
      ├─ api/             plain functions over lib/http
      ├─ hooks/           useXxxQuery / useXxxMutation (query-key factory per feature)
      ├─ components/
      ├─ pages/
      ├─ types.ts         mirrors docs/api/<module>.md
      └─ schemas.ts       Zod, mirrors Form Requests
  lib/
    http.ts               Axios instance: baseURL /api/v1, withCredentials, withXSRFToken, 401/419 handling
    errors.ts             ApiError normalization; 422 → RHF setError helper
    queryClient.ts
  stores/                 theme.ts, ui.ts (sidebar), auth.ts (current user snapshot only)
  types/api.ts            Paginated<T>, ApiErrorBody
```

## 6. Core domain logic

### FSRS-inspired scheduling (`FsrsScheduler`)
- State per item: `stability S`, `difficulty D`, `state`, `due_at`, `last_reviewed_at`, `reps`, `lapses`.
- Retrievability `R(t) = (1 + F · t/S)^C` with `C = −0.5`, `F = 19/81` (FSRS-5 power forgetting curve).
- Next interval `I = (S / F) · (r^(1/C) − 1)` for the user's `desired_retention r`, clamped to [1 day, 36500 days] and fuzzed ±5% for review cards.
- First rating sets the initial `S0(G)` and `D0(G)`; then the FSRS-5 update rules for D (mean-reversion), recall stability and forget stability. The 19 default weights come from the open-spaced-repetition reference and are pinned in `config/fsrs.php` with a source link.
- **Short-term learning steps** (1 min, 10 min) for new and relapsed cards before they graduate to day intervals. This is simpler than FSRS-5 same-day stability updates and fine for MVP.
- Signature: `schedule(CardState $state, Rating $rating, CarbonImmutable $now, float $desiredRetention): SchedulingResult` with no I/O.
- **Forgetting risk** = `1 − R(now)`. Shown as low / medium / high (< 0.1 / < 0.3 / ≥ 0.3).
- **Question recall:** objective questions are auto-checked; a wrong answer forces rating `Again`; for a correct answer the user picks Hard, Good or Easy.

### Mastery (`MasteryCalculator`, per user × topic)
```
retention = mean R(now) over the topic's scheduled items        (0–1)
accuracy  = difficulty-weighted accuracy of the last 20 answers   (0–1)
coverage  = items reviewed at least once / items in topic        (0–1)
mastery   = 100 · (0.45·retention + 0.40·accuracy + 0.15·coverage)
```
Missing components are re-weighted. **Weak topic** = mastery < 60 with at least 5 attempts, or high forgetting risk on > 30% of items. These weights are initial heuristics, kept in config and tunable.

### Streaks & goals
`study_days` rows are keyed by the user-local date. The streak is the number of consecutive days with any activity, ending today or yesterday (today is still in progress). Goals compare `study_days` sums for the current day or ISO week with the target.

## 7. AI layer

```
Controller ──(sync, short)──▶ Ai\Tasks\ExplainTopic ──▶ LlmClient ──▶ provider
Controller ──(dispatch)────▶ GenerateQuestionsJob ──▶ Ai\Tasks\GenerateQuestions
                               │ validate JSON schema → questions(status=pending_review)
                               └ ai_generations.status = succeeded/failed
SPA polls GET /ai/generations/{id} → opens the review screen
```
- **Sync** (≤ ~20 s, rate-limited): explain topic, assistant chat turn, interview turn. **Queued**: question, note and flashcard generation, answer evaluation batches, interview reports, Feynman evaluation.
- Every call records provider, model and tokens. `AiBudget` rejects calls over the user's daily cap with a 429.
- KB Q&A: `KnowledgeSearch` gets the top-k notes (FULLTEXT) → passages are inserted into the prompt as quoted data with an instruction not to follow them → the answer cites note IDs → the UI links to the notes.
- Prompts are versioned files; the prompt version is stored in `ai_generations.params` for reproducibility.
- Keys exist only in `backend/.env`. The SPA never calls a provider.

## 8. Security model
- Sanctum session cookie (HttpOnly, Secure, SameSite=Lax) plus CSRF cookie. Login and registration are throttled; AI endpoints are throttled per user.
- Every model with `user_id` has a policy. List queries always start from `$request->user()->…` or `Model::visibleTo($user)`.
- IDs in nested routes are scoped (`->scopeBindings()`), so `/paths/1/modules/9` returns 404 when module 9 isn't in path 1.
- Markdown is rendered through `rehype-sanitize` and never with `dangerouslySetInnerHTML` from raw input.
- Mass-assignment uses explicit `$fillable`. `user_id` is always set from auth, never from the request.

## 9. Performance
- `Model::preventLazyLoading(!app()->isProduction())`. Resources use `whenLoaded`, and counts use `withCount`.
- The learning path tree loads in one query per level (modules, topics with `parent_id`); topic progress is joined in one query.
- The review queue query is `WHERE user_id=? AND is_suspended=0 AND due_at<=?` with `ORDER BY due_at LIMIT n`, covered by the composite index; interleaving is done in PHP over the page.
- Dashboard: at most ~6 indexed queries over rollups, cached per user for 60 s under a per-user key that writes clear (no cache tags, since the database cache driver doesn't support them).

## 10. Environments

| | Development (XAMPP, Windows) | Production |
|---|---|---|
| SPA | `npm run dev` (Vite :5173); proxies `/api`, `/sanctum` to Laravel | `npm run build` → static files served by Nginx/Apache |
| API | `composer run dev` (artisan serve :8000 + queue:listen + logs) | PHP-FPM behind the same web server, `/api` location |
| DB | XAMPP MySQL 9.7, databases `learnos` and `learnos_test` | MySQL 8.x |
| Queue | `database` | Redis + Supervisor/systemd `queue:work` |
| Env | `backend/.env`, `frontend/.env` (only `VITE_*` and no secrets) | Server-managed env, never committed |
| Session | `SESSION_DOMAIN=localhost`, `SANCTUM_STATEFUL_DOMAINS=localhost:5173` | the app's domain, `SESSION_SECURE_COOKIE=true` |
