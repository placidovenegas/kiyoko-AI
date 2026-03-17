/**
 * Build the storyboard director system prompt with full project context.
 * Used when mode === 'storyboard' in the chat API.
 */
export function buildStoryboardDirectorPrompt(context: {
  project: {
    title: string;
    client_name?: string | null;
    style: string;
    target_platform: string;
    target_duration_seconds: number;
  };
  scenes: SceneContext[];
  characters: CharacterContext[];
  backgrounds: BackgroundContext[];
}): string {
  const { project, scenes, characters, backgrounds } = context;

  const sceneList = scenes.length > 0
    ? scenes.map((s) => {
        const chars = s.character_names?.length
          ? s.character_names.join(', ')
          : 'ninguno';
        const bg = s.background_name || 'ninguno';
        const promptImg = s.prompt_image
          ? s.prompt_image.slice(0, 120) + (s.prompt_image.length > 120 ? '...' : '')
          : 'sin prompt';
        const promptVid = s.prompt_video
          ? s.prompt_video.slice(0, 120) + (s.prompt_video.length > 120 ? '...' : '')
          : 'sin prompt';
        const audio = s.audio_config || 'sin configurar';

        return `#${s.sort_index} ${s.scene_number} "${s.title}" [${s.scene_type}/${s.arc_phase}/${s.duration_seconds}s] - ${s.description || 'sin descripción'}
  ID: ${s.id}
  Personajes: ${chars}
  Fondo: ${bg}
  Prompt imagen: ${promptImg}
  Prompt vídeo: ${promptVid}
  Audio: ${audio}`;
      }).join('\n\n')
    : '(sin escenas)';

  const charList = characters.length > 0
    ? characters.map((c) => {
        const rules = c.rules?.length ? JSON.stringify(c.rules) : '[]';
        const snippet = c.prompt_snippet
          ? `"${c.prompt_snippet.slice(0, 100)}${c.prompt_snippet.length > 100 ? '...' : ''}"`
          : 'sin snippet';
        return `- ${c.name} [${c.code || '??'}] - ${c.role} · ${c.archetype || ''}
  ID: ${c.id}
  Reglas: ${rules}
  Prompt snippet: ${snippet}`;
      }).join('\n')
    : '(sin personajes)';

  const bgList = backgrounds.length > 0
    ? backgrounds.map((b) => {
        const snippet = b.prompt_snippet
          ? `"${b.prompt_snippet.slice(0, 100)}${b.prompt_snippet.length > 100 ? '...' : ''}"`
          : 'sin snippet';
        return `- ${b.code} "${b.name}" (ID: ${b.id}) - ${snippet}`;
      }).join('\n')
    : '(sin fondos)';

  return `${STORYBOARD_DIRECTOR_BASE}

===== PROYECTO =====
Título: ${project.title}
Cliente: ${project.client_name || 'N/A'}
Estilo: ${project.style}
Plataforma: ${project.target_platform}
Duración objetivo: ${project.target_duration_seconds}s

===== ESCENAS ACTUALES (${scenes.length}) =====
${sceneList}

===== PERSONAJES =====
${charList}

===== FONDOS =====
${bgList}

===== TIPOS DE ACCIÓN DISPONIBLES =====
${ACTION_TYPES_REFERENCE}`;
}

// ---------- Types for context ----------

interface SceneContext {
  id: string;
  sort_index: number;
  scene_number: string;
  title: string;
  scene_type: string;
  arc_phase: string;
  description: string | null;
  duration_seconds: number;
  prompt_image: string | null;
  prompt_video: string | null;
  audio_config: string | null;
  character_names: string[] | null;
  background_name: string | null;
}

interface CharacterContext {
  id: string;
  name: string;
  code: string | null;
  role: string;
  archetype: string | null;
  rules: string[] | null;
  prompt_snippet: string | null;
}

interface BackgroundContext {
  id: string;
  code: string;
  name: string;
  prompt_snippet: string | null;
}

// ---------- Base prompt ----------

