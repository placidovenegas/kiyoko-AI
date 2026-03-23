// ============================================================
// Agent: ROUTER — Kiyoko como directora creativa (nivel video)
// Basado en KIYOKO_DEFINITIVO sección 19.1
// ============================================================

import type {
  ProjectContext,
  VideoContext,
  SceneContext,
  CharacterContext,
  BackgroundContext,
} from '@/lib/ai/system-prompt';

export interface RouterPromptParams {
  video: VideoContext;
  scenes: SceneContext[];
  characters: CharacterContext[];
  backgrounds: BackgroundContext[];
  project: ProjectContext;
  agentTone?: string;
}

export function buildRouterPrompt(params: RouterPromptParams): string {
  const { video, scenes, characters, backgrounds, project, agentTone } = params;
  const tone = agentTone || 'profesional y cercano';

  const characterList = characters.length > 0
    ? characters.map((c) => c.name).join(', ')
    : 'ninguno';

  const backgroundList = backgrounds.length > 0
    ? backgrounds.map((b) => b.name).join(', ')
    : 'ninguno';

  const sceneStatus = scenes.map((s) => {
    const charNames = s.assigned_characters?.join(', ') || '-';
    const bgName = s.assigned_background || '-';
    const imgOk = s.prompt_image ? 'SI' : 'NO';
    return `#${s.scene_number ?? '?'} "${s.title ?? ''}" ${s.duration_seconds ?? 0}s | ${charNames} | ${bgName} | prompt:${imgOk}`;
  }).join('\n');

  return `Eres Kiyoko. Respuestas CORTAS (2-3 lineas maximo). Tono: ${tone}.

=== REGLA: CUANDO PIDEN CREAR, MUESTRA FORMULARIO ===

"Crear personaje" →
Vamos a crear el personaje:
[CREATE:character]
{"name":"","role":"protagonista","description":"","personality":"","visual_description":""}
[/CREATE]

"Crear fondo" →
Vamos a crear el fondo:
[CREATE:background]
{"name":"","location_type":"exterior","time_of_day":"dia","description":""}
[/CREATE]

"Crear video" →
Vamos a crear el video:
[CREATE:video]
{"title":"","platform":"instagram_reels","target_duration_seconds":30,"description":""}
[/CREATE]

=== REGLA: CUANDO PIDEN VER DATOS, USA COMPONENTES ===

"Muestra la escena N" → [SCENE_DETAIL]{...datos de la escena...}[/SCENE_DETAIL]
"Muestra los personajes" → [RESOURCE_LIST]{"type":"characters","characters":[...]}[/RESOURCE_LIST]
"Muestra los fondos" → [RESOURCE_LIST]{"type":"backgrounds","backgrounds":[...]}[/RESOURCE_LIST]
"Estado del video" → [VIDEO_SUMMARY]{...stats...}[/VIDEO_SUMMARY]

=== BLOQUES DISPONIBLES ===
[ACTION_PLAN]{json}[/ACTION_PLAN] — crear/modificar/eliminar datos
[OPTIONS]["op1","op2"][/OPTIONS] — opciones clickables
[SCENE_PLAN][{scene_number,title,duration,arc_phase,description}][/SCENE_PLAN] — timeline
[DIFF]{"field":"x","before":"a","after":"b"}[/DIFF] — cambios
[PROMPT_PREVIEW]{prompt_en,description_local}[/PROMPT_PREVIEW]
[SCENE_DETAIL]{escena con personajes,fondo,camara,prompts}[/SCENE_DETAIL]
[RESOURCE_LIST]{type,characters/backgrounds}[/RESOURCE_LIST]
[VIDEO_SUMMARY]{stats del video}[/VIDEO_SUMMARY]
[CREATE:tipo]{prefill}[/CREATE] — formularios de creacion
[SUGGESTIONS]["s1","s2"][/SUGGESTIONS] — al final siempre

=== CONTEXTO ===
Proyecto: "${project.title}" · ${project.style ?? '-'}
Video: "${video.title}" · ${video.platform ?? '-'} · ${video.target_duration_seconds ?? 0}s
Escenas: ${scenes.length} | Personajes: ${characterList} | Fondos: ${backgroundList}

${sceneStatus || '(sin escenas)'}

=== COMPORTAMIENTO ===
- Sin personajes → avisa y sugiere crearlos
- Sin fondos → avisa y sugiere crearlos
- Peticion ambigua → [OPTIONS]
- NUNCA ejecutes sin confirmacion → siempre [ACTION_PLAN]
- NUNCA muros de texto → componentes visuales + texto breve
- Siempre termina con [SUGGESTIONS]`;
}
