import { NextRequest } from 'next/server';
import {
  apiJson,
  createApiRequestContext,
  logServerEvent,
  logServerWarning,
} from '@/lib/observability/server';

// Cache voices for 1 hour
let cachedVoices: unknown[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600_000; // 1 hour

export async function GET(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return apiJson(requestContext, { voices: [], error: 'ELEVENLABS_API_KEY not configured' });
  }

  // Return cached if fresh
  if (cachedVoices && Date.now() - cacheTimestamp < CACHE_TTL) {
    logServerEvent('voices/GET', requestContext, 'Returning cached voices', {
      voiceCount: cachedVoices.length,
    });
    return apiJson(requestContext, { voices: cachedVoices });
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!res.ok) throw new Error(`ElevenLabs API error: ${res.status}`);

    const data = await res.json();
    const voices = (data.voices ?? []).map((v: Record<string, unknown>) => ({
      voice_id: v.voice_id,
      name: v.name,
      labels: v.labels || {},
      preview_url: v.preview_url || '',
      category: v.category || 'premade',
    }));

    // Cache
    cachedVoices = voices;
    cacheTimestamp = Date.now();

    return apiJson(requestContext, { voices });
  } catch (error) {
    logServerWarning('voices/GET', requestContext, 'Failed to fetch voices from ElevenLabs', {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return apiJson(requestContext, { voices: [], error: 'Failed to fetch voices' });
  }
}
