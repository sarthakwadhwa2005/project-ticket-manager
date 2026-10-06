import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/server/services/projectService';
import { projectParamsSchema } from '@/lib/schemas';
import { validationError, notFound, internalError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = projectParamsSchema.safeParse({ id });

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json(notFound('Project'), { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(internalError('Failed to fetch project'), { status: 500 });
  }
}