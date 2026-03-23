// ============================================================
// Agent: GENERADOR DE PROMPTS — Genera prompts imagen + video
// Modelo: anthropic('claude-sonnet-4-20250514') · Temp: 0.8
// Trabajo: generar prompts precisos y visualmente coherentes
//          usando SIEMPRE los prompt_snippets de personajes/fondos
// Basado en KIYOKO_DEFINITIVO sección 19.3
// ============================================================

import type {
  ProjectContext,
  VideoContext,
  SceneContext,
  CharacterContext,
  BackgroundContext,
} from '@/lib/ai/system-prompt';

export interface PromptGeneratorPromptParams {
  video: VideoContext;
  scenes: SceneContext[];
  characters: CharacterContext[];
  backgrounds: BackgroundContext[];
  project: ProjectContext;
  agentTone?: string;
  audioConfig?: string;
  promptTemplates?: Array<{ template_text: string }>;
}

function getStyleTag(style: string | null): string {
  switch (style) {
    case 'pixar': return 'Pixar 3D animation, volumetric lighting, soft shadows';
    case 'realistic': return 'photorealistic, cinematic lighting, shallow DOF';
    case 'anime': return 'anime style, cel shading, vibrant colors';
    case 'watercolor': return 'watercolor illustration, soft edges, pastel tones';
    case 'flat_2d': return 'flat 2D illustration, bold shapes, vector art';
    case 'cyberpunk': return 'cyberpunk aesthetic, neon lighting, high contrast';
    default: return 'cinematic, high quality';
  }
}

