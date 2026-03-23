'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SceneAnnotation } from '@/types';

export function useAnnotations(shareId: string | undefined) {
  const [annotations, setAnnotations] = useState<SceneAnnotation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnnotations = useCallback(async () => {
    if (!shareId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('scene_annotations')
      .select('*')
      .eq('scene_share_id', shareId)
      .order('created_at', { ascending: false });
    setAnnotations((data as SceneAnnotation[]) ?? []);
    setLoading(false);
  }, [shareId]);

  return { annotations, loading, fetchAnnotations };
}
