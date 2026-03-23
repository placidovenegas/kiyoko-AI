'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { VideoAnalysis } from '@/types';

export function useVideoAnalysis(videoId: string | undefined) {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('video_analysis')
      .select('*')
      .eq('video_id', videoId)
      .eq('is_current', true)
      .single();
    setAnalysis(data as VideoAnalysis | null);
    setLoading(false);
  }, [videoId]);

  return { analysis, loading, fetchAnalysis };
}
