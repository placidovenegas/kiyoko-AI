'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { SceneFormData } from './types';

export function useCreateScene(videoId: string, projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SceneFormData & { sceneNumber: number }) => {
      const shortId = `s${data.sceneNumber}-${Date.now().toString(36)}`;

      const { data: scene, error } = await supabase
        .from('scenes')
        .insert({
          video_id: videoId,
          project_id: projectId,
          short_id: shortId,
          title: data.title.trim(),
          description: data.description.trim() || null,
          dialogue: data.dialogue.trim() || null,
          arc_phase: data.arc_phase,
          duration_seconds: data.duration_seconds,
          scene_type: data.scene_type,
          scene_number: data.sceneNumber,
          sort_order: data.sceneNumber * 1000,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return scene;
    },
    onSuccess: () => {
      toast.success('Escena creada');
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['scenes-nav'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al crear escena');
    },
  });
}
