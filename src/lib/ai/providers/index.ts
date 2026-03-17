import type { AiProviderId } from '@/types';

export interface ProviderConfig {
  id: AiProviderId;
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

export const AI_PROVIDERS: Record<string, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'both',
    isFree: true,
    defaultModel: 'gemini-2.0-flash',
    imageModel: 'imagen-3.0-generate-001',
    rateLimitRpm: 15,
    costPer1kTokens: 0,
    sdk: '@google/generative-ai',
    envKey: 'GOOGLE_AI_API_KEY',
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    type: 'text',
    isFree: false,
    defaultModel: 'claude-sonnet-4-20250514',
    rateLimitRpm: 50,
    costPer1kTokens: 0.003,
    sdk: '@anthropic-ai/sdk',
    envKey: 'ANTHROPIC_API_KEY',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    type: 'both',
    isFree: false,
    defaultModel: 'gpt-4o-mini',
    imageModel: 'dall-e-3',
    rateLimitRpm: 60,
    costPer1kTokens: 0.00015,
    costPerImage: 0.04,
    sdk: 'openai',
    envKey: 'OPENAI_API_KEY',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    type: 'text',
    isFree: true,
    defaultModel: 'llama-3.3-70b-versatile',
    rateLimitRpm: 30,
    costPer1kTokens: 0,
    sdk: 'groq-sdk',
    envKey: 'GROQ_API_KEY',
  },
  stability: {
    id: 'stability',
    name: 'Stability AI',
    type: 'image',
    isFree: false,
    defaultModel: 'stable-diffusion-3',
    imageModel: 'stable-diffusion-3',
    rateLimitRpm: 10,
    costPer1kTokens: 0,
    costPerImage: 0.03,
    sdk: 'fetch',
    envKey: 'STABILITY_API_KEY',
  },
} as const;

/** Priority chain for text generation (Groq first - fast and free) */
export const TEXT_PROVIDER_CHAIN: AiProviderId[] = ['groq', 'gemini', 'claude', 'openai'];

/** Priority chain for image generation */
export const IMAGE_PROVIDER_CHAIN: AiProviderId[] = ['openai', 'stability', 'gemini'];
