'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';

type VideoInsert = Database['public']['Tables']['videos']['Insert'];
type VideoUpdate = Database['public']['Tables']['videos']['Update'];

// ═══ QUERY ═══

export function useVideos(projectId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.videos.byProject(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('project_id', projectId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

// ═══ MUTATIONS ═══

export function useCreateVideo(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<VideoInsert, 'project_id'>) => {
      const { data, error } = await supabase
        .from('videos')
        .insert({ ...input, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.videos.byProject(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Video creado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateVideo(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: VideoUpdate & { id: string }) => {
      const { error } = await supabase.from('videos').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.videos.byProject(projectId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteVideo(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase.from('videos').delete().eq('id', videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.videos.byProject(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('Video eliminado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
