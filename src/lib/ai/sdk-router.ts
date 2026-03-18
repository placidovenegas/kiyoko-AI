import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import { xai } from '@ai-sdk/xai';
import { mistral } from '@ai-sdk/mistral';
import type { LanguageModel } from 'ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProviderId = 'grok' | 'deepseek' | 'gemini' | 'mistral' | 'groq' | 'claude' | 'openai';

interface ResolvedModel {
  model: LanguageModel;
  providerId: ProviderId;
}

// ---------------------------------------------------------------------------
// Model registry — each entry is a factory so we only instantiate on use
// ---------------------------------------------------------------------------

const MODELS: Record<ProviderId, () => LanguageModel> = {
  grok: () => xai('grok-3-fast'),
  deepseek: () => {
    const ds = createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY });
    return ds('deepseek-chat');
  },
  gemini: () => {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
    return google('gemini-2.0-flash');
  },
  mistral: () => mistral('mistral-large-latest'),
  groq: () => groq('llama-3.3-70b-versatile'),
  claude: () => anthropic('claude-sonnet-4-20250514'),
  openai: () => {
    const oai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return oai('gpt-4o-mini');
  },
};

// ---------------------------------------------------------------------------
// Environment variable each provider needs
// ---------------------------------------------------------------------------

const ENV_KEYS: Record<ProviderId, string> = {
  grok: 'XAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  gemini: 'GOOGLE_AI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  groq: 'GROQ_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
};

// ---------------------------------------------------------------------------
// Fallback chain — optimized for creative writing
// Grok #1 (best creative), DeepSeek #2 (narrative), Gemini #3 (versatile),
// Mistral #4 (precise), Groq #5 (fast), Claude #6 (soul), OpenAI #7 (reliable)
// ---------------------------------------------------------------------------

const TEXT_CHAIN: ProviderId[] = ['grok', 'deepseek', 'gemini', 'mistral', 'groq', 'claude', 'openai'];

// ---------------------------------------------------------------------------
// Provider helpers
// ---------------------------------------------------------------------------

function isAvailable(id: ProviderId): boolean {
  const key = process.env[ENV_KEYS[id]];
  return typeof key === 'string' && key.length > 0;
}

export function getModel(preferredId?: ProviderId): ResolvedModel {
  if (preferredId && isAvailable(preferredId)) {
    return { model: MODELS[preferredId](), providerId: preferredId };
  }

  for (const id of TEXT_CHAIN) {
    if (isAvailable(id)) {
      return { model: MODELS[id](), providerId: id };
    }
  }

  throw new Error(
    'NO_PROVIDER_AVAILABLE: No hay proveedores de IA configurados. Añade al menos una API key en .env.local (GROQ_API_KEY, GOOGLE_AI_API_KEY, XAI_API_KEY, etc.)',
  );
}

export function getModelWithFallback(): ResolvedModel {
  return getModel();
}

// ---------------------------------------------------------------------------
// Usage logging (best-effort, never throws)
// ---------------------------------------------------------------------------

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
}): Promise<void> {
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

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { TEXT_CHAIN, MODELS, ENV_KEYS };
export type { ProviderId, ResolvedModel };
