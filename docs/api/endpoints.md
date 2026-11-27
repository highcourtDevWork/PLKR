# LearnOS API – Endpoint Map (v1)

All paths are relative to `/api/v1`. Conventions are in [README.md](README.md). **Ph** = the implementation phase that delivers the endpoint ([roadmap](../roadmap.md)).

## Auth & account (Ph 0)
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Register (can be disabled by config) |
| POST | `/auth/login` | Session login (throttled) |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` · `/auth/reset-password` | Password reset |
| GET | `/me` | Current user + settings |
| PATCH | `/me/settings` | timezone, desired_retention, daily limits, ai_use_notes_context |
| PUT | `/auth/user/password` | Change password (Fortify) |
| DELETE | `/me` | Delete account (password confirm) |

## Learning paths (Ph 1, built; exact contract in [learning-paths.md](learning-paths.md))
| Method | Path | Notes |
|---|---|---|
| GET | `/learning-paths` | Own + system. `filter[title]`, `filter[is_system]`, `sort`. Includes `modules_count`, `topics_count`, `completed_topics_count` |
| POST | `/learning-paths` | |
| POST | `/learning-paths/reorder` | `{ ids }` of all own paths |
| GET | `/learning-paths/{path}` | Always returns the modules → topics → subtopics tree with the user's progress |
| PATCH / DELETE | `/learning-paths/{path}` | DELETE soft-deletes children |
| POST | `/learning-paths/{path}/modules` | |
| POST | `/learning-paths/{path}/modules/reorder` | `{ ids }` |
| PATCH / DELETE | `/modules/{module}` | |
| POST | `/modules/{module}/topics` | `parent_id` optional (depth ≤ 2) |
| POST | `/modules/{module}/topics/reorder` | `{ ids }` of one sibling group |
| GET / PATCH / DELETE | `/topics/{topic}` | GET includes breadcrumb, progress, subtopics, own `resources_count`. Note/card/question counts arrive with those modules |
| PUT | `/topics/{topic}/progress` | `{ status }` (manual completion; mastery is computed) |
| GET / POST | `/topics/{topic}/resources` | Own resources only |
| PATCH / DELETE | `/resources/{resource}` | |

## Tags & search (Ph 2)
| Method | Path | Notes |
|---|---|---|
| GET / POST | `/tags` | |
| PATCH / DELETE | `/tags/{tag}` | |
| GET | `/search?q=` | Notes, questions and topics; grouped top results (FULLTEXT) |

## Notes (Ph 2)
| Method | Path | Notes |
|---|---|---|
| GET | `/notes` | `filter[topic_id]`, `filter[kind]`, `filter[tag]`, `filter[q]`, `filter[pinned]`; `sort=-updated_at,title` |
| POST | `/notes` | `tag_ids[]` |
| GET / PATCH / DELETE | `/notes/{note}` | |
| POST | `/notes/{note}/flashcards` | Create cards from a note (manual list in body) |

## Questions (Ph 3; AI review Ph 7)
| Method | Path | Notes |
|---|---|---|
| GET | `/questions` | `filter[topic_id|module_id|learning_path_id]`, `filter[type]`, `filter[category]`, `filter[difficulty]`, `filter[status]`, `filter[source]`, `filter[tag]`, `filter[q]`; `include=options,tags` |
| POST | `/questions` | With `options[]` in one transaction |
| GET / PATCH / DELETE | `/questions/{question}` | PATCH replaces options |
| POST | `/questions/{question}/revision` | Add to the revision queue |
| GET | `/questions/review-queue` | AI-generated `pending_review` questions |
| POST | `/questions/review` | `{ approve: [ids], reject: [ids] }` (batch, transactional) |

## Revision (Ph 4)
| Method | Path | Notes |
|---|---|---|
| GET | `/flashcards` | `filter[topic_id]`, `filter[q]`, `filter[tag]` |
| POST | `/flashcards` | Also creates a revision schedule (state new) |
| GET / PATCH / DELETE | `/flashcards/{card}` | |
| GET | `/revision/queue` | `?limit=50&topic_id=&learning_path_id=`. Due + new (respects daily limits), interleaved. Each item includes its schedule + forgetting risk |
| POST | `/revision/reviews` | `{ schedule_id, rating 1-4, duration_ms, answer? }` → updated schedule + next due |
| GET | `/revision/schedules` | Browse the user's scheduled items with `filter[state]`, `filter[risk]`, `sort=due_at` |
| PATCH | `/revision/schedules/{schedule}` | `{ is_suspended }`, reset |
| GET | `/revision/logs` | History: `filter[from]`, `filter[to]`, `filter[topic_id]` |
| GET | `/revision/forecast` | Due counts per day for the next 30 days |

## Quizzes (Ph 5)
| Method | Path | Notes |
|---|---|---|
| GET / POST | `/quizzes` | Saved quiz definitions |
| GET / PATCH / DELETE | `/quizzes/{quiz}` | |
| POST | `/quiz-attempts` | `{ quiz_id }` or an ad-hoc `{ scope_type, scope_id, question_count, difficulty, types, time_limit_seconds, mode }` → attempt with questions (**correct answers hidden**) |
| GET | `/quiz-attempts` | History: `filter[status]`, `filter[quiz_id]`, `sort=-submitted_at` |
| GET | `/quiz-attempts/{attempt}` | During the attempt: questions + saved answers. After submission: plus correctness, explanations, feedback |
| PUT | `/quiz-attempts/{attempt}/answers/{question}` | Save an answer (rejected after `expires_at` → 409) |
| POST | `/quiz-attempts/{attempt}/submit` | Auto-grades objective answers; open answers → self-grade or queued AI grading (status `grading`) |
| POST | `/quiz-attempts/{attempt}/answers/{question}/self-grade` | `{ score 0–1 }` for open answers without AI |

## Dashboard, progress & goals (Ph 6)
| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard` | due_today, new_available, streak, goals progress, weak_topics[5], recent_topics[5], upcoming_interviews, retention summary, suggested assessment |
| GET | `/analytics/activity` | `?from=&to=` `study_days` series (heatmap) |
| GET | `/analytics/retention` | Retention by path and topic; forgetting-risk distribution |
| GET | `/analytics/quizzes` | Accuracy trend, by difficulty and by category |
| GET | `/analytics/weak-topics` | Paginated, with reasons |
| GET / POST | `/goals` | |
| PATCH / DELETE | `/goals/{goal}` | |

