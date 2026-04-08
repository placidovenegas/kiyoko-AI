/**
 * OpenRouter Provider — Qwen 3.5 Models
 *
 * Uses OpenRouter's OpenAI-compatible API to access Qwen models.
 * Qwen3.5 Flash: fast, cost-effective for storyboard generation
 * Qwen3.5 Plus: higher quality for complex creative tasks
 *
 * API: https://openrouter.ai/api/v1
 * Requires: OPENROUTER_API_KEY environment variable
 */

import OpenAI from 'openai';

/** Available Qwen models via OpenRouter */
export type QwenModel =
  | 'qwen/qwen3.5-flash-02-23'
  | 'qwen/qwen3.5-plus-02-15';

/** Default model for general creative tasks */
export const DEFAULT_QWEN_MODEL: QwenModel = 'qwen/qwen3.5-flash-02-23';

/** Higher-quality model for complex creative decisions */
export const QWEN_PLUS_MODEL: QwenModel = 'qwen/qwen3.5-plus-02-15';

/**
 * Create an OpenAI-compatible client configured for OpenRouter.
 * Instantiated lazily to avoid errors when env var is not set at import time.
 */
function getClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });
}

/**
 * Call a Qwen model via OpenRouter and return parsed JSON.
 *
 * @param systemPrompt - System instructions for the model
 * @param userMessage - User prompt content
 * @param model - Which Qwen model to use
 * @param temperature - Sampling temperature (0-2)
 * @returns Parsed JSON response from the model
 */
export async function callQwen(
  systemPrompt: string,
  userMessage: string,
  model: QwenModel = DEFAULT_QWEN_MODEL,
  temperature: number = 0.8
): Promise<unknown> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter returned an empty response');
  }

  return JSON.parse(content) as unknown;
}

/**
 * Call a Qwen model and return raw text (no JSON parsing).
 *
 * @param systemPrompt - System instructions for the model
 * @param userMessage - User prompt content
 * @param model - Which Qwen model to use
 * @param temperature - Sampling temperature (0-2)
 * @returns Raw text response from the model
 */
export async function callQwenText(
  systemPrompt: string,
  userMessage: string,
  model: QwenModel = DEFAULT_QWEN_MODEL,
  temperature: number = 0.8
): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter returned an empty response');
  }

  return content;
}
