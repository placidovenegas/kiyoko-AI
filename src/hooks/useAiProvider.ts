'use client';

import { useCallback, useEffect } from 'react';
import { useAiProviderStore } from '@/stores/useAiProviderStore';

export function useAiProvider() {
  const store = useAiProviderStore();

  const fetchProviderStatus = useCallback(async () => {
    store.setLoading(true);
    try {
      const response = await fetch('/api/ai/providers/status');
      if (response.ok) {
        const data = await response.json();
        store.setActiveTextProvider(data.activeTextProvider);
        store.setActiveImageProvider(data.activeImageProvider);
        for (const quota of data.quotas) {
          store.setQuota(quota.providerId, quota);
        }
      }
    } catch {
      // ignore
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    fetchProviderStatus();
  }, [fetchProviderStatus]);

  return {
    activeTextProvider: store.activeTextProvider,
    activeImageProvider: store.activeImageProvider,
    quotas: store.quotas,
    loading: store.loading,
    refetch: fetchProviderStatus,
  };
}
