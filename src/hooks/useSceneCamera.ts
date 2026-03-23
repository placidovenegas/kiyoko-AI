'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SceneCamera } from '@/types';

export function useSceneCamera(sceneId: string | undefined) {
  const [camera, setCamera] = useState<SceneCamera | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCamera = useCallback(async () => {
    if (!sceneId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('scene_camera')
      .select('*')
      .eq('scene_id', sceneId)
      .single();
    setCamera(data as SceneCamera | null);
    setLoading(false);
  }, [sceneId]);

  const updateCamera = useCallback(async (updates: Partial<SceneCamera>) => {
    if (!sceneId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('scene_camera')
      .upsert({ scene_id: sceneId, ...updates })
      .select()
      .single();
    if (data) setCamera(data as SceneCamera);
  }, [sceneId]);

  return { camera, loading, fetchCamera, updateCamera };
}
