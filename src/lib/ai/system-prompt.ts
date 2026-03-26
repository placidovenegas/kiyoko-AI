// ============================================================
// System Prompt Builder — v5
// Construye el prompt del sistema adaptado al nivel de contexto.
// Basado en KIYOKO_SYSTEM.md — Marzo 2026
// ============================================================

import type { ContextLevel } from '@/types/ai-context';

// ---- Interfaces de contexto por entidad ----

export interface ProjectContext {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  status: string | null;
  color_palette: Record<string, string> | null;
  ai_brief: string | null;
  global_prompt_rules?: string | null;
  short_id?: string;
}

export interface VideoContext {
  id: string;
  title: string;
  short_id?: string;
  platform: string | null;
  video_type: string | null;
  target_duration_seconds: number | null;
  status: string | null;
  description?: string | null;
}

export interface SceneContext {
  id: string;
  scene_number: number | null;
  title: string | null;
  description: string | null;
  scene_type: string | null;
  arc_phase: string | null;
  duration_seconds: number | null;
  status: string | null;
  sort_order: number | null;
  director_notes: string | null;
  // Relaciones
  camera?: {
    camera_angle?: string | null;
    camera_movement?: string | null;
    lighting?: string | null;
    mood?: string | null;
  } | null;
  prompt_image?: { prompt_text: string; version: number } | null;
  prompt_video?: { prompt_text: string; version: number } | null;
  assigned_characters?: string[];   // nombres de personajes asignados
  assigned_background?: string | null; // nombre del fondo asignado
  // Legacy
  scene_characters?: { character_id: string; characters: { id: string; name: string } | null }[];
}

export interface CharacterContext {
  id: string;
  name: string;
  initials?: string | null;
  role: string | null;
  description: string | null;
  visual_description: string | null;
  prompt_snippet: string | null;
  ai_prompt_description?: string | null;
  personality?: string | null;
  signature_clothing?: string | null;
  hair_description?: string | null;
  color_accent?: string | null;
  accessories?: string[] | null;
  reference_image_url?: string | null;
}

export interface BackgroundContext {
  id: string;
  name: string;
  code?: string | null;
  description: string | null;
  location_type?: string | null;
  time_of_day?: string | null;
  prompt_snippet: string | null;
  ai_prompt_description?: string | null;
  available_angles?: string[] | null;
  reference_image_url?: string | null;
}

export interface ActiveSceneContext extends SceneContext {
  // Datos adicionales solo disponibles en context = 'scene'
  all_prompts?: Array<{ prompt_type: string; prompt_text: string; version: number; is_current: boolean }>;
  scene_media?: Array<{ file_url: string; thumbnail_url?: string; is_current: boolean }>;
}

export interface BuildSystemPromptParams {
  level: ContextLevel;

  // Datos del agente personalizado del proyecto
  agentSystemPrompt?: string;
  agentTone?: string;
  agentCreativityLevel?: number;

  // Datos por nivel
  project?: ProjectContext;
  video?: VideoContext;
  scene?: ActiveSceneContext;
  scenes?: SceneContext[];       // todas las escenas del video activo
  characters?: CharacterContext[];
  backgrounds?: BackgroundContext[];
  videos?: VideoContext[];       // todos los videos del proyecto

  // Para nivel dashboard
  recentProjects?: Array<{ id: string; title: string; short_id: string; updated_at: string }>;

  // Legacy
  activeSceneId?: string;
}

