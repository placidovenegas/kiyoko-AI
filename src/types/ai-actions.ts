// ============================================================
// AI Actions — Catálogo completo de tipos y estructuras
// Basado en KIYOKO_SYSTEM.md v5
// ============================================================

// ---- Action Types ----

export type ActionType =
  // Proyectos
  | 'create_project'
  | 'update_project'
  // Videos
  | 'create_video'
  | 'update_video'
  // Escenas
  | 'create_scene'
  | 'update_scene'
  | 'delete_scene'
  | 'reorder_scenes'
  | 'batch_create_scenes'
  // Cámara
  | 'update_camera'
  // Personajes
  | 'create_character'
  | 'update_character'
  | 'delete_character'
  | 'assign_character'
  | 'remove_character'
  // Fondos
  | 'create_background'
  | 'update_background'
  | 'assign_background'
  // Prompts
  | 'create_prompt'
  | 'update_prompt'
  | 'batch_update_prompts'
  // Clips de video
  | 'create_clip_prompts'
  | 'update_clip_prompts'
  // Narración
  | 'create_narration'
  | 'update_narration'
  // Arco narrativo
  | 'create_narrative_arc'
  | 'update_narrative_arc'
  // Tareas
  | 'create_task'
  | 'update_task'
  // Navegación (no toca DB)
  | 'navigate'
  // Análisis (solo lectura)
  | 'explain'
  | 'analyze_video'
  // Legacy (compatibilidad hacia atrás)
  | 'remove_character_from_scene'
  | 'add_character_to_scene'
  | 'update_timeline'
  | 'merge_scenes'
  | 'split_scene'
  | 'batch_update';

// ---- Action principal (nuevo formato KIYOKO_SYSTEM) ----

export interface Action {
  type: ActionType;
  table: string | null;           // tabla Supabase, null para navigate/explain
  entity_id?: string;             // UUID si es UPDATE o DELETE
  data: Record<string, unknown>;  // campos a insertar/actualizar
}

// ---- Plan de acciones (nuevo formato) ----

export interface ActionPlan {
  description: string;
  requires_confirmation: boolean;
  actions: Action[];
}

// ---- Resultado de ejecución ----

export interface ActionResult {
  type: ActionType;
  success: boolean;
  entity_id?: string;             // UUID de la entidad creada/modificada
  error?: string;
}

export interface ActionPlanResult {
  batchId: string;
  results: ActionResult[];
  successCount: number;
  failedCount: number;
}

// ============================================================
// Tipos legacy — se mantienen para compatibilidad con
// action-executor.ts existente durante la migración
// ============================================================

/** @deprecated Usar Action */
export type AiActionType = ActionType;

/** @deprecated Usar Action */
export interface AiActionChange {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

/** @deprecated Usar Action */
export interface AiAction {
  id: string;
  type: AiActionType;
  target: {
    sceneId?: string;
    sceneNumber?: string;
    characterId?: string;
    characterName?: string;
    backgroundId?: string;
  };
  description_es: string;
  changes: AiActionChange[];
  reason: string;
  requiresNewPrompt: boolean;
  priority: number;
}

/** @deprecated Usar ActionPlan */
export interface AiActionPlan {
  summary_es: string;
  actions: AiAction[];
  total_scenes_affected: number;
  warnings: string[];
}

/** @deprecated Usar ActionResult */
export interface AiActionResult {
  actionId: string;
  success: boolean;
  error?: string;
  historyId?: string;
}

/** @deprecated */
export interface ChangeHistoryEntry {
  id: string;
  actionId: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
}

