'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';

export function useRealtimeSync(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`project:${projectId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'scenes',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        queryClient.setQueriesData(
          { queryKey: ['video'] },
          (old: unknown) => {
            const data = old as { video: unknown; scenes: Array<{ id: string }> } | undefined;
            if (!data?.scenes) return old;
            return {
              ...data,
              scenes: data.scenes.map((s) =>
                s.id === (payload.new as { id: string }).id ? { ...s, ...payload.new } : s
              ),
            };
          }
        );
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scenes',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const newScene = payload.new as { video_id: string };
        queryClient.invalidateQueries({
          queryKey: queryKeys.scenes.byVideo(newScene.video_id),
        });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'scenes',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        queryClient.setQueriesData(
          { queryKey: ['video'] },
          (old: unknown) => {
            const data = old as { video: unknown; scenes: Array<{ id: string }> } | undefined;
            if (!data?.scenes) return old;
            return {
              ...data,
              scenes: data.scenes.filter((s) => s.id !== (payload.old as { id: string }).id),
            };
          }
        );
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'videos',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.videos.byProject(projectId),
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}
