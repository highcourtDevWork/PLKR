# LearnOS – Product Requirements Document

Status: **Approved 2026-11-27** · Source spec: [requirements.md](requirements.md)

## Approved decisions (2026-11-27)
1. First release = phases 0–7. Interview prep, English, and Assistant+ (the AI assistant over your own notes, phase 10) follow.
2. **Multi-user with open registration** (can be switched off by config).
3. AI provider: to be decided at the start of phase 7. Design stays provider-independent.
4. Coding questions are evaluated by AI only; no code execution.
5. Notes are stored as Markdown, with a toolbar and live preview.

## 1. Problem

Most learning tools measure how much you *consume* (pages read, videos watched). Retention and understanding come from *retrieval*: recalling, explaining and applying knowledge at spaced intervals. Today a self-directed learner juggles separate tools for notes, flashcards, quizzes, interview prep and language practice, and none of them shares one model of what the learner actually knows.

## 2. Product goal

LearnOS is one workspace where a learner:
1. Structures any subject (path → module → topic → subtopic).
2. Captures knowledge in their own words (notes, examples, mistakes).
3. Turns knowledge into retrieval practice (flashcards, questions, quizzes, mock interviews, writing and speaking tasks).
4. Gets a schedule that says what to review today (FSRS-inspired spaced repetition).
5. Sees **measured understanding** (retention, accuracy, mastery per topic) rather than activity counts.
6. Uses an AI assistant to explain, generate, evaluate and interview, always through a review step and never as a black box.

## 3. Users

| Persona | Need |
|---|---|
| **Self-taught developer** (primary) | Learn PHP/Laravel/MySQL/JS/DSA/system design deeply; prepare for technical interviews |
| **Job seeker** | Mock interviews with follow-ups, a weakness report, and targeted revision before a real interview date |
| **Non-native English professional** | IT vocabulary, professional writing, speaking practice, English interviews |
| **General learner** | Any subject; the methods are subject-agnostic |

The design assumes **multi-user capable, single-user first**: each user owns their content, and the system also ships read-only seeded content (interview banks, vocabulary, English grammar path).

## 4. Learning methodologies → product mechanics

| Method | How LearnOS implements it |
|---|---|
| Active recall | Flashcards and questions show the prompt first; the answer is revealed only after an attempt |
| Spaced repetition | FSRS-inspired scheduler sets `due_at` for every reviewable item per user |
| Feynman technique | "Explain it simply" practice: the user writes an explanation for a topic, the AI rates clarity and gaps, and the result is stored as a `practice_submission` |
| Retrieval practice | Quizzes, the daily review queue, and mock interviews all log performance |
| Interleaved practice | The review queue and "mixed" quizzes draw from several topics in shuffled order |
| Progressive difficulty | Quiz builder picks difficulty from the user's topic mastery and moves up as accuracy rises |
| Practical application | Coding, scenario, debugging and architecture question categories; "practical example" notes |
| Periodic comprehensive assessments | Subject-level assessments, suggested on the dashboard every N weeks per active path |

**Understanding metric:** topic mastery (0–100) = weighted retention (FSRS retrievability of the topic's items) + difficulty-weighted quiz/interview accuracy + coverage (items practised / total items). Reading time never counts toward mastery. See [architecture.md §6](architecture.md).

## 5. Scope

### MVP (phases 0–7, see [roadmap.md](roadmap.md))
- Auth (register, login, logout, password reset), settings (timezone, retention target, daily limits), dark/light theme
- Learning paths: paths, modules, topics, subtopics, levels, resources, completion and mastery
- Knowledge base: Markdown notes with code highlighting, note kinds (explanation, example, snippet, mistake, Feynman, summary), tags, full-text search
- Question bank (manual): all formats and categories, options, explanations, references, tags
- Revision engine: flashcards and question recall, FSRS scheduling, confidence rating, history, forgetting risk, weak topics
- Quiz engine: topic, module, subject and mixed quizzes; random selection; difficulty filter; timed mode; explanations; attempt history
- Dashboard: due reviews, streak, daily and weekly goals, weak topics, recent topics, retention stats
- AI foundation: provider-independent client, explain topic (by level), generate notes, generate questions into a **review queue**, evaluate free-text answers

### Post-MVP (phases 8–10)
- Interview preparation: profiles, mock sessions, follow-ups, coding challenges with AI complexity evaluation, reports, recommended revision
- English: daily vocabulary, vocabulary cards, grammar and reading (seeded path), sentence and paragraph writing with AI feedback, professional communication prompts, speaking practice (browser speech-to-text)
- AI assistant over your own knowledge base (lexical retrieval over notes), knowledge-gap detection, Feynman evaluation, scheduled comprehensive assessments

### Future (not planned in detail)
- Semantic search and embeddings; sandboxed code execution; FSRS parameter optimization per user; pronunciation scoring through a speech provider; Anki import and Markdown export; sharing and cloning content between users; PWA/offline; email and push reminders; realtime streaming (Reverb); admin UI for system content.

## 6. Missing or ambiguous requirements (assumptions made)

| # | Gap | Assumption in this design | Needs your decision? |
|---|---|---|---|
| 1 | Single-user tool or multi-user SaaS? | Multi-user data model; registration can be turned off by config | **Yes** |
| 2 | "Separate reusable content from performance data": who provides the reusable content? | Content rows have nullable `user_id`; `NULL` = system content (seeded, read-only to users). All progress is in user-scoped tables | Confirm |
| 3 | Timezone and day boundary for streaks and daily goals | `users.timezone`; a "day" is the user's local calendar day | No |
| 4 | Which AI provider(s), monthly budget, and privacy of sending notes to an external LLM | Provider configurable; per-user daily token cap; a settings toggle allows notes in AI context | **Yes** (provider) |
| 5 | Coding challenges: execute code? | **No execution in MVP or Phase 8.** AI evaluates correctness and complexity. A sandbox (e.g. Judge0) is a future item | **Yes** |
| 6 | Speaking and pronunciation: how is audio assessed? | Phase 9 uses the browser Web Speech API (best in Chrome) for transcripts and AI feedback on the transcript. True pronunciation scoring is future | Confirm |
| 7 | "Upcoming interviews": real interviews or scheduled mock sessions? | Both: `interview_profiles.target_date` (real interview) and `interview_sessions.scheduled_at` (planned mock) | Confirm |
| 8 | Reminders and notifications | Out of MVP; the dashboard shows due counts | No |
| 9 | File uploads for resources | MVP resources are links only; uploads (local disk, size cap) come later | No |
| 10 | Rich text vs Markdown | Markdown is the stored format; the editor has a formatting toolbar and live preview | **Yes** |
| 11 | Question edits after attempts exist | Attempts reference the live question; editing a used question is allowed but deleting one is soft-only. Versioning is future | No |
| 12 | Account deletion and data export | Account deletion cascades all user data (MVP). JSON export is future | No |
| 13 | Accessibility and i18n | WCAG AA basics (keyboard and contrast); UI in English only | No |
| 14 | Admin role | None in MVP; system content comes from seeders | No |

## 7. Success criteria
- A user can go from an empty account to a daily review queue in under 10 minutes (create path → topic → note → cards).
- The review queue for 5,000 scheduled items loads in < 300 ms (indexed `(user_id, due_at)`).
- Every endpoint enforces ownership: a feature test proves 403/404 for another user's data.
- The FSRS scheduler matches reference test vectors within tolerance.
- No AI-generated question reaches the bank without explicit approval.
