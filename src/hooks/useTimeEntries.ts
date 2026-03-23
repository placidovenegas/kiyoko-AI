'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TimeEntry } from '@/types';

export function useTimeEntries(projectId: string | undefined) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false });
    setEntries((data as TimeEntry[]) ?? []);
    setLoading(false);
  }, [projectId]);

  return { entries, loading, fetchEntries };
}
