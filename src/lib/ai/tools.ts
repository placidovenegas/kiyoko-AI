import { tool } from 'ai';
import { z } from 'zod';

/**
 * AI tools for the chat director — the model can call these to modify the storyboard.
 * Each tool defines a Zod schema for input. No execute function — the client handles execution
 * via action-executor.ts after user approval.
 */

export const storyboardTools = {
  // ---- Scenes ----

  updateScene: tool({
    description: 'Actualiza campos directos de una escena existente (titulo, descripcion, duracion, etc.). Para prompts usa updatePrompt, para camara usa updateCamera.',
    inputSchema: z.object({
      sceneId: z.string().describe('UUID de la escena a actualizar'),
      changes: z.record(z.string(), z.unknown()).describe('Campos a actualizar (title, description, duration_seconds, scene_type, sort_order, etc.)'),
      reason: z.string().describe('Razon del cambio en espanol'),
    }),
  }),

  createScene: tool({
    description: 'Crea una nueva escena en el proyecto',
    inputSchema: z.object({
      title: z.string().describe('Titulo de la nueva escena'),
      description: z.string().describe('Descripcion de lo que pasa en la escena'),
      sceneNumber: z.string().describe('Codigo de la escena (ej: E10, N5)'),
      durationSeconds: z.number().describe('Duracion en segundos'),
      sceneType: z.enum(['original', 'improved', 'new', 'filler', 'video']).describe('Tipo de escena'),
      insertAfterSceneId: z.string().nullish().describe('UUID de la escena tras la cual insertar'),
      promptImage: z.string().optional().describe('Prompt para imagen (en ingles)'),
      promptVideo: z.string().optional().describe('Prompt para video (en ingles)'),
    }),
  }),

  deleteScene: tool({
    description: 'Elimina una escena del proyecto',
    inputSchema: z.object({
      sceneId: z.string().describe('UUID de la escena a eliminar'),
      reason: z.string().describe('Razon de la eliminacion'),
    }),
  }),

  reorderScenes: tool({
    description: 'Reordena las escenas del proyecto',
    inputSchema: z.object({
      sceneOrder: z.array(z.object({
        sceneId: z.string(),
        newSortOrder: z.number(),
      })).describe('Lista de escenas con su nuevo orden'),
    }),
  }),

  // ---- Characters ----

  createCharacter: tool({
    description: 'Crea un nuevo personaje en el proyecto',
    inputSchema: z.object({
      name: z.string().describe('Nombre del personaje'),
      role: z.string().optional().describe('Rol del personaje (protagonista, secundario, etc.)'),
      description: z.string().optional().describe('Descripcion general del personaje'),
      visualDescription: z.string().optional().describe('Descripcion visual detallada'),
      personality: z.string().optional().describe('Personalidad del personaje'),
      signatureClothing: z.string().optional().describe('Ropa caracteristica'),
      hairDescription: z.string().optional().describe('Descripcion del pelo'),
      colorAccent: z.string().optional().describe('Color de acento (hex)'),
    }),
  }),

  updateCharacter: tool({
    description: 'Actualiza un personaje existente (nombre, descripcion, reglas, visual)',
    inputSchema: z.object({
      characterId: z.string().describe('UUID del personaje'),
      changes: z.record(z.string(), z.unknown()).describe('Campos a actualizar (name, description, visual_description, personality, role, etc.)'),
      reason: z.string().describe('Razon del cambio'),
    }),
  }),

  deleteCharacter: tool({
    description: 'Elimina un personaje del proyecto',
    inputSchema: z.object({
      characterId: z.string().describe('UUID del personaje a eliminar'),
      reason: z.string().describe('Razon de la eliminacion'),
    }),
  }),

  removeCharacterFromScene: tool({
    description: 'Quita un personaje de una escena',
    inputSchema: z.object({
      sceneId: z.string(),
      characterId: z.string(),
      reason: z.string(),
    }),
  }),

  addCharacterToScene: tool({
    description: 'Anade un personaje a una escena',
    inputSchema: z.object({
      sceneId: z.string(),
      characterId: z.string(),
    }),
  }),

  // ---- Backgrounds ----

  createBackground: tool({
    description: 'Crea un nuevo fondo/localizacion en el proyecto',
    inputSchema: z.object({
      name: z.string().describe('Nombre del fondo'),
      code: z.string().describe('Codigo corto (ej: INT-SALON, EXT-CALLE)'),
      description: z.string().optional().describe('Descripcion del fondo'),
      locationType: z.enum(['interior', 'exterior']).optional().describe('Tipo de localizacion'),
      timeOfDay: z.enum(['day', 'night', 'sunset', 'dawn']).optional().describe('Hora del dia'),
      promptSnippet: z.string().optional().describe('Snippet para prompts de imagen'),
    }),
  }),

  updateBackground: tool({
    description: 'Actualiza un fondo/localizacion existente',
    inputSchema: z.object({
      backgroundId: z.string().describe('UUID del fondo'),
      changes: z.record(z.string(), z.unknown()).describe('Campos a actualizar'),
      reason: z.string().describe('Razon del cambio'),
    }),
  }),

  // ---- Camera ----

  updateCamera: tool({
    description: 'Actualiza o crea la configuracion de camara de una escena (scene_camera)',
    inputSchema: z.object({
      sceneId: z.string().describe('UUID de la escena'),
      camera_angle: z.enum([
        'wide', 'medium', 'close_up', 'extreme_close_up', 'pov',
        'low_angle', 'high_angle', 'birds_eye', 'dutch', 'over_shoulder',
      ]).optional().describe('Angulo de camara'),
      camera_movement: z.enum([
        'static', 'dolly_in', 'dolly_out', 'pan_left', 'pan_right',
        'tilt_up', 'tilt_down', 'tracking', 'crane', 'handheld', 'orbit',
      ]).optional().describe('Movimiento de camara'),
      lighting: z.string().optional().describe('Descripcion de la iluminacion'),
      mood: z.string().optional().describe('Mood/atmosfera de la escena'),
      camera_notes: z.string().optional().describe('Notas adicionales de camara'),
    }),
  }),

  // ---- Scene-background assignment ----

  assignBackground: tool({
    description: 'Asigna un fondo/localizacion a una escena (scene_backgrounds junction)',
    inputSchema: z.object({
      sceneId: z.string().describe('UUID de la escena'),
      backgroundId: z.string().describe('UUID del fondo a asignar'),
      angle: z.string().optional().describe('Angulo especifico del fondo en esta escena'),
      time_of_day: z.enum(['day', 'night', 'sunset', 'dawn']).optional().describe('Hora del dia para esta escena'),
    }),
  }),

  // ---- Analysis / Explanation ----

  explainStoryboard: tool({
    description: 'Genera un resumen/explicacion del storyboard completo',
    inputSchema: z.object({
      format: z.enum(['summary', 'detailed', 'timeline']).describe('Formato de la explicacion'),
    }),
  }),
};
