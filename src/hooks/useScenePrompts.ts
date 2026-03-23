'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ScenePrompt } from '@/types';

export function useScenePrompts(sceneId: string | undefined) {
  const [prompts, setPrompts] = useState<ScenePrompt[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPrompts = useCallback(async () => {
    if (!sceneId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('scene_prompts')
      .select('*')
      .eq('scene_id', sceneId)
      .order('created_at', { ascending: false });
    setPrompts((data as ScenePrompt[]) ?? []);
    setLoading(false);
  }, [sceneId]);

  return { prompts, loading, fetchPrompts };
}
