'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TimelineEntry } from '@/types';
import { toast } from 'sonner';

export function useTimeline(projectId: string | undefined) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchTimeline = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data } = await supabase
      .from('timeline_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    setEntries((data || []) as TimelineEntry[]);
    setLoading(false);
  }, [projectId, supabase]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  async function updateEntry(id: string, updates: Partial<TimelineEntry>) {
    const { error } = await supabase
      .from('timeline_entries')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    toast.success('Timeline actualizado');
  }

  return { entries, loading, updateEntry, refetch: fetchTimeline };
}
