import { PrismaClient, TicketStatus, TicketPriority } from '@prisma/client';

const prisma = new PrismaClient();

const projects = [
  {
    name: 'Next.js',
    description: 'The React Framework for the Web',
    repo: 'vercel/next.js',
  },
  {
    name: 'Prisma',
    description: 'Next-generation ORM for TypeScript and JavaScript',
    repo: 'prisma/prisma',
  },
  {
    name: 'Internal Tool',
    description: 'Custom internal tooling project',
    repo: null,
  },
];

const tickets = [
  // Next.js tickets (6 tickets)
  { projectIndex: 0, title: 'Add new documentation page', description: 'Create a guide for the new API', status: 'TODO', priority: 'MEDIUM' },
  { projectIndex: 0, title: 'Fix hydration error', description: 'Some pages show hydration mismatch', status: 'IN_PROGRESS', priority: 'HIGH' },
  { projectIndex: 0, title: 'Improve bundle size', description: 'Reduce initial bundle size by 10%', status: 'TODO', priority: 'LOW' },
  { projectIndex: 0, title: 'Update dependencies', description: 'Update all npm dependencies', status: 'DONE', priority: 'LOW' },
  { projectIndex: 0, title: 'Add dark mode support', description: 'Implement dark mode toggle', status: 'IN_PROGRESS', priority: 'MEDIUM' },
  { projectIndex: 0, title: 'Fix security vulnerability', description: 'Update packages with CVE', status: 'DONE', priority: 'HIGH' },

  // Prisma tickets (6 tickets)
  { projectIndex: 1, title: 'Add migration system', description: 'Implement database migration tool', status: 'IN_PROGRESS', priority: 'HIGH' },
  { projectIndex: 1, title: 'Improve query performance', description: 'Optimize generated queries', status: 'TODO', priority: 'MEDIUM' },
  { projectIndex: 1, title: 'Add support for PostgreSQL', description: 'Full PostgreSQL integration', status: 'DONE', priority: 'HIGH' },
  { projectIndex: 1, title: 'Write documentation', description: 'API reference and tutorials', status: 'IN_PROGRESS', priority: 'MEDIUM' },
  { projectIndex: 1, title: 'Fix type inference bug', description: 'Generic types not inferring correctly', status: 'TODO', priority: 'HIGH' },
  { projectIndex: 1, title: 'Add VS Code extension', description: 'Syntax highlighting and autocomplete', status: 'TODO', priority: 'LOW' },

  // Internal Tool tickets (6 tickets)
  { projectIndex: 2, title: 'Setup project structure', description: 'Initialize Next.js project with TypeScript', status: 'DONE', priority: 'HIGH' },
  { projectIndex: 2, title: 'Design database schema', description: 'Define models and relationships', status: 'DONE', priority: 'HIGH' },
  { projectIndex: 2, title: 'Implement authentication', description: 'Add user login and signup', status: 'TODO', priority: 'HIGH' },
  { projectIndex: 2, title: 'Create dashboard UI', description: 'Main dashboard with project cards', status: 'TODO', priority: 'MEDIUM' },
  { projectIndex: 2, title: 'Add API endpoints', description: 'REST API for projects and tickets', status: 'IN_PROGRESS', priority: 'MEDIUM' },
  { projectIndex: 2, title: 'Add search functionality', description: 'Search across tickets and projects', status: 'TODO', priority: 'LOW' },
];

async function main() {
  console.log('Starting seed...');

  // Clear existing data (idempotent)
  await prisma.ticket.deleteMany();
  await prisma.project.deleteMany();
  await prisma.repoCache.deleteMany();

  console.log('Cleared existing data');

  // Create projects
  const createdProjects = await Promise.all(
    projects.map((project) =>
      prisma.project.create({
        data: project,
      })
    )
  );

  console.log(`Created ${createdProjects.length} projects`);

  // Create tickets
  const createdTickets = await Promise.all(
    tickets.map((ticket) =>
      prisma.ticket.create({
        data: {
          projectId: createdProjects[ticket.projectIndex].id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status as TicketStatus,
          priority: ticket.priority as TicketPriority,
        },
      })
    )
  );

  console.log(`Created ${createdTickets.length} tickets`);

  // Verify counts
  for (const project of createdProjects) {
    const count = await prisma.ticket.count({
      where: { projectId: project.id },
    });
    console.log(`Project "${project.name}": ${count} tickets`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });