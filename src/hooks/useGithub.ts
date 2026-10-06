import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface RepoInsights {
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

// Get GitHub repo insights
export function useRepoInsights(projectId: string) {
  return useQuery({
    queryKey: queryKeys.repo.detail(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/repo`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to fetch repo insights');
      }
      const data = await res.json();
      return data.data as RepoInsights;
    },
    enabled: !!projectId,
    retry: 1,
  });
}