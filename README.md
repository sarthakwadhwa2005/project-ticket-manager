# Project Ticket Manager

A small Next.js project and ticket manager backed by PostgreSQL and Prisma. The
dashboard summarizes projects and recent tickets, while each project page
supports backend search/filtering and ticket create/edit flows.

## Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database (Neon works well)
- `DATABASE_URL` for pooled application connections
- `DIRECT_URL` for Prisma migrations
- Optional `GITHUB_TOKEN` for higher GitHub API rate limits

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set the database URLs. Do not commit
   `.env` or real credentials.

3. Generate the Prisma client and apply committed migrations:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. Seed the database with three projects and eighteen tickets:

   ```bash
   npx prisma db seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

For production/Vercel builds, `npm run build` runs `prisma generate`,
`prisma migrate deploy`, and `next build`.

## Architecture

- `src/app/`: App Router pages and API route handlers
- `src/components/`: client-side providers, forms, modals, and shared UI
- `src/hooks/`: TanStack React Query data and mutation hooks
- `src/lib/`: Prisma singleton, Zod schemas, query keys, and error helpers
- `src/server/services/`: project, ticket, and GitHub integration logic
- `prisma/`: schema, migration history, and idempotent seed script

API handlers stay thin: they validate input with shared Zod schemas, call a
service, and return the consistent `{ error: { code, message, details? } }`
shape for failures.

## Frontend state

TanStack React Query owns server state. Project and ticket mutations invalidate
the project list, affected project detail, and ticket list queries, so counts,
recent tickets, and ticket lists update without a manual refresh. Search input
is debounced before it becomes a query key; status and priority are sent as
query parameters to the backend rather than filtered in the browser.

Forms use the shared domain shapes and show inline errors. Submit buttons are
disabled while mutations are pending. Modals support labels, Escape-to-close,
initial focus, and focus restoration.

## Data model

Prisma stores:

- `Project`: name, description, optional normalized `owner/repo`
- `Ticket`: project foreign key, title, description, status, priority, and
  timestamps, with indexes for project/status and project/updatedAt
- `RepoCache`: one JSON snapshot per repository and its fetch timestamp

Tickets cascade when their project is deleted. `DIRECT_URL` is configured in
the Prisma datasource so migrations use the direct database connection.

## GitHub integration and caching

The browser calls only `/api/projects/[id]/repo`; the server calls the GitHub
REST API. The project page displays stars, forks, open issues, last pushed
time, primary language, watchers, license, and whether the response is cached
or fresh.

Successful responses are stored in `RepoCache` for five minutes. A request
within that TTL returns `cached: true` and the original `fetchedAt`. Expired
entries are refreshed; if refresh fails, the service can return the stale
snapshot with `stale: true`. Missing repositories, rate limits, and network
failures are presented inline without hiding the project or ticket content.

## Key decisions and trade-offs

- Route handlers and services are separated to keep HTTP concerns out of
  database and GitHub logic.
- React Query invalidation was chosen over manual local state synchronization
  so all dashboard and project views converge on the API response.
- The UI intentionally uses small reusable Tailwind primitives rather than a
  component library; this keeps the assignment focused and lightweight.
- The database cache is used instead of an in-memory cache because the app may
  run on multiple/serverless instances.
- Ticket lists request up to 100 records for this small assignment. A
  production-scale version would add visible pagination controls.

## Assumptions and known limitations

- There is no authentication or authorization; this is a single-user
  take-home application.
- Projects and tickets do not currently have delete UI.
- GitHub repository insights require the configured repository to be public.
- The API supports pagination, but the current project screen requests the
  first 100 tickets and does not expose pagination controls.
- Automated Vitest coverage is not included in the current implementation.

## Deployment notes

Set these Vercel environment variables for the relevant environments:

- `DATABASE_URL`: pooled PostgreSQL URL
- `DIRECT_URL`: direct PostgreSQL URL for migrations
- `GITHUB_TOKEN`: optional GitHub token

The build command already runs migrations before the Next.js build:

```bash
npm run build
```

Ensure the production database is reachable by `DIRECT_URL`, and review
migrations before deploying schema changes. Live URL: **to be added after
deployment**.

## AI usage

The tools used were:

- **Claude Code** for the initial Phase 1-2 backend work, including the Prisma
  schema/seed, services, API routes, and React Query hooks.
- **GitHub Copilot** for the Prisma migration, bug fixes, UI implementation,
  browser-flow verification, and documentation.
- **Claude chat** for planning, prompts, and requirements review.

One changed suggestion was the project status-count implementation. The first
AI-generated version counted only the four recent tickets fetched for each
project, which produced incorrect totals for projects with more than four
tickets. After reviewing the service code, it was replaced with a Prisma
`groupBy` over all tickets. The detailed notes are in
[`AI_NOTES.md`](./AI_NOTES.md).
