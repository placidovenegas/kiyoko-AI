'use client';

import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/stores/useProjectStore';
import type { Scene } from '@/types';
import { toast } from 'sonner';

export function useScenes() {
  const { scenes, setScenes, currentProject } = useProjectStore();
  const supabase = createClient();

  async function createScene(scene: Partial<Scene>) {
    if (!currentProject) throw new Error('No project loaded');

    const { data, error } = await supabase
      .from('scenes')
      .insert({
        ...scene,
        project_id: currentProject.id,
        sort_order: scenes.length,
      })
      .select()
      .single();

    if (error) throw error;
    setScenes([...scenes, data as Scene]);
    toast.success('Escena creada');
    return data as Scene;
  }

  async function updateScene(id: string, updates: Partial<Scene>) {
    const { error } = await supabase
      .from('scenes')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    setScenes(scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    toast.success('Escena actualizada');
  }

  async function deleteScene(id: string) {
    const { error } = await supabase
      .from('scenes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setScenes(scenes.filter((s) => s.id !== id));
    toast.success('Escena eliminada');
  }

  async function reorderScenes(orderedIds: string[]) {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('scenes')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    const reordered = orderedIds
      .map((id) => scenes.find((s) => s.id === id))
      .filter(Boolean) as Scene[];
    setScenes(reordered);
  }

  return {
    scenes,
    createScene,
    updateScene,
    deleteScene,
    reorderScenes,
  };
}
