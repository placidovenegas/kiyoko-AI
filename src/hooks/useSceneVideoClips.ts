'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SceneVideoClip } from '@/types';

export function useSceneVideoClips(sceneId: string | undefined) {
  const [clips, setClips] = useState<SceneVideoClip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClips = useCallback(async () => {
    if (!sceneId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('scene_video_clips')
      .select('*')
      .eq('scene_id', sceneId)
      .eq('is_current', true)
      .order('extension_number');
    setClips((data as SceneVideoClip[]) ?? []);
    setLoading(false);
  }, [sceneId]);

  return { clips, loading, fetchClips };
}
