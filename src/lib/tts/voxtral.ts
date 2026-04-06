/**
 * Voxtral TTS Client — Mistral AI Voice Synthesis
 *
 * Generates speech audio using Mistral's Voxtral TTS model.
 * Supports both preset voices and custom voice cloning via reference audio.
 *
 * API: POST https://api.mistral.ai/v1/audio/speech
 * Requires: MISTRAL_API_KEY environment variable
 */

/** Available built-in voice presets for Voxtral TTS */
export type VoxtralVoicePreset =
  | 'mistral_adam'
  | 'mistral_jessica'
  | 'mistral_alex'
  | 'mistral_emma'
  | 'mistral_oliver'
  | 'mistral_sophia';

/** Default voice preset */
export const DEFAULT_VOXTRAL_VOICE: VoxtralVoicePreset = 'mistral_adam';

/** Supported output audio formats */
export type VoxtralOutputFormat = 'mp3' | 'wav' | 'flac' | 'pcm';

/** Options for generating speech with Voxtral */
export interface VoxtralOptions {
  /** Text to synthesize */
  text: string;
  /** Voice preset name (ignored if referenceAudioBase64 is provided) */
  voicePreset?: VoxtralVoicePreset | string;
  /** Base64-encoded reference audio for voice cloning */
  referenceAudioBase64?: string;
  /** MIME type of the reference audio (default: 'audio/wav') */
  referenceMediaType?: string;
  /** Output audio format (default: 'mp3') */
  outputFormat?: VoxtralOutputFormat;
}

/**
 * Generate speech audio using Voxtral TTS.
 *
 * When a reference audio is provided, the model clones the voice.
 * Otherwise, it uses the specified preset voice.
 *
 * @param text - Text to convert to speech
 * @param voicePreset - Built-in voice preset name
 * @param referenceAudioBase64 - Optional base64 audio for voice cloning
 * @returns Raw audio buffer (MP3 by default)
 */
export async function generateVoxtralVoice(
  text: string,
  voicePreset?: VoxtralVoicePreset | string,
  referenceAudioBase64?: string
): Promise<ArrayBuffer> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is not set');
  }

  const body: Record<string, unknown> = {
    model: 'voxtral-tts-2025-03-26',
    text,
    output_format: 'mp3',
  };

  if (referenceAudioBase64) {
    body.voice_reference = {
      type: 'base64',
      data: referenceAudioBase64,
      media_type: 'audio/wav',
    };
  } else {
    body.voice = voicePreset || DEFAULT_VOXTRAL_VOICE;
  }

  const response = await fetch('https://api.mistral.ai/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `Voxtral TTS error (${response.status}): ${errorText}`
    );
  }

  return response.arrayBuffer();
}

/**
 * Generate speech with full options control.
 *
 * @param options - Full configuration for the TTS request
 * @returns Raw audio buffer in the specified format
 */
export async function generateVoxtralVoiceAdvanced(
  options: VoxtralOptions
): Promise<ArrayBuffer> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is not set');
  }

  const body: Record<string, unknown> = {
    model: 'voxtral-tts-2025-03-26',
    text: options.text,
    output_format: options.outputFormat || 'mp3',
  };

  if (options.referenceAudioBase64) {
    body.voice_reference = {
      type: 'base64',
      data: options.referenceAudioBase64,
      media_type: options.referenceMediaType || 'audio/wav',
    };
  } else {
    body.voice = options.voicePreset || DEFAULT_VOXTRAL_VOICE;
  }

  const response = await fetch('https://api.mistral.ai/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `Voxtral TTS error (${response.status}): ${errorText}`
    );
  }

  return response.arrayBuffer();
}
