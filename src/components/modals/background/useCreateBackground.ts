'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { BackgroundFormData } from './types';

export function useCreateBackground(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BackgroundFormData) => {
      const code = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)
        + '_' + Date.now().toString(36);

      const { data: bg, error } = await supabase
        .from('backgrounds')
        .insert({
          project_id: projectId,
          code,
          name: data.name.trim(),
          location_type: data.location_type,
          time_of_day: data.time_of_day,
          description: data.description.trim() || null,
          available_angles: data.available_angles,
          sort_order: Math.floor(Date.now() / 1000),
        })
        .select()
        .single();

      if (error) throw error;
      return bg;
    },
    onSuccess: () => {
      toast.success('Fondo creado');
      queryClient.invalidateQueries({ queryKey: ['backgrounds'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al crear fondo');
    },
  });
}
