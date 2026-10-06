import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, updateTicket, deleteTicket } from '@/server/services/ticketService';
import { ticketParamsSchema, updateTicketSchema } from '@/lib/schemas';
import { validationError, notFound, internalError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = ticketParamsSchema.safeParse({ id });

    if (!result.success) {
      const details = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    const ticket = await getTicketById(id);

    if (!ticket) {
      return NextResponse.json(notFound('Ticket'), { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(internalError('Failed to fetch ticket'), { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paramsResult = ticketParamsSchema.safeParse({ id });

    if (!paramsResult.success) {
      const details = paramsResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    const body = await request.json();
    const bodyResult = updateTicketSchema.safeParse(body);

    if (!bodyResult.success) {
      const details = bodyResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    const existingTicket = await getTicketById(id);
    if (!existingTicket) {
      return NextResponse.json(notFound('Ticket'), { status: 404 });
    }

    const ticket = await updateTicket(id, bodyResult.data);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(internalError('Failed to update ticket'), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = ticketParamsSchema.safeParse({ id });

    if (!result.success) {
      const details = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json(notFound('Ticket'), { status: 404 });
    }

    await deleteTicket(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(internalError('Failed to delete ticket'), { status: 500 });
  }
}