## AI (Ph 7, KB Q&A Ph 10)
| Method | Path | Notes |
|---|---|---|
| POST | `/ai/explain` | `{ topic_id or text, level: eli5|beginner|intermediate|advanced, save_as_note? }` (sync) |
| GET / POST | `/ai/conversations` | `purpose`, optional context topic or note |
| GET / DELETE | `/ai/conversations/{conversation}` | With messages (paginated, newest last) |
| POST | `/ai/conversations/{conversation}/messages` | Send a user turn → assistant reply (sync, throttled). `use_knowledge_base` flag (Ph 10) |
| POST | `/ai/generations` | `{ kind: questions|notes|flashcards|examples, topic_id, params }` → 202 |
| GET | `/ai/generations` · `/ai/generations/{generation}` | Status, output summary, created ids |
| GET | `/ai/usage` | Today's tokens vs budget |

## Interviews (Ph 8)
| Method | Path | Notes |
|---|---|---|
| GET / POST | `/interview-profiles` | System templates + own |
| GET / PATCH / DELETE | `/interview-profiles/{profile}` | |
| POST | `/interview-sessions` | `{ profile_id, scheduled_at? }`. Starts now unless scheduled |
| GET | `/interview-sessions` | `filter[status]`, `sort=-started_at` |
| GET | `/interview-sessions/{session}` | Responses tree + report |
| POST | `/interview-sessions/{session}/start` | |
| POST | `/interview-sessions/{session}/responses` | Answer the current prompt → evaluation + next prompt (follow-up or new question) |
| POST | `/interview-sessions/{session}/finish` | Queues the report → 202 |
| POST | `/interview-sessions/{session}/recommendations/apply` | Adds the recommended topics' items to the revision queue |

## English (Ph 9)
| Method | Path | Notes |
|---|---|---|
| GET | `/english/daily-words` | Today's words (introduced lazily, idempotent per local day) |
| GET | `/vocabulary` | `filter[domain]`, `filter[cefr_level]`, `filter[status]`, `filter[q]` |
| POST | `/vocabulary` | Own word |
| PATCH | `/vocabulary/{word}/status` | `{ status }`; `learning` creates a flashcard + schedule |
| GET | `/practice-prompts` | `filter[kind]`, `filter[level]` |
| POST | `/practice-submissions` | `{ prompt_id?, kind, response_text | transcript }` → 202 when AI evaluation is queued |
| GET | `/practice-submissions` · `/practice-submissions/{submission}` | History + evaluation |
