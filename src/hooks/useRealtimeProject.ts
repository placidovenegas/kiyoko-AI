'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/stores/useProjectStore';
import type { Scene, Character, Background } from '@/types';

/**
 * Subscribe to Realtime changes for a project's scenes, characters, and backgrounds.
 * Updates the Zustand store when other users make changes.
 */
export function useRealtimeProject(projectId: string | undefined) {
  const store = useProjectStore();

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scenes', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            store.setScenes([...store.scenes, payload.new as Scene]);
          } else if (payload.eventType === 'UPDATE') {
            store.setScenes(
              store.scenes.map((s) => (s.id === payload.new.id ? { ...s, ...payload.new } as Scene : s))
            );
          } else if (payload.eventType === 'DELETE') {
            store.setScenes(store.scenes.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'characters', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            store.setCharacters([...store.characters, payload.new as Character]);
          } else if (payload.eventType === 'UPDATE') {
            store.setCharacters(
              store.characters.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } as Character : c))
            );
          } else if (payload.eventType === 'DELETE') {
            store.setCharacters(store.characters.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'backgrounds', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            store.setBackgrounds([...store.backgrounds, payload.new as Background]);
          } else if (payload.eventType === 'UPDATE') {
            store.setBackgrounds(
              store.backgrounds.map((b) => (b.id === payload.new.id ? { ...b, ...payload.new } as Background : b))
            );
          } else if (payload.eventType === 'DELETE') {
            store.setBackgrounds(store.backgrounds.filter((b) => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, store]);
}
