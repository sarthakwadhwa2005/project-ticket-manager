# AI Notes

## Tools used

- **Claude Code**: Used for the initial Phase 1-2 backend work, including the
  Prisma schema/seed, services, API routes, and React Query hooks.
- **GitHub Copilot**: Used for the Prisma migration, backend bug fixes, UI
  implementation, browser-flow verification, and README/documentation work.
- **Claude chat**: Used for planning, prompts, and reviewing the requested
  requirements.

## Changed, rejected, or improved suggestions

The first AI-generated version of the project list computed ticket counts from
only the four “recent tickets” it fetched, so projects with more than four
tickets showed incorrect counts. I noticed this while reviewing the service
code and replaced it with a Prisma `groupBy` over all tickets, so counts remain
accurate regardless of how many tickets a project has.
