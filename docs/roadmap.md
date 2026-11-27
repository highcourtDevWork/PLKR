# LearnOS – Development Roadmap

Each phase follows the per-phase checklist in `CLAUDE.md` and ends with: tests green, `schema-reviewer` + `contract-auditor` run, `docs/api/<module>.md` written, and **your approval before the next phase**.

**MVP = Phases 0–7.**

| Phase | Name | Modules | Tables | Deliverables | Exit criteria |
|---|---|---|---|---|---|
| **0** | Foundation | CORE | users (+ settings cols), Laravel defaults | `git init`; Laravel 13 API scaffold (`install:api`, Sanctum, Fortify headless), Pest, Pint, Larastan; Vite React-TS with Tailwind, Router, Query, Zustand, RHF+Zod, Axios, oxlint (Vite template default), Vitest+RTL+MSW; Vite proxy; error renderer; auth pages; app shell (sidebar, topbar, theme, protected routes); settings page; Commands section in CLAUDE.md | Register → login → see empty dashboard → logout, in both themes; auth feature tests; CSRF/419 flow works |
| **1** | Learning paths | B, PROG (basic) | learning_paths, modules, topics, resources, user_topic_progress (tags moved to Phase 2: nothing to tag before notes) | CRUD + reorder + tree endpoint; topic workspace (Overview, Resources tabs); manual completion; system-content visibility rules + one seeded system path | Tree loads in ≤ 3 queries; 403/404 tests for other users and system edits |
| **2** | Knowledge base | C, TAG | notes, tags, taggables | Notes CRUD, kinds, pinning, tags, FULLTEXT search, ⌘K global search; Markdown editor + sanitized viewer | XSS test (script in note not executed); search finds by title and body |
| **3** | Question bank | E | questions, question_options | CRUD with options (transactional), all types and categories, filters, topic Questions tab | Option correctness rules validated per type (e.g. single_choice exactly 1 correct) |
| **4** | Revision engine | D | flashcards, revision_schedules, revision_logs | `FsrsScheduler` (pure) + reference-vector tests; ReviewService; queue with daily limits and interleaving; review session UI; schedules browser; forecast; forgetting risk | Scheduler unit tests pass; review → log + schedule + study_days in one transaction; queue query uses the index (EXPLAIN) |
| **5** | Quiz engine | F | quizzes, quiz_questions, quiz_attempts, user_answers | QuizBuilder (scope, difficulty, interleave), attempts with server-enforced timer, autosave, auto-grading, self-grading, results, history, "add misses to revision" | Expired attempt rejects answers (409); correct answers never sent before submit |
| **6** | Dashboard & analytics | A, PROG | study_days, learning_goals (+ mastery job) | ProgressRecorder, MasteryCalculator, StreakCalculator, RecalculateTopicMastery job, rebuild command; dashboard; analytics pages; goals | Dashboard ≤ 6 queries; streak correct across timezones (tests with `travelTo`) |
| **7** | AI foundation | I (+ C, E, F hooks) | ai_conversations, ai_messages, ai_generations | LlmClient + driver + fake; budget and throttle; explain topic (by level) and save as note; generate notes, flashcards and questions (queued) → review queue; AI evaluation of open quiz answers; assistant chat | All AI tests run on the fake; malformed AI JSON → generation `failed` with no partial inserts; no key in the frontend bundle |
| — | **MVP release** | | | Deployment guide, prod config, backup note | |
| **8** | Interview prep | G | interview_profiles, interview_sessions, interview_responses | Seeded profiles and question banks per track; session conductor (bank question → AI follow-ups to depth N); coding prompts with complexity fields; report job; apply recommendations | Session flow end-to-end on the fake LLM; report lists weak topics mapped to real topic ids |
| **9** | English | H | vocabulary_words, user_vocabulary, practice_prompts, practice_submissions | Seeded IT and professional vocabulary + English path (grammar and reading as topics and questions); daily words; vocabulary → flashcards; writing, sentence and professional-email practice with AI feedback; speaking via Web Speech API | Daily words idempotent per local day; feature-detects speech support (graceful fallback to typing) |
| **10** | Assistant+ & assessments | I, A | (none new) | KB Q&A with citations; knowledge-gap report per path; Feynman evaluation; periodic comprehensive assessment suggestions; performance and security pass; Playwright E2E for core flows | Prompt-injection test: note text can't change assistant instructions |

## Sizing (rough, one developer working with Claude)
Phase 0: 1–2 days · Phases 1–3: 2–3 days each · Phase 4: 3–4 days · Phase 5: 3 days · Phase 6: 2–3 days · Phase 7: 3–4 days · Phases 8–10: 3–5 days each.

## Deferred (future backlog)
Embeddings and semantic search · sandboxed code runner · FSRS parameter optimization · pronunciation scoring provider · Anki/CSV import and JSON export · content sharing and cloning · email and push reminders · Reverb realtime + streaming AI responses · PWA/offline · admin content UI · resource file uploads · question versioning.