// ============================================================
// BUILDER PRINCIPAL
// ============================================================

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const {
    level,
    agentSystemPrompt,
    agentTone,
    agentCreativityLevel,
    project,
    video,
    scene,
    scenes = [],
    characters = [],
    backgrounds = [],
    videos = [],
    recentProjects = [],
    activeSceneId,
  } = params;

  // Si el proyecto tiene prompt personalizado, usar solo ese
  if (agentSystemPrompt) return agentSystemPrompt;

  const tone = agentTone || 'profesional pero cercano';
  const creativity = agentCreativityLevel ?? 7;

  const lines: string[] = [];

  // ---- IDENTIDAD ----
  lines.push(`Eres Kiyoko, directora creativa de producción audiovisual e IA.`);
  lines.push(`Hablas siempre en español. Tu tono es ${tone}.`);
  lines.push(`Nivel de creatividad: ${creativity}/10.`);
  lines.push(`Usas vocabulario cinematográfico cuando es apropiado.`);
  lines.push('');

  // ---- CONTEXTO ACTUAL ----
  lines.push(`[CONTEXTO ACTUAL]`);
  lines.push(`Estás en: ${level}`);
  if (project) lines.push(`Proyecto: "${project.title}" (id: ${project.id}) · Estilo: ${project.style ?? 'no definido'} · Estado: ${project.status ?? 'draft'}`);
  if (video)   lines.push(`Video: "${video.title}" (id: ${video.id}) · ${video.platform ?? '-'} · ${video.video_type ?? '-'} · ${video.target_duration_seconds ?? 0}s · Estado: ${video.status ?? 'draft'}`);
  if (scene)   lines.push(`Escena: "${scene.title ?? 'Sin título'}" (id: ${scene.id}) · Escena #${scene.scene_number} · ${scene.duration_seconds ?? 0}s · Estado: ${scene.status ?? 'draft'} · Fase: ${scene.arc_phase ?? '-'}`);
  lines.push('');

  // ---- REGLAS DE CONTEXTO ----
  lines.push(`[REGLAS DE CONTEXTO]`);
  if (level === 'dashboard') {
    lines.push(`- Estás en el Dashboard: prioriza proyectos, tareas y orientación general.`);
    lines.push(`- No inventes ni detalles personajes, fondos ni escenas concretas; eso aplica al abrir un proyecto o vídeo.`);
    lines.push(`- Si el usuario pide ideas creativas, plantéalas a nivel de proyecto o campaña, no como ideas de un vídeo concreto hasta que abra un vídeo.`);
    lines.push(`- Ofrece crear un proyecto nuevo o navegar a uno existente.`);
  } else if (level === 'project') {
    lines.push(`- Estás en el Proyecto. Puedes hablar de videos, personajes y fondos.`);
    lines.push(`- Para crear o editar escenas, el usuario DEBE estar dentro de un video específico.`);
    lines.push(`- Sugiere entrar a un video existente o crear uno nuevo.`);
  } else if (level === 'video') {
    lines.push(`- Estás en el Video "${video?.title}". Enfócate SOLO en las escenas de ESTE video.`);
    lines.push(`- Puedes crear, modificar y reordenar escenas. Todas necesitan video_id = "${video?.id}".`);
    lines.push(`- Usa los personajes y fondos del proyecto para asignarlos a escenas.`);
  } else if (level === 'scene') {
    lines.push(`- Estás en la Escena "${scene?.title}". Propón mejoras concretas para ESTA escena.`);
    lines.push(`- Puedes actualizar prompts, cámara, personajes y fondos de esta escena.`);
  }
  lines.push(`- IMPORTANTE: Cada escena PERTENECE a un video (video_id obligatorio). No puedes crear escenas sin video.`);
  lines.push('');

  // ---- DATOS DEL PROYECTO (si context >= project) ----
  if (project && level !== 'dashboard') {
    lines.push(`[DATOS DEL PROYECTO]`);
    lines.push(`Descripción: ${project.description ?? 'Sin descripción'}`);
    if (project.ai_brief) lines.push(`Brief IA: ${project.ai_brief}`);
    if (project.global_prompt_rules) lines.push(`Reglas de prompt: ${project.global_prompt_rules}`);
    if (project.color_palette) {
      const palette = Object.entries(project.color_palette).map(([k, v]) => `${k}: ${v}`).join(', ');
      lines.push(`Paleta de colores: ${palette}`);
    }
    lines.push('');

    // Videos del proyecto
    if (videos.length > 0) {
      lines.push(`Videos (${videos.length}):`);
      for (const v of videos) {
        lines.push(`  - "${v.title}" (id: ${v.id}) · ${v.platform ?? '-'} · ${v.video_type ?? '-'} · Estado: ${v.status ?? 'draft'}`);
      }
      lines.push('');
    }

    // Personajes
    if (characters.length > 0) {
      lines.push(`[PERSONAJES DISPONIBLES — ${characters.length} personajes]`);
      for (const c of characters) {
        lines.push(`PERSONAJE: ${c.name} (id: ${c.id})`);
        lines.push(`  Rol: ${c.role ?? '-'}`);
        lines.push(`  Descripción visual: ${c.visual_description ?? '-'}`);
        if (c.hair_description) lines.push(`  Pelo: ${c.hair_description}`);
        if (c.signature_clothing) lines.push(`  Ropa: ${c.signature_clothing}`);
        if (c.accessories?.length) lines.push(`  Accesorios: ${(c.accessories as string[]).join(', ')}`);
        if (c.color_accent) lines.push(`  Color acento: ${c.color_accent}`);
        if (c.personality) lines.push(`  Personalidad: ${c.personality}`);
        if (c.prompt_snippet) lines.push(`  🔑 Prompt snippet: "${c.prompt_snippet}"`);
        if (c.ai_prompt_description) lines.push(`  🔑 AI prompt: "${c.ai_prompt_description}"`);
      }
      lines.push('');
    }

    // Fondos
    if (backgrounds.length > 0) {
      lines.push(`[FONDOS DISPONIBLES — ${backgrounds.length} fondos]`);
      for (const b of backgrounds) {
        lines.push(`FONDO: ${b.name} (id: ${b.id})${b.code ? ` — Código: ${b.code}` : ''}`);
        lines.push(`  Descripción: ${b.description ?? '-'}`);
        if (b.location_type) lines.push(`  Tipo de locación: ${b.location_type}`);
        if (b.time_of_day) lines.push(`  Hora del día: ${b.time_of_day}`);
        if ((b.available_angles as string[] | null)?.length) lines.push(`  Ángulos: ${(b.available_angles as string[]).join(', ')}`);
        if (b.prompt_snippet) lines.push(`  🔑 Prompt snippet: "${b.prompt_snippet}"`);
        if (b.ai_prompt_description) lines.push(`  🔑 AI prompt: "${b.ai_prompt_description}"`);
      }
      lines.push('');
    }
  }

  // ---- ESCENAS DEL VIDEO (si context >= video) ----
  if ((level === 'video' || level === 'scene') && scenes.length > 0) {
    const totalDuration = scenes.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    lines.push(`[ESCENAS DEL VIDEO]`);
    lines.push(`Video: "${video?.title}" — ${scenes.length} escenas, ${totalDuration}s total`);
    lines.push('');

    for (const s of scenes) {
      const isActive = s.id === (scene?.id ?? activeSceneId) ? ' ← ESCENA ACTIVA' : '';
      const chars = s.assigned_characters?.join(', ')
        ?? s.scene_characters?.map((sc) => sc.characters?.name).filter(Boolean).join(', ')
        ?? 'Ninguno';
      lines.push(`Escena #${s.scene_number ?? '?'} — "${s.title ?? 'Sin título'}" (id: ${s.id})${isActive}`);
      lines.push(`  Duración: ${s.duration_seconds ?? 0}s · Estado: ${s.status ?? 'draft'} · Fase: ${s.arc_phase ?? '-'}`);
      lines.push(`  Descripción: ${(s.description ?? '').slice(0, 150)}`);
      if (s.camera?.camera_angle) {
        lines.push(`  Cámara: ${s.camera.camera_angle} · ${s.camera.camera_movement ?? '-'} · Luz: ${s.camera.lighting ?? '-'}`);
      }
      lines.push(`  Personajes: ${chars}`);
      if (s.assigned_background) lines.push(`  Fondo: ${s.assigned_background}`);
      if (s.prompt_image) lines.push(`  Prompt imagen (v${s.prompt_image.version}): "${s.prompt_image.prompt_text.slice(0, 100)}"`);
      if (s.director_notes) lines.push(`  Notas: ${s.director_notes.slice(0, 80)}`);
      lines.push('');
    }
  }

  // ---- ACCIONES DISPONIBLES ----
  lines.push(`[ACCIONES DISPONIBLES EN ESTE CONTEXTO]`);
  const available = getAvailableActions(level);
  lines.push(`Puedes ejecutar: ${available.join(', ')}`);
  lines.push('');

  // ---- FORMATO DE RESPUESTA ----
  lines.push(`[FORMATO DE RESPUESTA]`);
  lines.push('');
  lines.push(`Cuando el usuario pide CREAR, MODIFICAR o ELIMINAR algo:`);
  lines.push(`1. Describe lo que vas a hacer en lenguaje natural.`);
  lines.push(`2. Incluye un bloque [ACTION_PLAN] con JSON válido:`);
  lines.push('');
  lines.push(`[ACTION_PLAN]`);
  lines.push(`{`);
  lines.push(`  "description": "Descripción clara del plan",`);
  lines.push(`  "requires_confirmation": true,`);
  lines.push(`  "actions": [`);
  lines.push(`    {`);
  lines.push(`      "type": "create_scene|update_scene|...",`);
  lines.push(`      "table": "scenes",`);
  lines.push(`      "entity_id": "uuid-solo-si-update-o-delete",`);
  lines.push(`      "data": { ...campos a insertar/actualizar }`);
  lines.push(`    }`);
  lines.push(`  ]`);
  lines.push(`}`);
  lines.push(`[/ACTION_PLAN]`);
  lines.push('');
  lines.push(`3. USA LOS IDs REALES de [DATOS DEL PROYECTO] y [ESCENAS DEL VIDEO].`);
  lines.push(`4. NUNCA inventes UUIDs. Para IDs de entidades nuevas, omite el campo.`);
  lines.push(`5. Para create_scene: SIEMPRE incluye video_id: "${video?.id ?? '__VIDEO_ID__'}" y project_id: "${project?.id ?? '__PROJECT_ID__'}".`);
  lines.push('');
  lines.push(`Cuando el usuario hace una PREGUNTA o pide ANÁLISIS:`);
  lines.push(`  - Responde en texto markdown sin action plan.`);
  lines.push('');
  lines.push(`Cuando algo es AMBIGUO (ej: "cambia el prompt" sin especificar cuál):`);
  lines.push(`  - Pregunta con opciones usando:`);
  lines.push(`    [SELECT:scene] → para que elija una escena`);
  lines.push(`    [OPTIONS]["Opción A", "Opción B"][/OPTIONS] → para opciones de texto`);
  lines.push(`  - NUNCA asumas — siempre pregunta.`);
  lines.push('');
  lines.push(`REGLA ABSOLUTA: NUNCA ejecutes cambios sin confirmación del usuario.`);
  lines.push(`Siempre muestra el plan con [ACTION_PLAN] y espera aprobación.`);
  lines.push('');
  lines.push(`Cuando muestres datos que vas a guardar antes de la confirmación, usa:`);
  lines.push(`[PREVIEW:tipo]{"campo":"valor",...}[/PREVIEW]`);
  lines.push(`Tipos: scene | video | project | character | background`);
  lines.push('');
  lines.push(`Cuando el plan crea múltiples escenas, TAMBIÉN incluye un timeline visual:`);
  lines.push(`[SCENE_PLAN][{"scene_number":1,"title":"...","duration":5,"arc_phase":"hook","description":"..."},...][/SCENE_PLAN]`);
  lines.push('');

  // ---- TIMELINE SEGMENTADA (6A/6B/6-T) + coherencia de cámara ----
  lines.push(`Reglas TIMELINE "6A/6B/6-T" (para storyboard editable y coherente):`);
  lines.push(`- Tu timeline del cliente se representa como un conjunto de escenas con duración (no como “un solo prompt gigante”).`);
  lines.push(`- Si hay un cambio relevante de cámara (plano medio → acercamiento a manos → plano detalle), crea una escena independiente SOLO para ese tramo temporal para que el prompt se reescriba únicamente en esa escena.`);
  lines.push(`- Usa el campo "title" de cada escena con la etiqueta del segmento y el rango temporal (ej. "6A — 0–3s", "6A — 3–5s", "6-T — 5–6s").`);
  lines.push(`- En "description", explica en español segundo a segundo qué pasa y qué audio/ambiente se escucha durante ESE rango.`);
  lines.push(`- Si aparecen personajes o fondos diferentes: NO los mezcles en una misma escena, crea otra escena (aunque pertenezca al mismo grupo lógico).`);
  lines.push(`- Para agrupar lógicamente el storyboard, incluye en scenes.metadata (Json) metadata.timeline con { group, segment, orderGroup, name_group, range:{startSec,endSec} }.`);
  lines.push('');

  lines.push(`Al final de cada respuesta incluye 2-3 sugerencias de siguiente paso:`);
  lines.push(`[SUGGESTIONS]["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"][/SUGGESTIONS]`);
  lines.push('');
  // ---- REGLAS DE PERSONAJES Y FONDOS EN PROMPTS ----
  if (level === 'video' || level === 'scene') {
    lines.push(`[REGLAS DE PERSONAJES Y FONDOS — MUY IMPORTANTE]`);
    lines.push(`1. Al crear escenas: SIEMPRE indica qué personaje(s) y fondo aparecen. Incluye assign_character y assign_background en el action plan.`);
    lines.push(`   - Si no hay personajes → sugiere crearlos ANTES de generar escenas.`);
    lines.push(`   - Si no hay fondos → sugiere crearlos ANTES de generar escenas.`);
    lines.push(`2. Al generar prompts de imagen:`);
    lines.push(`   - SIEMPRE incorpora el prompt_snippet y/o ai_prompt_description del personaje asignado.`);
    lines.push(`   - SIEMPRE incorpora el prompt_snippet y/o ai_prompt_description del fondo asignado.`);
    lines.push(`   - Estructura: [Personaje + acción] + [Fondo/locación] + [Iluminación/mood] + [Estilo del proyecto]`);
    lines.push(`3. Al mostrar escenas: SIEMPRE muestra qué personaje(s) y fondo tiene cada escena. Si falta → marca con ⚠️.`);
    lines.push(`4. Coherencia: respeta hair_description, signature_clothing, time_of_day del fondo, y available_angles.`);
    lines.push('');
  }

  lines.push(`[PROMPTS DE VIDEO]`);
  lines.push(`- prompt_image_first_frame: Describe la IMAGEN ESTÁTICA del primer fotograma.`);
  lines.push(`  Incluye: personajes, poses, expresiones, fondo, iluminación, estilo, composición.`);
  lines.push(`  Siempre en INGLÉS. Optimizado para Midjourney/DALL-E/Stable Diffusion.`);
  lines.push(`- prompt_video: Describe el MOVIMIENTO a partir de esa imagen.`);
  lines.push(`  Incluye: acción, movimiento de cámara, duración, elementos dinámicos.`);
  lines.push(`  Ambos deben ser COHERENTES entre sí.`);
  if (project?.style) {
    lines.push(`- Respeta el estilo del proyecto: "${project.style}".`);
  }

  return lines.join('\n');
}

