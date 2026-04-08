import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, getApiKeyHint } from '@/lib/utils/crypto';
import type { AiProviderId } from '@/types';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  parseApiJson,
} from '@/lib/observability/server';

/**
 * GET /api/user/api-keys
 * List all API keys for the current user (returns hints, not actual keys).
 */
export async function GET(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: keys, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, api_key_hint, is_active, monthly_budget_usd, monthly_spent_usd, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return apiError(requestContext, 'api-keys/GET', error, {
        message: 'Failed to fetch API keys',
        extra: { userId: user.id },
      });
    }

    return apiJson(requestContext, {
      success: true,
      keys: keys ?? [],
    });
  } catch (error) {
    return apiError(requestContext, 'api-keys/GET', error);
  }
}

interface AddKeyBody {
  provider: AiProviderId;
  apiKey: string;
  monthlyBudget?: number;
}

/**
 * POST /api/user/api-keys
 * Add a new API key. The key is encrypted before storing.
 */
export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<AddKeyBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const { provider, apiKey, monthlyBudget } = body;

    if (!provider || !apiKey) {
      return apiBadRequest(requestContext, 'Missing required fields: provider, apiKey');
    }

    const validProviders: AiProviderId[] = ['openrouter', 'gemini', 'claude', 'openai'];
    if (!validProviders.includes(provider)) {
      return apiBadRequest(requestContext, `Invalid provider. Must be one of: ${validProviders.join(', ')}`);
    }

    // Check if user already has a key for this provider
    const { data: existing } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (existing) {
      return apiJson(requestContext, {
        error: 'You already have a key for this provider. Use PATCH to update it.',
        requestId: requestContext.requestId,
      }, { status: 409 });
    }

    // Encrypt the key before storing
    const encryptedKey = encrypt(apiKey);
    const keyHint = getApiKeyHint(apiKey);

    const { data: newKey, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        provider,
        api_key_encrypted: encryptedKey,
        api_key_hint: keyHint,
        is_active: true,
        monthly_budget_usd: monthlyBudget ?? null,
        monthly_spent_usd: 0,
      })
      .select('id, provider, api_key_hint, is_active, monthly_budget_usd, monthly_spent_usd, created_at')
      .single();

    if (error) {
      return apiError(requestContext, 'api-keys/POST', error, {
        message: 'Failed to save API key',
        extra: { userId: user.id, provider },
      });
    }

    return apiJson(requestContext, { success: true, key: newKey }, { status: 201 });
  } catch (error) {
    return apiError(requestContext, 'api-keys/POST', error);
  }
}
