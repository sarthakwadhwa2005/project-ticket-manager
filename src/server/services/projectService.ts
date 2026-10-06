import { prisma } from '@/lib/prisma';
import { CreateProjectInput, normalizeRepo } from '@/lib/schemas';
import { notFound } from '@/lib/errors';
import type { ErrorResponse } from '@/lib/errors';

export async function getAllProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { tickets: true },
      },
      tickets: {
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          updatedAt: true,
        },
      },
    },
  });

  // Group tickets by status
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    repo: project.repo,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    ticketCounts: {
      TODO: project.tickets.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: project.tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      DONE: project.tickets.filter((t) => t.status === 'DONE').length,
      total: project._count.tickets,
    },
    recentTickets: project.tickets,
  }));
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tickets: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      _count: {
        select: { tickets: true },
      },
    },
  });

  if (!project) {
    return null;
  }

  const statusCounts = {
    TODO: project.tickets.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: project.tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE: project.tickets.filter((t) => t.status === 'DONE').length,
    total: project._count.tickets,
  };

  return {
    ...project,
    ticketCounts: statusCounts,
  };
}

export async function createProject(data: CreateProjectInput) {
  const normalizedRepo = data.repo ? normalizeRepo(data.repo) : null;

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      repo: normalizedRepo,
    },
  });

  return project;
}

export async function checkProjectExists(id: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });
  return !!project;
}