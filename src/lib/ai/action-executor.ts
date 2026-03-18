import { createClient } from '@/lib/supabase/client';
import type { AiAction, AiActionResult } from '@/types/ai-actions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeChanges(action: AiAction): AiAction['changes'] {
  return Array.isArray(action.changes) ? action.changes : [];
}

function buildUpdates(action: AiAction): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  for (const change of safeChanges(action)) {
    if (change.field) updates[change.field] = change.newValue;
  }
  return updates;
}

async function recordHistory(
  supabase: ReturnType<typeof createClient>,
  params: {
    projectId: string;
    userId: string;
    entityType: string;
    entityId: string;
    action: string;
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    batchId: string;
    descriptionEs: string;
  },
) {
  await supabase.from('change_history').insert({
    project_id: params.projectId,
    user_id: params.userId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    field_name: params.fieldName,
    old_value: params.oldValue,
    new_value: params.newValue,
    batch_id: params.batchId,
    description_es: params.descriptionEs,
  });
}

// ---------------------------------------------------------------------------
// Execute a single action
// ---------------------------------------------------------------------------

export async function executeAction(
  action: AiAction,
  projectId: string,
  userId: string,
  batchId: string,
): Promise<AiActionResult> {
  const supabase = createClient();
  const changes = safeChanges(action);

  try {
    switch (action.type) {
      // ---- Scene updates ----
      case 'update_scene':
      case 'update_prompt': {
        const sceneId = action.target.sceneId;
        if (!sceneId) return { actionId: action.id, success: false, error: 'No sceneId in target' };

        const updates = buildUpdates(action);
        if (Object.keys(updates).length === 0) {
          return { actionId: action.id, success: false, error: 'No changes to apply' };
        }

        const { data: updated, error: updateErr } = await supabase
          .from('scenes')
          .update(updates)
          .eq('id', sceneId)
          .select('id')
          .maybeSingle();

        if (updateErr) {
          return { actionId: action.id, success: false, error: `DB error: ${updateErr.message}` };
        }
        if (!updated) {
          return { actionId: action.id, success: false, error: `Escena ${sceneId} no encontrada o sin permisos` };
        }
        return { actionId: action.id, success: true };
      }

      // ---- Delete scene ----
      case 'delete_scene': {
        const sceneId = action.target.sceneId;
        if (!sceneId) return { actionId: action.id, success: false, error: 'No sceneId in target' };

        const { data: scene } = await supabase.from('scenes').select('*').eq('id', sceneId).single();
        await recordHistory(supabase, {
          projectId, userId, entityType: 'scene', entityId: sceneId,
          action: 'delete_scene', fieldName: '_full_record',
          oldValue: scene ? JSON.stringify(scene) : null, newValue: null,
          batchId, descriptionEs: action.description_es,
        });
        await supabase.from('scenes').delete().eq('id', sceneId);
        return { actionId: action.id, success: true };
      }

      // ---- Create scene ----
      case 'create_scene': {
        const fields: Record<string, unknown> = { project_id: projectId };
        for (const change of changes) {
          if (change.field) fields[change.field] = change.newValue;
        }
        // Also pull from target if available
        if (action.target.sceneNumber && !fields.scene_number) fields.scene_number = action.target.sceneNumber;

        const { data: newScene } = await supabase.from('scenes').insert(fields).select('id').single();
        if (newScene) {
          await recordHistory(supabase, {
            projectId, userId, entityType: 'scene', entityId: newScene.id,
            action: 'create_scene', fieldName: '_full_record',
            oldValue: null, newValue: JSON.stringify(fields),
            batchId, descriptionEs: action.description_es,
          });
        }
        return { actionId: action.id, success: true };
      }

      // ---- Reorder scenes ----
      case 'reorder_scenes': {
        for (const change of changes) {
          const sceneId = change.field;
          if (!sceneId) continue;
          await recordHistory(supabase, {
            projectId, userId, entityType: 'scene', entityId: sceneId,
            action: 'reorder_scenes', fieldName: 'sort_order',
            oldValue: String(change.oldValue), newValue: String(change.newValue),
            batchId, descriptionEs: action.description_es,
          });
          await supabase.from('scenes').update({ sort_order: change.newValue }).eq('id', sceneId);
        }
        return { actionId: action.id, success: true };
      }

      // ---- Character updates ----
      case 'update_character': {
        const charId = action.target.characterId;
        if (!charId) return { actionId: action.id, success: false, error: 'No characterId in target' };

        const updates = buildUpdates(action);
        if (Object.keys(updates).length === 0) {
          return { actionId: action.id, success: false, error: 'No changes to apply' };
        }

        const { data: updated, error: updateErr } = await supabase
          .from('characters')
          .update(updates)
          .eq('id', charId)
          .select('id')
          .maybeSingle();

        if (updateErr) {
          return { actionId: action.id, success: false, error: `DB error: ${updateErr.message}` };
        }
        if (!updated) {
          return { actionId: action.id, success: false, error: `Personaje ${charId} no encontrado o sin permisos` };
        }
        return { actionId: action.id, success: true };
      }

      // ---- Create character ----
      case 'create_character' as string: {
        const fields: Record<string, unknown> = { project_id: projectId };
        for (const change of changes) {
          if (change.field) fields[change.field] = change.newValue;
        }
        if (action.target.characterName && !fields.name) fields.name = action.target.characterName;

        const { data: newChar } = await supabase.from('characters').insert(fields).select('id').single();
        if (newChar) {
          await recordHistory(supabase, {
            projectId, userId, entityType: 'character', entityId: newChar.id,
            action: 'create_character', fieldName: '_full_record',
            oldValue: null, newValue: JSON.stringify(fields),
            batchId, descriptionEs: action.description_es,
          });
        }
        return { actionId: action.id, success: true };
      }

      // ---- Delete character ----
      case 'delete_character' as string: {
        const charId = action.target.characterId;
        if (!charId) return { actionId: action.id, success: false, error: 'No characterId in target' };

        const { data: char } = await supabase.from('characters').select('*').eq('id', charId).single();
        await recordHistory(supabase, {
          projectId, userId, entityType: 'character', entityId: charId,
          action: 'delete_character', fieldName: '_full_record',
          oldValue: char ? JSON.stringify(char) : null, newValue: null,
          batchId, descriptionEs: action.description_es,
        });
        await supabase.from('characters').delete().eq('id', charId);
        return { actionId: action.id, success: true };
      }

      // ---- Remove character from scene ----
      case 'remove_character_from_scene': {
        const sceneId = action.target.sceneId;
        const charId = action.target.characterId;
        if (!sceneId || !charId) {
          return { actionId: action.id, success: false, error: `Missing IDs: sceneId=${sceneId}, characterId=${charId}` };
        }

        const { data: scene } = await supabase.from('scenes').select('character_ids').eq('id', sceneId).single();
        const oldIds = (scene?.character_ids || []) as string[];
        const newIds = oldIds.filter((id: string) => id !== charId);
        await recordHistory(supabase, {
          projectId, userId, entityType: 'scene', entityId: sceneId,
          action: 'remove_character_from_scene', fieldName: 'character_ids',
          oldValue: JSON.stringify(oldIds), newValue: JSON.stringify(newIds),
          batchId, descriptionEs: action.description_es,
        });
        const { error: rmErr } = await supabase.from('scenes').update({ character_ids: newIds }).eq('id', sceneId);
        if (rmErr) return { actionId: action.id, success: false, error: rmErr.message };
        return { actionId: action.id, success: true };
      }

      // ---- Add character to scene ----
      case 'add_character_to_scene': {
        const sceneId = action.target.sceneId;
        const charId = action.target.characterId;
        if (!sceneId || !charId) {
          return { actionId: action.id, success: false, error: `Missing IDs: sceneId=${sceneId}, characterId=${charId}` };
        }

        const { data: scene } = await supabase.from('scenes').select('character_ids').eq('id', sceneId).single();
        const oldIds = (scene?.character_ids || []) as string[];
        const newIds = [...oldIds, charId];
        await recordHistory(supabase, {
          projectId, userId, entityType: 'scene', entityId: sceneId,
          action: 'add_character_to_scene', fieldName: 'character_ids',
          oldValue: JSON.stringify(oldIds), newValue: JSON.stringify(newIds),
          batchId, descriptionEs: action.description_es,
        });
        const { error: addErr } = await supabase.from('scenes').update({ character_ids: newIds }).eq('id', sceneId);
        if (addErr) return { actionId: action.id, success: false, error: addErr.message };
        return { actionId: action.id, success: true };
      }

      // ---- Background operations ----
      case 'create_background' as string: {
        const fields: Record<string, unknown> = { project_id: projectId };
        for (const change of changes) {
          if (change.field) fields[change.field] = change.newValue;
        }
        const { data: newBg } = await supabase.from('backgrounds').insert(fields).select('id').single();
        if (newBg) {
          await recordHistory(supabase, {
            projectId, userId, entityType: 'background', entityId: newBg.id,
            action: 'create_background', fieldName: '_full_record',
            oldValue: null, newValue: JSON.stringify(fields),
            batchId, descriptionEs: action.description_es,
          });
        }
        return { actionId: action.id, success: true };
      }

      case 'update_background' as string: {
        const bgId = action.target.sceneId; // reusing sceneId field for bg
        if (!bgId) return { actionId: action.id, success: false, error: 'No backgroundId in target' };

        const updates = buildUpdates(action);
        for (const change of changes) {
          await recordHistory(supabase, {
            projectId, userId, entityType: 'background', entityId: bgId,
            action: 'update_background', fieldName: change.field,
            oldValue: change.oldValue != null ? String(change.oldValue) : null,
            newValue: change.newValue != null ? String(change.newValue) : null,
            batchId, descriptionEs: action.description_es,
          });
        }
        await supabase.from('backgrounds').update(updates).eq('id', bgId);
        return { actionId: action.id, success: true };
      }

      // ---- Explain (no-op) ----
      case 'explain':
        return { actionId: action.id, success: true };

      default:
        return { actionId: action.id, success: false, error: `Tipo de accion no soportado: ${action.type}` };
    }
  } catch (err) {
    return {
      actionId: action.id,
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ---------------------------------------------------------------------------
// Execute full action plan
// ---------------------------------------------------------------------------

export async function executeActionPlan(
  actions: AiAction[],
  projectId: string,
  userId: string,
): Promise<{ results: AiActionResult[]; batchId: string }> {
  const batchId = crypto.randomUUID();
  const sorted = [...actions].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
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

// ---------------------------------------------------------------------------
// Undo a batch
// ---------------------------------------------------------------------------

export async function undoBatch(batchId: string): Promise<{ success: boolean; restoredCount: number }> {
  const supabase = createClient();

  const { data: entries } = await supabase
    .from('change_history')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });

  if (!entries || entries.length === 0) return { success: false, restoredCount: 0 };

  let restored = 0;
  for (const entry of entries) {
    try {
      const table = entry.entity_type === 'character' ? 'characters'
        : entry.entity_type === 'background' ? 'backgrounds'
        : 'scenes';

      if (entry.action.startsWith('delete_') && entry.old_value) {
        const data = JSON.parse(entry.old_value);
        delete data.id;
        await supabase.from(table).insert({ ...data, id: entry.entity_id });
        restored++;
      } else if (entry.action.startsWith('create_')) {
        await supabase.from(table).delete().eq('id', entry.entity_id);
        restored++;
      } else if (entry.field_name && entry.field_name !== '_full_record') {
        // Try to parse JSON values (for arrays like character_ids)
        let restoreValue: unknown = entry.old_value;
        try {
          const parsed = JSON.parse(entry.old_value ?? '');
          if (Array.isArray(parsed)) restoreValue = parsed;
        } catch { /* use string value */ }

        await supabase.from(table).update({ [entry.field_name]: restoreValue }).eq('id', entry.entity_id);
        restored++;
      }
    } catch {
      // Continue restoring other entries
    }
  }

  await supabase.from('change_history').delete().eq('batch_id', batchId);

  const projectId = entries[0]?.project_id;
  if (projectId) {
    try { await supabase.rpc('recalc_project_stats', { p_id: projectId }); } catch { /* ignore */ }
  }

  return { success: true, restoredCount: restored };
}
