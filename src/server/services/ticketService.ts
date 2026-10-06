import { prisma } from '@/lib/prisma';
import { CreateTicketInput, UpdateTicketInput, TicketQuery } from '@/lib/schemas';

export async function getTickets(query: TicketQuery) {
  const { projectId, q, status, priority, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (projectId) {
    where.projectId = projectId;
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return ticket;
}

export async function createTicket(data: CreateTicketInput) {
  const ticket = await prisma.ticket.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return ticket;
}

export async function updateTicket(id: string, data: UpdateTicketInput) {
  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return ticket;
}

export async function deleteTicket(id: string) {
  await prisma.ticket.delete({
    where: { id },
  });
}