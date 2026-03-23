'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/types';

export function useVideos(projectId: string | undefined) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    setVideos((data as Video[]) ?? []);
    setLoading(false);
  }, [projectId]);

  const createVideo = useCallback(async (input: Partial<Video>) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('videos')
      .insert({ ...input, project_id: projectId } as never)
      .select()
      .single();
    if (data) setVideos((prev) => [...prev, data as Video]);
    return { data, error };
  }, [projectId]);

  const deleteVideo = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('videos').delete().eq('id', id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { videos, loading, fetchVideos, createVideo, deleteVideo };
}
