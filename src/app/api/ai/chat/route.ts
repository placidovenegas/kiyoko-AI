import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getAllAvailableModels, markProviderFailed, createModelWithKey, TEXT_CHAIN } from '@/lib/ai/sdk-router';
import type { ProviderId, ResolvedModel } from '@/lib/ai/sdk-router';
import { decrypt } from '@/lib/utils/crypto';
import {
  buildSystemPrompt,
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
  try {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const {
      messages,
      contextLevel: rawLevel,
      projectId,
      videoId,
      sceneId,
      aiMode = 'auto',
      images,
      preferredProvider,
      contextClientHint,
    } = (await request.json()) as ChatRequestBody;

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Missing messages' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
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
        let scene: SceneContext | undefined;
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
              scene = {
                ...sceneData,
                all_prompts: prompts,
                prompt_image: prompts.find((p) => p.prompt_type === 'image') ?? null,
                prompt_video: prompts.find((p) => p.prompt_type === 'video') ?? null,
              } as unknown as SceneContext;
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
            preferredProviderIds = ['groq', 'gemini', 'mistral'];
          }
        }
      }
    }

    // 3. Preparar mensajes — convertir URLs de imagenes a bloques multimodal
    //    para que modelos con vision (Gemini, Claude, GPT-4o) puedan analizarlas
    const IMAGE_URL_REGEX = /\[Imagenes adjuntas: ([^\]]+)\]/;
    let hasImages = false;

    const aiMessages = messages.map((m) => {
      const imageMatch = m.content.match(IMAGE_URL_REGEX);
      if (!imageMatch) return m;

      hasImages = true;
      const urls = imageMatch[1].split(', ').map((u) => u.trim()).filter(Boolean);
      const textWithoutImages = m.content.replace(IMAGE_URL_REGEX, '').trim();

      // Build multimodal content array for AI SDK
      const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];
      if (textWithoutImages) content.push({ type: 'text', text: textWithoutImages });
      for (const url of urls) {
        content.push({ type: 'image', image: url });
      }

      return { ...m, content: content as never };
    });

    // 4. Resolver cadena de proveedores
    let availableModels = getAllAvailableModels();

    try {
      const { data: userKeys } = await supabase.from('user_api_keys')
        .select('provider, api_key_encrypted')
        .eq('user_id', user.id).eq('is_active', true);

      if (userKeys?.length) {
        const userModels: ResolvedModel[] = [];
        for (const row of userKeys) {
          const pid = row.provider as ProviderId;
          if (!availableModels.some((m) => m.providerId === pid)) {
            try {
              const decrypted = decrypt(row.api_key_encrypted as string);
              userModels.push({ model: createModelWithKey(pid, decrypted), providerId: pid });
            } catch { /* clave inválida */ }
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

        m.content = (textOnly || '') + (hadImage ? `\n\n${NO_VISION_USER_NOTE}` : '');

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
      console.log(`[chat] Images detected — vision models prioritized: [${visionFirst.map((m) => m.providerId).join(', ')}]`);
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
      const idx = availableModels.findIndex((m) => m.providerId === preferredProvider);
      if (idx > 0) {
        const [preferred] = availableModels.splice(idx, 1);
        availableModels = [preferred, ...availableModels];
      }
    }

    if (aiMode !== 'auto' && aiMode) {
      availableModels = availableModels.filter((m) => m.providerId === aiMode);
      if (!availableModels.length) {
        return new Response(
          JSON.stringify({ error: `Proveedor "${aiMode}" no disponible.` }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    if (!availableModels.length) {
      return new Response(
        JSON.stringify({ error: 'No hay proveedores de IA disponibles.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (contextClientHint?.trim()) {
      systemPrompt += `

=== CONTEXTO DE PANTALLA (confirmado por el cliente) ===
${contextClientHint.trim()}
`;
    }

    console.log(`[chat] level=${level} agent=${activeAgent} temp=${agentTemperature} prompt_len=${systemPrompt.length} providers=[${availableModels.map((m) => m.providerId).join(', ')}]`);
    console.log(`[chat] prompt_start: ${systemPrompt.slice(0, 150)}...`);

    // 5. Stream con fallback
    let lastError: Error | null = null;

    for (const { model, providerId } of availableModels) {
      try {
        console.log(`[chat] Trying: ${providerId}`);

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
            } catch { /* nunca romper el stream */ }
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

        if (firstChunk.done && !firstChunk.value) {
          try { reader.releaseLock(); } catch { /* ignore */ }
          throw new Error(`Provider ${providerId} returned empty response`);
        }

        console.log(`[chat] ${providerId} responding (level=${level})`);

        // Emitir Vercel AI Data Stream Protocol
        const encoder = new TextEncoder();
        const messageId = crypto.randomUUID();

        const dataStream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const emit = (line: string) => controller.enqueue(encoder.encode(line + '\n'));

            emit(`f:${JSON.stringify({ messageId })}`);
            if (firstChunk.value) emit(`0:${JSON.stringify(firstChunk.value)}`);

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) emit(`0:${JSON.stringify(value)}`);
              }
            } catch (streamErr) {
              console.warn(`[chat] Mid-stream error from ${providerId}:`, streamErr);
              emit(`3:${JSON.stringify(streamErr instanceof Error ? streamErr.message : 'Stream error')}`);
            }

            emit(`d:${JSON.stringify({ finishReason: 'stop' })}`);
            controller.close();
          },
        });

        return new Response(dataStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Vercel-AI-Data-Stream': 'v1',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-AI-Provider': providerId,
            'X-Active-Agent': activeAgent,
            'X-Context-Level': level,
          },
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error ?? 'Unknown error');
        lastError = new Error(errMsg);
        console.warn(`[chat] ${providerId} FAILED: ${errMsg.slice(0, 200)}`);
        markProviderFailed(providerId as ProviderId, errMsg);
      }
    }

    const finalError = lastError?.message || 'Todos los proveedores fallaron. Intenta de nuevo.';
    return new Response(JSON.stringify({ error: finalError }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[chat]', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
