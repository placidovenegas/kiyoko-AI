'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/stores/useProjectStore';

export function useRealtimeProject(projectId: string | undefined) {
  const { setCharacters, setBackgrounds, characters, backgrounds } = useProjectStore();

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
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCharacters([...characters, payload.new as unknown as import('@/types').Character]);
        } else if (payload.eventType === 'UPDATE') {
          setCharacters(characters.map((c) =>
            c.id === (payload.new as { id: string }).id ? { ...c, ...payload.new } as unknown as import('@/types').Character : c
          ));
        } else if (payload.eventType === 'DELETE') {
          setCharacters(characters.filter((c) => c.id !== (payload.old as { id: string }).id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'backgrounds',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBackgrounds([...backgrounds, payload.new as unknown as import('@/types').Background]);
        } else if (payload.eventType === 'UPDATE') {
          setBackgrounds(backgrounds.map((b) =>
            b.id === (payload.new as { id: string }).id ? { ...b, ...payload.new } as unknown as import('@/types').Background : b
          ));
        } else if (payload.eventType === 'DELETE') {
          setBackgrounds(backgrounds.filter((b) => b.id !== (payload.old as { id: string }).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, characters, backgrounds, setCharacters, setBackgrounds]);
}
