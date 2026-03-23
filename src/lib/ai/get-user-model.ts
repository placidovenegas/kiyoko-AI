import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/utils/crypto';
import { getModel, createModelWithKey, type ProviderId, type ResolvedModel } from './sdk-router';

/**
 * Get the best model for a user, preferring their own API key if available.
 * Falls back to system keys via the standard fallback chain.
 */
export async function getUserModel(
  userId: string,
  preferredProvider?: ProviderId
): Promise<ResolvedModel> {
  try {
    const supabase = await createClient();

    // Check if user has their own API key for the preferred provider
    if (preferredProvider) {
      const { data: userKey } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted, provider')
        .eq('user_id', userId)
        .eq('provider', preferredProvider)
        .eq('is_active', true)
        .single();

      if (userKey?.api_key_encrypted) {
        const apiKey = decrypt(userKey.api_key_encrypted);
        const model = createModelWithKey(preferredProvider, apiKey);
        return { model, providerId: preferredProvider };
      }
    }

    // Check if user has ANY active key
    const { data: userKeys } = await supabase
      .from('user_api_keys')
      .select('api_key_encrypted, provider')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (userKeys?.length) {
      for (const key of userKeys) {
        try {
          const apiKey = decrypt(key.api_key_encrypted);
          const model = createModelWithKey(key.provider as ProviderId, apiKey);
          return { model, providerId: key.provider as ProviderId };
        } catch {
          continue; // Try next key
        }
      }
    }
  } catch {
    // Fall through to system keys
  }

  // Fallback to system keys
  return getModel(preferredProvider);
}
