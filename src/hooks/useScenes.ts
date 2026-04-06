'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';

type Scene = Database['public']['Tables']['scenes']['Row'];
type SceneInsert = Database['public']['Tables']['scenes']['Insert'];
type SceneUpdate = Database['public']['Tables']['scenes']['Update'];

// ═══ QUERIES ═══

export function useScenes(videoId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.scenes.byVideo(videoId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scenes')
        .select('*, scene_camera(*), scene_characters(*, characters(*)), scene_backgrounds(*, backgrounds(*))')
        .eq('video_id', videoId!)
        .order('scene_number');
      if (error) throw error;
      return data;
    },
    enabled: !!videoId,
  });
}

export function useScene(sceneShortId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.scenes.detail(sceneShortId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scenes')
        .select('*, scene_camera(*), scene_prompts(*), scene_characters(*, characters(*)), scene_backgrounds(*, backgrounds(*))')
        .eq('short_id', sceneShortId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sceneShortId,
  });
}

// ═══ MUTATIONS ═══

export function useCreateScene(videoId: string, projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<SceneInsert, 'video_id' | 'project_id'>) => {
      const { data, error } = await supabase
        .from('scenes')
        .insert({ ...input, video_id: videoId, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.scenes.byVideo(videoId) });
      toast.success('Escena creada');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateScene(videoId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: SceneUpdate & { id: string }) => {
      const { error } = await supabase.from('scenes').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.scenes.byVideo(videoId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteScene(videoId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sceneId: string) => {
      const { error } = await supabase.from('scenes').delete().eq('id', sceneId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.scenes.byVideo(videoId) });
      toast.success('Escena eliminada');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReorderScenes(videoId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scenes: { id: string; scene_number: number; sort_order: number }[]) => {
      const updates = scenes.map((s) =>
        supabase.from('scenes').update({ scene_number: s.scene_number, sort_order: s.sort_order }).eq('id', s.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.scenes.byVideo(videoId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
