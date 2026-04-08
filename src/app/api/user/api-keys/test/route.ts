import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AiProviderId } from '@/types';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  logServerWarning,
  parseApiJson,
} from '@/lib/observability/server';

interface TestKeyBody {
  provider: AiProviderId;
  apiKey: string;
}

/**
 * POST /api/user/api-keys/test
 * Test if an API key is valid by making a minimal request to the provider.
 */
export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<TestKeyBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return apiBadRequest(requestContext, 'Missing required fields: provider, apiKey');
    }

    logServerEvent('api-keys/test', requestContext, 'Testing provider API key', {
      userId: user.id,
      provider,
    });

    let isValid = false;
    let errorMessage: string | null = null;

    try {
      switch (provider) {
        case 'gemini': {
          // Test with a minimal request to Gemini API
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
          );
          isValid = response.ok;
          if (!response.ok) {
            errorMessage = `Gemini API returned status ${response.status}`;
          }
          break;
        }

        case 'claude': {
          // Test with a minimal message to Claude API
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'hi' }],
            }),
          });
          // 200 or 400 (bad request but authenticated) means key is valid
          isValid = response.status !== 401 && response.status !== 403;
          if (!isValid) {
            errorMessage = `Anthropic API returned status ${response.status}`;
          }
          break;
        }

        case 'openai': {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          isValid = response.ok;
          if (!response.ok) {
            errorMessage = `OpenAI API returned status ${response.status}`;
          }
          break;
        }

        case 'openrouter': {
          const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          isValid = response.ok;
          if (!response.ok) {
            errorMessage = `OpenRouter API returned status ${response.status}`;
          }
          break;
        }

        default:
          return apiBadRequest(requestContext, `Unknown provider: ${provider}`);
      }
    } catch (fetchError) {
      isValid = false;
      errorMessage = fetchError instanceof Error ? fetchError.message : 'Connection failed';
      logServerWarning('api-keys/test', requestContext, 'Provider key test request failed', {
        userId: user.id,
        provider,
        errorMessage,
      });
    }

    return apiJson(requestContext, {
      success: true,
      isValid,
      provider,
      error: errorMessage,
    });
  } catch (error) {
    return apiError(requestContext, 'api-keys/test', error);
  }
}
