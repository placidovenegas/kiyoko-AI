import { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUserModel } from '@/lib/ai/get-user-model';
import { logUsage } from '@/lib/ai/sdk-router';
import { characterOutputSchema } from '@/lib/ai/schemas/character-output';
import {
  apiBadRequest,
  apiError,
  apiJson,
  apiUnauthorized,
  createApiRequestContext,
  logServerEvent,
  parseApiJson,
} from '@/lib/observability/server';

const roleSchema = z.enum(['protagonista', 'secundario', 'extra', 'narrador']);
const resultSectionSchema = z.object({
  title: z.string(),
  items: z.array(z.string()),
});

const resultPayloadSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(resultSectionSchema),
  suggestions: z.array(z.string()),
});

const voiceDirectionSchema = z.object({
  archetype: z.string(),
  tone: z.string(),
  pace: z.string(),
  recommendedLanguage: z.enum(['es', 'en']),
  voiceBrief: z.string(),
  useCases: z.array(z.string()),
});

const draftCharacterSchema = z.object({
  draft: characterOutputSchema.extend({ role: roleSchema }),
  voiceDirection: voiceDirectionSchema,
  suggestions: z.array(z.string()),
});

const enrichCharacterSchema = z.object({
  result: resultPayloadSchema,
  updates: z.object({
    description: z.string().nullable(),
    visual_description: z.string().nullable(),
    personality: z.string().nullable(),
    hair_description: z.string().nullable(),
    signature_clothing: z.string().nullable(),
    prompt_snippet: z.string().nullable(),
    ai_prompt_description: z.string().nullable(),
    accessories: z.array(z.string()).nullable(),
    color_accent: z.string().nullable(),
    rules: z.object({
      always: z.array(z.string()),
      never: z.array(z.string()),
    }).nullable(),
  }),
  voiceDirection: voiceDirectionSchema.nullable(),
});

const sceneSummarySchema = z.object({
  result: resultPayloadSchema,
});

interface CharacterAssistBody {
  action: 'draft' | 'audit' | 'enrich' | 'prompt' | 'scene-summary';
  projectId: string;
  characterId?: string;
  prompt?: string;
  seed?: {
    role?: string;
    description?: string;
    visual_description?: string;
    personality?: string;
  };
}

