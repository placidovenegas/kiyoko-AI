import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Available voices
const VOICES = [
  { id: 'es-ES-AlvaroNeural', name: 'Álvaro', gender: 'male', accent: 'España' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'female', accent: 'España' },
  { id: 'es-MX-DaliaNeural', name: 'Dalia', gender: 'female', accent: 'México' },
  { id: 'es-MX-JorgeNeural', name: 'Jorge', gender: 'male', accent: 'México' },
  { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'female', accent: 'English' },
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'male', accent: 'English' },
];

export async function GET() {
  return NextResponse.json({ voices: VOICES });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, voice } = await request.json() as {
      text: string;
      voice?: string;
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Use Google TTS API (free tier) via Gemini API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'TTS not configured. Add GOOGLE_AI_API_KEY.' }, { status: 503 });
    }

    // Google Cloud TTS API endpoint (works with AI API key)
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: (voice || 'es-ES-AlvaroNeural').startsWith('en') ? 'en-US' : 'es-ES',
            name: voice || 'es-ES-Standard-B',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      // Fallback: return info about TTS capability
      return NextResponse.json({
        error: 'TTS API not available. Voice generation requires Google Cloud TTS API access.',
        voices: VOICES,
        tip: 'Para activar TTS, habilita la Cloud Text-to-Speech API en tu proyecto de Google Cloud.',
      }, { status: 503 });
    }

    const data = await response.json();
    const audioContent = data.audioContent; // base64

    return new NextResponse(Buffer.from(audioContent, 'base64'), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="narration.mp3"',
      },
    });
  } catch (error) {
    console.error('[generate-voice]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Voice generation failed' },
      { status: 500 }
    );
  }
}
