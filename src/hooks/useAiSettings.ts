'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ProjectAiSettings } from '@/types';

export function useAiSettings(projectId: string | undefined) {
  const [settings, setSettings] = useState<ProjectAiSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('project_ai_settings')
      .select('*')
      .eq('project_id', projectId)
      .single();
    setSettings(data as ProjectAiSettings | null);
    setLoading(false);
  }, [projectId]);

  const updateSettings = useCallback(async (updates: Partial<ProjectAiSettings>) => {
    if (!settings) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('project_ai_settings')
      .update(updates as unknown as Record<string, unknown>)
      .eq('id', settings.id)
      .select()
      .single();
    if (data) setSettings(data as ProjectAiSettings);
  }, [settings]);

  return { settings, loading, fetchSettings, updateSettings };
}