function compactText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request);

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized(requestContext);
    }

    const { data: body, response } = await parseApiJson<CharacterAssistBody>(request, requestContext);
    if (response || !body) {
      return response;
    }

    if (!body.projectId || !body.action) {
      return apiBadRequest(requestContext, 'projectId y action son obligatorios');
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, title, style, ai_brief, global_prompt_rules, custom_style_description, color_palette')
      .eq('id', body.projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return apiJson(requestContext, { error: 'Proyecto no encontrado', requestId: requestContext.requestId }, { status: 404 });
    }

    const { data: aiSettings } = await supabase
      .from('project_ai_settings')
      .select('vision_provider, vision_model, image_provider, tts_provider')
      .eq('project_id', body.projectId)
      .maybeSingle();

    const { model, providerId } = await getUserModel(user.id);
    const startedAt = Date.now();

    logServerEvent('character-assist', requestContext, 'Running contextual character action', {
      userId: user.id,
      projectId: body.projectId,
      characterId: body.characterId,
      action: body.action,
      providerId,
    });

    if (body.action === 'draft') {
      if (!compactText(body.prompt)) {
        return apiBadRequest(requestContext, 'prompt es obligatorio para draft');
      }

      const { object, usage } = await generateObject({
        model,
        schema: draftCharacterSchema,
        system: `Eres el copiloto IA de Kiyoko para crear personajes listos para producción audiovisual.

Genera una ficha de personaje completa, consistente y utilizable para prompts de imagen y vídeo.
Reglas:
- Devuelve prompt_snippet y ai_prompt_description en inglés.
- El campo role debe ser uno de: protagonista, secundario, extra, narrador.
- Sé concreto en rasgos visuales, peinado, ropa, textura y silueta.
- Propón también una dirección de voz útil para locución o narración del personaje.
- Respeta el estilo base del proyecto si existe.
- suggestions debe existir siempre, aunque esté vacío.
- useCases debe existir siempre, aunque esté vacío.
`,
        prompt: `Proyecto: ${project.title}\nEstilo: ${project.style ?? 'custom'}\nBrief IA: ${compactText(project.ai_brief) || 'Sin brief'}\nReglas globales: ${compactText(project.global_prompt_rules) || 'Sin reglas'}\nEstilo custom: ${compactText(project.custom_style_description) || 'No definido'}\nPaleta: ${compactText(project.color_palette) || 'No definida'}\nVision provider: ${aiSettings?.vision_provider ?? 'auto'}\nTTS provider: ${aiSettings?.tts_provider ?? 'auto'}\n\nInstrucción del usuario:\n${body.prompt}\n\nSemilla opcional:\n- Rol: ${compactText(body.seed?.role) || 'sin definir'}\n- Descripción: ${compactText(body.seed?.description) || 'sin definir'}\n- Visual: ${compactText(body.seed?.visual_description) || 'sin definir'}\n- Personalidad: ${compactText(body.seed?.personality) || 'sin definir'}`,
      });

      await logUsage({
        userId: user.id,
        projectId: body.projectId,
        provider: providerId,
        model: providerId,
        task: 'character-assist:draft',
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        estimatedCost: 0,
        responseTimeMs: Date.now() - startedAt,
        success: true,
      });

      return apiJson(requestContext, object);
    }

    if (body.action === 'audit') {
      const { data: characters } = await supabase
        .from('characters')
        .select('id, name, role, description, visual_description, prompt_snippet, ai_prompt_description, reference_image_url')
        .eq('project_id', body.projectId)
        .order('sort_order', { ascending: true });

      const safeCharacters = characters ?? [];
      const characterIds = safeCharacters.map((character) => character.id);

      const [{ data: safeSceneLinks }, { data: safeImages }] = characterIds.length
        ? await Promise.all([
          supabase.from('scene_characters').select('character_id').in('character_id', characterIds),
          supabase.from('character_images').select('character_id').in('character_id', characterIds),
        ])
        : [{ data: [] }, { data: [] }];

      const { object, usage } = await generateObject({
        model,
        schema: resultPayloadSchema,
        system: `Eres un supervisor de continuidad de personajes. Analiza el elenco del proyecto y devuelve un resumen ejecutivo breve, accionable y orientado a producción.`,
        prompt: `Proyecto: ${project.title}\nEstilo: ${project.style ?? 'custom'}\nBrief IA: ${compactText(project.ai_brief) || 'Sin brief'}\nTotal personajes: ${safeCharacters.length}\n\nPersonajes:\n${safeCharacters.map((character) => {
          const sceneCount = (safeSceneLinks ?? []).filter((link) => link.character_id === character.id).length;
          const imageCount = (safeImages ?? []).filter((image) => image.character_id === character.id).length;
          return `- ${character.name} | rol: ${character.role ?? 'sin rol'} | ref: ${character.reference_image_url ? 'sí' : 'no'} | escenas: ${sceneCount} | imágenes: ${imageCount} | prompt: ${character.prompt_snippet || character.ai_prompt_description ? 'sí' : 'no'} | descripción visual: ${character.visual_description ?? 'vacía'}`;
        }).join('\n') || '- Sin personajes'}\n\nDevuelve secciones pensadas para UI: huecos críticos, consistencia visual, y siguientes pasos.`,
      });

      await logUsage({
        userId: user.id,
        projectId: body.projectId,
        provider: providerId,
        model: providerId,
        task: 'character-assist:audit',
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        estimatedCost: 0,
        responseTimeMs: Date.now() - startedAt,
        success: true,
      });

      return apiJson(requestContext, { result: object });
    }

    if (!body.characterId) {
      return apiBadRequest(requestContext, 'characterId es obligatorio para esta acción');
    }

    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, name, role, description, visual_description, personality, hair_description, signature_clothing, accessories, color_accent, prompt_snippet, ai_prompt_description, reference_image_url, rules')
      .eq('id', body.characterId)
      .eq('project_id', body.projectId)
      .single();

    if (characterError || !character) {
      return apiJson(requestContext, { error: 'Personaje no encontrado', requestId: requestContext.requestId }, { status: 404 });
    }

    const { data: sceneLinks } = await supabase
      .from('scene_characters')
      .select('role_in_scene, scene:scenes(scene_number, title, description, arc_phase)')
      .eq('character_id', body.characterId);

    if (body.action === 'enrich') {
      const { object, usage } = await generateObject({
        model,
        schema: enrichCharacterSchema,
        system: `Eres el copiloto IA contextual de personajes de Kiyoko.

Tu objetivo es enriquecer fichas de personaje para producción audiovisual sin romper coherencia.
Reglas:
- Solo rellena o mejora campos útiles para consistencia visual y narrativa.
- prompt_snippet y ai_prompt_description deben ir en inglés.
- Si propones color_accent, devuelve un hex válido.
- La dirección de voz debe servir para narración o locución, no como actuación teatral extrema.
- result.sections debe ser corto y útil para mostrarse en un drawer de UI.
- result.sections y result.suggestions deben existir siempre, aunque estén vacíos.
- En updates, todas las claves deben existir; usa null cuando no propongas cambio.
- rules debe existir como objeto o null.
`,
        prompt: `Proyecto: ${project.title}\nEstilo: ${project.style ?? 'custom'}\nBrief IA: ${compactText(project.ai_brief) || 'Sin brief'}\nReglas globales: ${compactText(project.global_prompt_rules) || 'Sin reglas'}\nVision provider: ${aiSettings?.vision_provider ?? 'auto'}\nTTS provider: ${aiSettings?.tts_provider ?? 'auto'}\n\nPersonaje actual:\n- Nombre: ${character.name}\n- Rol: ${character.role ?? 'sin rol'}\n- Descripción: ${character.description ?? 'vacía'}\n- Descripción visual: ${character.visual_description ?? 'vacía'}\n- Personalidad: ${character.personality ?? 'vacía'}\n- Pelo: ${character.hair_description ?? 'vacío'}\n- Ropa: ${character.signature_clothing ?? 'vacía'}\n- Accesorios: ${character.accessories?.join(', ') ?? 'ninguno'}\n- Prompt snippet: ${character.prompt_snippet ?? 'vacío'}\n- AI prompt description: ${character.ai_prompt_description ?? 'vacío'}\n- Tiene imagen de referencia: ${character.reference_image_url ? 'sí' : 'no'}\n\nEscenas:\n${(sceneLinks ?? []).map((link) => {
          const scene = Array.isArray(link.scene) ? link.scene[0] : link.scene;
          if (!scene) return '- Sin escena';
          return `- ${scene.scene_number}: ${scene.title} | arco: ${scene.arc_phase ?? 'n/a'} | rol: ${link.role_in_scene ?? 'n/a'} | desc: ${scene.description ?? 'sin descripción'}`;
        }).join('\n') || '- Sin escenas'}`,
      });

      await logUsage({
        userId: user.id,
        projectId: body.projectId,
        provider: providerId,
        model: providerId,
        task: 'character-assist:enrich',
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        estimatedCost: 0,
        responseTimeMs: Date.now() - startedAt,
        success: true,
      });

      return apiJson(requestContext, object);
    }

    if (body.action === 'prompt') {
      const { object, usage } = await generateObject({
        model,
        schema: z.object({
          result: resultPayloadSchema,
          updates: z.object({
            prompt_snippet: z.string(),
            ai_prompt_description: z.string(),
          }),
        }),
        system: `Eres un especialista en prompts de personajes para generación consistente de imágenes y vídeo.

Devuelve prompt_snippet y ai_prompt_description en inglés, extremadamente claros y reutilizables.
El prompt_snippet debe poder inyectarse dentro de prompts de escena sin depender de contexto adicional.
- result.sections y result.suggestions deben existir siempre, aunque estén vacíos.
`,
        prompt: `Proyecto: ${project.title}\nEstilo: ${project.style ?? 'custom'}\nPersonaje:\n- Nombre: ${character.name}\n- Rol: ${character.role ?? 'sin rol'}\n- Descripción visual: ${character.visual_description ?? 'vacía'}\n- Pelo: ${character.hair_description ?? 'vacío'}\n- Ropa: ${character.signature_clothing ?? 'vacía'}\n- Accesorios: ${character.accessories?.join(', ') ?? 'ninguno'}\n- Personalidad: ${character.personality ?? 'vacía'}\n- Prompt actual: ${character.prompt_snippet ?? 'vacío'}\n- AI prompt actual: ${character.ai_prompt_description ?? 'vacío'}\n- Reglas: ${JSON.stringify(character.rules ?? {})}`,
      });

      await logUsage({
        userId: user.id,
        projectId: body.projectId,
        provider: providerId,
        model: providerId,
        task: 'character-assist:prompt',
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        estimatedCost: 0,
        responseTimeMs: Date.now() - startedAt,
        success: true,
      });

      return apiJson(requestContext, object);
    }

    const { object, usage } = await generateObject({
      model,
      schema: sceneSummarySchema,
      system: `Eres un analista de continuidad narrativa. Resume cómo se está usando un personaje dentro del storyboard y señala huecos o riesgos de consistencia.`,
      prompt: `Proyecto: ${project.title}\nPersonaje: ${character.name}\nRol: ${character.role ?? 'sin rol'}\nPrompt snippet: ${character.prompt_snippet ?? character.ai_prompt_description ?? 'vacío'}\n\nEscenas:\n${(sceneLinks ?? []).map((link) => {
        const scene = Array.isArray(link.scene) ? link.scene[0] : link.scene;
        if (!scene) return '- Sin escena';
        return `- ${scene.scene_number}: ${scene.title} | arco: ${scene.arc_phase ?? 'n/a'} | rol en escena: ${link.role_in_scene ?? 'n/a'} | ${scene.description ?? 'sin descripción'}`;
      }).join('\n') || '- Sin escenas'}`,
    });

    await logUsage({
      userId: user.id,
      projectId: body.projectId,
      provider: providerId,
      model: providerId,
      task: 'character-assist:scene-summary',
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      estimatedCost: 0,
      responseTimeMs: Date.now() - startedAt,
      success: true,
    });

    return apiJson(requestContext, object);
  } catch (error) {
    return apiError(requestContext, 'character-assist', error, {
      message: 'No se pudo completar la asistencia contextual de personajes',
    });
  }
}