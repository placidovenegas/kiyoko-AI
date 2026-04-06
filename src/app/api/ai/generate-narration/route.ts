import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateText } from 'ai';
import { getAllAvailableModels } from '@/lib/ai/sdk-router';
import { getUserModel } from '@/lib/ai/get-user-model';
import { getStyleById } from '@/lib/constants/narration-styles';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  logServerWarning,
  parseApiJson,
} from '@/lib/observability/server';

/** Try generateText with user model first, then fallback across all available system models */
async function generateTextWithFallback(
  params: { system: string; prompt: string; userId: string },
  logContext?: { requestId: string; clientRequestId: string | null; method: string; path: string; startedAt: number },
) {
  // Try user's own key first
  try {
    const { model, providerId } = await getUserModel(params.userId);
    const result = await generateText({ model, system: params.system, prompt: params.prompt });
    return { text: result.text, providerId };
  } catch {
    // Fall through to system fallback chain
  }

  const models = getAllAvailableModels();
  if (models.length === 0) throw new Error('No AI providers available');

  let lastError: Error | null = null;
  for (const { model, providerId } of models) {
    try {
      const result = await generateText({ model, system: params.system, prompt: params.prompt });
      return { text: result.text, providerId };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (logContext) {
        logServerWarning('generate-narration', logContext, 'Provider failed during narration fallback', {
          userId: params.userId,
          providerId,
          errorMessage: lastError.message,
        });
      }
      // Continue to next provider
    }
  }
  throw lastError || new Error('All providers failed');
}

/**
 * Clean AI response: strip JSON, markdown, quotes, prefixes.
 * Ensures we get plain narration text only.
 */
