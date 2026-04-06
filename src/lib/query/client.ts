import { MutationCache, QueryCache, QueryClient, isServer } from '@tanstack/react-query';
import { logClientError } from '@/lib/observability/logger';

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        logClientError('react-query.query', error, {
          queryKey: query.queryKey,
          queryHash: query.queryHash,
          meta: query.meta,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        logClientError('react-query.mutation', error, {
          mutationKey: mutation.options.mutationKey,
          meta: mutation.meta,
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,           // 1 min — datos "frescos", no refetch
        gcTime: 24 * 60 * 60 * 1000,    // 24h — mantener en cache (necesario para persist)
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
