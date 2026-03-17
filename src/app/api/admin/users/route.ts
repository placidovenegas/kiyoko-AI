import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/users
 * List all users (admin only).
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Use admin client to bypass RLS and list all users
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
    }

    const { data: users, error: usersError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[admin/users/GET]', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // TODO: Optionally fetch usage stats per user
    // TODO: Add pagination support (limit, offset)

    return NextResponse.json({
      success: true,
      users: users ?? [],
      total: users?.length ?? 0,
    });
  } catch (error) {
    console.error('[admin/users/GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
