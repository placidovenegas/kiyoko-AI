'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { CharacterFormData } from './types';

export function useCreateCharacter(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CharacterFormData) => {
      const { data: character, error } = await supabase
        .from('characters')
        .insert({
          project_id: projectId,
          name: data.name.trim(),
          role: data.role,
          description: data.description.trim() || null,
          visual_description: data.visual_description.trim() || null,
          personality: data.personality.trim() || null,
          hair_description: data.hair_description.trim() || null,
          signature_clothing: data.signature_clothing.trim() || null,
          accessories: data.accessories ? data.accessories.split(',').map((a) => a.trim()).filter(Boolean) : [],
          color_accent: data.color_accent || '#6B7280',
          prompt_snippet: data.prompt_snippet.trim() || data.visual_description.trim() || null,
          ai_prompt_description: data.ai_prompt_description.trim() || data.prompt_snippet.trim() || data.visual_description.trim() || null,
          initials: data.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
          sort_order: Math.floor(Date.now() / 1000),
        })
        .select()
        .single();

      if (error) throw error;
      return character;
    },
    onSuccess: () => {
      toast.success('Personaje creado');
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al crear personaje');
    },
  });
}
