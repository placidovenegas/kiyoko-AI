import { createClient } from '@/lib/supabase/client';
import type { AiAction, AiActionResult } from '@/types/ai-actions';

/**
 * Execute a single AI action against Supabase, recording history for undo.
 */
export async function executeAction(
  action: AiAction,
  projectId: string,
  userId: string,
  batchId: string,
): Promise<AiActionResult> {
  const supabase = createClient();

  try {
    switch (action.type) {
      case 'update_scene':
      case 'update_prompt': {
        if (!action.target.sceneId) throw new Error('No sceneId');
        const updates: Record<string, unknown> = {};
        for (const change of action.changes) {
          // Record history before changing
          await supabase.from('change_history').insert({
            project_id: projectId,
            user_id: userId,
            entity_type: 'scene',
            entity_id: action.target.sceneId,
            action: action.type,
            field_name: change.field,
            old_value: change.oldValue != null ? String(change.oldValue) : null,
            new_value: change.newValue != null ? String(change.newValue) : null,
            batch_id: batchId,
            description_es: action.description_es,
          });
          updates[change.field] = change.newValue;
        }
        await supabase.from('scenes').update(updates).eq('id', action.target.sceneId);
        return { actionId: action.id, success: true };
      }

      case 'delete_scene': {
        if (!action.target.sceneId) throw new Error('No sceneId');
        // Save full scene as old_value for restore
        const { data: scene } = await supabase.from('scenes').select('*').eq('id', action.target.sceneId).single();
        await supabase.from('change_history').insert({
          project_id: projectId,
          user_id: userId,
          entity_type: 'scene',
          entity_id: action.target.sceneId,
          action: 'delete_scene',
          field_name: '_full_record',
          old_value: scene ? JSON.stringify(scene) : null,
          new_value: null,
          batch_id: batchId,
          description_es: action.description_es,
        });
        await supabase.from('scenes').delete().eq('id', action.target.sceneId);
        return { actionId: action.id, success: true };
      }

      case 'create_scene': {
        const fields: Record<string, unknown> = { project_id: projectId };
        for (const change of action.changes) {
          fields[change.field] = change.newValue;
        }
        const { data: newScene } = await supabase.from('scenes').insert(fields).select('id').single();
        if (newScene) {
          await supabase.from('change_history').insert({
            project_id: projectId,
            user_id: userId,
            entity_type: 'scene',
            entity_id: newScene.id,
            action: 'create_scene',
            field_name: '_full_record',
            old_value: null,
            new_value: JSON.stringify(fields),
            batch_id: batchId,
            description_es: action.description_es,
          });
        }
        return { actionId: action.id, success: true };
      }

      case 'reorder_scenes': {
        for (const change of action.changes) {
          const sceneId = change.field; // field = sceneId for reorder
          await supabase.from('change_history').insert({
            project_id: projectId,
            user_id: userId,
            entity_type: 'scene',
            entity_id: sceneId,
            action: 'reorder_scenes',
            field_name: 'sort_order',
            old_value: String(change.oldValue),
            new_value: String(change.newValue),
            batch_id: batchId,
            description_es: action.description_es,
          });
          await supabase.from('scenes').update({ sort_order: change.newValue }).eq('id', sceneId);
        }
        return { actionId: action.id, success: true };
      }

      case 'update_character': {
        if (!action.target.characterId) throw new Error('No characterId');
        const updates: Record<string, unknown> = {};
        for (const change of action.changes) {
          await supabase.from('change_history').insert({
            project_id: projectId,
            user_id: userId,
            entity_type: 'character',
            entity_id: action.target.characterId!,
            action: 'update_character',
            field_name: change.field,
            old_value: change.oldValue != null ? String(change.oldValue) : null,
            new_value: change.newValue != null ? String(change.newValue) : null,
            batch_id: batchId,
            description_es: action.description_es,
          });
          updates[change.field] = change.newValue;
        }
        await supabase.from('characters').update(updates).eq('id', action.target.characterId);
        return { actionId: action.id, success: true };
      }

      case 'remove_character_from_scene': {
        if (!action.target.sceneId || !action.target.characterId) throw new Error('Missing IDs');
        const { data: scene } = await supabase.from('scenes').select('character_ids').eq('id', action.target.sceneId).single();
        const oldIds = (scene?.character_ids || []) as string[];
        const newIds = oldIds.filter((id: string) => id !== action.target.characterId);
        await supabase.from('change_history').insert({
          project_id: projectId,
          user_id: userId,
          entity_type: 'scene',
          entity_id: action.target.sceneId,
          action: 'remove_character_from_scene',
          field_name: 'character_ids',
          old_value: JSON.stringify(oldIds),
          new_value: JSON.stringify(newIds),
          batch_id: batchId,
          description_es: action.description_es,
        });
        await supabase.from('scenes').update({ character_ids: newIds }).eq('id', action.target.sceneId);
        return { actionId: action.id, success: true };
      }

      case 'add_character_to_scene': {
        if (!action.target.sceneId || !action.target.characterId) throw new Error('Missing IDs');
        const { data: scene } = await supabase.from('scenes').select('character_ids').eq('id', action.target.sceneId).single();
        const oldIds = (scene?.character_ids || []) as string[];
        const newIds = [...oldIds, action.target.characterId];
        await supabase.from('change_history').insert({
          project_id: projectId,
          user_id: userId,
          entity_type: 'scene',
          entity_id: action.target.sceneId,
          action: 'add_character_to_scene',
          field_name: 'character_ids',
          old_value: JSON.stringify(oldIds),
          new_value: JSON.stringify(newIds),
          batch_id: batchId,
          description_es: action.description_es,
        });
        await supabase.from('scenes').update({ character_ids: newIds }).eq('id', action.target.sceneId);
        return { actionId: action.id, success: true };
      }

      case 'explain':
        // No DB changes, just return success
        return { actionId: action.id, success: true };

      default:
        return { actionId: action.id, success: false, error: `Unknown action: ${action.type}` };
    }
  } catch (err) {
    return {
      actionId: action.id,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Execute a full action plan (all actions in sequence).
 */
export async function executeActionPlan(
  actions: AiAction[],
  projectId: string,
  userId: string,
): Promise<{ results: AiActionResult[]; batchId: string }> {
  const batchId = crypto.randomUUID();
  const sorted = [...actions].sort((a, b) => a.priority - b.priority);
  const results: AiActionResult[] = [];

  for (const action of sorted) {
    const result = await executeAction(action, projectId, userId, batchId);
    results.push(result);
  }

  // Recalc project stats
  const supabase = createClient();
  try { await supabase.rpc('recalc_project_stats', { p_id: projectId }); } catch { /* ignore */ }

  return { results, batchId };
}

/**
 * Undo a batch of actions by restoring old values from change_history.
 */
export async function undoBatch(batchId: string): Promise<{ success: boolean; restoredCount: number }> {
  const supabase = createClient();

  const { data: entries } = await supabase
    .from('change_history')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false }); // Reverse order for undo

  if (!entries || entries.length === 0) return { success: false, restoredCount: 0 };

  let restored = 0;
  for (const entry of entries) {
    try {
      if (entry.action === 'delete_scene' && entry.old_value) {
        // Restore deleted scene
        const sceneData = JSON.parse(entry.old_value);
        delete sceneData.id; // Let DB generate new ID or use the original
        await supabase.from('scenes').insert({ ...sceneData, id: entry.entity_id });
        restored++;
      } else if (entry.action === 'create_scene') {
        // Delete created scene
        await supabase.from('scenes').delete().eq('id', entry.entity_id);
        restored++;
      } else if (entry.field_name && entry.field_name !== '_full_record') {
        // Restore old field value
        const table = entry.entity_type === 'character' ? 'characters' : 'scenes';
        const restoreValue = entry.old_value;
        await supabase.from(table).update({ [entry.field_name]: restoreValue }).eq('id', entry.entity_id);
        restored++;
      }
    } catch {
      // Continue restoring other entries
    }
  }

  // Mark batch as undone
  await supabase.from('change_history').delete().eq('batch_id', batchId);

  // Recalc stats
  const projectId = entries[0]?.project_id;
  if (projectId) {
    try { await supabase.rpc('recalc_project_stats', { p_id: projectId }); } catch { /* ignore */ }
  }

  return { success: true, restoredCount: restored };
}
