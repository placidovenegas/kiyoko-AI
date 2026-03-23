'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { StylePreset } from '@/types';

export function useStylePresets(projectId: string | undefined) {
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPresets = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('style_presets')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    setPresets((data as StylePreset[]) ?? []);
    setLoading(false);
  }, [projectId]);

  return { presets, loading, fetchPresets };
}
