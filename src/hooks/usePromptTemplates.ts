'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PromptTemplate } from '@/types';

export function usePromptTemplates(projectId: string | undefined) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    setTemplates((data as PromptTemplate[]) ?? []);
    setLoading(false);
  }, [projectId]);

  return { templates, loading, fetchTemplates };
}
