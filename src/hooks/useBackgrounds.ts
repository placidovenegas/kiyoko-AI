'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';

type BackgroundInsert = Database['public']['Tables']['backgrounds']['Insert'];
type BackgroundUpdate = Database['public']['Tables']['backgrounds']['Update'];

// ═══ QUERY ═══

export function useBackgrounds(projectId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.backgrounds.byProject(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backgrounds')
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

export function useCreateBackground(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<BackgroundInsert, 'project_id'>) => {
      const { data, error } = await supabase
        .from('backgrounds')
        .insert({ ...input, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(projectId) });
      toast.success('Fondo creado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBackground(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: BackgroundUpdate & { id: string }) => {
      const { error } = await supabase.from('backgrounds').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(projectId) });
      toast.success('Fondo actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBackground(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (backgroundId: string) => {
      const { error } = await supabase.from('backgrounds').delete().eq('id', backgroundId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(projectId) });
      toast.success('Fondo eliminado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
