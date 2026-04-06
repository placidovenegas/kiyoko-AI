'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';

export function useRealtimeProject(projectId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`project-resources:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: queryKeys.characters.byProject(projectId) });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'backgrounds',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: queryKeys.backgrounds.byProject(projectId) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, qc]);
}
