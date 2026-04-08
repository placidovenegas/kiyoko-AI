'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import { queryKeys } from '@/lib/query/keys';
import { toast } from 'sonner';
import type { VideoFormData } from './types';

export function useCreateVideo(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VideoFormData) => {
      const shortId = generateShortId();
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
        + '-' + shortId;

      const { data: video, error } = await supabase
        .from('videos')
        .insert({
          project_id: projectId,
          title: data.title.trim(),
          short_id: shortId,
          slug,
          platform: data.platform,
          target_duration_seconds: data.target_duration_seconds,
          aspect_ratio: data.aspect_ratio,
          description: data.description.trim() || null,
          status: 'draft',
          sort_order: Math.floor(Date.now() / 1000),
        })
        .select()
        .single();

      if (error) throw error;
      return video;
    },
    onSuccess: () => {
      toast.success('Video creado');
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al crear video');
    },
  });
}
