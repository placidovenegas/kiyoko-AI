import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Admin client with service_role_key — ONLY use in server-side code.
 * Bypasses RLS. Returns null if service_role_key is not configured.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
