'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SceneMedia } from '@/types';

export function useSceneMedia(sceneId: string | undefined) {
  const [media, setMedia] = useState<SceneMedia[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMedia = useCallback(async () => {
    if (!sceneId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('scene_media')
      .select('*')
      .eq('scene_id', sceneId)
      .order('created_at', { ascending: false });
    setMedia((data as SceneMedia[]) ?? []);
    setLoading(false);
  }, [sceneId]);

  return { media, loading, fetchMedia };
}
