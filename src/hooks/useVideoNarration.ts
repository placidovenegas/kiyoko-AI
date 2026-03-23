'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { VideoNarration } from '@/types';

export function useVideoNarration(videoId: string | undefined) {
  const [narration, setNarration] = useState<VideoNarration | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNarration = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('video_narrations')
      .select('*')
      .eq('video_id', videoId)
      .eq('is_current', true)
      .single();
    setNarration(data as VideoNarration | null);
    setLoading(false);
  }, [videoId]);

  const updateNarration = useCallback(async (text: string) => {
    if (!narration) return;
    const supabase = createClient();
    await supabase
      .from('video_narrations')
      .update({ narration_text: text })
      .eq('id', narration.id);
    setNarration((prev) => prev ? { ...prev, narration_text: text } : null);
  }, [narration]);

  return { narration, loading, fetchNarration, updateNarration };
}
