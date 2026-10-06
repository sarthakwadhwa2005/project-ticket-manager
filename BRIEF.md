You are building a take-home assignment: a small Project & Ticket management app. Read the whole brief before writing code. Work through the phases in 3 batches: (A) phases 1-2, (B) phases 3-4, (C) phases 5-6. Do not stop between phases inside a batch. After each batch, commit, then give me a short summary and how to verify it. Skip the Vitest tests unless time remains. Keep the UI simple.s

## Stack (fixed)
- Next.js (App Router) + TypeScript (strict mode), backend implemented as Route Handlers inside the same Next.js app, with a clear separation of layers
- PostgreSQL (hosted on Neon, free tier) with Prisma ORM. Do NOT use SQLite (it won't persist on Vercel).
- Zod for validation, shared between API and forms
- TanStack Query for client data fetching, caching and invalidation
- Tailwind CSS for styling (simple, clean, responsive; visual design is not the focus)
- Deployed to Vercel

## Product requirements

### Dashboard (/)
- Show all projects as large cards. Each card shows: name, short description, ticket counts grouped by status (Todo / In Progress / Done), a small selection (3-4) of recent tickets, an "Open project" link, and a "+" button that opens a create-ticket modal pre-bound to that project.
- A "New project" button opens a create-project modal.
- After any create/update, the dashboard must reflect the latest saved state with no manual browser refresh (use TanStack Query invalidation on mutation success).

### Create project
- Fields: name (required), description (required), GitHub repo (optional; accept either a full URL like https://github.com/vercel/next.js or "owner/repo"; normalize and store as "owner/repo"; reject invalid formats with a clear message).
- Persisted in DB and appears immediately.

### Project screen (/projects/[id])
- Project info, summary and ticket counts
- Full list of that project's tickets
- Debounced search box + status filter + priority filter, all working together, all executed by the BACKEND (query params), not by filtering loaded data on the client
- Open/edit an existing ticket (modal or dedicated page, your choice, keep it simple)
- Create a new ticket
- "Repository Insights" section when a repo is configured

### Tickets
- Fields: title, description, status (TODO | IN_PROGRESS | DONE), priority (LOW | MEDIUM | HIGH), createdAt, updatedAt
- Create and edit. updatedAt must change on every update.
- After saving and navigating back, project screen and dashboard show updated data without a refresh.

### GitHub Repository Insights
- Fetched ONLY through our backend (frontend never calls GitHub directly)
- Show: stars, forks, open issues, last updated/pushed, primary language, and one more useful metric (e.g. watchers or license)
- Cache each repo's data for 5 minutes. Use a DB-backed cache table (RepoCache: repo unique, data Json, fetchedAt) because in-memory caches are unreliable on serverless. Requests within the TTL must return the cached result without calling GitHub. Include a `cached: boolean` and `fetchedAt` in the API response so the behavior is visible/testable.
- Handle gracefully: repo not found (404), GitHub rate limit (403/429), network failure. Return meaningful error responses, and the UI should show an inline error in the insights section without breaking the rest of the page. Support an optional GITHUB_TOKEN env var to raise rate limits. If GitHub fails but a stale cache entry exists, it's acceptable to serve stale data with a `stale: true` flag (document this decision).

### UX states
- Loading skeletons/spinners, empty states (no projects, no tickets, no search results), and error states with retry for failed requests. Toast or inline messages for failed mutations. Disable submit buttons while saving.

## Backend API (suggested; keep it consistent)
- GET /api/projects -> projects with statusCounts and recent tickets (use a groupBy, avoid N+1 queries)
- POST /api/projects
- GET /api/projects/[id] -> project + statusCounts
- GET /api/projects/[id]/repo -> cached GitHub insights
- GET /api/tickets?projectId=&q=&status=&priority= -> search (case-insensitive over title and description) combined with filters
- POST /api/tickets
- GET /api/tickets/[id]
- PATCH /api/tickets/[id]
Rules:
- Validate every request body and query param with Zod. Return 400 with field-level errors, 404 for missing resources, 502 for upstream GitHub failures, 500 for unexpected errors, using one consistent error response shape: { error: { code, message, details? } }.
- Keep route handlers thin: parse/validate -> call a service function -> map errors to responses. Put logic in src/server/services (projectService, ticketService, githubService). Put shared Zod schemas in src/lib/schemas.ts and a shared error helper in src/lib/errors.ts.
- Validate that a ticket's projectId exists before creating.

## Data model (Prisma)
- Project: id, name, description, repo (String? as "owner/repo"), createdAt, updatedAt
- Ticket: id, projectId (FK, onDelete Cascade), title, description, status enum, priority enum, createdAt, updatedAt; indexes on (projectId, status) and (projectId, updatedAt)
- RepoCache: repo (unique), data (Json), fetchedAt

## Seed
- prisma/seed.ts creating 3 projects (at least 2 with real public repos, e.g. vercel/next.js and prisma/prisma; one without a repo) and 18 tickets with a realistic mix of statuses and priorities. The seed must be idempotent (safe to re-run) and runnable via `npx prisma db seed`.

## Code quality expectations
- TypeScript strict, no `any`. Infer types from Zod schemas and Prisma where possible.
- Folder structure: src/app (routes/pages), src/app/api, src/server/services, src/lib, src/components, src/hooks (React Query hooks), prisma/.
- Centralize query keys in one file; mutations invalidate relevant keys (projects list, project detail, tickets lists).
- Environment variables: DATABASE_URL, DIRECT_URL if needed for Neon, GITHUB_TOKEN (optional). Provide .env.example. Never commit secrets.
- Add a few focused tests (Vitest) for the highest-value logic: repo URL normalization, the GitHub cache TTL behavior (mock fetch and time), and ticket search/filter query building. Keep it small.
- ESLint passes, `npm run build` passes, and no console errors.

## README.md (required deliverable)
Write it for a reviewer. Include: prerequisites; step-by-step local setup (install, env, DB setup, migrate, seed, run); architecture overview; how frontend state and data are handled; data modelling approach; GitHub integration and caching approach; key technical decisions and trade-offs; assumptions, known limitations, incomplete items (be honest); deployment notes with the live URL placeholder; and an "AI usage" section.

AI usage section: also create and maintain AI_NOTES.md as we work. Log (1) which AI tools were used and for what, and (2) any REAL moment where a suggestion you made was changed, rejected or improved by me or by a bug we hit, with the reason. Do not invent examples. If none have occurred by the end, say so and ask me, and I will supply one. At the end, summarize AI_NOTES.md into the README.

## Phases (stop after each for my review; commit after each with a clear conventional commit message)
1. Scaffold the project, Prisma schema, migrations, seed, shared Zod schemas, error helper, .env.example. Verify with `npx prisma db seed`.
2. Backend: services + all API routes + tests for backend logic. Show me example curl commands for each endpoint and confirm they work.
3. Dashboard UI: project cards, counts, recent tickets, create project modal, "+" create ticket modal, loading/empty/error states.
4. Project screen: summary, ticket list, backend search + filters, create/edit ticket, query invalidation behavior verified.
5. GitHub insights UI + cache verification (demonstrate that the second request within 5 minutes returns cached: true), error handling.
6. Polish (responsiveness, accessibility basics like labels and focus handling in modals), README, AI_NOTES.md, final lint/build/test run, and a Vercel deployment checklist (env vars to set, `prisma generate` in build script, `prisma migrate deploy` step).

Before starting phase 1, briefly restate your plan and ask me any blocking questions (for example, my Neon connection string). Do not ask about things you can decide sensibly yourself.