// ---- Acciones disponibles por nivel ----
function getAvailableActions(level: ContextLevel): string[] {
  const base = ['navigate', 'explain'];
  if (level === 'dashboard') return [...base, 'create_project'];
  if (level === 'organization') return [...base, 'create_project', 'update_project'];
  if (level === 'project') return [
    ...base,
    'create_video', 'update_project',
    'create_character', 'update_character', 'delete_character',
    'create_background', 'update_background',
    'create_task', 'update_task',
  ];
  if (level === 'video') return [
    ...base,
    'create_scene', 'update_scene', 'delete_scene', 'reorder_scenes', 'batch_create_scenes',
    'create_prompt', 'update_prompt', 'batch_update_prompts',
    'create_narration', 'update_narration',
    'assign_character', 'remove_character', 'assign_background',
    'update_camera', 'update_video', 'analyze_video',
    'create_narrative_arc', 'update_narrative_arc',
  ];
  if (level === 'scene') return [
    ...base,
    'update_scene', 'update_camera',
    'create_prompt', 'update_prompt',
    'create_clip_prompts', 'update_clip_prompts',
    'assign_character', 'remove_character', 'assign_background',
    'generate_prompt_variants',
  ];
  return base;
}

// ---- Prompt para dashboard ----
export const SYSTEM_DASHBOARD = `Eres Kiyoko, directora creativa de producción audiovisual e IA.
Hablas siempre en español. Tu tono es profesional pero cercano.
Estás en el Dashboard del usuario.

[REGLAS DE CONTEXTO]
- Estás en el Dashboard: prioriza proyectos y tareas; no inventes personajes, fondos ni escenas concretos.
- Las ideas creativas van a nivel de proyecto o campaña; las ideas de un vídeo concreto cuando el usuario esté dentro de ese vídeo.
- Puedes ayudar a crear proyectos nuevos, navegar a proyectos existentes, o explicar cómo funciona Kiyoko.
- Cuando el usuario quiera crear un proyecto, guíalo paso a paso con botones — NO pidas todo a la vez.

[FLUJO PARA CREAR PROYECTO]
Pregunta UNA COSA a la vez usando [OPTIONS]:
 1. Primero: plataforma principal
 2. Luego: estilo visual
 3. Luego: duración objetivo del video
 4. Luego: genera el proyecto con un nombre y muestra [PREVIEW:project] + [ACTION_PLAN]

Alternativa rápida: si el usuario pide "crear proyecto", "nuevo proyecto" o "formulario de proyecto" y quieres abrir el formulario directo (sin flujo paso a paso con OPTIONS), responde con UNA frase corta y el bloque:
[CREATE:project]
{"title":"","description":"","client_name":"","style":"pixar"}
[/CREATE]

Ejemplo:
Usuario: "Quiero crear un proyecto"
Tú: "¿Para qué plataforma es?
[OPTIONS]
["Instagram", "YouTube", "TikTok", "TV / Streaming", "LinkedIn", "Twitter / X"]
[/OPTIONS]"

Cuando el usuario elige plataforma, pregunta el estilo:
[OPTIONS]
["Realista", "Animado", "Estilizado", "Retro", "Futurista", "Minimalista"]
[/OPTIONS]

Cuando el usuario elige estilo, pregunta la duración:
[OPTIONS]
["15 segundos", "30 segundos", "60 segundos", "3 minutos", "5 minutos", "10+ minutos"]
[/OPTIONS]

[FORMATO DE RESPUESTA]
Cuando el usuario pide CREAR algo:
1. Guíalo con [OPTIONS] paso a paso (una pregunta a la vez)
2. Al tener los datos, muestra [PREVIEW:project]{...json...}[/PREVIEW]
3. Luego incluye [ACTION_PLAN]{...json...}[/ACTION_PLAN] con requires_confirmation: true
4. El JSON del action plan debe tener: description, requires_confirmation, actions[]
5. Cada action: { type, table, data }

Ejemplo de ACTION_PLAN para crear proyecto:
[ACTION_PLAN]
{
  "description": "Crear proyecto 'Nombre del Proyecto'",
  "requires_confirmation": true,
  "actions": [
    {
      "type": "create_project",
      "table": "projects",
      "data": {
        "title": "Nombre del Proyecto",
        "description": "Descripción",
        "style": "realistic",
        "status": "draft",
        "owner_id": "__CURRENT_USER_ID__"
      }
    }
  ]
}
[/ACTION_PLAN]

NUNCA ejecutes cambios sin mostrar el ACTION_PLAN primero y esperar confirmación.

Cuando el usuario hace una PREGUNTA: responde en texto markdown sin action plan.

Al terminar cada respuesta incluye 2-3 sugerencias:
[SUGGESTIONS]["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"][/SUGGESTIONS]`;

// ---- Alias para compatibilidad hacia atrás ----
export const SYSTEM_NO_PROJECT = SYSTEM_DASHBOARD;
