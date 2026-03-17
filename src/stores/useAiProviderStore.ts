'use client';

import { create } from 'zustand';
import type { AiProviderId, QuotaStatus } from '@/types';

interface AiProviderState {
  activeTextProvider: AiProviderId | null;
  activeImageProvider: AiProviderId | null;
  quotas: Record<string, QuotaStatus>;
  loading: boolean;

  setActiveTextProvider: (provider: AiProviderId | null) => void;
  setActiveImageProvider: (provider: AiProviderId | null) => void;
  setQuota: (providerId: string, quota: QuotaStatus) => void;
  setLoading: (loading: boolean) => void;
}

export const useAiProviderStore = create<AiProviderState>()((set) => ({
  activeTextProvider: null,
  activeImageProvider: null,
  quotas: {},
  loading: false,

  setActiveTextProvider: (activeTextProvider) => set({ activeTextProvider }),
  setActiveImageProvider: (activeImageProvider) => set({ activeImageProvider }),
  setQuota: (providerId, quota) =>
    set((s) => ({ quotas: { ...s.quotas, [providerId]: quota } })),
  setLoading: (loading) => set({ loading }),
}));
