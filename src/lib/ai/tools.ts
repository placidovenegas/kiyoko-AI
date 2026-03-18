import { tool } from 'ai';
import { z } from 'zod';

/**
 * AI tools for the chat director — the model can call these to modify the storyboard.
 * Each tool defines a Zod schema for input and an execute function.
 * The execute function returns data that the client uses to apply changes.
 */

export const storyboardTools = {
  updateScene: tool({
    description: 'Actualiza campos de una escena existente (título, descripción, duración, prompts, etc.)',
    inputSchema: z.object({
      sceneId: z.string().describe('UUID de la escena a actualizar'),
      changes: z.record(z.string(), z.unknown()).describe('Campos a actualizar (title, description, duration_seconds, prompt_image, prompt_video, etc.)'),
      reason: z.string().describe('Razón del cambio en español'),
    }),
  }),

  createScene: tool({
    description: 'Crea una nueva escena en el proyecto',
    inputSchema: z.object({
      title: z.string().describe('Título de la nueva escena'),
      description: z.string().describe('Descripción en español de lo que pasa en la escena'),
      sceneNumber: z.string().describe('Número/código de la escena (ej: E10, N5)'),
      durationSeconds: z.number().describe('Duración en segundos'),
      sceneType: z.enum(['original', 'improved', 'new', 'filler', 'video']).describe('Tipo de escena'),
      insertAfterSceneId: z.string().optional().describe('UUID de la escena después de la cual insertar'),
      promptImage: z.string().optional().describe('Prompt para generación de imagen (en inglés)'),
      promptVideo: z.string().optional().describe('Prompt para generación de vídeo (en inglés)'),
    }),
  }),

  deleteScene: tool({
    description: 'Elimina una escena del proyecto',
    inputSchema: z.object({
      sceneId: z.string().describe('UUID de la escena a eliminar'),
      reason: z.string().describe('Razón de la eliminación'),
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

  updateCharacter: tool({
    description: 'Actualiza un personaje (nombre, descripción, reglas)',
    inputSchema: z.object({
      characterId: z.string().describe('UUID del personaje'),
      changes: z.record(z.string(), z.unknown()).describe('Campos a actualizar'),
      reason: z.string().describe('Razón del cambio'),
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
    description: 'Añade un personaje a una escena',
    inputSchema: z.object({
      sceneId: z.string(),
      characterId: z.string(),
    }),
  }),

  explainStoryboard: tool({
    description: 'Genera un resumen/explicación del storyboard completo',
    inputSchema: z.object({
      format: z.enum(['summary', 'detailed', 'timeline']).describe('Formato de la explicación'),
    }),
  }),
};
