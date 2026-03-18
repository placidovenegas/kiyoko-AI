/**
 * AI Providers — Single source of truth.
 * Re-exports from sdk-router.ts which manages the actual provider chain.
 */

import { PROVIDER_META, TEXT_CHAIN, type ProviderId, type ProviderMeta } from '@/lib/ai/sdk-router';

// Re-export ProviderConfig interface matching the old shape for backwards compat
export interface ProviderConfig {
  id: string;
  name: string;
  type: 'text' | 'image' | 'both';
  isFree: boolean;
  defaultModel: string;
  imageModel?: string;
  rateLimitRpm: number;
  costPer1kTokens: number;
  costPerImage?: number;
  sdk: string;
  envKey: string;
}

// Build AI_PROVIDERS from PROVIDER_META for backwards compatibility
export const AI_PROVIDERS: Record<string, ProviderConfig> = Object.fromEntries(
  Object.entries(PROVIDER_META).map(([id, meta]: [string, ProviderMeta]) => [
    id,
    {
      id: meta.id,
      name: meta.name,
      type: 'text' as const,
      isFree: meta.isFree,
      defaultModel: meta.defaultModel,
      rateLimitRpm: 60,
      costPer1kTokens: meta.isFree ? 0 : 0.003,
      sdk: 'ai-sdk',
      envKey: meta.envKey,
    },
  ]),
);

// Provider chains
export const TEXT_PROVIDER_CHAIN: string[] = TEXT_CHAIN;
export const IMAGE_PROVIDER_CHAIN: string[] = ['openai', 'gemini'];

export type { ProviderId };
