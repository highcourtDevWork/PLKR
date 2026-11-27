# LearnOS – Original Requirements

> The original product spec, word for word. Where sections conflict (Blade vs React, "OpenCode"), the resolutions in `/CLAUDE.md` take precedence.

---

# Project: LearnOS – Personal Learning & Knowledge Retention Platform

## 1. Project Vision

Build a comprehensive personal learning management application called LearnOS.

The application should help users learn any subject, organize knowledge, improve memory retention, practise questions, improve English communication, and prepare for technical and non-technical interviews.

This must not be just a notes application or traditional LMS. It should be a combination of:

- Personal Learning Management System.
- Knowledge Management System.
- AI Learning Assistant.
- Spaced Repetition System.
- Active Recall Platform.
- Question Bank and Quiz Engine.
- Interview Preparation Platform.
- English Communication Learning System.

## 2. Technology Stack

- Backend: Laravel 13
- Language: PHP 8.4+
- Database: MySQL 8
- Frontend: Blade, Tailwind CSS, JavaScript
- API: REST API
- Authentication: Laravel authentication
- AI: Provider-independent LLM integration
- Background jobs: Laravel Queues
- Cache: Redis (optional)
- Version control: Git

Follow Laravel conventions, SOLID principles, clean architecture where appropriate, and maintainable coding practices.

## 3. Core Modules

### Module A: Learning Dashboard
- Overall learning progress.
- Daily and weekly goals.
- Learning streak.
- Pending revision.
- Weak topics.
- Recently studied topics.
- Upcoming interviews.
- Knowledge retention statistics.

### Module B: Learning Path Management
- Create unlimited subjects.
- Create modules within subjects.
- Create topics and subtopics.
- Support beginner, intermediate and advanced levels.
- Track topic completion and mastery.
- Attach learning resources.

### Module C: Knowledge Management
- Rich text notes.
- Markdown support.
- Code snippets.
- Practical examples.
- Personal explanations.
- Mistakes and solutions.
- Searchable knowledge base.
- Tags and categories.

### Module D: Smart Revision Engine
Implement active recall and spaced repetition.

Features:
- Flashcards.
- Question-based recall.
- Confidence rating.
- Revision history.
- Automatically calculated next revision date.
- Weak-topic detection.
- Forgetting-risk indicators.

Use an FSRS-inspired scheduling approach. Keep the scheduling algorithm separate from controllers and make it testable.

### Module E: Question Bank
Support:
- Multiple-choice questions.
- True/false questions.
- Short answers.
- Long answers.
- Coding questions.
- Scenario-based questions.
- Debugging questions.
- Architecture questions.
- Interview questions.

Every question should support:
- Subject.
- Module.
- Topic.
- Difficulty.
- Question category.
- Expected answer.
- Explanation.
- References.
- Tags.

Allow manual question creation and AI-generated questions.

### Module F: Quiz Engine
- Topic-wise quizzes.
- Module-wise quizzes.
- Full subject assessments.
- Random questions.
- Difficulty selection.
- Timed assessments.
- Answer explanations.
- Historical attempts.
- Performance analytics.

### Module G: Interview Preparation
Create configurable interview profiles.

Support:
- PHP interviews.
- Laravel interviews.
- MySQL interviews.
- JavaScript interviews.
- DSA interviews.
- REST API interviews.
- System design interviews.
- Real-world problem-solving interviews.
- Communication interviews.

Include:
- Mock interviews.
- Follow-up questions.
- Coding challenges.
- Time and space complexity evaluation.
- Answer evaluation.
- Interview reports.
- Weakness identification.
- Recommended revision topics.

### Module H: English Learning
- Daily vocabulary.
- Grammar.
- Sentence formation.
- Reading practice.
- Paragraph writing.
- Speaking topics.
- Pronunciation practice.
- Professional communication.
- IT industry vocabulary.
- English interview practice.

### Module I: AI Learning Assistant
Create a provider-independent AI service layer.

Features:
- Explain a topic at different difficulty levels.
- Generate structured learning notes.
- Generate topic-wise questions.
- Evaluate answers.
- Generate practical examples.
- Identify knowledge gaps.
- Create quizzes.
- Conduct mock interviews.
- Explain saved notes.
- Answer questions using the user's own knowledge base.

AI responses should be saved when appropriate, and AI-generated questions must be reviewable before being added to the question bank.

## 4. Important Learning Methodologies

Implement these learning methodologies:

1. Active Recall.
2. Spaced Repetition.
3. Feynman Technique.
4. Retrieval Practice.
5. Interleaved Practice.
6. Progressive Difficulty.
7. Practical Application.
8. Periodic Comprehensive Assessments.

The system should measure actual understanding rather than simply measuring how many pages the user reads.

## 5. Database Architecture

Design normalized database tables for:

- Users.
- Learning paths.
- Modules.
- Topics.
- Resources.
- Notes.
- Flashcards.
- Questions.
- Question options.
- Quizzes.
- Quiz attempts.
- User answers.
- Revision schedules.
- Revision logs.
- Interview sessions.
- Interview responses.
- Learning goals.
- Vocabulary.
- Speaking practice.
- AI conversations.

Use appropriate foreign keys, indexes, unique constraints, transactions and soft deletes where appropriate.

Separate reusable learning content from individual user performance data.

## 6. Software Engineering Requirements

- Use Laravel best practices.
- Keep controllers thin.
- Use Form Requests for validation.
- Use service classes for complex business logic.
- Use policies and authorization.
- Use Eloquent relationships properly.
- Avoid N+1 queries.
- Apply database indexing based on query patterns.
- Use transactions where necessary.
- Use queues for expensive background processing.
- Implement API resources.
- Follow consistent naming conventions.
- Write unit and feature tests.
- Use secure authentication and authorization.
- Avoid unnecessary abstractions and overengineering.

## 7. UI/UX Requirements

Build a modern, professional, responsive application.

Include:
- Sidebar navigation.
- Learning dashboard.
- Subject and topic tree.
- Notes editor.
- Flashcard interface.
- Interactive quiz interface.
- Interview workspace.
- AI assistant interface.
- Analytics dashboard.
- Dark and light themes.

Keep the interface clean and easy to navigate.

## 8. Development Strategy

Do not build the entire application in one step.

First analyze the requirements and prepare:

1. Product Requirement Document.
2. Complete module breakdown.
3. Database ER diagram.
4. Database table definitions.
5. Application architecture.
6. Laravel folder structure.
7. API endpoint documentation.
8. UI page structure.
9. Development roadmap.
10. Testing strategy.

Then implement the project phase by phase.

For every phase:
- Explain the objective.
- Identify affected modules and tables.
- Explain the implementation.
- Write maintainable code.
- Add migrations and seeders.
- Implement validation and authorization.
- Add tests.
- Review performance and security.
- Update technical documentation.

Do not modify unrelated modules without explaining why.

## 9. Development Rules for OpenCode

Before implementing any feature:

1. Inspect the existing codebase.
2. Understand existing architecture.
3. Identify dependencies and affected files.
4. Explain the proposed solution.
5. Consider database performance.
6. Consider time and space complexity where relevant.
7. Implement the smallest maintainable solution.
8. Test existing functionality for regressions.

Never generate unnecessary files or duplicate existing functionality.

## 10. First Task

For now, DO NOT write application code.

Act as a senior product architect and Laravel system designer.

Analyze the entire LearnOS requirement and produce:

- Complete system architecture.
- ER diagram.
- Database schema.
- Module dependencies.
- User workflows.
- Page and navigation structure.
- API design.
- Phase-wise implementation plan.
- Potential technical challenges.
- MVP scope versus future features.

Identify missing requirements and explain important architectural decisions.

Wait for my approval before starting implementation.

## 11. Frontend Architecture – React

The frontend must use React, not Laravel Blade.

Technology requirements:

- React with TypeScript.
- Vite for frontend development and production builds.
- Tailwind CSS for styling.
- React Router for navigation.
- TanStack Query for server-state management.
- Zustand for lightweight global client state.
- React Hook Form for forms.
- Zod for frontend validation.
- Axios for API communication.
- Reusable component architecture.

Frontend requirements:

1. Organize code by business feature.
2. Keep API calls separate from UI components.
3. Create reusable hooks for API operations.
4. Use TypeScript interfaces for API responses.
5. Implement loading, error and empty states.
6. Protect authenticated routes.
7. Implement responsive layouts.
8. Support dark and light themes.
9. Avoid unnecessary global state.
10. Use lazy loading for major application modules.

## 12. Backend and Frontend Integration

- Laravel must operate as a standalone REST API.
- React must communicate with Laravel through JSON APIs.
- Use Laravel Sanctum for authentication.
- Prefer secure cookie-based authentication for a same-site deployment.
- Configure CORS and CSRF correctly.
- Use API Resources for consistent responses.
- Implement pagination, filtering and sorting.
- Implement centralized API error handling.
- Use versioned API routes such as /api/v1.
- Never expose LLM API keys in React.
- Perform AI requests through Laravel.
- Validate all incoming requests on the backend.
- Enforce authorization on the backend regardless of frontend route protection.

## 13. Development and Deployment

Develop frontend and backend independently.

Development:
- React Vite development server.
- Laravel API server.
- MySQL database.
- Optional Redis.

Production:
- Build React into static assets.
- Serve React using Apache or Nginx.
- Serve Laravel API separately.
- Configure HTTPS.
- Configure environment variables independently.
- Never commit production secrets.

Keep frontend and backend API contracts documented and synchronized.
