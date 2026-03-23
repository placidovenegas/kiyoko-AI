'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { fetchVideoWithScenes, fetchVideoAnalysis, fetchVideoNarration } from '@/lib/queries/videos';

export function useVideoQuery(videoShortId: string | undefined) {
  const supabase = createClient();

  const videoQuery = useQuery({
    queryKey: queryKeys.videos.detail(videoShortId ?? ''),
    queryFn: () => fetchVideoWithScenes(supabase, videoShortId!),
    enabled: !!videoShortId,
  });

  const video = videoQuery.data?.video ?? null;
  const scenes = videoQuery.data?.scenes ?? [];

  const analysisQuery = useQuery({
    queryKey: queryKeys.videos.analysis(video?.id ?? ''),
    queryFn: () => fetchVideoAnalysis(supabase, video!.id),
    enabled: !!video?.id,
  });

  const narrationQuery = useQuery({
    queryKey: queryKeys.videos.narration(video?.id ?? ''),
    queryFn: () => fetchVideoNarration(supabase, video!.id),
    enabled: !!video?.id,
  });

  return {
    video,
    scenes,
    analysis: analysisQuery.data ?? null,
    narration: narrationQuery.data ?? null,
    isLoading: videoQuery.isLoading,
    scenesLoading: videoQuery.isLoading,
    error: videoQuery.error?.message ?? null,
  };
}
