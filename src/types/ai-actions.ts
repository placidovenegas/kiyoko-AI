export type AiActionType =
  | 'update_scene'
  | 'delete_scene'
  | 'create_scene'
  | 'reorder_scenes'
  | 'update_character'
  | 'remove_character_from_scene'
  | 'add_character_to_scene'
  | 'update_prompt'
  | 'update_timeline'
  | 'batch_update'
  | 'merge_scenes'
  | 'split_scene'
  | 'explain';

export interface AiActionChange {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

export interface AiAction {
  id: string;
  type: AiActionType;
  target: {
    sceneId?: string;
    sceneNumber?: string;
    characterId?: string;
    characterName?: string;
  };
  description_es: string;
  changes: AiActionChange[];
  reason: string;
  requiresNewPrompt: boolean;
  priority: number;
}

export interface AiActionPlan {
  summary_es: string;
  actions: AiAction[];
  total_scenes_affected: number;
  warnings: string[];
}

export interface AiActionResult {
  actionId: string;
  success: boolean;
  error?: string;
  historyId?: string;
}

export interface ChangeHistoryEntry {
  id: string;
  project_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  batch_id: string | null;
  description_es: string;
  created_at: string;
}
