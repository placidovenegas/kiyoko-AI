'use client';

import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/stores/useProjectStore';
import type { Character } from '@/types';
import { toast } from 'sonner';

export function useCharacters() {
  const { characters, setCharacters, currentProject } = useProjectStore();
  const supabase = createClient();

  async function createCharacter(character: Partial<Character>) {
    if (!currentProject) throw new Error('No project loaded');

    const { data, error } = await supabase
      .from('characters')
      .insert({
        ...character,
        project_id: currentProject.id,
        sort_order: characters.length,
      })
      .select()
      .single();

    if (error) throw error;
    setCharacters([...characters, data as Character]);
    toast.success('Personaje creado');
    return data as Character;
  }

  async function updateCharacter(id: string, updates: Partial<Character>) {
    const { error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    setCharacters(characters.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    toast.success('Personaje actualizado');
  }

  async function deleteCharacter(id: string) {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setCharacters(characters.filter((c) => c.id !== id));
    toast.success('Personaje eliminado');
  }

  return { characters, createCharacter, updateCharacter, deleteCharacter };
}
