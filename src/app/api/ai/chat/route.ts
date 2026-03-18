import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getAllAvailableModels, markProviderFailed, createModelWithKey } from '@/lib/ai/sdk-router';
import type { ProviderId, ResolvedModel } from '@/lib/ai/sdk-router';
import { storyboardTools } from '@/lib/ai/tools';
import { decrypt } from '@/lib/utils/crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  projectId?: string;
  images?: string[];
  preferredProvider?: string;
  videoCutId?: string;
}

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  target_platform: string | null;
  target_duration_seconds: number | null;
  status: string | null;
  color_palette: Record<string, string> | null;
  ai_brief: string | null;
  global_rules: unknown[] | null;
  total_scenes: number | null;
  total_characters: number | null;
  total_backgrounds: number | null;
  estimated_duration_seconds: number | null;
  completion_percentage: number | null;
  narration_mode: string | null;
}

interface SceneRow {
  id: string;
  scene_number: string | null;
  title: string | null;
  description: string | null;
  scene_type: string | null;
  arc_phase: string | null;
  duration_seconds: number | null;
  prompt_image: string | null;
  prompt_video: string | null;
  character_ids: string[] | null;
  background_id: string | null;
  camera_angle: string | null;
  camera_movement: string | null;
  lighting: string | null;
  mood: string | null;
  music_notes: string | null;
  narration_text: string | null;
  status: string | null;
  sort_order: number | null;
  director_notes: string | null;
}

interface CharacterRow {
  id: string;
  name: string;
  role: string | null;
  description: string | null;
  visual_description: string | null;
  personality: string | null;
  signature_clothing: string | null;
  hair_description: string | null;
  color_accent: string | null;
  role_rules: unknown[] | null;
  appears_in_scenes: string[] | null;
}

interface BackgroundRow {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  location_type: string | null;
  time_of_day: string | null;
  prompt_snippet: string | null;
}

interface NarrativeArcRow {
  id: string;
  phase: string;
  phase_number: number;
  title: string;
  description: string | null;
  start_second: number | null;
  end_second: number | null;
  scene_numbers: string[] | null;
}

interface TimelineEntryRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_seconds: number | null;
  arc_phase: string | null;
  scene_id: string | null;
}

interface ProjectIssueRow {
  id: string;
  issue_type: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: number | null;
  resolved: boolean;
}

