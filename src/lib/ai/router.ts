import { AI_PROVIDERS, TEXT_PROVIDER_CHAIN, IMAGE_PROVIDER_CHAIN } from './providers/index';
import { GeminiProvider } from './providers/gemini';
import { ClaudeProvider } from './providers/claude';
import { OpenAIProvider } from './providers/openai';
import { GroqProvider } from './providers/groq';
import { StabilityProvider } from './providers/stability';
import type { BaseProvider, TextGenerationInput, StreamChunk } from './providers/base';
import type { AiProviderId } from '@/types';

const providerInstances: Record<string, BaseProvider> = {
  gemini: new GeminiProvider(),
  claude: new ClaudeProvider(),
  openai: new OpenAIProvider(),
  groq: new GroqProvider(),
  stability: new StabilityProvider(),
};

export interface ResolvedProvider {
  providerId: AiProviderId;
  apiKey: string;
  model: string;
  instance: BaseProvider;
}

/**
 * Get ALL available providers for a task (ordered by priority).
 */
export function getAvailableProviders(task: 'text' | 'image', preferredId?: string): ResolvedProvider[] {
  let chain = task === 'text' ? [...TEXT_PROVIDER_CHAIN] : [...IMAGE_PROVIDER_CHAIN];

  // Move preferred provider to front of chain
  if (preferredId) {
    chain = [preferredId as AiProviderId, ...chain.filter(id => id !== preferredId)];
  }

  const results: ResolvedProvider[] = [];

  for (const providerId of chain) {
    const provider = AI_PROVIDERS[providerId];
    if (!provider) continue;
    if (task === 'image' && provider.type === 'text') continue;
    if (task === 'text' && provider.type === 'image') continue;

    const instance = providerInstances[providerId];
    if (!instance) continue;

    const globalKey = process.env[provider.envKey];
    if (globalKey) {
      results.push({
        providerId: providerId as AiProviderId,
        apiKey: globalKey,
        model: task === 'text'
          ? provider.defaultModel
          : (provider.imageModel ?? provider.defaultModel),
        instance,
      });
    }
  }

  return results;
}

/**
 * Get first available provider (for simple use cases).
 */
export async function getAvailableProvider(
  _userId: string,
  task: 'text' | 'image',
  preferredId?: string
): Promise<ResolvedProvider> {
  const providers = getAvailableProviders(task, preferredId);
  if (providers.length === 0) {
    throw new Error(
      'NO_PROVIDER_AVAILABLE: No hay proveedores de IA configurados. Añade GOOGLE_AI_API_KEY o GROQ_API_KEY en .env.local'
    );
  }
  return providers[0];
}

/**
 * Generate text with automatic fallback across providers.
 * Tries each provider in order, falls back on error.
 */
export async function generateTextWithFallback(
  input: TextGenerationInput
): Promise<{ text: string; providerId: string; model: string }> {
  const providers = getAvailableProviders('text');
  if (providers.length === 0) {
    throw new Error('NO_PROVIDER_AVAILABLE');
  }

  for (const provider of providers) {
    try {
      const result = await provider.instance.generateText(input, provider.apiKey);
      return { text: result.text, providerId: provider.providerId, model: result.model };
    } catch (err) {
      console.error(`[AI] ${provider.providerId} failed:`, err instanceof Error ? err.message : err);
      continue; // Try next provider
    }
  }

  throw new Error('ALL_PROVIDERS_FAILED: Todos los proveedores de IA fallaron. Inténtalo de nuevo.');
}

/**
 * Stream text with automatic fallback across providers.
 * Tries each provider in order, falls back on error.
 */
export async function streamTextWithFallback(
  input: TextGenerationInput
): Promise<{ stream: AsyncIterable<StreamChunk>; providerId: string; model: string }> {
  const providers = getAvailableProviders('text');
  if (providers.length === 0) {
    throw new Error('NO_PROVIDER_AVAILABLE');
  }

  for (const provider of providers) {
    try {
      const stream = provider.instance.streamText(input, provider.apiKey);
      return { stream, providerId: provider.providerId, model: provider.model };
    } catch (err) {
      console.error(`[AI] ${provider.providerId} stream failed:`, err instanceof Error ? err.message : err);
      continue;
    }
  }

  throw new Error('ALL_PROVIDERS_FAILED');
}

/**
 * Log AI usage (best effort).
 */
export async function logUsage(params: {
  userId: string;
  projectId?: string;
  provider: string;
  model: string;
  task: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
}) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    if (!supabase) return;

    await supabase.from('ai_usage_logs').insert({
      user_id: params.userId,
      project_id: params.projectId ?? null,
      provider: params.provider,
      model: params.model,
      task: params.task,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      total_tokens: params.inputTokens + params.outputTokens,
      estimated_cost_usd: params.estimatedCost,
      response_time_ms: params.responseTimeMs,
      success: params.success,
      error_message: params.errorMessage ?? null,
      was_fallback: false,
    });
  } catch {
    // Silent fail
  }
}
