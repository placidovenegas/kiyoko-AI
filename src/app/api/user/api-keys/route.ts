import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, getApiKeyHint } from '@/lib/utils/crypto';
import type { AiProviderId } from '@/types';

/**
 * GET /api/user/api-keys
 * List all API keys for the current user (returns hints, not actual keys).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: keys, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, key_hint, is_active, monthly_budget_usd, monthly_spent_usd, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[api-keys/GET]', error);
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      keys: keys ?? [],
    });
  } catch (error) {
    console.error('[api-keys/GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: AddKeyBody = await request.json();
    const { provider, apiKey, monthlyBudget } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, apiKey' },
        { status: 400 }
      );
    }

    const validProviders: AiProviderId[] = ['gemini', 'claude', 'openai', 'groq', 'stability'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user already has a key for this provider
    const { data: existing } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a key for this provider. Use PATCH to update it.' },
        { status: 409 }
      );
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
        key_hint: keyHint,
        is_active: true,
        monthly_budget_usd: monthlyBudget ?? null,
        monthly_spent_usd: 0,
      })
      .select('id, provider, key_hint, is_active, monthly_budget_usd, monthly_spent_usd, created_at')
      .single();

    if (error) {
      console.error('[api-keys/POST]', error);
      return NextResponse.json(
        { error: 'Failed to save API key' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, key: newKey },
      { status: 201 }
    );
  } catch (error) {
    console.error('[api-keys/POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