interface ChangeHistoryRow {
  entity_type: string;
  entity_id: string;
  action: string;
  field_name: string | null;
  description_es: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// System prompt builder — FULL project context
// ---------------------------------------------------------------------------

function buildFullSystemPrompt(
  project: ProjectRow,
  scenes: SceneRow[],
  characters: CharacterRow[],
  backgrounds: BackgroundRow[],
  arcs: NarrativeArcRow[],
  timeline: TimelineEntryRow[],
  issues: ProjectIssueRow[],
  recentChanges: ChangeHistoryRow[],
  hasImages: boolean,
): string {
  // ---- Scenes block ----
  const scenesBlock = scenes
    .map((s) => {
      const chars = s.character_ids?.length ? `Personajes: [${s.character_ids.join(', ')}]` : 'Sin personajes';
      const bg = s.background_id ? `Fondo: ${s.background_id}` : 'Sin fondo';
      return `  ${s.scene_number ?? '?'} "${s.title ?? 'Sin titulo'}" [ID: ${s.id}]
    Tipo: ${s.scene_type ?? 'original'} | Fase: ${s.arc_phase ?? '-'} | Duracion: ${s.duration_seconds ?? 0}s | Estado: ${s.status ?? 'draft'}
    Descripcion: ${(s.description ?? '').slice(0, 150)}
    ${chars} | ${bg}
    Camara: ${s.camera_angle ?? '-'} / ${s.camera_movement ?? '-'} | Iluminacion: ${s.lighting ?? '-'} | Mood: ${s.mood ?? '-'}
    Prompt imagen: ${s.prompt_image ? 'SI' : 'NO'} | Prompt video: ${s.prompt_video ? 'SI' : 'NO'}
    Narracion: ${s.narration_text ? s.narration_text.slice(0, 80) + '...' : 'Sin narracion'}
    Notas director: ${s.director_notes ? s.director_notes.slice(0, 80) : '-'}`;
    })
    .join('\n\n');

  // ---- Characters block ----
  const charactersBlock = characters
    .map((c) => {
      return `  ${c.name} [ID: ${c.id}]
    Rol: ${c.role ?? '-'} | Color: ${c.color_accent ?? '-'}
    Descripcion: ${(c.description ?? '').slice(0, 100)}
    Visual: ${(c.visual_description ?? '').slice(0, 100)}
    Personalidad: ${(c.personality ?? '').slice(0, 80)}
    Ropa: ${c.signature_clothing ?? '-'} | Pelo: ${c.hair_description ?? '-'}
    Reglas: ${c.role_rules?.length ? JSON.stringify(c.role_rules) : 'Ninguna'}
    Aparece en: ${c.appears_in_scenes?.join(', ') || 'No asignado'}`;
    })
    .join('\n\n');

  // ---- Backgrounds block ----
  const backgroundsBlock = backgrounds
    .map((b) => `  ${b.code ?? '?'} "${b.name}" [ID: ${b.id}] — ${b.location_type ?? '?'} / ${b.time_of_day ?? '?'}: ${(b.description ?? '').slice(0, 100)}`)
    .join('\n');

  // ---- Arcs block ----
  const arcsBlock = arcs
    .map((a) => `  ${a.phase_number}. ${a.phase} "${a.title}" [${a.start_second ?? 0}s-${a.end_second ?? 0}s] — Escenas: ${a.scene_numbers?.join(', ') || '-'}`)
    .join('\n');

  // ---- Timeline block ----
  const timelineBlock = timeline.length > 0
    ? timeline.map((t) => `  ${t.start_time}-${t.end_time} "${t.title}" (${t.duration_seconds}s) [${t.arc_phase ?? '-'}]`).join('\n')
    : '  Sin entradas de timeline';

  // ---- Issues block ----
  const issuesBlock = issues
    .map((i) => `  [${i.issue_type}] ${i.resolved ? 'RESUELTO' : 'PENDIENTE'} — ${i.title}: ${(i.description ?? '').slice(0, 80)}`)
    .join('\n');

  // ---- Recent changes block ----
  const changesBlock = recentChanges.length > 0
    ? recentChanges
        .slice(0, 20)
        .map((c) => `  ${new Date(c.created_at).toLocaleDateString('es-ES')} — ${c.action} ${c.entity_type} ${c.entity_id.slice(0, 8)}: ${c.description_es ?? c.field_name ?? ''}`)
        .join('\n')
    : '  Sin cambios recientes';

  // ---- Color palette ----
  const palette = project.color_palette
    ? Object.entries(project.color_palette).map(([k, v]) => `${k}: ${v}`).join(', ')
    : 'No definida';

  return `Eres Kiyoko AI, directora creativa profesional de storyboards y produccion audiovisual.

═══════════════════════════════════════════════════════
PROYECTO: ${project.title}
═══════════════════════════════════════════════════════
- Descripcion: ${project.description ?? 'Sin descripcion'}
- Estilo visual: ${project.style ?? 'no definido'}
- Plataforma: ${project.target_platform ?? 'no definida'}
- Duracion objetivo: ${project.target_duration_seconds ?? 0}s
- Duracion estimada: ${project.estimated_duration_seconds ?? 0}s
- Estado: ${project.status ?? 'draft'}
- Completado: ${project.completion_percentage ?? 0}%
- Paleta de colores: ${palette}
- Modo narracion: ${project.narration_mode ?? 'none'}
- Brief IA: ${project.ai_brief ?? 'Sin brief'}
- Reglas globales: ${project.global_rules?.length ? JSON.stringify(project.global_rules) : 'Ninguna'}

═══════════════════════════════════════════════════════
ESCENAS (${scenes.length})
═══════════════════════════════════════════════════════
${scenesBlock || '  Sin escenas'}

═══════════════════════════════════════════════════════
PERSONAJES (${characters.length})
═══════════════════════════════════════════════════════
${charactersBlock || '  Sin personajes'}

═══════════════════════════════════════════════════════
FONDOS (${backgrounds.length})
═══════════════════════════════════════════════════════
${backgroundsBlock || '  Sin fondos'}

═══════════════════════════════════════════════════════
ARCOS NARRATIVOS (${arcs.length})
═══════════════════════════════════════════════════════
${arcsBlock || '  Sin arcos definidos'}

═══════════════════════════════════════════════════════
TIMELINE (${timeline.length} entradas)
═══════════════════════════════════════════════════════
${timelineBlock}

═══════════════════════════════════════════════════════
PROBLEMAS DETECTADOS (${issues.length})
═══════════════════════════════════════════════════════
${issuesBlock || '  Sin problemas detectados'}

═══════════════════════════════════════════════════════
CAMBIOS RECIENTES
═══════════════════════════════════════════════════════
${changesBlock}

═══════════════════════════════════════════════════════
REGLAS DE COMPORTAMIENTO
═══════════════════════════════════════════════════════

1. IDIOMA: Siempre responde en espanol
2. DATOS REALES: Usa los IDs reales de escenas, personajes y fondos que te he proporcionado
3. ANALISIS: Cuando analices el proyecto, se exhaustiva y detallada. Revisa coherencia, ritmo, duracion, personajes y fondos.
4. SUGERENCIAS: Al terminar una tarea o analisis, SIEMPRE incluye un bloque de sugerencias al final:
   [SUGERENCIAS]
   - Sugerencia 1 relacionada con lo que acabas de hacer
   - Sugerencia 2 de mejora
   - Sugerencia 3 de siguiente paso
   [/SUGERENCIAS]

5. MODIFICACIONES: Cuando el usuario pida cambios en la base de datos, SIEMPRE muestra primero un plan de acciones con este formato JSON:

\`\`\`json
{
  "type": "action_plan",
  "summary_es": "Resumen claro del plan de cambios",
  "actions": [
    {
      "id": "uuid-generado",
      "type": "update_scene|delete_scene|create_scene|reorder_scenes|update_character|remove_character_from_scene|add_character_to_scene|update_prompt",
      "target": { "sceneId": "uuid", "sceneNumber": "E3", "characterId": "uuid", "characterName": "Nombre" },
      "description_es": "Descripcion clara del cambio",
      "changes": [{ "field": "campo_db", "oldValue": "valor_actual", "newValue": "valor_nuevo" }],
      "reason": "Razon del cambio",
      "requiresNewPrompt": false,
      "priority": 1
    }
  ],
  "total_scenes_affected": 2,
  "warnings": ["Advertencias si las hay"]
}
\`\`\`

6. TABLAS MODIFICABLES: Puedes proponer cambios en: scenes, characters, backgrounds, narrative_arcs, timeline_entries, project_issues
7. NUNCA ejecutes cambios sin mostrar el plan primero. El usuario decidira si aplicar o no.
8. Si detectas inconsistencias (personaje asignado pero no existe, fondo no referenciado, etc.), mencionalo proactivamente.
9. Cuando el usuario suba imagenes, analiza su contenido visual (composicion, colores, estilo, personajes visibles) y relacionalo con el proyecto.
10. Formatea tus respuestas con Markdown: usa titulos, listas, negritas y bloques de codigo cuando sea apropiado.
11. Se concisa pero completa. No repitas informacion innecesariamente.
12. Si el usuario pregunta algo que no requiere cambios en la DB, responde normalmente sin JSON.`;
}

const SYSTEM_NO_PROJECT = `Eres Kiyoko AI, asistente creativa profesional para produccion de storyboards y videos publicitarios.

Respondes siempre en espanol. Puedes ayudar con:
- Analisis creativo y narrativo
- Sugerencias de mejora para storyboards
- Generacion de prompts para imagenes y videos
- Consultas sobre produccion audiovisual
- Estructura narrativa y ritmo

Al terminar una respuesta, incluye sugerencias de siguientes pasos:
[SUGERENCIAS]
- Sugerencia 1
- Sugerencia 2
[/SUGERENCIAS]

Si no tienes contexto de un proyecto especifico, pidele al usuario que abra un proyecto primero para poder analizar sus datos.`;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages, projectId, images, preferredProvider, videoCutId } = (await request.json()) as ChatRequestBody;

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'Missing messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Build system prompt — load ALL project data if projectId provided
    let systemPrompt = SYSTEM_NO_PROJECT;

    if (projectId) {
      const [
        projectRes,
        scenesRes,
        charactersRes,
        backgroundsRes,
        arcsRes,
        timelineRes,
        issuesRes,
        changesRes,
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('id, title, description, style, target_platform, target_duration_seconds, status, color_palette, ai_brief, global_rules, total_scenes, total_characters, total_backgrounds, estimated_duration_seconds, completion_percentage, narration_mode')
          .eq('id', projectId)
          .single(),
        supabase
          .from('scenes')
          .select('id, scene_number, title, description, scene_type, arc_phase, duration_seconds, prompt_image, prompt_video, character_ids, background_id, camera_angle, camera_movement, lighting, mood, music_notes, narration_text, status, sort_order, director_notes')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true }),
        supabase
          .from('characters')
          .select('id, name, role, description, visual_description, personality, signature_clothing, hair_description, color_accent, role_rules, appears_in_scenes')
          .eq('project_id', projectId)
          .order('name', { ascending: true }),
        supabase
          .from('backgrounds')
          .select('id, name, code, description, location_type, time_of_day, prompt_snippet')
          .eq('project_id', projectId)
          .order('name', { ascending: true }),
        supabase
          .from('narrative_arcs')
          .select('id, phase, phase_number, title, description, start_second, end_second, scene_numbers')
          .eq('project_id', projectId)
          .order('phase_number', { ascending: true }),
        supabase
          .from('timeline_entries')
          .select('id, title, start_time, end_time, duration_seconds, arc_phase, scene_id')
          .eq('project_id', projectId)
          .order('sort_order', { ascending: true }),
        supabase
          .from('project_issues')
          .select('id, issue_type, title, description, category, priority, resolved')
          .eq('project_id', projectId)
          .order('priority', { ascending: false }),
        supabase
          .from('change_history')
          .select('entity_type, entity_id, action, field_name, description_es, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      if (projectRes.data) {
        systemPrompt = buildFullSystemPrompt(
          projectRes.data as ProjectRow,
          (scenesRes.data ?? []) as SceneRow[],
          (charactersRes.data ?? []) as CharacterRow[],
          (backgroundsRes.data ?? []) as BackgroundRow[],
          (arcsRes.data ?? []) as NarrativeArcRow[],
          (timelineRes.data ?? []) as TimelineEntryRow[],
          (issuesRes.data ?? []) as ProjectIssueRow[],
          (changesRes.data ?? []) as ChangeHistoryRow[],
          (images?.length ?? 0) > 0,
        );
      }
    }

    // 3. Build messages array — if images provided, add them to the last user message
    const aiMessages = [...messages];
    if (images && images.length > 0) {
      const lastUserIdx = aiMessages.findLastIndex((m) => m.role === 'user');
      if (lastUserIdx >= 0) {
        const lastMsg = aiMessages[lastUserIdx];
        // Append image context to the message
        aiMessages[lastUserIdx] = {
          ...lastMsg,
          content: `${lastMsg.content}\n\n[El usuario ha adjuntado ${images.length} imagen(es). URLs: ${images.join(', ')}]`,
        };
      }
    }

    // 4. Stream with AI SDK — try each available provider with runtime fallback
    //    streamText() doesn't throw synchronously — errors surface during stream consumption.
    //    We read the first chunk to verify the provider works, then pipe the rest.
    let availableModels = getAllAvailableModels();

    // Check if user has their own API keys in the DB
    if (preferredProvider) {
      const isAlreadyAvailable = availableModels.some(m => m.providerId === preferredProvider);

      if (!isAlreadyAvailable) {
        // Provider not available via server env — check user's DB keys
        try {
          const { data: userKey } = await supabase
            .from('user_api_keys')
            .select('api_key_encrypted, is_active')
            .eq('user_id', user.id)
            .eq('provider', preferredProvider)
            .eq('is_active', true)
            .single();

          if (userKey?.api_key_encrypted) {
            const decryptedKey = decrypt(userKey.api_key_encrypted);
            const model = createModelWithKey(preferredProvider as ProviderId, decryptedKey);
            // Prepend user's provider to the front
            availableModels = [{ model, providerId: preferredProvider as ProviderId }, ...availableModels];
            console.log(`[chat] Using user's own key for ${preferredProvider}`);
          }
        } catch {
          // No user key found or decrypt failed — continue with server keys
        }
      } else {
        // Move preferred to front
        const preferredIdx = availableModels.findIndex(m => m.providerId === preferredProvider);
        if (preferredIdx > 0) {
          const [preferred] = availableModels.splice(preferredIdx, 1);
          availableModels = [preferred, ...availableModels];
        }
      }
    }

    console.log(`[chat] Available providers: [${availableModels.map(m => m.providerId).join(', ')}]${preferredProvider ? ` (preferred: ${preferredProvider})` : ''}`);

    if (availableModels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hay proveedores de IA disponibles. Configura al menos una API key.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let lastError: Error | null = null;

    for (const { model, providerId } of availableModels) {
      try {
        console.log(`[chat] Trying provider: ${providerId}`);

        const result = streamText({
          model,
          system: systemPrompt,
          messages: aiMessages,
          tools: storyboardTools,
          maxRetries: 0,
        });

        // Verify the provider works by reading the first chunk.
        // Some providers return empty stream on error instead of throwing.
        const reader = result.textStream.getReader();
        let firstChunk: ReadableStreamReadResult<string>;

        try {
          // Race: either we get a chunk or the full text promise rejects with the real error
          const textPromise = Promise.resolve(result.text).then(() => null as never, (e: unknown) => { throw e; });
          const readPromise = reader.read();

          firstChunk = await Promise.race([readPromise, textPromise]);
        } catch (readError) {
          // Error from provider — release reader and propagate
          try { reader.releaseLock(); } catch { /* ignore */ }
          throw readError;
        }

        // If stream ended immediately with no content, the provider failed silently
        if (firstChunk.done && !firstChunk.value) {
          try { reader.releaseLock(); } catch { /* ignore */ }
          throw new Error(`Provider ${providerId} returned empty response`);
        }

        // Provider works!
        console.log(`[chat] Provider ${providerId} responding`);

        const encoder = new TextEncoder();
        const sseStream = new ReadableStream<Uint8Array>({
          async start(controller) {
            // Send first chunk
            if (!firstChunk.done && firstChunk.value) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: firstChunk.value })}\n\n`));
            }
            // Stream rest
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: value })}\n\n`));
                }
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            } catch (streamErr) {
              console.warn(`[chat] Mid-stream error from ${providerId}:`, streamErr);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(sseStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-AI-Provider': providerId,
          },
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error ?? 'Unknown error');
        lastError = new Error(errMsg);
        console.warn(`[chat] Provider ${providerId} FAILED: ${errMsg.slice(0, 200)}`);

        // Mark this provider as temporarily disabled
        markProviderFailed(providerId as ProviderId, errMsg);
        console.log(`[chat] Falling back to next provider...`);

        // Continue to next provider
      }
    }

    // All providers failed
    const finalError = lastError?.message || 'Todos los proveedores de IA fallaron. Intenta de nuevo en unos minutos.';
    console.error(`[chat] All providers failed. Last error: ${finalError}`);
    return new Response(
      JSON.stringify({ error: finalError }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[chat]', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
