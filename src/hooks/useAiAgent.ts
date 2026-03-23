'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ProjectAiAgent } from '@/types';

export function useAiAgent(projectId: string | undefined) {
  const [agent, setAgent] = useState<ProjectAiAgent | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAgent = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('project_ai_agents')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_default', true)
      .single();
    setAgent(data as ProjectAiAgent | null);
    setLoading(false);
  }, [projectId]);

  const updateAgent = useCallback(async (updates: Partial<ProjectAiAgent>) => {
    if (!agent) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('project_ai_agents')
      .update(updates)
      .eq('id', agent.id)
      .select()
      .single();
    if (data) setAgent(data as ProjectAiAgent);
  }, [agent]);

  return { agent, loading, fetchAgent, updateAgent };
}
