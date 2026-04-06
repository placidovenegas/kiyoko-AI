export const PERSISTED_QUERY_CACHE_KEY = 'kiyoko-query-cache-v2';

export function clearPersistedQueryCache() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(PERSISTED_QUERY_CACHE_KEY);
}
