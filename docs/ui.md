# LearnOS – Pages, Navigation & User Workflows

## Layout

```
┌──────────────┬──────────────────────────────────────────────────────┐
│ LearnOS      │ Topbar: breadcrumbs · ⌘K search · AI ✦ · theme · user │
│──────────────├──────────────────────────────────────────────────────│
│ ▣ Dashboard  │                                                      │
│ ◷ Review (12)│                 page content                         │
│ ▤ Paths  ▸   │                                                      │
│   └ tree     │                                                      │
│ ✎ Notes      │                                                      │
│ ? Questions  │                                                      │
│ ✓ Quizzes    │                                                      │
│ ☺ Interviews │                                                      │
│ Aa English   │                                                      │
│ ✦ Assistant  │                                                      │
│ ▥ Analytics  │                                                      │
│──────────────│                                                      │
│ ⚙ Settings   │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘
```
- The sidebar collapses to icons on tablets and becomes a drawer on mobile. The **Review** item shows the due count.
- The Paths item expands into the subject → module → topic tree (lazy-loaded per path).
- ⌘K / Ctrl+K opens global search (topics, notes, questions).
- The AI ✦ button opens the assistant in a side panel with the current page's context (topic or note).
- Theme: light, dark or system, stored in `localStorage` via a Zustand store and applied as the `dark` class on `<html>`.

## Route map (each feature is lazy-loaded)

| Route | Page | Phase |
|---|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth (guest only) | 0 |
| `/` | Dashboard | 0 (shell) → 6 |
| `/paths` | Paths grid (own + system) | 1 |
| `/paths/:pathId` | Path overview: modules and topics tree, progress bars, levels | 1 |
| `/topics/:topicId` | **Topic workspace** with tabs: Overview · Notes · Flashcards · Questions · Resources · Progress | 1–5 |
| `/notes`, `/notes/new`, `/notes/:id` | Knowledge base list and editor (split Markdown/preview) | 2 |
| `/questions`, `/questions/new`, `/questions/:id` | Question bank with a filter sidebar | 3 |
| `/questions/review` | AI-generated questions awaiting approval | 7 |
| `/review` | **Review session**: one card at a time, reveal, rate 1–4, progress bar | 4 |
| `/review/schedules` | Scheduled items, risk, suspend | 4 |
| `/quizzes` | Saved quizzes + "Quick quiz" builder | 5 |
| `/quizzes/attempts/:id` | **Quiz player** (timer, navigator, autosave) → results | 5 |
| `/quizzes/history` | Attempt history | 5 |
| `/analytics` | Activity heatmap, retention, accuracy trends, weak topics | 6 |
| `/goals` | Goals (or inside Settings) | 6 |
| `/assistant`, `/assistant/:conversationId` | AI chat (modes: explain, ask my notes, tutor) | 7 / 10 |
| `/interviews` | Profiles, upcoming (target dates, scheduled mocks), past sessions | 8 |
| `/interviews/sessions/:id` | **Interview workspace**: prompt, answer box or code editor, complexity fields, timer, follow-ups | 8 |
| `/interviews/sessions/:id/report` | Report: rubric radar, strengths and weaknesses, recommended revision | 8 |
| `/english` | Today: daily words, writing prompt, speaking prompt | 9 |
| `/english/vocabulary`, `/english/practice/:kind`, `/english/history` | | 9 |
| `/settings` | Profile, study settings, AI and privacy, theme, account deletion | 0 → 6 |

Every data view has **Skeleton** (loading), **ErrorState** with a retry button, and **EmptyState** with a primary call to action (e.g. "No notes yet — write your first note").

## Key screens

**Dashboard:** row 1: due today · streak · today's goal ring · retention %. Row 2: "Start review" call to action, weak topics (with "practise" buttons), recently studied. Row 3: upcoming interviews, suggested assessment, 30-day forecast.

**Topic workspace:** header with level badge, mastery ring, status toggle and "Ask AI ✦" (explain at a chosen level). Tabs reuse the feature lists filtered by `topic_id`.

**Review session:** a full-focus view (sidebar hidden) with the front of the card and an optional typed answer. On reveal it shows the back, the user's answer, and four buttons with the projected next interval ("Again <10m · Hard 2d · Good 5d · Easy 12d"). Keyboard shortcuts: Space to reveal, 1–4 to rate.

**Quiz player:** question navigator, server-synced countdown, answers autosaved on change (debounced), submit confirmation listing unanswered questions. Results show per-question correctness and explanations, plus an "Add wrong ones to revision" button.

## User workflows

1. **Onboarding:** register → set timezone and daily limits → choose "Start from a system path" (e.g. Laravel interview prep) or "Create my own path" → dashboard.
2. **Learn a topic:** Paths → path → topic → read resources → write notes in your own words (Feynman kind) → turn key points into flashcards → mark the topic "in progress".
3. **Daily loop:** dashboard → Start review (due + new, interleaved) → rate each card → dashboard updates streak and goals → do the weak-topic quick quiz.
4. **Quiz:** Quizzes → Quick quiz (scope, count, difficulty, timer) → answer → submit → review explanations → add misses to revision → mastery updates (async).
5. **AI generation:** topic → "Generate questions ✦" (count, difficulty, types) → queued toast → notification badge on Questions → review screen: edit, approve or reject each → approved questions enter the bank.
6. **Mock interview (Ph 8):** Interviews → choose profile (e.g. Laravel, mid-level, 30 min) → session: answer → AI follow-up → coding prompt with complexity fields → finish → report → "Add recommended topics to revision".
7. **English daily (Ph 9):** English → 5 daily words (add to learning → flashcards) → write a paragraph on a prompt → AI feedback (grammar, vocabulary, tone, corrected version) → optional speaking prompt (browser speech-to-text → feedback).
8. **Ask my notes (Ph 10):** Assistant → "Ask my knowledge base" → answer citing your notes → open a cited note.
