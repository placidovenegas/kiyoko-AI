'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface UseRealtimeUpdatesOptions {
  projectId: string | undefined;
  enabled?: boolean;
}

/**
 * Subscribe to Supabase Realtime for the realtime_updates table.
 * When an AI action completes, invalidates the relevant TanStack Query caches
 * so all components refresh automatically.
 */
export function useRealtimeUpdates({ projectId, enabled = true }: UseRealtimeUpdatesOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId || !enabled) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`realtime-updates:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_updates',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updateType = (payload.new as Record<string, unknown>)?.update_type as string;

          if (process.env.NODE_ENV === 'development') {
            console.debug(`[realtime] ${updateType} for project ${projectId}`);
          }

          switch (updateType) {
            case 'ai_actions_executed':
            case 'scene_updated':
            case 'scene_created':
            case 'scene_deleted':
              queryClient.invalidateQueries({ queryKey: ['scenes', 'project', projectId] });
              queryClient.invalidateQueries({ queryKey: ['scenes', 'video'] });
              break;
            case 'character_updated':
            case 'character_created':
            case 'character_deleted':
              queryClient.invalidateQueries({ queryKey: ['characters', 'project', projectId] });
              break;
            case 'background_updated':
            case 'background_created':
            case 'background_deleted':
              queryClient.invalidateQueries({ queryKey: ['backgrounds', 'project', projectId] });
              break;
            default:
              // Generic project refresh for unknown update types
              queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, enabled, queryClient]);
}
