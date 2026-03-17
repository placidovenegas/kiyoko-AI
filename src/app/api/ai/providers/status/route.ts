import { NextResponse } from 'next/server';
import { AI_PROVIDERS, TEXT_PROVIDER_CHAIN, IMAGE_PROVIDER_CHAIN } from '@/lib/ai/providers';

export async function GET() {
  const providers = Object.values(AI_PROVIDERS).map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    isFree: p.isFree,
    model: p.defaultModel,
    imageModel: p.imageModel || null,
    available: !!process.env[p.envKey],
    envKey: p.envKey,
  }));

  // Find first available text provider
  let activeTextProvider: string | null = null;
  for (const id of TEXT_PROVIDER_CHAIN) {
    const p = AI_PROVIDERS[id];
    if (p && process.env[p.envKey]) { activeTextProvider = id; break; }
  }

  // Find first available image provider
  let activeImageProvider: string | null = null;
  for (const id of IMAGE_PROVIDER_CHAIN) {
    const p = AI_PROVIDERS[id];
    if (p && p.type !== 'text' && process.env[p.envKey]) { activeImageProvider = id; break; }
  }

  return NextResponse.json({ providers, activeTextProvider, activeImageProvider });
}
