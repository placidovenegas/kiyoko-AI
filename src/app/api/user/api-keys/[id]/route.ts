import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, getApiKeyHint } from '@/lib/utils/crypto';

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
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the key belongs to the user
    const { data: existingKey, error: fetchError } = await supabase
      .from('user_api_keys')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    const body: PatchKeyBody = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.apiKey !== undefined) {
      updates.api_key_encrypted = encrypt(body.apiKey);
      updates.key_hint = getApiKeyHint(body.apiKey);
    }

    if (body.isActive !== undefined) {
      updates.is_active = body.isActive;
    }

    if (body.monthlyBudget !== undefined) {
      updates.monthly_budget_usd = body.monthlyBudget;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedKey, error: updateError } = await supabase
      .from('user_api_keys')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, provider, key_hint, is_active, monthly_budget_usd, monthly_spent_usd, updated_at')
      .single();

    if (updateError) {
      console.error('[api-keys/PATCH]', updateError);
      return NextResponse.json(
        { error: 'Failed to update API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      key: updatedKey,
    });
  } catch (error) {
    console.error('[api-keys/PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/api-keys/[id]
 * Remove an API key.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error: deleteError } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[api-keys/DELETE]', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted',
    });
  } catch (error) {
    console.error('[api-keys/DELETE]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
