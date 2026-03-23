'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SceneShare } from '@/types';

export function useSceneShares(videoId: string | undefined) {
  const [shares, setShares] = useState<SceneShare[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchShares = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('scene_shares')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    setShares((data as SceneShare[]) ?? []);
    setLoading(false);
  }, [videoId]);

  return { shares, loading, fetchShares };
}
