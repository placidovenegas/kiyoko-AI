'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ProjectIssue } from '@/types';
import { toast } from 'sonner';

export function useIssues(projectId: string | undefined) {
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchIssues = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data } = await supabase
      .from('project_issues')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    setIssues((data || []) as ProjectIssue[]);
    setLoading(false);
  }, [projectId, supabase]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  async function resolveIssue(id: string, notes: string) {
    const { error } = await supabase
      .from('project_issues')
      .update({ resolved: true, resolution_notes: notes })
      .eq('id', id);
    if (error) throw error;
    setIssues(issues.map((i) => (i.id === id ? { ...i, resolved: true, resolution_notes: notes } : i)));
    toast.success('Issue marcado como resuelto');
  }

  return { issues, loading, resolveIssue, refetch: fetchIssues };
}
