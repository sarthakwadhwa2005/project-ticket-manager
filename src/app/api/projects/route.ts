import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/server/services/projectService';
import { createProjectSchema } from '@/lib/schemas';
import { validationError, internalError } from '@/lib/errors';

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(internalError('Failed to fetch projects'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    const project = await createProject(result.data);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(internalError('Failed to create project'), { status: 500 });
  }
}