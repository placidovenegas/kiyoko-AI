'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface OnlineUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

/**
 * Track who's online in a project using Supabase Realtime Presence.
 */
export function usePresence(projectId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    async function setupPresence() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for display
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const channel = supabase.channel(`presence-${projectId}`, {
        config: { presence: { key: user.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<{ id: string; name: string; avatar_url: string | null }>();
          const users: OnlineUser[] = [];
          for (const key in state) {
            const presences = state[key];
            if (presences && presences.length > 0) {
              users.push({
                id: presences[0].id,
                name: presences[0].name,
                avatar_url: presences[0].avatar_url,
              });
            }
          }
          setOnlineUsers(users);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              id: user.id,
              name: profile?.full_name ?? user.email ?? 'Usuario',
              avatar_url: profile?.avatar_url ?? null,
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const cleanup = setupPresence();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [projectId]);

  return { onlineUsers };
}
