import { NextResponse } from 'next/server';

// Cache voices for 1 hour
let cachedVoices: unknown[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600_000; // 1 hour

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ voices: [], error: 'ELEVENLABS_API_KEY not configured' });
  }

  // Return cached if fresh
  if (cachedVoices && Date.now() - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ voices: cachedVoices });
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

    return NextResponse.json({ voices });
  } catch (error) {
    console.error('[voices]', error);
    return NextResponse.json({ voices: [], error: 'Failed to fetch voices' });
  }
}
