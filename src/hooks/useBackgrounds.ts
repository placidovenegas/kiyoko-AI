'use client';

import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/stores/useProjectStore';
import type { Background } from '@/types';
import { toast } from 'sonner';

export function useBackgrounds() {
  const { backgrounds, setBackgrounds, currentProject } = useProjectStore();
  const supabase = createClient();

  async function createBackground(bg: Partial<Background>) {
    if (!currentProject) throw new Error('No project loaded');

    const { data, error } = await supabase
      .from('backgrounds')
      .insert({
        ...bg,
        project_id: currentProject.id,
        sort_order: backgrounds.length,
      })
      .select()
      .single();

    if (error) throw error;
    setBackgrounds([...backgrounds, data as Background]);
    toast.success('Fondo creado');
    return data as Background;
  }

  async function updateBackground(id: string, updates: Partial<Background>) {
    const { error } = await supabase
      .from('backgrounds')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    setBackgrounds(backgrounds.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    toast.success('Fondo actualizado');
  }

  async function deleteBackground(id: string) {
    const { error } = await supabase
      .from('backgrounds')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setBackgrounds(backgrounds.filter((b) => b.id !== id));
    toast.success('Fondo eliminado');
  }

  return { backgrounds, createBackground, updateBackground, deleteBackground };
}
