'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// ═══ QUERY ═══

export function useTasks(projectId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.tasks.byProject(projectId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
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

export function useCreateTask(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TaskInsert, 'project_id'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
      toast.success('Tarea creada');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTask(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: TaskUpdate & { id: string }) => {
      const { error } = await supabase.from('tasks').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTask(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
      toast.success('Tarea eliminada');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompleteTask(projectId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
