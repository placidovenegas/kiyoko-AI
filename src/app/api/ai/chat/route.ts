import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getAllAvailableModels, markProviderFailed, createModelWithKey, TEXT_CHAIN } from '@/lib/ai/sdk-router';
import type { ProviderId, ResolvedModel } from '@/lib/ai/sdk-router';
import { decrypt } from '@/lib/utils/crypto';
import {
  SYSTEM_DASHBOARD,
  type ProjectContext,
  type VideoContext,
  type SceneContext,
  type CharacterContext,
  type BackgroundContext,
} from '@/lib/ai/system-prompt';
import type { ContextLevel } from '@/types/ai-context';
import { detectIntent } from '@/lib/ai/detect-intent';
import { selectAgent } from '@/lib/ai/select-agent';
import { buildProjectAssistantPrompt } from '@/lib/ai/agents/project-assistant';
import type { KiyokoActiveAgent } from '@/stores/ai-store';
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  // Contexto de navegación (qué ve el usuario ahora)
  contextLevel?: ContextLevel;
  projectId?: string;
  videoId?: string;
  sceneId?: string;
  /** Resumen alineado con la UI (títulos + IDs) — se añade al system prompt */
  contextClientHint?: string;
  aiMode?: string;
  conversationId?: string;
  images?: string[];
  preferredProvider?: string;
  // Legacy
  contextType?: string;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const requestContext = createApiRequestContext(request);
  try {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<ChatRequestBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    const {
      messages,
      contextLevel: rawLevel,
      projectId,
      videoId,
      sceneId,
      aiMode = 'auto',
      preferredProvider,
      contextClientHint,
    } = body;

    if (!messages?.length) {
      return apiBadRequest(requestContext, 'Missing messages');
    }

    // Determinar nivel de contexto
    const level: ContextLevel = rawLevel ??
      (sceneId ? 'scene' : videoId ? 'video' : projectId ? 'project' : 'dashboard');

    // 2. Build system prompt según nivel de contexto
    let systemPrompt = SYSTEM_DASHBOARD;
    let agentTemperature: number | undefined;
    let activeAgent: KiyokoActiveAgent = 'router';
    let preferredProviderIds: string[] = [];

    if (level === 'dashboard' || !projectId) {
      systemPrompt = SYSTEM_DASHBOARD;
    } else {
      // Cargar datos del proyecto siempre
      const [projectRes, agentRes] = await Promise.all([
        supabase.from('projects')
          .select('id, title, description, style, status, color_palette, ai_brief, global_prompt_rules, short_id')
          .eq('id', projectId).single(),
        supabase.from('project_ai_agents')
          .select('system_prompt, tone, creativity_level')
          .eq('project_id', projectId).eq('is_default', true).maybeSingle(),
      ]);

      const agent = agentRes.data;
      // creativity_level can be 0-1 (decimal) or 0-10 (integer scale)
      // If <= 1, use directly; if > 1, divide by 10
      if (agent?.creativity_level != null) {
        const raw = Number(agent.creativity_level);
        agentTemperature = raw > 1 ? raw / 10 : raw;
      }

      if (!projectRes.data) {
        systemPrompt = SYSTEM_DASHBOARD;
      } else {
        const project = projectRes.data as unknown as ProjectContext;

        // Cargar datos según el nivel de contexto
        let video: VideoContext | undefined;
        let rawVideoData: Record<string, unknown> | null = null;
        let scenes: SceneContext[] = [];
        let characters: CharacterContext[] = [];
        let backgrounds: BackgroundContext[] = [];
        let videos: VideoContext[] = [];

        // Siempre cargamos personajes, fondos, videos + perfil creativo y stats de tareas
        const [charsRes, bgsRes, videosRes, profileRes, taskStatsRes] = await Promise.all([
          supabase.from('characters')
            .select('id, name, role, description, visual_description, prompt_snippet, ai_prompt_description, hair_description, signature_clothing, accessories, color_accent, personality, initials, reference_image_url')
            .eq('project_id', projectId).order('name'),
          supabase.from('backgrounds')
            .select('id, name, code, description, location_type, time_of_day, prompt_snippet, ai_prompt_description, available_angles, reference_image_url')
            .eq('project_id', projectId).order('name'),
          supabase.from('videos')
            .select('id, title, short_id, platform, video_type, target_duration_seconds, status')
            .eq('project_id', projectId).order('created_at'),
          supabase.from('profiles')
            .select('creative_video_types, creative_platforms, creative_use_context, creative_purpose, creative_typical_duration')
            .eq('id', user.id).maybeSingle(),
          supabase.from('tasks')
            .select('id, status, priority')
            .eq('project_id', projectId),
        ]);

        // Fix #7: Log errors from context queries without blocking
        if (charsRes.error) {
          logServerWarning('chat/POST', requestContext, 'Failed to load characters', { error: charsRes.error.message });
        }
        if (bgsRes.error) {
          logServerWarning('chat/POST', requestContext, 'Failed to load backgrounds', { error: bgsRes.error.message });
        }
        if (videosRes.error) {
          logServerWarning('chat/POST', requestContext, 'Failed to load videos', { error: videosRes.error.message });
        }
        if (profileRes.error) {
          logServerWarning('chat/POST', requestContext, 'Failed to load creative profile', { error: profileRes.error.message });
        }
        if (taskStatsRes.error) {
          logServerWarning('chat/POST', requestContext, 'Failed to load task stats', { error: taskStatsRes.error.message });
        }

        characters = (charsRes.data ?? []) as unknown as CharacterContext[];
        backgrounds = (bgsRes.data ?? []) as unknown as BackgroundContext[];
        videos = (videosRes.data ?? []) as unknown as VideoContext[];

        // Build creative profile for ideation agent
        const profileData = profileRes.data as Record<string, string | null> | null;
        const creativeProfile = profileData ? {
          video_types: profileData.creative_video_types ?? null,
          platforms: profileData.creative_platforms ?? null,
          use_context: profileData.creative_use_context ?? null,
          purpose: profileData.creative_purpose ?? null,
          typical_duration: profileData.creative_typical_duration ?? null,
        } : undefined;

        // Build task stats for task agent
        const taskRows = taskStatsRes.data ?? [];
        const taskStats = {
          open: taskRows.filter((t: Record<string, unknown>) => t.status !== 'completed' && t.status !== 'cancelled').length,
          total: taskRows.length,
          urgent: taskRows.filter((t: Record<string, unknown>) => t.priority === 'urgent' && t.status !== 'completed').length,
        };

        // Si hay video activo, cargamos sus escenas con toda la info
        if (videoId && (level === 'video' || level === 'scene')) {
          const [videoRes, scenesRes] = await Promise.all([
            supabase.from('videos')
              .select('id, title, short_id, platform, video_type, target_duration_seconds, status, description, metadata')
              .eq('id', videoId).single(),
            supabase.from('scenes')
              .select(`
                id, scene_number, title, description, scene_type, arc_phase,
                duration_seconds, status, sort_order, director_notes,
                scene_characters(character_id, characters(id, name)),
                scene_camera(camera_angle, camera_movement, lighting, mood),
                scene_backgrounds(backgrounds(name)),
                scene_prompts(prompt_type, prompt_text, version, is_current)
              `)
              .eq('video_id', videoId)
              .order('sort_order', { ascending: true }),
          ]);

          rawVideoData = videoRes.data as Record<string, unknown> | null;
          video = rawVideoData as unknown as VideoContext;

          // Mapear escenas con sus relaciones
          scenes = ((scenesRes.data ?? []) as Record<string, unknown>[]).map((s) => {
            const charNames = ((s.scene_characters as Array<{ characters: { name: string } | null }>) ?? [])
              .map((sc) => sc.characters?.name).filter(Boolean) as string[];
            const bgName = ((s.scene_backgrounds as Array<{ backgrounds: { name: string } | null }>) ?? [])[0]
              ?.backgrounds?.name ?? null;
            const cam = ((s.scene_camera as Record<string, unknown>[]) ?? [])[0] ?? null;
            // Extract current prompts
            const allPrompts = (s.scene_prompts as Array<{ prompt_type: string; prompt_text: string; version: number; is_current: boolean }>) ?? [];
            const currentPrompts = allPrompts.filter((p) => p.is_current);
            const imgPrompt = currentPrompts.find((p) => p.prompt_type === 'image') ?? null;
            const vidPrompt = currentPrompts.find((p) => p.prompt_type === 'video') ?? null;

            return {
              ...s,
              assigned_characters: charNames,
              assigned_background: bgName,
              camera: cam,
              prompt_image: imgPrompt,
              prompt_video: vidPrompt,
            } as unknown as SceneContext;
          });

          // Si hay escena activa, cargar sus prompts actuales
          if (sceneId && level === 'scene') {
            const { data: sceneData } = await supabase.from('scenes')
              .select(`
                *,
                scene_camera(*),
                scene_prompts!inner(prompt_type, prompt_text, version, is_current)
              `)
              .eq('id', sceneId).single();

            if (sceneData) {
              const prompts = (sceneData.scene_prompts as Array<{ prompt_type: string; prompt_text: string; version: number; is_current: boolean }> ?? [])
                .filter((p) => p.is_current);
              const _scene = {
                ...sceneData,
                all_prompts: prompts,
                prompt_image: prompts.find((p) => p.prompt_type === 'image') ?? null,
                prompt_video: prompts.find((p) => p.prompt_type === 'video') ?? null,
              } as unknown as SceneContext;

              void _scene;
            }
          }
        }

        // ---- 4-agent system for video/scene levels ----
        if ((level === 'video' || level === 'scene') && video) {
          const lastMessage = messages[messages.length - 1]?.content ?? '';
          const intent = detectIntent(lastMessage);

          // Extract audio config from video metadata (Section 8, 13)
          const videoMeta = rawVideoData?.metadata as Record<string, unknown> | null;
          const audioConfig = videoMeta?.audio_config
            ? JSON.stringify(videoMeta.audio_config)
            : undefined;

          const selected = selectAgent(intent, {
            project,
            video,
            scenes,
            characters,
            backgrounds,
            agentTone: agent?.tone ?? undefined,
            audioConfig,
            activeSceneId: sceneId,
            creativeProfile,
            taskStats,
          });

          // Append custom agent prompt as additional context, never replace
          systemPrompt = agent?.system_prompt
            ? `${selected.systemPrompt}\n\n=== INSTRUCCIONES ADICIONALES ===\n${agent.system_prompt}`
            : selected.systemPrompt;
          agentTemperature = selected.temperature;
          activeAgent = selected.agentName;
          preferredProviderIds = selected.preferredProviders;
        } else {
          // project level → detect intent + select agent (characters, backgrounds, tasks, etc.)
          const lastMessage = messages[messages.length - 1]?.content ?? '';
          const intent = detectIntent(lastMessage);

          // Intents que los agentes especializados manejan mejor que el project-assistant
          const specializedIntents = new Set([
            'create_character', 'view_character', 'list_characters', 'edit_character',
            'create_background', 'view_background', 'list_backgrounds', 'edit_background',
            'create_task', 'list_tasks',
            'generate_ideas', 'delete_entity',
          ]);

          if (specializedIntents.has(intent)) {
            // Usar agente especializado (con video dummy vacío ya que estamos a nivel proyecto)
            const dummyVideo: VideoContext = { id: '', title: '', short_id: '', platform: null, video_type: null, target_duration_seconds: null, status: 'draft' } as VideoContext;
            const selected = selectAgent(intent, {
              project,
              video: dummyVideo,
              scenes: [],
              characters,
              backgrounds,
              agentTone: agent?.tone ?? undefined,
              creativeProfile,
              taskStats,
            });
            systemPrompt = agent?.system_prompt
              ? `${selected.systemPrompt}\n\n=== INSTRUCCIONES ADICIONALES ===\n${agent.system_prompt}`
              : selected.systemPrompt;
            agentTemperature = selected.temperature;
            activeAgent = selected.agentName;
            preferredProviderIds = selected.preferredProviders;
          } else {
            // project-assistant para el resto (crear video, ver proyecto, etc.)
            const basePrompt = buildProjectAssistantPrompt({
              project,
              videos,
              characters,
              backgrounds,
              agentTone: agent?.tone ?? undefined,
            });
            systemPrompt = agent?.system_prompt
              ? `${basePrompt}\n\n=== INSTRUCCIONES ADICIONALES DEL PROYECTO ===\n${agent.system_prompt}`
              : basePrompt;
            agentTemperature = 0.3;
            activeAgent = 'project';
            preferredProviderIds = ['openrouter', 'gemini'];
          }
        }
      }
    }

    // 3. Preparar mensajes — convertir URLs de imagenes a bloques multimodal
    //    para que modelos con vision (Gemini, Claude, GPT-4o) puedan analizarlas
    const IMAGE_URL_REGEX = /\[Imagenes adjuntas: ([^\]]+)\]/;
    let hasImages = false;

    type MultimodalPart = { type: 'text'; text: string } | { type: 'image'; image: string };

    const aiMessages = messages.map((m) => {
      const imageMatch = m.content.match(IMAGE_URL_REGEX);
      if (!imageMatch) return { role: m.role, content: m.content } as const;

      hasImages = true;
      const urls = imageMatch[1].split(', ').map((u) => u.trim()).filter(Boolean);
      const textWithoutImages = m.content.replace(IMAGE_URL_REGEX, '').trim();

      // Build multimodal content array for AI SDK (new object, never mutate original)
      const parts: MultimodalPart[] = [];
      if (textWithoutImages) parts.push({ type: 'text' as const, text: textWithoutImages });
      for (const url of urls) {
        parts.push({ type: 'image' as const, image: url });
      }

      return { role: m.role, content: parts as unknown as string };
    });

    // 4. Resolver cadena de proveedores
    let availableModels = getAllAvailableModels();

    // Early check: count user keys to know if we have any providers at all
    const { data: userKeys } = await supabase.from('user_api_keys')
      .select('provider, api_key_encrypted')
      .eq('user_id', user.id).eq('is_active', true);

    if (availableModels.length === 0 && (!userKeys || userKeys.length === 0)) {
      return apiJson(requestContext, {
        error: 'No hay proveedores de IA disponibles. Configura una API key en Ajustes > Proveedores de IA.',
        requestId: requestContext.requestId,
      }, { status: 503 });
    }

    try {

      if (userKeys?.length) {
        const userModels: ResolvedModel[] = [];
        for (const row of userKeys) {
          const pid = row.provider as ProviderId;
          if (!availableModels.some((m) => m.providerId === pid)) {
            try {
              const decrypted = decrypt(row.api_key_encrypted as string);
              userModels.push({ model: createModelWithKey(pid, decrypted), providerId: pid });
            } catch (decryptErr) {
              logServerWarning('chat/POST', requestContext, `Failed to decrypt API key for ${pid}`, {
                keyId: row.provider,
                error: decryptErr instanceof Error ? decryptErr.message : 'unknown',
              });
            }
          }
        }
        if (userModels.length > 0) {
          const combined: ResolvedModel[] = [];
          for (const id of TEXT_CHAIN) {
            const srv = availableModels.find((m) => m.providerId === id);
            const usr = userModels.find((m) => m.providerId === id);
            if (srv) combined.push(srv);
            else if (usr) combined.push(usr);
          }
          availableModels = combined;
        }
      }
    } catch { /* continuar con claves del servidor */ }

    // If images are present, prioritize vision-capable models (Gemini, Claude, OpenAI).
    // If no vision provider is available, we must not send multimodal image payloads to text-only models.
    const VISION_PROVIDERS: string[] = ['gemini', 'claude', 'openai'];
    const canUseVision = hasImages && availableModels.some((m) => VISION_PROVIDERS.includes(m.providerId));

    if (hasImages && !canUseVision) {
      // System-level fallback so the assistant gives the user prompts to analyze externally.
      systemPrompt += `

[AVISO — IMAGENES SIN VISION INTEGRADA]
El usuario adjuntó una o más imágenes reales, pero en esta sesión NO hay provider/modelo de visión disponible (no puedes ver/analisar imágenes aquí).
Debes:
1) decir claramente que no puedes analizar la imagen dentro de la app en este modo,
2) recomendar analizar fuera en https://gemini.google.com/app,
3) entregar prompts listos para pegar (Personaje / Fondo / Estilo-Cámara en inglés),
4) pedir que el usuario pegue aquí el resultado del análisis para continuar creando prompts y escenas.
No inventes análisis visual detallado sin visión.
`.trim();

      // Remove image parts from AI SDK input so text-only models won't fail.
      const NO_VISION_USER_NOTE =
        'Adjunté imagen(es), pero esta sesión no puede analizarlas. Sigue el fallback: analizar fuera en Gemini y pega el análisis aquí.';

      for (const m of aiMessages as Array<{ content: unknown }>) {
        if (!Array.isArray(m.content)) continue;
        const parts = m.content as Array<{ type: string; text?: string; image?: string }>;
        const textOnly = parts.filter((p) => p.type === 'text' && typeof p.text === 'string')
          .map((p) => p.text)
          .join('\n')
          .trim();
        const hadImage = parts.some((p) => p.type === 'image' && typeof p.image === 'string');

        // Fix #15: Append fallback note instead of replacing original content
        const originalContent = textOnly || '';
        m.content = originalContent.trim()
          ? `${originalContent}\n\n${hadImage ? NO_VISION_USER_NOTE : ''}`
          : (hadImage ? NO_VISION_USER_NOTE : '');

        // Ensure we always pass some content (the assistant must still respond).
        if (typeof m.content !== 'string' || (m.content as string).trim().length === 0) {
          m.content = NO_VISION_USER_NOTE;
        }
      }
    }

    if (canUseVision) {
      const visionFirst: ResolvedModel[] = [];
      const rest: ResolvedModel[] = [];
      for (const m of availableModels) {
        if (VISION_PROVIDERS.includes(m.providerId)) visionFirst.push(m);
        else rest.push(m);
      }
      availableModels = [...visionFirst, ...rest];
      logServerEvent('chat/POST', requestContext, `Images detected — vision models prioritized: [${visionFirst.map((m) => m.providerId).join(', ')}]`);
    }

    // Reordenar según preferencias del agente (si hay)
    if (preferredProviderIds.length > 0 && !canUseVision) {
      const reordered: ResolvedModel[] = [];
      for (const pid of preferredProviderIds) {
        const found = availableModels.find((m) => m.providerId === pid);
        if (found) reordered.push(found);
      }
      // Append remaining models not in preferred list
      for (const m of availableModels) {
        if (!reordered.some((r) => r.providerId === m.providerId)) {
          reordered.push(m);
        }
      }
      availableModels = reordered;
    }

    // Mover proveedor preferido del usuario al frente (overrides agent preference)
    if (preferredProvider) {
      // Fix #9: Validate preferred provider exists in available models
      const isValid = availableModels.some((m) => m.providerId === preferredProvider);
      if (!isValid) {
        logServerWarning('chat/POST', requestContext, `Preferred provider ${preferredProvider} not available`, {
          available: availableModels.map((m) => m.providerId),
        });
      }
      const idx = availableModels.findIndex((m) => m.providerId === preferredProvider);
      if (idx > 0) {
        const [preferred] = availableModels.splice(idx, 1);
        availableModels = [preferred, ...availableModels];
      }
    }

    if (aiMode !== 'auto' && aiMode) {
      availableModels = availableModels.filter((m) => m.providerId === aiMode);
      if (!availableModels.length) {
        return apiJson(requestContext, { error: `Proveedor "${aiMode}" no disponible.`, requestId: requestContext.requestId }, { status: 503 });
      }
    }

    if (!availableModels.length) {
      return apiJson(requestContext, { error: 'No hay proveedores de IA disponibles. Configura una API key en Ajustes > Proveedores de IA.', requestId: requestContext.requestId }, { status: 503 });
    }

    // Fix #3: Only add client hint when we don't have full project context loaded
    // At video/scene level, full data is already in the agent's system prompt
    if (contextClientHint?.trim() && level === 'dashboard') {
      systemPrompt += `

=== CONTEXTO DE PANTALLA (confirmado por el cliente) ===
${contextClientHint.trim()}
`;
    }

    logServerEvent('chat/POST', requestContext, 'Prepared chat request', {
      userId: user.id,
      level,
      activeAgent,
      providerChain: availableModels.map((m) => m.providerId),
      promptLength: systemPrompt.length,
      hasImages,
      aiMode,
      preferredProvider: preferredProvider ?? null,
      projectId: projectId ?? null,
      videoId: videoId ?? null,
      sceneId: sceneId ?? null,
      messageCount: messages.length,
    });

    // 5. Stream con fallback
    let lastError: Error | null = null;

    for (const { model, providerId } of availableModels) {
      try {
        logServerEvent('chat/POST', requestContext, 'Trying provider', {
          userId: user.id,
          providerId,
          level,
          activeAgent,
        });

        const result = streamText({
          model,
          system: systemPrompt,
          messages: aiMessages,
          maxRetries: 0,
          ...(agentTemperature != null ? { temperature: agentTemperature } : {}),
          onFinish: async ({ usage }) => {
            try {
              await supabase.from('ai_usage_logs').insert({
                user_id: user.id,
                project_id: projectId ?? null,
                provider: providerId,
                model: 'chat',
                task: 'chat',
                input_tokens: usage?.inputTokens ?? 0,
                output_tokens: usage?.outputTokens ?? 0,
                total_tokens: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
                estimated_cost_usd: 0,
                response_time_ms: 0,
                success: true,
                was_fallback: false,
              } as never).maybeSingle();
            } catch (usageError) {
              logServerWarning('chat/POST', requestContext, 'Failed to persist AI usage log', {
                userId: user.id,
                providerId,
                errorMessage: usageError instanceof Error ? usageError.message : String(usageError),
              });
            }
          },
        });

        // Verificar primer chunk antes de retornar el stream
        const reader = result.textStream.getReader();
        let firstChunk: ReadableStreamReadResult<string>;

        try {
          const textPromise = result.text.then(
            () => new Promise<never>(() => {}),
            (e: unknown) => { throw e; },
          );
          firstChunk = await Promise.race([reader.read(), textPromise]);
        } catch (readError) {
          try { reader.releaseLock(); } catch { /* ignore */ }
          throw readError;
        }

        // Fix #4: Validate first chunk has actual content
        if (firstChunk.done || !firstChunk.value || firstChunk.value.trim().length === 0) {
          try { reader.releaseLock(); } catch { /* ignore */ }
          throw new Error(`Provider ${providerId} returned empty/invalid first chunk`);
        }

        logServerEvent('chat/POST', requestContext, 'Provider started streaming', {
          userId: user.id,
          providerId,
          level,
          activeAgent,
        });

        // Emitir Vercel AI Data Stream Protocol
        const encoder = new TextEncoder();
        const messageId = crypto.randomUUID();

        const dataStream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const emit = (line: string) => controller.enqueue(encoder.encode(line + '\n'));
            let accumulated = '';

            emit(`f:${JSON.stringify({ messageId })}`);
            if (firstChunk.value) {
              accumulated += firstChunk.value;
              emit(`0:${JSON.stringify(firstChunk.value)}`);
            }

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  accumulated += value;
                  emit(`0:${JSON.stringify(value)}`);
                }
              }
            } catch (streamErr) {
              logServerWarning('chat/POST', requestContext, 'Mid-stream provider error', {
                userId: user.id,
                providerId,
                errorMessage: streamErr instanceof Error ? streamErr.message : String(streamErr),
              });
              // Fix #11: Check if there's substantial accumulated content
              if (accumulated.length > 20) {
                // Have substantial content, emit what we have + error note
                emit(`0:${JSON.stringify('\n\n⚠️ La respuesta fue cortada por un error del proveedor.')}`);
                emit(`3:${JSON.stringify('Stream interrupted')}`);
              } else {
                // Little/no content, emit full error
                emit(`3:${JSON.stringify(streamErr instanceof Error ? streamErr.message : 'Stream error')}`);
              }
            }

            emit(`d:${JSON.stringify({ finishReason: 'stop' })}`);
            controller.close();
          },
        });

        return apiResponse(requestContext, new Response(dataStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Vercel-AI-Data-Stream': 'v1',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-AI-Provider': providerId,
            'X-Active-Agent': activeAgent,
            'X-Context-Level': level,
          },
        }));
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error ?? 'Unknown error');
        lastError = new Error(errMsg);
        logServerWarning('chat/POST', requestContext, 'Provider failed before stream start', {
          userId: user.id,
          providerId,
          level,
          activeAgent,
          errorMessage: errMsg.slice(0, 500),
        });
        markProviderFailed(providerId as ProviderId, errMsg);
      }
    }

    const finalError = lastError?.message || 'Todos los proveedores fallaron. Intenta de nuevo.';
    return apiJson(requestContext, { error: finalError, requestId: requestContext.requestId }, {
      status: 503,
    });
  } catch (error) {
    return apiError(requestContext, 'chat/POST', error, {
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
