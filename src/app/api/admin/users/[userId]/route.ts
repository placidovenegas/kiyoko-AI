import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

interface UpdateUserBody {
  role?: 'user' | 'admin' | 'moderator';
}

/**
 * PATCH /api/admin/users/[userId]
 * Update a user's role (admin only).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user is admin
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

    // Prevent admin from demoting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 400 }
      );
    }

    const body: UpdateUserBody = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'Missing required field: role' },
        { status: 400 }
      );
    }

    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Cast role to the DB enum type — the profiles table may use a different enum
    const dbRole = role as 'admin' | 'editor' | 'viewer' | 'pending' | 'blocked';

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 });
    }

    const { data: updatedUser, error: updateError } = await adminClient
      .from('profiles')
      .update({ role: dbRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, full_name, role, updated_at')
      .single();

    if (updateError) {
      console.error('[admin/users/PATCH]', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[admin/users/PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
