import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { anthropic, createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
import { xai } from '@ai-sdk/xai';
import { mistral } from '@ai-sdk/mistral';
import type { LanguageModel } from 'ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProviderId = 'groq' | 'cerebras' | 'mistral' | 'gemini' | 'grok' | 'deepseek' | 'claude' | 'openai';

export interface ResolvedModel {
  model: LanguageModel;
  providerId: ProviderId;
}

export interface ProviderStatus {
  id: ProviderId;
  name: string;
  hasKey: boolean;
  isFree: boolean;
  isDisabled: boolean;
  disabledUntil: number | null; // timestamp
  retryInSeconds: number | null; // seconds until re-enabled
  lastError: string | null;
}

// ---------------------------------------------------------------------------
// Provider metadata (shared with UI)
// ---------------------------------------------------------------------------

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  isFree: boolean;
  defaultModel: string;
  envKey: string;
  description: string;
  signupUrl: string;
}

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  grok: {
    id: 'grok',
    name: 'Grok (xAI)',
    isFree: true,
    defaultModel: 'grok-3-fast',
    envKey: 'XAI_API_KEY',
    description: 'Mejor para escritura creativa y emocional',
    signupUrl: 'https://console.x.ai',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek V3',
    isFree: true,
    defaultModel: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
    description: 'Narrativas complejas y analisis profundo',
    signupUrl: 'https://platform.deepseek.com',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini Flash',
    isFree: true,
    defaultModel: 'gemini-2.0-flash',
    envKey: 'GOOGLE_AI_API_KEY',
    description: 'Versatil y rapido, texto e imagenes',
    signupUrl: 'https://aistudio.google.com/apikey',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral Large',
    isFree: true,
    defaultModel: 'mistral-large-latest',
    envKey: 'MISTRAL_API_KEY',
    description: 'Preciso y tecnico, 1B tokens gratis/mes',
    signupUrl: 'https://console.mistral.ai',
  },
  groq: {
    id: 'groq',
    name: 'Groq LLaMA 3.3',
    isFree: true,
    defaultModel: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
    description: 'Ultrarrapido, buen fallback',
    signupUrl: 'https://console.groq.com/keys',
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    isFree: true,
    defaultModel: 'llama3.1-8b',
    envKey: 'CEREBRAS_API_KEY',
    description: 'La inferencia mas rapida del mundo, gratis',
    signupUrl: 'https://cloud.cerebras.ai',
  },
  claude: {
    id: 'claude',
    name: 'Claude Sonnet 4',
    isFree: false,
    defaultModel: 'claude-sonnet-4-20250514',
    envKey: 'ANTHROPIC_API_KEY',
    description: 'El mejor en personajes vivos (premium)',
    signupUrl: 'https://console.anthropic.com',
  },
  openai: {
    id: 'openai',
    name: 'GPT-4o Mini',
    isFree: false,
    defaultModel: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
    description: 'Fiable y versatil (premium)',
    signupUrl: 'https://platform.openai.com',
  },
};

// ---------------------------------------------------------------------------
// Model registry — each entry is a factory so we only instantiate on use
// ---------------------------------------------------------------------------

const MODELS: Record<ProviderId, () => LanguageModel> = {
  grok: () => xai('grok-3-fast'),
  deepseek: () => {
    const ds = createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY });
    return ds.chat('deepseek-chat');
  },
  gemini: () => {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
    return google('gemini-2.0-flash');
  },
  mistral: () => mistral('mistral-large-latest'),
  groq: () => groq('llama-3.3-70b-versatile'),
  cerebras: () => {
    const c = createOpenAI({ baseURL: 'https://api.cerebras.ai/v1', apiKey: process.env.CEREBRAS_API_KEY });
    return c.chat('llama3.1-8b');
  },
  claude: () => anthropic('claude-sonnet-4-20250514'),
  openai: () => {
    const oai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return oai('gpt-4o-mini');
  },
};

// ---------------------------------------------------------------------------
// Fallback chain — optimized for creative writing
// ---------------------------------------------------------------------------

// Fallback chain: quality free first, then fast fallbacks, then premium.
// Groq = fast + 128K context. Mistral = best free quality. Gemini = versatile.
// Cerebras = ultra-fast but only 8K context (fails with large project prompts).
const TEXT_CHAIN: ProviderId[] = ['groq', 'mistral', 'gemini', 'cerebras', 'grok', 'deepseek', 'claude', 'openai'];

// ---------------------------------------------------------------------------
// Quota / cooldown tracking
// ---------------------------------------------------------------------------

interface CooldownInfo {
  until: number;       // timestamp ms
  lastError: string;
  retryAfterSec: number | null; // from API response if available
}

// Use globalThis to survive Next.js hot-reloads in dev
const globalKey = '__kiyoko_provider_cooldowns__' as const;
type GlobalWithCooldowns = typeof globalThis & { [globalKey]?: Map<ProviderId, CooldownInfo> };
const g = globalThis as GlobalWithCooldowns;
if (!g[globalKey]) g[globalKey] = new Map();
const providerCooldowns = g[globalKey];