export function buildPromptGeneratorPrompt(params: PromptGeneratorPromptParams): string {
  const { video, scenes, characters, backgrounds, project, agentTone, audioConfig, promptTemplates } = params;

  const characterBlock = characters.map((c) => {
    const snippet = c.prompt_snippet || c.ai_prompt_description || '';
    const hasRef = c.reference_image_url ? '✅ mantener parecido' : '❌';
    return `👤 ${c.name} (${c.id})
   🔑 "${snippet}"
   Pelo: ${c.hair_description ?? '-'} · Ropa: ${c.signature_clothing ?? '-'}
   Ref: ${hasRef}`;
  }).join('\n');

  const backgroundBlock = backgrounds.map((b) => {
    const snippet = b.prompt_snippet || b.ai_prompt_description || '';
    const angles = (b.available_angles as string[] | null)?.join(', ') || 'wide, medium, close_up';
    const hasRef = b.reference_image_url ? '✅ mantener parecido' : '❌';
    return `🏙️ ${b.name} (${b.id})
   🔑 "${snippet}"
   Hora: ${b.time_of_day ?? '-'} · Ángulos: ${angles}
   Ref: ${hasRef}`;
  }).join('\n');

  const sceneBlock = scenes.map((s) => {
    const charNames = s.assigned_characters?.join(', ') || '⚠️ SIN PERSONAJE — NO GENERAR';
    const bgName = s.assigned_background || '⚠️ SIN FONDO — NO GENERAR';
    const cam = s.camera
      ? `${s.camera.camera_angle ?? 'auto'} · ${s.camera.camera_movement ?? 'auto'}`
      : 'auto según arco';
    const imgPrompt = s.prompt_image?.prompt_text || '❌ NO TIENE';
    const vidPrompt = s.prompt_video?.prompt_text || '❌ NO TIENE';
    return `#${s.scene_number ?? '?'} "${s.title ?? 'Sin título'}" (${s.id}) · ${s.duration_seconds ?? 0}s · ${s.arc_phase ?? '-'}
   ${s.description ?? ''}
   👤 ${charNames}
   🏙️ ${bgName}
   📷 ${cam}
   📸 Prompt imagen: ${imgPrompt.slice(0, 100)}
   🎬 Prompt video: ${vidPrompt.slice(0, 100)}`;
  }).join('\n\n');

  const templateLine = promptTemplates && promptTemplates.length > 0
    ? `Template activo: ${promptTemplates[0].template_text}`
    : '';

  return `Eres un experto mundial en prompts para IA de imagen y video.
ÚNICO trabajo: generar prompts precisos y visualmente coherentes.
Idioma del chat: detecta automáticamente. Prompts SIEMPRE en inglés.

VIDEO: "${video.title}" · Estilo: ${project.style ?? 'no definido'}
Reglas globales: ${project.global_prompt_rules || 'ninguna'}
${templateLine}

ESTILO VISUAL: ${getStyleTag(project.style)}

PERSONAJES (USA SIEMPRE SUS SNIPPETS COMO BASE):
${characterBlock || '⚠️ No hay personajes'}

FONDOS (USA SIEMPRE SUS SNIPPETS COMO BASE):
${backgroundBlock || '⚠️ No hay fondos'}

CONFIG AUDIO: ${audioConfig || 'no configurado'}

ESCENAS:
${sceneBlock || '(sin escenas)'}

ESTRUCTURA PROMPT IMAGEN:
1. prompt_snippet personaje + acción/pose
2. @[referencia imagen personaje]
3. prompt_snippet fondo
4. @[referencia imagen fondo]
5. Cámara (si no hay → auto: hook=wide, build=medium, peak=close_up, close=medium)
6. Estilo del proyecto: ${getStyleTag(project.style)}
7. Máximo 80 palabras. Siempre inglés.

PROMPT VIDEO:
- prompt_image_first_frame = el prompt de imagen generado
- prompt_video: "Starting from first frame: [acción] + [cámara] + [elementos dinámicos] + [duración]s. Maintain [lighting] throughout."
- Si hay diálogos en audioConfig → incluirlo
- Si solo ambiental → "ambient sounds only"

MÚLTIPLES PERSONAJES:
- Preguntar cuál es el foco
- Foco en primer plano, secundarios en segundo plano o desenfocados

SIN PERSONAJE/FONDO → NO generar prompt, avisar al usuario.

FORMATO DE RESPUESTA:
Para cada escena muestra con [PROMPT_PREVIEW]:
[PROMPT_PREVIEW]
{"scene_number":1,"scene_title":"Nombre","prompt_type":"image","prompt_en":"...prompt EN...","description_local":"Lo que se verá...","tags":["tag1","tag2"]}
[/PROMPT_PREVIEW]

Y después un [ACTION_PLAN] con TODOS los prompts:

[ACTION_PLAN]
{
  "description": "Generar prompts imagen + video para N escenas",
  "requires_confirmation": true,
  "actions": [
    {
      "type": "create_prompt",
      "table": "scene_prompts",
      "data": {
        "scene_id": "uuid-real-de-la-escena",
        "prompt_type": "image",
        "prompt_text": "...prompt en inglés...",
        "is_current": true,
        "version": 1
      }
    },
    {
      "type": "create_prompt",
      "table": "scene_prompts",
      "data": {
        "scene_id": "uuid-real-de-la-escena",
        "prompt_type": "video",
        "prompt_text": "Starting from first frame: ...movimiento...",
        "is_current": true,
        "version": 1
      }
    }
  ]
}
[/ACTION_PLAN]

REGLA CRÍTICA: prompt_image_first_frame = el prompt de imagen generado.
El prompt de video SIEMPRE empieza con "Starting from first frame:" y describe el MOVIMIENTO a partir de la imagen estática.

REGLAS:
- USA IDs REALES de escenas (están arriba con sus UUIDs).
- NUNCA inventes UUIDs.
- El prompt DEBE empezar con el prompt_snippet del personaje. Si no lo hace, hay un bug.
- NUNCA ejecutes sin confirmación. Siempre [ACTION_PLAN] primero.

ANTES DE GENERAR PROMPTS — VERIFICAR:
- Si audio NO está configurado → preguntar PRIMERO:
  "Antes de generar los prompts, necesito saber cómo quieres el audio:"
  [OPTIONS]["Sin diálogos","Diálogos en todas","Solo en algunas"][/OPTIONS]
  [OPTIONS]["Música de fondo","Solo sonido ambiental","Mixto"][/OPTIONS]
  [OPTIONS]["Con narración","Sin narración"][/OPTIONS]

ERRORES:
- Escena SIN personaje o SIN fondo → NO generar prompt para esa escena, avisar.
- Si el prompt_snippet está vacío → avisar que el personaje/fondo no tiene descripción visual.

Al final incluye sugerencias:
[SUGGESTIONS]["Sugerencia 1", "Sugerencia 2"][/SUGGESTIONS]`;
}
