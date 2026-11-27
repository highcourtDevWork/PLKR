# LearnOS – Technical Challenges & Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | **Scope** (9 modules, each a product on its own) | Never shipping | Strict phase gating; MVP = Phases 0–7; every module works without AI |
| 2 | **FSRS correctness** (subtle formula errors stay invisible for weeks) | Wrong review timing undermines the core value | Pure class; reference-vector unit tests; weights pinned with source; `revision_logs` keep before/after state, so schedules can be recalculated after a fix |
| 3 | **Timezones / day boundaries** | Broken streaks, goals counted on the wrong day | Store UTC, compute "day" with `users.timezone`; tests around midnight and DST changes |
| 4 | **Sanctum SPA cookie setup** (localhost vs 127.0.0.1, ports, `SESSION_DOMAIN`, stateful domains) | 401/419 loops in dev | Same-origin via Vite proxy (AD-1); always use `localhost`; documented `.env` values; a 419 → refresh-CSRF retry in the Axios interceptor |
| 5 | **AI non-determinism and malformed output** | Broken inserts, bad questions | Structured output + JSON-schema validation; all-or-nothing transaction; human review gate; prompt versions stored |
| 6 | **AI cost and latency** | Surprise bills, slow UI | Queue long tasks; per-user daily token budget + throttle; cheap model for evaluation and stronger model for generation (config) |
| 7 | **Prompt injection** via notes in KB Q&A, or user answers being evaluated | AI follows instructions inside user content; biased grading | Content passed as quoted data with explicit instructions; outputs are data only (never executed or rendered unsanitized); grading rubric in the system prompt; injection tests |
| 8 | **Privacy**: user notes sent to a third-party LLM | Data exposure | `ai_use_notes_context` toggle; only the necessary snippets are sent; provider choice documented |
| 9 | **Coding-question evaluation without execution** | AI misjudges correctness and complexity | UI labels it "AI assessment"; user can dispute (self-grade override); sandbox runner in the future backlog |
| 10 | **MySQL FULLTEXT limits** (min token length 3 in InnoDB, stopwords, no stemming) | "Go", "UI" or "JS" not found | Fall back to `LIKE` for queries shorter than 3 characters; consider `ngram` parser or lowering `innodb_ft_min_token_size`; embeddings in the future |
| 11 | **Markdown XSS** | Account takeover via stored script | `rehype-sanitize` with an allow-list; no raw HTML; tests |
| 12 | **CHECK + FK action restriction in MySQL** on `revision_schedules` | Migration failure | RESTRICT FKs + service-level cleanup (see erd.md); verify in Phase 4 |
| 13 | **Speech recognition support** (Web Speech API is Chromium-only and needs a network) | English speaking unusable in Firefox/Safari | Feature detection, a typed-answer fallback, and a provider-based STT option later |
| 14 | **Rollup drift** (`study_days`, `user_topic_progress`) | Dashboard shows wrong numbers | Writes go only through `ProgressRecorder`; `learnos:rebuild-progress` command; recompute after commit |
| 15 | **Windows/XAMPP dev specifics** | Queue worker not running, path issues | `composer run dev` runs server + queue + logs together; queue `database` driver; document in CLAUDE.md Commands |
| 16 | **Editing questions that have answer history** | Past results show changed content | Accepted for MVP (documented); question versioning in the backlog; deletes are soft only |
| 17 | **Local MySQL 9.7 vs production MySQL 8** | Using features that don't exist in 8 (e.g. `VECTOR`) | Target 8.0 features only; run the test suite on MySQL 8 in CI before release |