function cleanNarrationText(raw: string): string {
  let text = raw.trim();

  // If the AI returned JSON, try to extract the text field
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') return parsed;
      if (parsed.text) return String(parsed.text);
      if (parsed.improved_prompt) return String(parsed.improved_prompt);
      if (parsed.narration) return String(parsed.narration);
    } catch {
      // Not valid JSON, continue with text cleanup
    }
  }

  // Strip markdown code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Strip JSON-like wrapping
  text = text.replace(/^\s*\{[\s\S]*?"(?:text|narration|improved_prompt)"\s*:\s*"([\s\S]*?)"\s*[\s\S]*\}\s*$/m, '$1');

  // Strip "Narrador:", "Narrator:", "Voiceover:" prefixes
  text = text.replace(/^(?:Narrador|Narrator|Voz en off|Voiceover|Narracion)\s*:\s*/gim, '');

  // Strip surrounding quotes
  text = text.replace(/^["']|["']$/g, '');

  // Unescape JSON strings
  text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"');

  return text.trim();
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<{
      mode: 'per_scene' | 'continuous';
      videoId?: string;
      scenes: Array<{
        id: string;
        scene_number: string;
        title: string;
        description: string;
        duration_seconds: number;
        arc_phase: string;
      }>;
      config?: {
        language?: string;
        perspective?: string;
        projectName?: string;
        styleId?: string;
        customInstructions?: string;
      };
    }>(request, requestContext);

    if (response || !body) {
      return response;
    }

    const { mode, scenes, config, videoId } = body;
    const style = getStyleById(config?.styleId || 'pixar');
    const styleInstruction = style.id === 'custom'
      ? (config?.customInstructions || 'Tono profesional y calido.')
      : style.promptInstruction;
    const lang = config?.language || 'es';
    const langName = lang === 'es' ? 'espanol' : 'ingles';
    const projectName = config?.projectName || '';

    if (!scenes?.length) {
      return apiBadRequest(requestContext, 'No scenes provided');
    }

    logServerEvent('generate-narration', requestContext, 'Generating narration', {
      userId: user.id,
      mode,
      videoId: videoId ?? null,
      sceneCount: scenes.length,
      language: lang,
      styleId: style.id,
    });

    if (mode === 'continuous') {
      // ── CONTINUOUS: one flowing narration text ──
      const sceneList = scenes.map((s) =>
        `- [${s.scene_number}] "${s.title}" ${s.duration_seconds}s (${s.arc_phase}): ${s.description}`
      ).join('\n');
      const totalSeconds = scenes.reduce((a, s) => a + s.duration_seconds, 0);
      const maxWords = Math.floor(totalSeconds * 2.3);

      const { text: rawText, providerId } = await generateTextWithFallback({
        userId: user.id,
        system: `Eres el narrador de un video publicitario. Vas a leer en voz alta el texto que escribas.

IMPORTANTE — FORMATO DE RESPUESTA:
- Responde UNICAMENTE con el texto de narracion. NADA MAS.
- NO uses formato JSON. NO uses markdown. NO uses comillas.
- NO escribas instrucciones ni descripciones de escenas.
- NO pongas "Narrador:" ni ningun prefijo.
- Escribe directamente lo que el narrador dira en voz alta.

ESTILO: ${styleInstruction}

ESTRUCTURA:
- Marca cada cambio de escena con [${scenes[0]?.scene_number}], [${scenes[1]?.scene_number || 'E2'}], etc. al inicio de la linea.
- Escenas de logo/titulo/transicion = [...] (silencio).
- Maximo ${maxWords} palabras para ${totalSeconds}s.
- Idioma: ${langName}.
- El ritmo debe seguir el arco narrativo del video.`,
        prompt: `Video${projectName ? `: "${projectName}"` : ''} — ${totalSeconds}s, ${scenes.length} escenas.

${sceneList}

Escribe la narracion:`,
  }, requestContext);

      const text = cleanNarrationText(rawText);

      // Save narration to video_narrations if videoId is provided
      if (videoId) {
        try {
          const admin = createAdminClient();
          const db = admin ?? supabase;

          // Set previous narrations for this video to is_current = false
          await db
            .from('video_narrations')
            .update({ is_current: false })
            .eq('video_id', videoId)
            .eq('is_current', true);

          // Get next version number
          const { data: lastNarration } = await db
            .from('video_narrations')
            .select('version')
            .eq('video_id', videoId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

          const nextVersion = (lastNarration?.version ?? 0) + 1;

          await db
            .from('video_narrations')
            .insert({
              video_id: videoId,
              narration_text: text,
              source: 'ai',
              version: nextVersion,
              is_current: true,
              status: 'draft',
            });
        } catch (saveError) {
          logServerWarning('generate-narration', requestContext, 'Error saving continuous narration to DB', {
            userId: user.id,
            videoId,
            errorMessage: saveError instanceof Error ? saveError.message : String(saveError),
          });
        }
      }

      return apiJson(requestContext, { mode: 'continuous', text, provider: providerId });

    } else {
      // ── PER-SCENE: generate all at once in a single call ──
      const sceneList = scenes.map((s) =>
        `[${s.scene_number}] "${s.title}" ${s.duration_seconds}s (${s.arc_phase}): ${s.description}`
      ).join('\n');

      const { text: rawText } = await generateTextWithFallback({
        userId: user.id,
        system: `Eres el narrador de un video publicitario. Escribe el texto de voz en off para CADA escena.

IMPORTANTE — FORMATO DE RESPUESTA:
- Responde SOLO con texto plano. NO JSON. NO markdown. NO comillas.
- Para cada escena, escribe una linea con formato: [NUMERO_ESCENA] texto de narracion
- Ejemplo: [E1] Las tijeras danzan sobre el cabello dorado.
- Si una escena es de logo/titulo/transicion, escribe: [E1] ...
- NO describas las escenas. Escribe lo que el narrador DICE en voz alta.
- Cada texto debe caber en la duracion de su escena (~2.3 palabras/segundo).

ESTILO: ${styleInstruction}
IDIOMA: ${langName}`,
        prompt: `Genera narracion para cada escena:

${sceneList}`,
  }, requestContext);

      const cleaned = cleanNarrationText(rawText);

      // Parse lines into per-scene results
      const results: Array<{ sceneId: string; text: string }> = [];
      const lines = cleaned.split('\n').filter((l) => l.trim());

      for (const scene of scenes) {
        // Find the line for this scene
        const marker = `[${scene.scene_number}]`;
        const line = lines.find((l) => l.includes(marker));
        if (line) {
          let narration = line.replace(marker, '').trim();
          // Remove "..." placeholder for silent scenes
          if (narration === '...' || narration === '[...]') narration = '';
          results.push({ sceneId: scene.id, text: narration });
        } else {
          results.push({ sceneId: scene.id, text: '' });
        }
      }

      // Save concatenated narration to video_narrations if videoId is provided
      if (videoId) {
        try {
          const admin = createAdminClient();
          const db = admin ?? supabase;

          const fullText = results.map(r => r.text).filter(Boolean).join('\n');

          // Set previous narrations for this video to is_current = false
          await db
            .from('video_narrations')
            .update({ is_current: false })
            .eq('video_id', videoId)
            .eq('is_current', true);

          // Get next version number
          const { data: lastNarration } = await db
            .from('video_narrations')
            .select('version')
            .eq('video_id', videoId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

          const nextVersion = (lastNarration?.version ?? 0) + 1;

          await db
            .from('video_narrations')
            .insert({
              video_id: videoId,
              narration_text: fullText,
              source: 'ai',
              version: nextVersion,
              is_current: true,
              status: 'draft',
            });
        } catch (saveError) {
          logServerWarning('generate-narration', requestContext, 'Error saving per-scene narration to DB', {
            userId: user.id,
            videoId,
            errorMessage: saveError instanceof Error ? saveError.message : String(saveError),
          });
        }
      }

      return apiJson(requestContext, { mode: 'per_scene', results, provider: 'fallback' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Narration generation failed';

    if (message.startsWith('NO_PROVIDER_AVAILABLE')) {
      return apiJson(requestContext, { error: message, requestId: requestContext.requestId }, { status: 429 });
    }

    return apiError(requestContext, 'generate-narration', error, {
      message,
    });
  }
}
