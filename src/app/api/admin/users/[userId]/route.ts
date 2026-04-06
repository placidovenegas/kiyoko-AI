import type { Database } from '@/types/database.types';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

type UserRole = Database['public']['Enums']['user_role'];

interface UpdateUserBody {
  role?: UserRole;
}

/**
 * PATCH /api/admin/users/[userId]
 * Update a user's role (admin only).
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const requestContext = createApiRequestContext(request);

  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    // Check if current user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return apiJson(requestContext, { error: 'Forbidden: Admin access required', requestId: requestContext.requestId }, { status: 403 });
    }

    // Prevent admin from demoting themselves
    if (userId === user.id) {
      return apiBadRequest(requestContext, 'Cannot modify your own role');
    }

    const { data: body, response } = await parseApiJson<UpdateUserBody>(request, requestContext);
    if (response) {
      return response;
    }

    const { role } = body;

    if (!role) {
      return apiBadRequest(requestContext, 'Missing required field: role');
    }

    const validRoles: UserRole[] = ['admin', 'editor', 'viewer', 'pending', 'blocked'];
    if (!validRoles.includes(role)) {
      return apiBadRequest(requestContext, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    if (!adminClient) {
      return apiJson(requestContext, { error: 'Admin client not configured', requestId: requestContext.requestId }, { status: 500 });
    }

    const { data: updatedUser, error: updateError } = await adminClient
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, full_name, role, updated_at')
      .single();

    if (updateError) {
      return apiError(requestContext, 'admin/users/[userId]', updateError, {
        message: 'Failed to update user',
        extra: { adminUserId: user.id, targetUserId: userId, role },
      });
    }

    if (!updatedUser) {
      return apiJson(requestContext, { error: 'User not found', requestId: requestContext.requestId }, { status: 404 });
    }

    logServerEvent('admin/users/[userId]', requestContext, 'Updated user role', {
      adminUserId: user.id,
      targetUserId: userId,
      role,
    });

    return apiJson(requestContext, {
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    return apiError(requestContext, 'admin/users/[userId]', error);
  }
}
