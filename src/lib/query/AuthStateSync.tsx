'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { logClientError, logClientEvent } from '@/lib/observability/logger';
import { queryKeys } from '@/lib/query/keys';
import { clearPersistedQueryCache } from '@/lib/query/persistence';

export function AuthStateSync() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        logClientError('auth.sync.bootstrap', error);
        return;
      }

      currentUserIdRef.current = data.user?.id ?? null;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;
      const previousUserId = currentUserIdRef.current;
      const didUserChange = previousUserId !== null && previousUserId !== nextUserId;
      const didSignOut = event === 'SIGNED_OUT';
      const didRestoreOrRefreshSession =
        nextUserId !== null &&
        (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED');

      logClientEvent('auth.sync', 'Supabase auth state changed', {
        event,
        previousUserId,
        nextUserId,
      });

      if (didUserChange || didSignOut) {
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] !== 'auth',
        });
        clearPersistedQueryCache();
      }

      if (didRestoreOrRefreshSession) {
        void queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== queryKeys.auth.all[0],
        });
      }

      currentUserIdRef.current = nextUserId;
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [queryClient, supabase]);

  return null;
}
