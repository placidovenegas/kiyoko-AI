// Chat context — detects where the user is in the app and adapts AI behavior.
// Route params: shortId (project), videoShortId (video), sceneShortId (scene).

export type ChatLocation =
  | { type: 'dashboard' }
  | { type: 'project'; shortId: string }
  | { type: 'video'; shortId: string; videoShortId: string }
  | { type: 'scene'; shortId: string; videoShortId: string; sceneShortId: string }
  | { type: 'characters'; shortId: string }
  | { type: 'backgrounds'; shortId: string }
  | { type: 'settings'; shortId: string };

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

/**
 * Derive chat context from the current pathname + Next.js route params.
 * Works with actual app routes: /project/[shortId]/video/[videoShortId]/scene/[sceneShortId]
 */
export function getChatLocationFromPath(
  pathname: string,
  params: Record<string, string>,
): ChatLocation {
  const { shortId, videoShortId, sceneShortId } = params;

  if (sceneShortId && videoShortId && shortId) {
    return { type: 'scene', shortId, videoShortId, sceneShortId };
  }
  if (videoShortId && shortId) {
    return { type: 'video', shortId, videoShortId };
  }
  if (shortId) {
    if (pathname.includes('/resources/characters')) return { type: 'characters', shortId };
    if (pathname.includes('/resources/backgrounds')) return { type: 'backgrounds', shortId };
    if (pathname.includes('/settings')) return { type: 'settings', shortId };
    return { type: 'project', shortId };
  }
  return { type: 'dashboard' };
}

/**
 * Welcome message shown when user opens the chat sidebar at a given location.
 */
export function getWelcomeMessage(location: ChatLocation): string {
  switch (location.type) {
    case 'dashboard':
      return (
        '¡Hola! Estoy en el dashboard. Puedo ayudarte a:\n' +
        '• Crear un nuevo proyecto\n' +
        '• Analizar tus proyectos existentes\n' +
        '• Generar ideas para vídeos\n' +
        '¿Qué quieres hacer?'
      );
    case 'project':
      return (
        'Estás en el proyecto. Puedo:\n' +
        '• Crear un nuevo vídeo\n' +
        '• Añadir personajes o fondos\n' +
        '• Analizar el estado del proyecto\n' +
        '¿En qué te ayudo?'
      );
    case 'video':
      return (
        'Estás en un vídeo. Puedo:\n' +
        '• Crear o editar escenas\n' +
        '• Generar la narración completa\n' +
        '• Analizar la coherencia del vídeo\n' +
        '• Generar prompts para todas las escenas\n' +
        '¿Qué necesitas?'
      );
    case 'scene':
      return (
        'Estás en una escena. Puedo:\n' +
        '• Generar o mejorar el prompt de imagen/vídeo\n' +
        '• Cambiar cámara, iluminación, mood\n' +
        '• Añadir o cambiar personajes\n' +
        '• Asignar un fondo\n' +
        '¿Qué quieres ajustar?'
      );
    case 'characters':
      return 'Estás en personajes. Sube una imagen y analizaré al personaje para crear su descripción para prompts.';
    case 'backgrounds':
      return 'Estás en fondos. Sube una imagen de referencia o descríbeme el escenario que necesitas.';
    case 'settings':
      return '¿En qué te puedo ayudar con la configuración?';
    default:
      return '¿En qué puedo ayudarte?';
  }
}

/**
 * Quick action buttons shown at the bottom of the chat, contextual to location.
 */
export function getQuickActions(location: ChatLocation): QuickAction[] {
  switch (location.type) {
    case 'dashboard':
      return [
        { id: 'new_project', label: 'Crear proyecto', icon: '➕', prompt: 'Quiero crear un nuevo proyecto' },
        { id: 'suggestions', label: 'Ideas para vídeo', icon: '💡', prompt: 'Dame ideas para un vídeo' },
      ];
    case 'project':
      return [
        { id: 'new_video', label: 'Crear video', icon: '🎬', prompt: 'Crear video' },
        { id: 'add_character', label: 'Añadir personaje', icon: '🎭', prompt: 'Crear personaje' },
        { id: 'add_background', label: 'Añadir fondo', icon: '🌄', prompt: 'Crear fondo' },
        { id: 'project_summary', label: 'Resumen', icon: '📊', prompt: 'Dame un resumen del estado del proyecto' },
      ];
    case 'video':
      return [
        { id: 'generate_scenes', label: 'Generar escenas', icon: '🎬', prompt: 'Genera las escenas para este vídeo' },
        { id: 'generate_narration', label: 'Narración', icon: '🎙️', prompt: 'Genera la narración completa de todas las escenas' },
        { id: 'batch_prompts', label: 'Prompts batch', icon: '⚡', prompt: 'Genera los prompts de imagen para todas las escenas' },
        { id: 'analyze_video', label: 'Analizar', icon: '🔍', prompt: 'Analiza la coherencia de las escenas del vídeo' },
      ];
    case 'scene':
      return [
        { id: 'generate_prompt', label: 'Generar prompt', icon: '✨', prompt: 'Genera el prompt para esta escena' },
        { id: 'improve_prompt', label: 'Mejorar prompt', icon: '🔄', prompt: 'Mejora el prompt actual de esta escena' },
        { id: 'analyze_image', label: 'Analizar imagen', icon: '🖼️', prompt: 'Analiza la imagen de referencia de esta escena' },
        { id: 'change_camera', label: 'Cambiar cámara', icon: '📷', prompt: 'Sugiere una configuración de cámara para esta escena' },
      ];
    case 'characters':
      return [
        { id: 'analyze_character', label: 'Analizar imagen', icon: '🖼️', prompt: 'Analiza la imagen del personaje' },
        { id: 'create_character', label: 'Nuevo personaje', icon: '➕', prompt: 'Crea un nuevo personaje para este proyecto' },
      ];
    case 'backgrounds':
      return [
        { id: 'create_background', label: 'Nuevo fondo', icon: '🌄', prompt: 'Crea un nuevo fondo para este proyecto' },
      ];
    default:
      return [];
  }
}
