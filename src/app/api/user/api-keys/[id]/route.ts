import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, getApiKeyHint } from '@/lib/utils/crypto';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  parseApiJson,
} from '@/lib/observability/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatchKeyBody {
  apiKey?: string;
  isActive?: boolean;
  monthlyBudget?: number | null;
}

/**
 * PATCH /api/user/api-keys/[id]
 * Update an existing API key (key value, active status, or budget).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const requestContext = createApiRequestContext(request);
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    // Verify the key belongs to the user
    const { data: existingKey, error: fetchError } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingKey) {
      return apiJson(requestContext, { error: 'API key not found', requestId: requestContext.requestId }, { status: 404 });
    }

    const { data: body, response } = await parseApiJson<PatchKeyBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const updates: Record<string, unknown> = {};

    if (body.apiKey !== undefined) {
      updates.api_key_encrypted = encrypt(body.apiKey);
      updates.api_key_hint = getApiKeyHint(body.apiKey);
    }

    if (body.isActive !== undefined) {
      updates.is_active = body.isActive;
    }

    if (body.monthlyBudget !== undefined) {
      updates.monthly_budget_usd = body.monthlyBudget;
    }

    if (Object.keys(updates).length === 0) {
      return apiBadRequest(requestContext, 'No fields to update');
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedKey, error: updateError } = await supabase
      .from('user_api_keys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, provider, api_key_hint, is_active, monthly_budget_usd, monthly_spent_usd, updated_at')
      .single();

    if (updateError) {
      return apiError(requestContext, 'api-keys/[id]/PATCH', updateError, {
        message: 'Failed to update API key',
        extra: { userId: user.id, apiKeyId: id },
      });
    }

    return apiJson(requestContext, {
      success: true,
      key: updatedKey,
    });
  } catch (error) {
    return apiError(requestContext, 'api-keys/[id]/PATCH', error);
  }
}

/**
 * DELETE /api/user/api-keys/[id]
 * Remove an API key.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestContext = createApiRequestContext(request);
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { error: deleteError } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return apiError(requestContext, 'api-keys/[id]/DELETE', deleteError, {
        message: 'Failed to delete API key',
        extra: { userId: user.id, apiKeyId: id },
      });
    }

    return apiJson(requestContext, {
      success: true,
      message: 'API key deleted',
    });
  } catch (error) {
    return apiError(requestContext, 'api-keys/[id]/DELETE', error);
  }
}
