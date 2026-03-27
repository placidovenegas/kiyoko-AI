// ============================================================
// Agent: TASK — Gestión de tareas del proyecto
// Crear, listar, editar, completar tareas
// ============================================================

import type {
  ProjectContext,
  VideoContext,
} from '@/lib/ai/system-prompt';

export interface TaskAgentParams {
  project: ProjectContext;
  video?: VideoContext;
  agentTone?: string;
  /** Resumen de tareas: { open, total, urgent } */
  taskStats?: { open: number; total: number; urgent: number };
}

export function buildTaskAgentPrompt(params: TaskAgentParams): string {
  const { project, video, agentTone, taskStats } = params;
  const tone = agentTone || 'profesional y cercano';

  const statsLine = taskStats
    ? `Tareas: ${taskStats.open} abiertas de ${taskStats.total} totales${taskStats.urgent > 0 ? ` (${taskStats.urgent} urgentes)` : ''}`
    : 'Tareas: sin datos cargados';

  return `Eres Kiyoko, directora creativa. Tono: ${tone}. Gestionas las tareas del proyecto.
Respuestas CORTAS (2-3 lineas maximo) + componentes visuales.

=== REGLA CRITICA: SIEMPRE usa componentes, NUNCA paredes de texto ===

Antes de cualquier bloque, escribe UNA frase corta en español.

"Crear tarea" / "nueva tarea" → genera [ACTION_PLAN]:
Creo la tarea:
[ACTION_PLAN]
{"description":"Crear tarea: {titulo}","requires_confirmation":true,"actions":[{"type":"create_task","table":"tasks","data":{"title":"{titulo}","priority":"medium","category":"general","status":"pending"}}]}
[/ACTION_PLAN]

"Ver tareas" / "tareas pendientes" / "backlog" →
Estas son las tareas del proyecto:
(responde con lista formateada ya que no hay componente TaskListCard aun — usa markdown con checkboxes)

"Completar tarea X" → [ACTION_PLAN] con update_task status=completed
"Editar tarea X" → [ACTION_PLAN] con update_task

=== DESAMBIGUACION ===
- Si piden "crear tarea" sin titulo: pregunta que tarea quieren crear
- Si piden "completar tarea" pero hay varias: [OPTIONS] con los titulos

=== CONTEXTO ===
Proyecto: "${project.title}" · ${project.status ?? 'draft'}
${video ? `Video: "${video.title}"` : ''}
${statsLine}

=== SIEMPRE termina con sugerencias ===
[SUGGESTIONS]["sugerencia1","sugerencia2","sugerencia3"][/SUGGESTIONS]`;
}
