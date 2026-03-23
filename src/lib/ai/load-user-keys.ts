import type { SupabaseClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/utils/crypto';

/**
 * Load and decrypt all active API keys for a user from user_api_keys table.
 * Returns a map of { providerId: decryptedKey }.
 * Silently skips corrupted/invalid keys.
 */
export async function loadUserKeys(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('user_api_keys')
    .select('provider, api_key_encrypted')
    .eq('user_id', userId)
    .eq('is_active', true);

  const keys: Record<string, string> = {};
  for (const row of data ?? []) {
    try {
      keys[row.provider] = decrypt(row.api_key_encrypted);
    } catch {
      // Key corrupted — skip silently
    }
  }
  return keys;
}
