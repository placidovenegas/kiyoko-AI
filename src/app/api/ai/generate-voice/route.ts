import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  generateSpeechElevenLabs,
  ELEVENLABS_VOICES,
  DEFAULT_VOICE_ES,
  DEFAULT_VOICE_EN,
  getElevenLabsUsage,
} from '@/lib/tts/elevenlabs';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiResponse,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  logServerWarning,
  parseApiJson,
} from '@/lib/observability/server';

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

export async function GET(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  let usage = null;

  if (apiKey) {
    try {
      usage = await getElevenLabsUsage(apiKey);
    } catch (error) {
      logServerWarning('generate-voice/GET', requestContext, 'Could not fetch ElevenLabs usage', {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return apiJson(requestContext, {
    voices: ALL_VOICES,
    provider: apiKey ? 'elevenlabs' : 'none',
    usage,
  });
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<{
      text: string;
      voice?: string;
      language?: string;
      provider?: 'elevenlabs' | 'google';
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speed?: number;
      videoId?: string;
      projectId?: string;
    }>(request, requestContext);

    if (response || !body) {
      return response;
    }

    const { text, voice, language = 'es', videoId, projectId } = body;

    if (!text?.trim()) {
      return apiBadRequest(requestContext, 'Text is required');
    }

    // ─── Try ElevenLabs first (primary) ────────────────────────
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsKey) {
      // Check quota before generating
      try {
        const usage = await getElevenLabsUsage(elevenLabsKey);
        if (usage.remainingCharacters < text.length) {
          return apiJson(requestContext, {
            error: `Cuota de ElevenLabs insuficiente. Necesitas ${text.length} caracteres pero solo quedan ${usage.remainingCharacters}.`,
            remainingCharacters: usage.remainingCharacters,
            requiredCharacters: text.length,
          }, { status: 429 });
        }
      } catch (quotaError) {
        logServerWarning('generate-voice/POST', requestContext, 'Could not check ElevenLabs quota', {
          userId: user.id,
          errorMessage: quotaError instanceof Error ? quotaError.message : String(quotaError),
        });
        // Continue anyway — the generation call will fail if quota is exceeded
      }

      try {
        const voiceId = voice || (language === 'en' ? DEFAULT_VOICE_EN : DEFAULT_VOICE_ES);
        const voiceMeta = ELEVENLABS_VOICES.find((v) => v.id === voiceId);
        const audioBuffer = await generateSpeechElevenLabs(elevenLabsKey, {
          text,
          voiceId,
          stability: body.stability,
          similarityBoost: body.similarityBoost,
          style: body.style,
        });

        // Save audio to Storage + update video_narrations if videoId is provided
        if (videoId && projectId) {
          try {
            const admin = createAdminClient();
            const db = admin ?? supabase;

            const timestamp = Date.now();
            const storagePath = `projects/${projectId}/narration/${videoId}/${timestamp}.mp3`;

            const { error: uploadError } = await db.storage
              .from('kiyoko-storage')
              .upload(storagePath, audioBuffer, {
                contentType: 'audio/mpeg',
                upsert: false,
              });

            if (uploadError) {
              logServerWarning('generate-voice/POST', requestContext, 'Storage upload error for ElevenLabs audio', {
                userId: user.id,
                videoId,
                projectId,
                errorMessage: uploadError.message,
              });
            } else {
              const { data: urlData } = db.storage
                .from('kiyoko-storage')
                .getPublicUrl(storagePath);

              const publicUrl = urlData.publicUrl;

              // Estimate audio duration: ~150 words/min, ~5 chars/word => ~750 chars/min
              const estimatedDurationMs = Math.round((text.length / 750) * 60 * 1000);

              // Update the current video_narrations record with audio info
              await db
                .from('video_narrations')
                .update({
                  audio_url: publicUrl,
                  audio_path: storagePath,
                  audio_duration_ms: estimatedDurationMs,
                  status: 'generated',
                  voice_id: voiceId,
                  voice_name: voiceMeta?.name ?? voiceId,
                  provider: 'elevenlabs',
                })
                .eq('video_id', videoId)
                .eq('is_current', true);
            }
          } catch (saveError) {
            logServerWarning('generate-voice/POST', requestContext, 'Error saving ElevenLabs audio to storage or DB', {
              userId: user.id,
              videoId,
              projectId,
              errorMessage: saveError instanceof Error ? saveError.message : String(saveError),
            });
          }
        }

        logServerEvent('generate-voice/POST', requestContext, 'Generated voice with ElevenLabs', {
          userId: user.id,
          provider: 'elevenlabs',
          voiceId,
          videoId,
          projectId,
          textLength: text.length,
        });

        return apiResponse(requestContext, new Response(new Uint8Array(audioBuffer), {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline; filename="narration.mp3"',
            'X-TTS-Provider': 'elevenlabs',
          },
        }));
      } catch (err) {
        logServerWarning('generate-voice/POST', requestContext, 'ElevenLabs generation failed, falling back', {
          userId: user.id,
          provider: 'elevenlabs',
          errorMessage: err instanceof Error ? err.message : String(err),
        });
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
          const audioBuffer = Buffer.from(data.audioContent, 'base64');

          // Save Google TTS audio to Storage + DB if videoId provided
          if (videoId && projectId) {
            try {
              const admin = createAdminClient();
              const db = admin ?? supabase;

              const timestamp = Date.now();
              const storagePath = `projects/${projectId}/narration/${videoId}/${timestamp}.mp3`;

              const { error: uploadError } = await db.storage
                .from('kiyoko-storage')
                .upload(storagePath, audioBuffer, {
                  contentType: 'audio/mpeg',
                  upsert: false,
                });

              if (!uploadError) {
                const { data: urlData } = db.storage
                  .from('kiyoko-storage')
                  .getPublicUrl(storagePath);

                const estimatedDurationMs = Math.round((text.length / 750) * 60 * 1000);

                await db
                  .from('video_narrations')
                  .update({
                    audio_url: urlData.publicUrl,
                    audio_path: storagePath,
                    audio_duration_ms: estimatedDurationMs,
                    status: 'generated',
                    voice_id: googleVoiceName,
                    voice_name: googleVoiceName,
                    provider: 'google',
                  })
                  .eq('video_id', videoId)
                  .eq('is_current', true);
              }
            } catch (saveError) {
              logServerWarning('generate-voice/POST', requestContext, 'Error saving Google TTS audio', {
                userId: user.id,
                videoId,
                projectId,
                errorMessage: saveError instanceof Error ? saveError.message : String(saveError),
              });
            }
          }

          logServerEvent('generate-voice/POST', requestContext, 'Generated voice with Google TTS', {
            userId: user.id,
            provider: 'google',
            voiceId: googleVoiceName,
            videoId,
            projectId,
            textLength: text.length,
          });

          return apiResponse(requestContext, new Response(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Disposition': 'inline; filename="narration.mp3"',
              'X-TTS-Provider': 'google',
            },
          }));
        }
      } catch (err) {
        logServerWarning('generate-voice/POST', requestContext, 'Google TTS generation failed', {
          userId: user.id,
          provider: 'google',
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ─── No provider available ─────────────────────────────────
    return apiJson(requestContext, {
      error: 'No TTS provider configured.',
      tip: 'Anade ELEVENLABS_API_KEY en .env.local (gratis: elevenlabs.io, 10K chars/mes sin tarjeta).',
      fallback: 'browser',
    }, { status: 503 });

  } catch (error) {
    return apiError(requestContext, 'generate-voice/POST', error, {
      message: error instanceof Error ? error.message : 'Voice generation failed',
    });
  }
}
