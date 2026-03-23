// Provider registry — resolves ordered provider chains for different AI tasks.
// Wraps sdk-router with task-aware fallback chains and user key support.

import {
  getAllAvailableModels,
  createModelWithKey,
  markProviderFailed,
  type ProviderId,
  type ResolvedModel,
} from './sdk-router';

export type AITask = 'chat' | 'vision' | 'narration' | 'image_gen';

// Per-task fallback order (free providers first, then premium)
const CHAIN_ORDER: Record<AITask, ProviderId[]> = {
  chat:      ['groq', 'mistral', 'gemini', 'cerebras', 'deepseek', 'grok', 'claude', 'openai'],
  vision:    ['gemini', 'mistral', 'openai', 'grok', 'claude'],
  narration: ['mistral', 'groq', 'gemini', 'cerebras', 'deepseek', 'claude', 'openai'],
  image_gen: ['gemini', 'grok', 'openai'],
};

/**
 * Build an ordered array of ResolvedModel for a given task.
 *
 * @param task    - The type of AI task
 * @param mode    - "auto" uses the full fallback chain; a providerId string restricts to that one
 * @param userKeys - Decrypted user API keys from loadUserKeys()
 */
export function resolveProviderChain(
  task: AITask,
  mode: string = 'auto',
  userKeys: Record<string, string> = {},
): ResolvedModel[] {
  const order: ProviderId[] = mode === 'auto'
    ? CHAIN_ORDER[task]
    : [mode as ProviderId];

  // Start with server-side free providers that are currently available
  const available = getAllAvailableModels();
  const availableIds = new Set(available.map((m) => m.providerId));

  const chain: ResolvedModel[] = [];

  for (const id of order) {
    // Use server key if available
    if (availableIds.has(id)) {
      const m = available.find((m) => m.providerId === id);
      if (m) { chain.push(m); continue; }
    }
    // Use user's own key for premium providers
    if (userKeys[id]) {
      try {
        const model = createModelWithKey(id, userKeys[id]);
        chain.push({ model, providerId: id });
      } catch {
        // Invalid key — skip
      }
    }
  }

  return chain;
}

export { markProviderFailed };
export type { ProviderId, ResolvedModel };
