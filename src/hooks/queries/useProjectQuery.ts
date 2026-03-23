'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { fetchProjectByShortId, fetchProjectResources } from '@/lib/queries/projects';
import { fetchVideosByProject } from '@/lib/queries/videos';

export function useProjectQuery(shortId: string | undefined) {
  const supabase = createClient();

  const projectQuery = useQuery({
    queryKey: queryKeys.projects.detail(shortId ?? ''),
    queryFn: () => fetchProjectByShortId(supabase, shortId!),
    enabled: !!shortId,
  });

  const videosQuery = useQuery({
    queryKey: queryKeys.videos.byProject(projectQuery.data?.id ?? ''),
    queryFn: () => fetchVideosByProject(supabase, projectQuery.data!.id),
    enabled: !!projectQuery.data?.id,
  });

  const resourcesQuery = useQuery({
    queryKey: ['project-resources', projectQuery.data?.id],
    queryFn: () => fetchProjectResources(supabase, projectQuery.data!.id),
    enabled: !!projectQuery.data?.id,
  });

  return {
    project: projectQuery.data ?? null,
    videos: videosQuery.data ?? [],
    characters: resourcesQuery.data?.characters ?? [],
    backgrounds: resourcesQuery.data?.backgrounds ?? [],
    stylePresets: resourcesQuery.data?.stylePresets ?? [],
    isLoading: projectQuery.isLoading,
    error: projectQuery.error?.message ?? null,
  };
}
