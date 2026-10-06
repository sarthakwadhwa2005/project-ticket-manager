# AI Usage Notes

## Current Session

### AI Tools Used
- **Claude Code (this session)**: Full implementation of Phase 1-2 (backend services, API routes, React Query hooks, Prisma setup)

### Work Performed (Batch A - Phases 1-2)
1. Scaffolded Next.js 16 project with TypeScript and Tailwind
2. Installed dependencies: @tanstack/react-query, prisma@5, @prisma/client, zod, react-hook-form, date-fns
3. Created Prisma schema with Project, Ticket, RepoCache models and enums
4. Set up migrations using `prisma migrate reset` (to baseline existing tables from `db push`)
5. Created shared Zod schemas in `src/lib/schemas.ts`
6. Created error helpers in `src/lib/errors.ts`
7. Created services: projectService, ticketService, githubService
8. Created API routes:
   - GET/POST /api/projects
   - GET /api/projects/[id]
   - GET /api/projects/[id]/repo
   - GET/POST /api/tickets
   - GET/PATCH/DELETE /api/tickets/[id]
9. Created React Query hooks: useProjects, useTickets, useGithub
10. Created query keys in src/lib/query-keys.ts

### Bugs Fixed During Implementation
1. **Prisma version**: Downgraded from Prisma 8 (new CLI) to Prisma 5 (stable CLI) because migrate commands worked differently
2. **Zod v4 API**: Changed `.error.errors` to `.error.issues` throughout all route files (Zod 4 changed the API)
3. **JSON type error**: Fixed Prisma JSON type compatibility in githubService by casting data properly
4. **Build error**: Removed prisma.config.ts which was auto-generated and causing TypeScript errors

### Testing Performed
- Verified seed creates 3 projects and 18 tickets
- Tested all API endpoints:
  - GET /api/projects ✓
  - GET /api/projects/[id] ✓
  - GET /api/tickets?projectId=&q=&status= ✓
  - POST /api/tickets ✓
  - PATCH /api/tickets/[id] ✓
  - GET /api/projects/[id]/repo ✓ (first call: cached=false, second call: cached=true)
- Verified GitHub cache works correctly (5-minute TTL)

### Commands Run
```bash
# Database setup
npx prisma db pull                    # Check existing tables
npx prisma migrate reset --force      # Reset and create migrations
npx prisma db seed                    # Run seed script

# Development
npm run dev                           # Start dev server
npm run build                         # Build for production
```

### Notes
- Using Prisma 5.22.0 for stable CLI (Prisma 8 has different CLI structure)
- DATABASE_URL (pooled) and DIRECT_URL configured in .env for Neon
- Build script includes `prisma generate && prisma migrate deploy` for Vercel