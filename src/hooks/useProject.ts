'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/stores/useProjectStore';
import type { Project } from '@/types';

export function useProject(shortId: string | undefined) {
  const store = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!shortId) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch project by short_id
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('short_id', shortId)
        .single();

      if (projErr) throw projErr;
      store.setProject(project as unknown as Project);

      // Fetch videos
      const { data: videos } = await supabase
        .from('videos')
        .select('*')
        .eq('project_id', project.id)
        .order('sort_order');
      store.setVideos((videos ?? []) as unknown as import('@/types').Video[]);

      // Fetch characters
      const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', project.id)
        .order('sort_order');
      store.setCharacters((characters ?? []) as unknown as import('@/types').Character[]);

      // Fetch backgrounds
      const { data: backgrounds } = await supabase
        .from('backgrounds')
        .select('*')
        .eq('project_id', project.id)
        .order('sort_order');
      store.setBackgrounds((backgrounds ?? []) as unknown as import('@/types').Background[]);

      // Fetch style presets
      const { data: presets } = await supabase
        .from('style_presets')
        .select('*')
        .eq('project_id', project.id)
        .order('sort_order');
      store.setStylePresets((presets ?? []) as unknown as import('@/types').StylePreset[]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading project');
    } finally {
      setLoading(false);
    }
  }, [shortId, store]);

  useEffect(() => {
    if (shortId) {
      fetchProject();
    }
    return () => store.reset();
  }, [shortId]);

  const updateProject = useCallback(async (data: Partial<Project>) => {
    if (!store.project) return;
    const supabase = createClient();
    const { error: err } = await supabase
      .from('projects')
      .update(data as Record<string, unknown>)
      .eq('id', store.project.id);
    if (!err) {
      store.setProject({ ...store.project, ...data });
    }
  }, [store]);

  return {
    project: store.project,
    videos: store.videos,
    characters: store.characters,
    backgrounds: store.backgrounds,
    stylePresets: store.stylePresets,
    loading,
    error,
    fetchProject,
    updateProject,
  };
}
