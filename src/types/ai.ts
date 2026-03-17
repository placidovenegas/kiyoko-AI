export type AiProviderId = 'gemini' | 'claude' | 'openai' | 'groq' | 'stability';
export type AiProviderType = 'text' | 'image' | 'both';
export type AiTask = 'text_generation' | 'image_generation' | 'chat' | 'analysis';

export interface AiProvider {
  id: AiProviderId;
  name: string;
  type: AiProviderType;
  isFree: boolean;
  priority: number;
  isAvailable: boolean;
  hasQuota: boolean;
  rateLimitRpm: number;
  models: {
    text?: string;
    image?: string;
  };
}

export interface AiRouterConfig {
  userId: string;
  task: AiTask;
  preferredProvider?: AiProviderId;
  fallbackEnabled: boolean;
}

export interface AiTextResponse {
  text: string;
  providerId: AiProviderId;
  model: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
}

export interface AiImageResponse {
  imageUrl: string;
  providerId: AiProviderId;
  model: string;
  responseTimeMs: number;
}

export interface QuotaStatus {
  providerId: AiProviderId;
  requestsThisMinute: number;
  maxRequestsPerMinute: number;
  isAvailable: boolean;
}

export interface AiUsageLog {
  id: string;
  user_id: string;
  project_id: string | null;
  provider: string;
  model: string;
  task: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  was_fallback: boolean;
  original_provider: string | null;
  fallback_reason: string | null;
  response_time_ms: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: AiProviderId;
  api_key_encrypted: string;
  api_key_hint: string;
  is_active: boolean;
  total_requests: number;
  total_tokens_used: number;
  total_cost_usd: number;
  last_used_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  monthly_budget_usd: number | null;
  monthly_spent_usd: number;
  budget_reset_at: string | null;
  created_at: string;
  updated_at: string;
}
