import { createClient } from '@/lib/supabase/client';

/**
 * Número de filas en `user_api_keys` con `is_active = true` (misma semántica que `loadUserKeys`).
 * `null` si falla la consulta (RLS u otro error).
 */
export async function fetchActiveUserApiKeyCount(): Promise<number | null> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('user_api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) return null;
  return count ?? 0;
}
