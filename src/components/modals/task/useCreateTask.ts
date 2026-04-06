'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { createTaskSortOrder } from '@/lib/tasks/workspace';
import { toast } from 'sonner';
import type { TaskFormData } from './types';

export function useCreateTask(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TaskFormData) => {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: data.title.trim(),
          description: data.description.trim() || null,
          category: data.category,
          priority: data.priority,
          due_date: data.due_date || null,
          status: 'pending',
          created_by: 'manual',
          sort_order: createTaskSortOrder(),
        })
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      toast.success('Tarea creada');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al crear tarea');
    },
  });
}