const DEFAULT_COOLDOWN_MS = 3 * 60 * 1000;        // 3 min for transient rate limits
const BILLING_COOLDOWN_MS = 24 * 60 * 60 * 1000;  // 24h for billing/auth errors (won't fix itself)

/**
 * Parse retry-after seconds from error message (e.g., "Please retry in 41.882903401s.")
 */
function parseRetryAfter(errorMessage: string): number | null {
  const match = errorMessage.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (match) return Math.ceil(parseFloat(match[1]));

  const matchSec = errorMessage.match(/retryDelay.*?(\d+)s/i);
  if (matchSec) return parseInt(matchSec[1], 10);

  return null;
}

export function markProviderFailed(id: ProviderId, errorMessage?: string): void {
  const msg = errorMessage ?? '';
  const retryAfterSec = parseRetryAfter(msg);

  // 402/403/401 = auth/billing issue — won't fix itself, long cooldown
  const isAuthError = msg.includes('402') || msg.includes('403') || msg.includes('Forbidden') || msg.includes('401') || msg.includes('Unauthorized') || msg.includes('permission') || msg.includes('credits') || msg.includes('Insufficient') || msg.includes('Balance');
  const cooldownMs = isAuthError
    ? BILLING_COOLDOWN_MS
    : retryAfterSec
      ? retryAfterSec * 1000 + 5000
      : DEFAULT_COOLDOWN_MS;

  providerCooldowns.set(id, {
    until: Date.now() + cooldownMs,
    lastError: errorMessage?.slice(0, 200) ?? 'Unknown error',
    retryAfterSec,
  });

  console.warn(`[sdk-router] ${id} disabled for ${Math.round(cooldownMs / 1000)}s`);
}

function isProviderOnCooldown(id: ProviderId): boolean {
  const info = providerCooldowns.get(id);
  if (!info) return false;
  if (Date.now() > info.until) {
    providerCooldowns.delete(id);
    return false;
  }
  return true;
}

function getCooldownInfo(id: ProviderId): CooldownInfo | null {
  const info = providerCooldowns.get(id);
  if (!info) return null;
  if (Date.now() > info.until) {
    providerCooldowns.delete(id);
    return null;
  }
  return info;
}

// ---------------------------------------------------------------------------
// Provider availability
// ---------------------------------------------------------------------------

function hasApiKey(id: ProviderId): boolean {
  const key = process.env[PROVIDER_META[id].envKey];
  return typeof key === 'string' && key.length > 0;
}

function isAvailable(id: ProviderId): boolean {
  return hasApiKey(id) && !isProviderOnCooldown(id);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
    'NO_PROVIDER_AVAILABLE: Todos los proveedores estan en cooldown o sin API key.',
  );
}

export function getModelWithFallback(): ResolvedModel {
  return getModel();
}

/**
 * Get all available models in the fallback chain order.
 */
export function getAllAvailableModels(): ResolvedModel[] {
  const models: ResolvedModel[] = [];
  for (const id of TEXT_CHAIN) {
    if (isAvailable(id)) {
      models.push({ model: MODELS[id](), providerId: id });
    }
  }
  return models;
}

/**
 * Get status of all providers (for the status API endpoint).
 */
export function getAllProviderStatuses(): ProviderStatus[] {
  return TEXT_CHAIN.map((id) => {
    const cooldown = getCooldownInfo(id);
    const retryIn = cooldown ? Math.max(0, Math.round((cooldown.until - Date.now()) / 1000)) : null;

    return {
      id,
      name: PROVIDER_META[id].name,
      hasKey: hasApiKey(id),
      isFree: PROVIDER_META[id].isFree,
      isDisabled: isProviderOnCooldown(id),
      disabledUntil: cooldown?.until ?? null,
      retryInSeconds: retryIn,
      lastError: cooldown?.lastError ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Create model from a user-provided API key (decrypted)
// ---------------------------------------------------------------------------

export function createModelWithKey(providerId: ProviderId, apiKey: string): LanguageModel {
  // All providers that use OpenAI-compatible API or have a createXxx factory
  switch (providerId) {
    case 'grok': {
      const x = createOpenAI({ baseURL: 'https://api.x.ai/v1', apiKey });
      return x.chat('grok-3-fast');
    }
    case 'deepseek': {
      const ds = createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey });
      return ds.chat('deepseek-chat');
    }
    case 'gemini': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google('gemini-2.0-flash');
    }
    case 'mistral': {
      const m = createOpenAI({ baseURL: 'https://api.mistral.ai/v1', apiKey });
      return m.chat('mistral-large-latest');
    }
    case 'groq': {
      const g = createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey });
      return g.chat('llama-3.3-70b-versatile');
    }
    case 'cerebras': {
      const c = createOpenAI({ baseURL: 'https://api.cerebras.ai/v1', apiKey });
      return c.chat('llama3.1-8b');
    }
    case 'claude': {
      const a = createAnthropic({ apiKey });
      return a('claude-sonnet-4-20250514');
    }
    case 'openai': {
      const oai = createOpenAI({ apiKey });
      return oai('gpt-4o-mini');
    }
    default: throw new Error(`Unknown provider: ${providerId}`);
  }
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

export { TEXT_CHAIN, MODELS };