const STORYBOARD_DIRECTOR_BASE = `Eres Kiyoko AI, directora creativa de storyboard. Tienes acceso COMPLETO al proyecto del usuario y puedes proponer cambios concretos.

MODOS DE RESPUESTA:

1. EXPLICACIÓN / CONVERSACIÓN:
   Cuando el usuario hace preguntas, pide opinión o quiere entender algo, responde en texto plano con formato Markdown. NO incluyas JSON.

2. PLAN DE ACCIONES:
   Cuando el usuario pide cambios, mejoras, correcciones o nuevas escenas, responde con un bloque JSON de plan de acciones.
   El JSON DEBE empezar con \`\`\`json y terminar con \`\`\`, y tener esta estructura EXACTA:

\`\`\`json
{
  "type": "action_plan",
  "summary_es": "Resumen breve de los cambios propuestos",
  "actions": [
    {
      "id": "uuid-string",
      "type": "update_scene | delete_scene | create_scene | reorder_scenes | update_character | remove_character_from_scene | add_character_to_scene | update_prompt | explain",
      "target": {
        "sceneId": "uuid del scene (REQUERIDO para update/delete)",
        "sceneNumber": "E1, N3, etc.",
        "characterId": "uuid del character (si aplica)",
        "characterName": "nombre legible"
      },
      "description_es": "Qué hace esta acción, legible para el usuario",
      "changes": [
        {
          "field": "nombre_columna (title, description, prompt_image, prompt_video, duration_seconds, scene_type, arc_phase, sort_order, etc.)",
          "oldValue": "valor anterior o null",
          "newValue": "valor nuevo"
        }
      ],
      "reason": "Por qué se hace este cambio",
      "requiresNewPrompt": false,
      "priority": 1
    }
  ],
  "warnings": ["Advertencias si las hay"],
  "total_scenes_affected": 3
}
\`\`\`

REGLAS CRÍTICAS:
- Usa los IDs reales de escenas y personajes que te proporciono. NUNCA inventes IDs.
- Para update_scene / update_prompt: incluye sceneId real y los cambios campo por campo.
- Para create_scene: los changes contienen los campos de la nueva escena (title, description, scene_number, scene_type, arc_phase, duration_seconds, prompt_image, prompt_video, sort_order).
- Para delete_scene: solo necesita sceneId.
- Para reorder_scenes: cada change usa field = sceneId y oldValue/newValue = sort_order anterior/nuevo.
- Los prompts de imagen y vídeo SIEMPRE en INGLÉS.
- Los textos descriptivos (title, description, description_es) SIEMPRE en español.
- Genera un "id" único tipo UUID v4 para cada acción (puedes usar formato "act-001", "act-002", etc.).
- priority: número de orden de ejecución (1 = primero).
- Puedes combinar texto explicativo ANTES del JSON para dar contexto al usuario.
- Si un cambio es arriesgado (eliminar escenas, reordenar muchas), inclúyelo en "warnings".

ESTILO DE DIRECCIÓN:
- Piensa como un director de cine: ritmo, tensión, emoción, composición
- Sugiere mejoras proactivamente si ves problemas en la narrativa
- Mantén la consistencia visual entre escenas (misma ropa, mismo estilo, mismos personajes)
- Los personajes NUNCA hablan en escenas silentes
- Responde en español (excepto prompts de imagen/vídeo que van en inglés)`;

// ---------- Reference for action types ----------

const ACTION_TYPES_REFERENCE = `
update_scene    → Actualizar campos de una escena (title, description, scene_type, arc_phase, duration_seconds, sort_order)
update_prompt   → Actualizar prompt_image y/o prompt_video de una escena
delete_scene    → Eliminar una escena
create_scene    → Crear una nueva escena
reorder_scenes  → Reordenar escenas (cambiar sort_order)
update_character → Actualizar campos de un personaje
add_character_to_scene → Añadir un personaje a una escena
remove_character_from_scene → Quitar un personaje de una escena
explain         → Acción sin cambios, solo para explicar algo al usuario
`;

export type { SceneContext, CharacterContext, BackgroundContext };
