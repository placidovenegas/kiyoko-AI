'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { RequestInstrumentation } from '@/lib/observability/RequestInstrumentation';
import { AuthStateSync } from './AuthStateSync';
import { getQueryClient } from './client';
import { PERSISTED_QUERY_CACHE_KEY } from './persistence';

const persister = typeof window !== 'undefined'
  ? createSyncStoragePersister({
      storage: window.localStorage,
      key: PERSISTED_QUERY_CACHE_KEY,
    })
  : undefined;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  // Si hay persister (client-side), usar PersistQueryClientProvider
  // que restaura el cache de localStorage y luego revalida en background
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 24 * 60 * 60 * 1000, // 24h max cache age
          buster: 'auth-v2',             // cambiar para invalidar todo el cache
        }}
      >
        <RequestInstrumentation />
        <AuthStateSync />
        {children}
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </PersistQueryClientProvider>
    );
  }

  // SSR fallback
  return (
    <QueryClientProvider client={queryClient}>
      <RequestInstrumentation />
      <AuthStateSync />
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
