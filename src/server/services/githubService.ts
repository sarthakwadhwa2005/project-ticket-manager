import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { githubNotFound, githubRateLimited, githubNetworkError } from '@/lib/errors';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface GitHubRepoData {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  language: string | null;
  watchers_count: number;
  license: { name: string } | null;
}

export interface RepoInsights {
  stars: number;
  forks: number;
  openIssues: number;
  lastPushed: string;
  language: string | null;
  watchers: number;
  license: string | null;
  cached: boolean;
  fetchedAt: string;
  stale?: boolean;
}

function toJson(data: GitHubRepoData): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data));
}

export async function getRepoInsights(
  repo: string
): Promise<{ data: RepoInsights } | { error: ReturnType<typeof githubNotFound> }> {
  // Check cache first
  const cached = await prisma.repoCache.findUnique({
    where: { repo },
  });

  if (cached) {
    const cacheAge = Date.now() - new Date(cached.fetchedAt).getTime();
    if (cacheAge <= CACHE_TTL_MS) {
      // Cache is valid - return cached data
      return {
        data: {
          stars: (cached.data as unknown as GitHubRepoData).stargazers_count,
          forks: (cached.data as unknown as GitHubRepoData).forks_count,
          openIssues: (cached.data as unknown as GitHubRepoData).open_issues_count,
          lastPushed: (cached.data as unknown as GitHubRepoData).pushed_at,
          language: (cached.data as unknown as GitHubRepoData).language,
          watchers: (cached.data as unknown as GitHubRepoData).watchers_count,
          license: (cached.data as unknown as GitHubRepoData).license?.name ?? null,
          cached: true,
          fetchedAt: cached.fetchedAt.toISOString(),
        },
      };
    }

    // Cache is stale - try to fetch fresh data, but return stale if fetch fails
    try {
      const freshData = await fetchFromGitHub(repo);
      const fetchedAt = new Date();
      await prisma.repoCache.update({
        where: { repo },
        data: {
          data: toJson(freshData),
          fetchedAt,
        },
      });

      return {
        data: {
          stars: freshData.stargazers_count,
          forks: freshData.forks_count,
          openIssues: freshData.open_issues_count,
          lastPushed: freshData.pushed_at,
          language: freshData.language,
          watchers: freshData.watchers_count,
          license: freshData.license?.name ?? null,
          cached: false,
          fetchedAt: fetchedAt.toISOString(),
        },
      };
    } catch {
      // Return stale cache data on fetch failure
      return {
        data: {
          stars: (cached.data as unknown as GitHubRepoData).stargazers_count,
          forks: (cached.data as unknown as GitHubRepoData).forks_count,
          openIssues: (cached.data as unknown as GitHubRepoData).open_issues_count,
          lastPushed: (cached.data as unknown as GitHubRepoData).pushed_at,
          language: (cached.data as unknown as GitHubRepoData).language,
          watchers: (cached.data as unknown as GitHubRepoData).watchers_count,
          license: (cached.data as unknown as GitHubRepoData).license?.name ?? null,
          cached: true,
          fetchedAt: cached.fetchedAt.toISOString(),
          stale: true,
        },
      };
    }
  }

  // No cache - fetch from GitHub
  try {
    const data = await fetchFromGitHub(repo);

    // Store in cache
    await prisma.repoCache.upsert({
      where: { repo },
      update: {
        data: toJson(data),
        fetchedAt: new Date(),
      },
      create: {
        repo,
        data: toJson(data),
      },
    });

    return {
      data: {
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        lastPushed: data.pushed_at,
        language: data.language,
        watchers: data.watchers_count,
        license: data.license?.name ?? null,
        cached: false,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return { error: githubNotFound(repo) };
      }
      if (error.message.includes('403') || error.message.includes('429')) {
        return { error: githubRateLimited() };
      }
    }
    return { error: githubNetworkError() };
  }
}

async function fetchFromGitHub(repo: string): Promise<GitHubRepoData> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
  }

  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers,
  });

  if (!response.ok) {
    const error = new Error(response.status.toString());
    if (response.status === 404) error.message = '404';
    if (response.status === 403 || response.status === 429) error.message = response.status.toString();
    throw error;
  }

  return response.json() as Promise<GitHubRepoData>;
}
