import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

// ---------------------------------------------------------------------------
// Stack B: Qwen (cerebro) + Gemini (ojos) + Voxtral (voz)
// Solo 3 env vars necesarias: OPENROUTER_API_KEY, GOOGLE_AI_API_KEY, MISTRAL_API_KEY
// Claude y OpenAI opcionales (si el usuario pone su key)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProviderId = 'openrouter' | 'gemini' | 'claude';

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
  disabledUntil: number | null;
  retryInSeconds: number | null;
  lastError: string | null;
}

// ---------------------------------------------------------------------------
// Provider metadata
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
  openrouter: {
    id: 'openrouter',
    name: 'Qwen 3.5 (OpenRouter)',
    isFree: true,
    defaultModel: 'qwen/qwen3.5-flash-02-23',
    envKey: 'OPENROUTER_API_KEY',
    description: 'Cerebro principal — generacion de escenas, prompts, chat',
    signupUrl: 'https://openrouter.ai/keys',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini Flash',
    isFree: true,
    defaultModel: 'gemini-2.0-flash',
    envKey: 'GOOGLE_AI_API_KEY',
    description: 'Vision + fallback de texto, analisis de imagenes',
    signupUrl: 'https://aistudio.google.com/apikey',
  },
  claude: {
    id: 'claude',
    name: 'Claude Sonnet 4',
    isFree: false,
    defaultModel: 'claude-sonnet-4-20250514',
    envKey: 'ANTHROPIC_API_KEY',
    description: 'Premium — mejor calidad de personajes (requiere API key)',
    signupUrl: 'https://console.anthropic.com',
  },
};

// ---------------------------------------------------------------------------
// Model registry
// ---------------------------------------------------------------------------

const MODELS: Record<ProviderId, () => LanguageModel> = {
  openrouter: () => {
    const or = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    return or.chat('qwen/qwen3.5-flash-02-23');
  },
  gemini: () => {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
    return google('gemini-2.0-flash');
  },
  claude: () => {
    const a = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return a('claude-sonnet-4-20250514');
  },
};

// ---------------------------------------------------------------------------
// Fallback chain — Stack B
// ---------------------------------------------------------------------------

// Primary: Qwen via OpenRouter (fast, cheap, good quality)
// Fallback: Gemini (free, versatile)
// Premium: Claude (only if user has API key)
const TEXT_CHAIN: ProviderId[] = ['openrouter', 'gemini', 'claude'];

// ---------------------------------------------------------------------------
// Cooldown tracking
// ---------------------------------------------------------------------------

interface CooldownInfo {
  until: number;
  lastError: string;
  retryAfterSec: number | null;
}

const globalKey = '__kiyoko_provider_cooldowns__' as const;
type GlobalWithCooldowns = typeof globalThis & { [globalKey]?: Map<ProviderId, CooldownInfo> };
const g = globalThis as GlobalWithCooldowns;
if (!g[globalKey]) g[globalKey] = new Map();
const providerCooldowns = g[globalKey];

const DEFAULT_COOLDOWN_MS = 3 * 60 * 1000;
const BILLING_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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
  const isAuthError = msg.includes('402') || msg.includes('403') || msg.includes('Forbidden') || msg.includes('401') || msg.includes('Unauthorized') || msg.includes('permission') || msg.includes('credits') || msg.includes('Insufficient') || msg.includes('Balance');
  const cooldownMs = isAuthError ? BILLING_COOLDOWN_MS : retryAfterSec ? retryAfterSec * 1000 + 5000 : DEFAULT_COOLDOWN_MS;

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
  if (Date.now() > info.until) { providerCooldowns.delete(id); return false; }
  return true;
}

function getCooldownInfo(id: ProviderId): CooldownInfo | null {
  const info = providerCooldowns.get(id);
  if (!info) return null;
  if (Date.now() > info.until) { providerCooldowns.delete(id); return null; }
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
  throw new Error('NO_PROVIDER_AVAILABLE: Ningún proveedor disponible. Configura OPENROUTER_API_KEY o GOOGLE_AI_API_KEY.');
}

export function getModelWithFallback(): ResolvedModel {
  return getModel();
}

export function getAllAvailableModels(): ResolvedModel[] {
  const models: ResolvedModel[] = [];
  for (const id of TEXT_CHAIN) {
    if (isAvailable(id)) {
      models.push({ model: MODELS[id](), providerId: id });
    }
  }
  return models;
}

export function getAllProviderStatuses(): ProviderStatus[] {
  return TEXT_CHAIN.map((id) => {
    const cooldown = getCooldownInfo(id);
    const retryIn = cooldown ? Math.max(0, Math.round((cooldown.until - Date.now()) / 1000)) : null;
    return {
      id, name: PROVIDER_META[id].name, hasKey: hasApiKey(id),
      isFree: PROVIDER_META[id].isFree, isDisabled: isProviderOnCooldown(id),
      disabledUntil: cooldown?.until ?? null, retryInSeconds: retryIn,
      lastError: cooldown?.lastError ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Create model from user-provided API key
// ---------------------------------------------------------------------------

export function createModelWithKey(providerId: ProviderId, apiKey: string): LanguageModel {
  switch (providerId) {
    case 'openrouter': {
      const or = createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey });
      return or.chat('qwen/qwen3.5-flash-02-23');
    }
    case 'gemini': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google('gemini-2.0-flash');
    }
    case 'claude': {
      const a = createAnthropic({ apiKey });
      return a('claude-sonnet-4-20250514');
    }
    default: throw new Error(`Unknown provider: ${providerId}`);
  }
}

// ---------------------------------------------------------------------------
// Usage logging
// ---------------------------------------------------------------------------

export async function logUsage(params: {
  userId: string; projectId?: string; provider: string; model: string;
  task: string; inputTokens: number; outputTokens: number;
  estimatedCost: number; responseTimeMs: number; success: boolean; errorMessage?: string;
}): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    if (!supabase) return;
    await supabase.from('ai_usage_logs').insert({
      user_id: params.userId, project_id: params.projectId ?? null,
      provider: params.provider, model: params.model, task: params.task,
      input_tokens: params.inputTokens, output_tokens: params.outputTokens,
      total_tokens: params.inputTokens + params.outputTokens,
      estimated_cost_usd: params.estimatedCost, response_time_ms: params.responseTimeMs,
      success: params.success, error_message: params.errorMessage ?? null, was_fallback: false,
    });
  } catch { /* Silent fail */ }
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { TEXT_CHAIN, MODELS };
