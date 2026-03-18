import { NextResponse } from 'next/server';
import { getAllProviderStatuses, PROVIDER_META, type ProviderId } from '@/lib/ai/sdk-router';

export async function GET() {
  const statuses = getAllProviderStatuses();

  // Build response with full provider info
  const providers = statuses.map((s) => {
    const meta = PROVIDER_META[s.id as ProviderId];
    let status: 'available' | 'rate_limited' | 'no_key' | 'cooldown';

    if (!s.hasKey) {
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
      // Quota info
      retryInSeconds: s.retryInSeconds,
      lastError: s.lastError,
    };
  });

  // Determine active provider (first available)
  const activeTextProvider = providers.find((p) => p.status === 'available')?.id ?? null;

  return NextResponse.json({
    success: true,
    providers,
    activeTextProvider,
    activeImageProvider: null,
  });
}
