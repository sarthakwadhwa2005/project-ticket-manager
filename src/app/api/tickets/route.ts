import { NextRequest, NextResponse } from 'next/server';
import { getTickets, createTicket } from '@/server/services/ticketService';
import { createTicketSchema, ticketQuerySchema } from '@/lib/schemas';
import { validationError, notFound, internalError } from '@/lib/errors';
import { checkProjectExists } from '@/server/services/projectService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const result = ticketQuerySchema.safeParse(searchParams);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    const data = await getTickets(result.data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(internalError('Failed to fetch tickets'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createTicketSchema.safeParse(body);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    // Validate that project exists
    const projectExists = await checkProjectExists(result.data.projectId);
    if (!projectExists) {
      return NextResponse.json(notFound('Project'), { status: 404 });
    }

    const ticket = await createTicket(result.data);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(internalError('Failed to create ticket'), { status: 500 });
  }
}