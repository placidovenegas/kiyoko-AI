import { createClient } from '@/lib/supabase/server';
import { getAllProviderStatuses, PROVIDER_META, type ProviderId } from '@/lib/ai/sdk-router';
import { apiJson, createApiRequestContext, logServerWarning } from '@/lib/observability/server';

export async function GET(request: Request) {
  const requestContext = createApiRequestContext(request);
  const statuses = getAllProviderStatuses();

  // Try to load user API keys to mark providers as available even without env keys
  let userProviderIds = new Set<string>();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userKeys } = await supabase
        .from('user_api_keys')
        .select('provider')
        .eq('user_id', user.id)
        .eq('is_active', true);
      userProviderIds = new Set((userKeys ?? []).map((k) => k.provider as string));
    }
  } catch (error) {
    logServerWarning('providers/status', requestContext, 'Failed to resolve user provider keys', {
      error,
    });
  }

  // Build response with full provider info
  const providers = statuses.map((s) => {
    const meta = PROVIDER_META[s.id as ProviderId];
    const hasUserKey = userProviderIds.has(s.id);
    const effectivelyHasKey = s.hasKey || hasUserKey;

    let status: 'available' | 'rate_limited' | 'no_key' | 'cooldown';

    if (!effectivelyHasKey) {
      status = 'no_key';
    } else if (s.isDisabled) {
      status = 'cooldown';
    } else {
      status = 'available';
    }

    return {
      id: s.id,
      name: s.name,
      type: 'text' as const,
      isFree: s.isFree,
      defaultModel: meta.defaultModel,
      imageModel: null,
      status,
      description: meta.description,
      signupUrl: meta.signupUrl,
      hasUserKey,
      retryInSeconds: s.retryInSeconds,
      lastError: s.lastError,
    };
  });

  // Determine active provider (first available)
  const activeTextProvider = providers.find((p) => p.status === 'available')?.id ?? null;

  return apiJson(requestContext, {
    success: true,
    providers,
    activeTextProvider,
    activeImageProvider: null,
  });
}
