'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Publication } from '@/types';

export function usePublications(projectId: string | undefined) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPublications = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('publications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setPublications((data as Publication[]) ?? []);
    setLoading(false);
  }, [projectId]);

  return { publications, loading, fetchPublications };
}
