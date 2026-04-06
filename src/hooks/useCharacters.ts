'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';

type Character = Database['public']['Tables']['characters']['Row'];
type CharacterInsert = Database['public']['Tables']['characters']['Insert'];
type CharacterUpdate = Database['public']['Tables']['characters']['Update'];

// ═══ QUERY ═══

export function useCharacters(projectId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.characters.byProject(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId!)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCharacter(characterId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.characters.detail(characterId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*, character_images(*)')
        .eq('id', characterId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!characterId,
  });
}

// ═══ MUTATIONS ═══

export function useCreateCharacter(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CharacterInsert, 'project_id'>) => {
      const { data, error } = await supabase
        .from('characters')
        .insert({ ...input, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.byProject(projectId) });
      toast.success('Personaje creado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCharacter(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: CharacterUpdate & { id: string }) => {
      const { error } = await supabase.from('characters').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.byProject(projectId) });
      toast.success('Personaje actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCharacter(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (characterId: string) => {
      const { error } = await supabase.from('characters').delete().eq('id', characterId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.byProject(projectId) });
      toast.success('Personaje eliminado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
