'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProject } from './ProjectContext';
import type { Scene } from '@/types/scene';

export interface VideoCut {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: string;
  aspect_ratio: string | null;
  target_duration_seconds: number;
  status: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface VideoContextValue {
  video: VideoCut | null;
  loading: boolean;
  error: string | null;
  /** Scenes belonging to this video (via video_cut_scenes), ordered by sort_order */
  scenes: Scene[];
  scenesLoading: boolean;
  refreshScenes: () => void;
}

const VideoContext = createContext<VideoContextValue>({
  video: null,
  loading: true,
  error: null,
  scenes: [],
  scenesLoading: true,
  refreshScenes: () => {},
});

export function useVideo() {
  return useContext(VideoContext);
}

export function VideoProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const videoSlug = params.videoSlug as string;
  const { project } = useProject();

  const [video, setVideo] = useState<VideoCut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [scenesLoading, setScenesLoading] = useState(true);

  // Fetch video by slug
  useEffect(() => {
    if (!videoSlug || !project?.id) return;

    const supabase = createClient();
    async function fetchVideo() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('video_cuts')
        .select('*')
        .eq('project_id', project!.id)
        .eq('slug', videoSlug)
        .single();

      if (err) {
        setError(err.message);
        setVideo(null);
      } else {
        setVideo(data as VideoCut);
        setError(null);
      }
      setLoading(false);
    }

    fetchVideo();
  }, [videoSlug, project?.id]);

  // Fetch scenes for this video via junction table
  const fetchScenes = useCallback(async () => {
    if (!video?.id || !project?.id) return;
    setScenesLoading(true);

    const supabase = createClient();

    // Get scene IDs for this video from the junction table
    const { data: junctionData } = await supabase
      .from('video_cut_scenes')
      .select('scene_id, sort_order')
      .eq('video_cut_id', video.id)
      .order('sort_order', { ascending: true });

    if (!junctionData || junctionData.length === 0) {
      // No scenes assigned to this video yet — fall back to all project scenes
      const { data: allScenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('project_id', project.id)
        .order('sort_order', { ascending: true });
      setScenes((allScenes as Scene[]) ?? []);
    } else {
      // Fetch the actual scenes
      const sceneIds = junctionData.map((j) => j.scene_id);
      const { data: sceneData } = await supabase
        .from('scenes')
        .select('*')
        .in('id', sceneIds);

      if (sceneData) {
        // Sort by the junction table order
        const orderMap = new Map(junctionData.map((j) => [j.scene_id, j.sort_order]));
        const sorted = (sceneData as Scene[]).sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );
        setScenes(sorted);
      }
    }

    setScenesLoading(false);
  }, [video?.id, project?.id]);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  return (
    <VideoContext.Provider value={{ video, loading, error, scenes, scenesLoading, refreshScenes: fetchScenes }}>
      {children}
    </VideoContext.Provider>
  );
}
