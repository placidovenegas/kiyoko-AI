'use client';

import { useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/stores/useProjectStore';
import type { Project, ProjectCreateInput } from '@/types';
import { slugify } from '@/lib/utils/slugify';

export function useProject(slug?: string) {
  const store = useProjectStore();
  const supabase = createClient();

  const fetchProject = useCallback(async () => {
    if (!slug) return;
    store.setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      store.setCurrentProject(data as Project);

      // Fetch related data
      const [scenes, characters, backgrounds] = await Promise.all([
        supabase.from('scenes').select('*').eq('project_id', data.id).order('sort_order'),
        supabase.from('characters').select('*').eq('project_id', data.id).order('sort_order'),
        supabase.from('backgrounds').select('*').eq('project_id', data.id).order('sort_order'),
      ]);

      store.setScenes((scenes.data || []) as typeof store.scenes);
      store.setCharacters((characters.data || []) as typeof store.characters);
      store.setBackgrounds((backgrounds.data || []) as typeof store.backgrounds);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Error loading project');
    } finally {
      store.setLoading(false);
    }
  }, [slug, supabase, store]);

  useEffect(() => {
    fetchProject();
    return () => store.reset();
  }, [fetchProject, store]);

  async function createProject(input: ProjectCreateInput): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const projectSlug = slugify(input.title);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...input,
        slug: projectSlug,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  }

  async function updateProject(updates: Partial<Project>) {
    if (!store.currentProject) throw new Error('No project loaded');

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', store.currentProject.id);

    if (error) throw error;
    store.setCurrentProject({ ...store.currentProject, ...updates });
  }

  async function deleteProject() {
    if (!store.currentProject) throw new Error('No project loaded');

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', store.currentProject.id);

    if (error) throw error;
    store.reset();
  }

  return {
    project: store.currentProject,
    scenes: store.scenes,
    characters: store.characters,
    backgrounds: store.backgrounds,
    loading: store.loading,
    error: store.error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProject,
  };
}
