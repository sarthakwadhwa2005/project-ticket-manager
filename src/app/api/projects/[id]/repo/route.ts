import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/server/services/projectService';
import { getRepoInsights } from '@/server/services/githubService';
import { projectParamsSchema } from '@/lib/schemas';
import { validationError, notFound, badGateway, internalError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = projectParamsSchema.safeParse({ id });

    if (!result.success) {
      const details = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(validationError(details), { status: 400 });
    }

    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json(notFound('Project'), { status: 404 });
    }

    if (!project.repo) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'No repository configured for this project' } },
        { status: 404 }
      );
    }

    const insights = await getRepoInsights(project.repo);

    if ('error' in insights) {
      const error = insights.error;
      if (error.error.code === 'GITHUB_NOT_FOUND') {
        return NextResponse.json(error, { status: 404 });
      }
      if (error.error.code === 'GITHUB_RATE_LIMITED') {
        return NextResponse.json(error, { status: 403 });
      }
      if (error.error.code === 'GITHUB_NETWORK_ERROR') {
        return NextResponse.json(badGateway('Failed to fetch GitHub data'), { status: 502 });
      }
      return NextResponse.json(internalError('Failed to fetch repository insights'), { status: 500 });
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching repo insights:', error);
    return NextResponse.json(internalError('Failed to fetch repository insights'), { status: 500 });
  }
}