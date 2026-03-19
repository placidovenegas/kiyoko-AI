import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateSpeechElevenLabs,
  ELEVENLABS_VOICES,
  DEFAULT_VOICE_ES,
  DEFAULT_VOICE_EN,
  getElevenLabsUsage,
} from '@/lib/tts/elevenlabs';

// Combined voice list (ElevenLabs + legacy Google names for backwards compat)
const ALL_VOICES = [
  ...ELEVENLABS_VOICES.map((v) => ({
    id: v.id,
    name: v.name,
    gender: v.gender,
    accent: v.accent,
    language: v.language,
    provider: 'elevenlabs' as const,
  })),
  // Legacy Google voices (kept for reference)
  { id: 'es-ES-Standard-B', name: 'Google ES Masculina', gender: 'male', accent: 'Espana', language: 'es', provider: 'google' as const },
  { id: 'es-ES-Standard-A', name: 'Google ES Femenina', gender: 'female', accent: 'Espana', language: 'es', provider: 'google' as const },
];

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  let usage = null;

  if (apiKey) {
    try {
      usage = await getElevenLabsUsage(apiKey);
    } catch {
      // Ignore usage fetch error
    }
  }

  return NextResponse.json({
    voices: ALL_VOICES,
    provider: apiKey ? 'elevenlabs' : 'none',
    usage,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      text: string;
      voice?: string;
      language?: string;
      provider?: 'elevenlabs' | 'google';
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speed?: number;
    };

    const { text, voice, language = 'es' } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // ─── Try ElevenLabs first (primary) ────────────────────────
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsKey) {
      try {
        const voiceId = voice || (language === 'en' ? DEFAULT_VOICE_EN : DEFAULT_VOICE_ES);
        const audioBuffer = await generateSpeechElevenLabs(elevenLabsKey, {
          text,
          voiceId,
          stability: body.stability,
          similarityBoost: body.similarityBoost,
          style: body.style,
        });

        return new NextResponse(new Uint8Array(audioBuffer), {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline; filename="narration.mp3"',
            'X-TTS-Provider': 'elevenlabs',
          },
        });
      } catch (err) {
        console.error('[generate-voice] ElevenLabs error:', err);
        // Fall through to Google TTS
      }
    }

    // ─── Try Google Cloud TTS (fallback) ───────────────────────
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (googleKey) {
      try {
        const googleVoiceName = voice?.startsWith('es-') || voice?.startsWith('en-')
          ? voice
          : language === 'en' ? 'en-US-Standard-D' : 'es-ES-Standard-B';

        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: {
                languageCode: language === 'en' ? 'en-US' : 'es-ES',
                name: googleVoiceName,
              },
              audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          return new NextResponse(Buffer.from(data.audioContent, 'base64'), {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': 'inline; filename="narration.mp3"',
              'X-TTS-Provider': 'google',
            },
          });
        }
      } catch (err) {
        console.error('[generate-voice] Google TTS error:', err);
      }
    }

    // ─── No provider available ─────────────────────────────────
    return NextResponse.json({
      error: 'No TTS provider configured.',
      tip: 'Anade ELEVENLABS_API_KEY en .env.local (gratis: elevenlabs.io, 10K chars/mes sin tarjeta).',
      fallback: 'browser',
    }, { status: 503 });

  } catch (error) {
    console.error('[generate-voice]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Voice generation failed' },
      { status: 500 },
    );
  }
}
