import {
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
} from '@/lib/observability/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/users
 * List all users (admin only).
 */
export async function GET(request: Request) {
  const requestContext = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return apiJson(requestContext, { error: 'Forbidden: Admin access required', requestId: requestContext.requestId }, { status: 403 });
    }

    // Use admin client to bypass RLS and list all users
    const adminClient = createAdminClient();
    if (!adminClient) {
      return apiJson(requestContext, { error: 'Admin client not configured', requestId: requestContext.requestId }, { status: 500 });
    }

    const { data: users, error: usersError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      return apiError(requestContext, 'admin/users', usersError, {
        message: 'Failed to fetch users',
        extra: { adminUserId: user.id },
      });
    }

    // TODO: Optionally fetch usage stats per user
    // TODO: Add pagination support (limit, offset)

    logServerEvent('admin/users', requestContext, 'Listed admin users', {
      adminUserId: user.id,
      total: users?.length ?? 0,
    });

    return apiJson(requestContext, {
      success: true,
      users: users ?? [],
      total: users?.length ?? 0,
    });
  } catch (error) {
    return apiError(requestContext, 'admin/users', error);
  }
}
