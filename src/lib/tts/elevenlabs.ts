/**
 * ElevenLabs TTS Client
 *
 * Free tier: 10,000 characters/month
 * High quality multilingual voices
 *
 * API: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
 */

export interface ElevenLabsVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  accent: string;
  previewUrl?: string;
}

// Curated voices for Kiyoko (Spanish + English)
// Full list: https://api.elevenlabs.io/v1/voices
export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  // Spanish
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', language: 'es', gender: 'female', accent: 'Espana' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', language: 'es', gender: 'male', accent: 'Espana' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', language: 'es', gender: 'female', accent: 'Neutral' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', language: 'es', gender: 'male', accent: 'Neutral' },
  // English
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', language: 'en', gender: 'female', accent: 'American' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', language: 'en', gender: 'male', accent: 'British' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', language: 'en', gender: 'male', accent: 'American' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', language: 'en', gender: 'female', accent: 'American' },
];

export const DEFAULT_VOICE_ES = 'onwK4e9ZLuTAKqWW03F9'; // Daniel
export const DEFAULT_VOICE_EN = 'EXAVITQu4vr4xnSDxMaL'; // Sarah

interface GenerateOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

/**
 * Generate speech audio via ElevenLabs API.
 * Returns raw audio buffer (MP3).
 */
export async function generateSpeechElevenLabs(
  apiKey: string,
  options: GenerateOptions,
): Promise<Buffer> {
  const {
    text,
    voiceId = DEFAULT_VOICE_ES,
    modelId = 'eleven_multilingual_v2',
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.0,
  } = options;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `ElevenLabs API error: ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.detail?.message) errorMessage = parsed.detail.message;
      else if (parsed.detail) errorMessage = String(parsed.detail);
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(new Uint8Array(arrayBuffer));
}

/**
 * Get remaining character quota from ElevenLabs.
 */
export async function getElevenLabsUsage(
  apiKey: string,
): Promise<{ characterCount: number; characterLimit: number; remainingCharacters: number }> {
  const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) throw new Error('Failed to get ElevenLabs usage');

  const data = await response.json();
  return {
    characterCount: data.character_count ?? 0,
    characterLimit: data.character_limit ?? 10000,
    remainingCharacters: (data.character_limit ?? 10000) - (data.character_count ?? 0),
  };
}
