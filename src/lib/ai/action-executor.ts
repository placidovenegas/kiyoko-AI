import { createClient } from '@/lib/supabase/client';
import type { AiAction, AiActionResult, Action, ActionPlan, ActionResult } from '@/types/ai-actions';
import type { Json } from '@/types/database.types';
import { generateShortId } from '@/lib/utils/nanoid';

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

/**
 * Record an entity snapshot BEFORE a mutation (v4 replaces change_history).
 */
async function recordSnapshot(
  supabase: ReturnType<typeof createClient>,
  params: {
    entityType: string;
    entityId: string;
    actionType: string;
    snapshotData: Record<string, unknown> | null;
    userId: string;
    projectId: string | null;
    conversationId?: string;
  },
) {
  if (!params.snapshotData) return;
  if (!params.projectId) return; // cannot snapshot without a project_id (e.g. create_project actions)
  await supabase.from('entity_snapshots').insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    action_type: params.actionType,
    snapshot_data: params.snapshotData as unknown as Json,
    user_id: params.userId,
    project_id: params.projectId,
    conversation_id: params.conversationId ?? null,
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
  conversationId?: string,
): Promise<AiActionResult> {
  const supabase = createClient();
  const changes = safeChanges(action);

  try {
    switch (action.type) {
      // ---- Scene updates (non-prompt fields) ----
      case 'update_scene': {
        const sceneId = action.target.sceneId;
        if (!sceneId) return { actionId: action.id, success: false, error: 'No sceneId in target' };

        const updates = buildUpdates(action);
        if (Object.keys(updates).length === 0) {
          return { actionId: action.id, success: false, error: 'No changes to apply' };
        }

        // Snapshot before
        const { data: before } = await supabase.from('scenes').select('*').eq('id', sceneId).single();
        if (before) {
          await recordSnapshot(supabase, {
            entityType: 'scene', entityId: sceneId, actionType: 'update',
            snapshotData: before as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });
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

      // ---- Update prompt (v4: scene_prompts table) ----
      case 'update_prompt': {
        const sceneId = action.target.sceneId;
        if (!sceneId) return { actionId: action.id, success: false, error: 'No sceneId in target' };

        // Process each prompt change
        for (const change of changes) {
          // Determine prompt type from field name
          let promptType: 'image' | 'video' | 'narration' | 'analysis';
          if (change.field === 'prompt_image' || change.field === 'image') {
            promptType = 'image';
          } else if (change.field === 'prompt_video' || change.field === 'video') {
            promptType = 'video';
          } else if (change.field === 'prompt_narration' || change.field === 'narration') {
            promptType = 'narration';
          } else {
            // Default to image if not recognizable
            promptType = 'image';
          }

          const promptText = change.newValue;
          if (typeof promptText !== 'string' || !promptText) continue;

          // Snapshot the current prompt before replacing
          const { data: currentPrompt } = await supabase
            .from('scene_prompts')
            .select('*')
            .eq('scene_id', sceneId)
            .eq('prompt_type', promptType)
            .eq('is_current', true)
            .maybeSingle();

          if (currentPrompt) {
            await recordSnapshot(supabase, {
              entityType: 'scene_prompt', entityId: currentPrompt.id, actionType: 'update',
              snapshotData: currentPrompt as unknown as Record<string, unknown>,
              userId, projectId, conversationId,
            });

            // Mark old prompt as not current
            await supabase
              .from('scene_prompts')
              .update({ is_current: false })
              .eq('id', currentPrompt.id);
          }

          // Get next version number
          const nextVersion = currentPrompt?.version != null ? currentPrompt.version + 1 : 1;

          // Insert new prompt as current
          await supabase.from('scene_prompts').insert({
            scene_id: sceneId,
            prompt_type: promptType,
            prompt_text: promptText,
            is_current: true,
            version: nextVersion,
            status: 'draft',
          });
        }

        return { actionId: action.id, success: true };
      }

      // ---- Delete scene ----
      case 'delete_scene': {
        const sceneId = action.target.sceneId;
        if (!sceneId) return { actionId: action.id, success: false, error: 'No sceneId in target' };

        const { data: scene } = await supabase.from('scenes').select('*').eq('id', sceneId).single();
        if (scene) {
          await recordSnapshot(supabase, {
            entityType: 'scene', entityId: sceneId, actionType: 'delete',
            snapshotData: scene as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }
        await supabase.from('scenes').delete().eq('id', sceneId);
        return { actionId: action.id, success: true };
      }

      // ---- Create scene (v4: also create scene_camera if provided) ----
      case 'create_scene': {
        const fields: Record<string, unknown> = { project_id: projectId };
        const cameraFields: Record<string, unknown> = {};

        const cameraKeys = new Set(['camera_angle', 'camera_movement', 'lighting', 'mood', 'camera_notes']);

        for (const change of changes) {
          if (!change.field) continue;
          if (cameraKeys.has(change.field)) {
            cameraFields[change.field] = change.newValue;
          } else {
            fields[change.field] = change.newValue;
          }
        }
        // Also pull from target if available
        if (action.target.sceneNumber && !fields.scene_number) fields.scene_number = action.target.sceneNumber;

        const { data: newScene } = await supabase.from('scenes').insert(fields as never).select('id').single();
        if (newScene) {
          // Snapshot the created scene
          await recordSnapshot(supabase, {
            entityType: 'scene', entityId: newScene.id, actionType: 'create',
            snapshotData: fields as Record<string, unknown>,
            userId, projectId, conversationId,
          });

          // Create scene_camera record if camera data was provided
          if (Object.keys(cameraFields).length > 0) {
            await supabase.from('scene_camera').insert({
              scene_id: newScene.id,
              ...cameraFields,
            } as never);
          }
        }
        return { actionId: action.id, success: true };
      }

      // ---- Reorder scenes ----
      case 'reorder_scenes': {
        for (const change of changes) {
          const sceneId = change.field;
          if (!sceneId) continue;

          const { data: before } = await supabase.from('scenes').select('*').eq('id', sceneId).single();
          if (before) {
            await recordSnapshot(supabase, {
              entityType: 'scene', entityId: sceneId, actionType: 'reorder',
              snapshotData: before as unknown as Record<string, unknown>,
              userId, projectId, conversationId,
            });
          }
          await supabase.from('scenes').update({ sort_order: change.newValue as number }).eq('id', sceneId);
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

        const { data: before } = await supabase.from('characters').select('*').eq('id', charId).single();
        if (before) {
          await recordSnapshot(supabase, {
            entityType: 'character', entityId: charId, actionType: 'update',
            snapshotData: before as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });
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

        const { data: newChar } = await supabase.from('characters').insert(fields as never).select('id').single();
        if (newChar) {
          await recordSnapshot(supabase, {
            entityType: 'character', entityId: newChar.id, actionType: 'create',
            snapshotData: fields as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }
        return { actionId: action.id, success: true };
      }

      // ---- Delete character ----
      case 'delete_character' as string: {
        const charId = action.target.characterId;
        if (!charId) return { actionId: action.id, success: false, error: 'No characterId in target' };

        const { data: char } = await supabase.from('characters').select('*').eq('id', charId).single();
        if (char) {
          await recordSnapshot(supabase, {
            entityType: 'character', entityId: charId, actionType: 'delete',
            snapshotData: char as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }
        await supabase.from('characters').delete().eq('id', charId);
        return { actionId: action.id, success: true };
      }

      // ---- Remove character from scene (v4: scene_characters junction) ----
      case 'remove_character_from_scene': {
        const sceneId = action.target.sceneId;
        const charId = action.target.characterId;
        if (!sceneId || !charId) {
          return { actionId: action.id, success: false, error: `Missing IDs: sceneId=${sceneId}, characterId=${charId}` };
        }

        // Snapshot the junction row before deleting
        const { data: sceneChar } = await supabase
          .from('scene_characters')
          .select('*')
          .eq('scene_id', sceneId)
          .eq('character_id', charId)
          .maybeSingle();

        if (sceneChar) {
          await recordSnapshot(supabase, {
            entityType: 'scene_character', entityId: sceneChar.id, actionType: 'delete',
            snapshotData: sceneChar as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }

        const { error: rmErr } = await supabase
          .from('scene_characters')
          .delete()
          .eq('scene_id', sceneId)
          .eq('character_id', charId);

        if (rmErr) return { actionId: action.id, success: false, error: rmErr.message };
        return { actionId: action.id, success: true };
      }

      // ---- Add character to scene (v4: scene_characters junction) ----
      case 'add_character_to_scene': {
        const sceneId = action.target.sceneId;
        const charId = action.target.characterId;
        if (!sceneId || !charId) {
          return { actionId: action.id, success: false, error: `Missing IDs: sceneId=${sceneId}, characterId=${charId}` };
        }

        // Check if already exists to avoid duplicates
        const { data: existing } = await supabase
          .from('scene_characters')
          .select('id')
          .eq('scene_id', sceneId)
          .eq('character_id', charId)
          .maybeSingle();

        if (existing) {
          return { actionId: action.id, success: true }; // Already linked
        }

        const { error: addErr } = await supabase
          .from('scene_characters')
          .insert({
            scene_id: sceneId,
            character_id: charId,
          });

        if (addErr) return { actionId: action.id, success: false, error: addErr.message };

        // Snapshot the new junction row
        const { data: newRow } = await supabase
          .from('scene_characters')
          .select('*')
          .eq('scene_id', sceneId)
          .eq('character_id', charId)
          .maybeSingle();

        if (newRow) {
          await recordSnapshot(supabase, {
            entityType: 'scene_character', entityId: newRow.id, actionType: 'create',
            snapshotData: newRow as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }

        return { actionId: action.id, success: true };
      }

      // ---- Update camera (v4: scene_camera table) ----
      case 'update_camera': {
        const sceneId = action.target.sceneId;
        if (!sceneId) return { actionId: action.id, success: false, error: 'No sceneId in target' };

        const updates = buildUpdates(action);
        if (Object.keys(updates).length === 0) {
          return { actionId: action.id, success: false, error: 'No changes to apply' };
        }

        // Snapshot the current camera record
        const { data: before } = await supabase
          .from('scene_camera')
          .select('*')
          .eq('scene_id', sceneId)
          .maybeSingle();

        if (before) {
          await recordSnapshot(supabase, {
            entityType: 'scene_camera', entityId: before.id, actionType: 'update',
            snapshotData: before as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });

          const { error: updateErr } = await supabase
            .from('scene_camera')
            .update(updates)
            .eq('scene_id', sceneId);

          if (updateErr) return { actionId: action.id, success: false, error: `DB error: ${updateErr.message}` };
        } else {
          // No camera record exists yet — create one
          const { error: insertErr } = await supabase
            .from('scene_camera')
            .insert({ scene_id: sceneId, ...updates } as never);

          if (insertErr) return { actionId: action.id, success: false, error: `DB error: ${insertErr.message}` };
        }

        return { actionId: action.id, success: true };
      }

      // ---- Assign background to scene (v4: scene_backgrounds junction) ----
      case 'assign_background': {
        const sceneId = action.target.sceneId;
        const bgId = action.target.backgroundId;
        if (!sceneId || !bgId) {
          return { actionId: action.id, success: false, error: `Missing IDs: sceneId=${sceneId}, backgroundId=${bgId}` };
        }

        // Build extra fields from changes (angle, time_of_day)
        const extraFields = buildUpdates(action);

        // Check if assignment already exists
        const { data: existing } = await supabase
          .from('scene_backgrounds')
          .select('*')
          .eq('scene_id', sceneId)
          .eq('background_id', bgId)
          .maybeSingle();

        if (existing) {
          // Snapshot and update
          await recordSnapshot(supabase, {
            entityType: 'scene_background', entityId: existing.id, actionType: 'update',
            snapshotData: existing as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });

          const { error: updateErr } = await supabase
            .from('scene_backgrounds')
            .update(extraFields)
            .eq('id', existing.id);

          if (updateErr) return { actionId: action.id, success: false, error: updateErr.message };
        } else {
          // Insert new assignment
          const { data: newRow, error: insertErr } = await supabase
            .from('scene_backgrounds')
            .insert({
              scene_id: sceneId,
              background_id: bgId,
              ...extraFields,
            } as never)
            .select('*')
            .single();

          if (insertErr) return { actionId: action.id, success: false, error: insertErr.message };

          if (newRow) {
            await recordSnapshot(supabase, {
              entityType: 'scene_background', entityId: newRow.id, actionType: 'create',
              snapshotData: newRow as unknown as Record<string, unknown>,
              userId, projectId, conversationId,
            });
          }
        }

        return { actionId: action.id, success: true };
      }

      // ---- Background operations ----
      case 'create_background' as string: {
        const fields: Record<string, unknown> = { project_id: projectId };
        for (const change of changes) {
          if (change.field) fields[change.field] = change.newValue;
        }
        const { data: newBg } = await supabase.from('backgrounds').insert(fields as never).select('id').single();
        if (newBg) {
          await recordSnapshot(supabase, {
            entityType: 'background', entityId: newBg.id, actionType: 'create',
            snapshotData: fields as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }
        return { actionId: action.id, success: true };
      }

      case 'update_background' as string: {
        const bgId = action.target.backgroundId ?? action.target.sceneId; // backward compat
        if (!bgId) return { actionId: action.id, success: false, error: 'No backgroundId in target' };

        const updates = buildUpdates(action);

        const { data: before } = await supabase.from('backgrounds').select('*').eq('id', bgId).single();
        if (before) {
          await recordSnapshot(supabase, {
            entityType: 'background', entityId: bgId, actionType: 'update',
            snapshotData: before as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }

        await supabase.from('backgrounds').update(updates).eq('id', bgId);
        return { actionId: action.id, success: true };
      }

      // ---- Explain / analyze (no-op, respuesta solo de texto) ----
      case 'explain':
      case 'analyze_video' as string:
        return { actionId: action.id, success: true };

      // ---- Navigate (no-op en servidor — el frontend maneja la navegación) ----
      case 'navigate' as string:
        return { actionId: action.id, success: true };

      // ---- Create video ----
      case 'create_video' as string: {
        const fields: Record<string, unknown> = { project_id: projectId };
        for (const change of changes) {
          if (change.field) fields[change.field] = change.newValue;
        }
        // Generar short_id y slug si no vienen en los cambios
        if (!fields.short_id) fields.short_id = generateShortId();
        if (!fields.slug) {
          const title = (fields.title as string) ?? 'video';
          fields.slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50);
        }
        if (!fields.status) fields.status = 'draft';

        const { data: newVideo, error: videoErr } = await supabase
          .from('videos').insert(fields as never).select('id, short_id, slug').single();

        if (videoErr) return { actionId: action.id, success: false, error: videoErr.message };
        if (newVideo) {
          await recordSnapshot(supabase, {
            entityType: 'video', entityId: newVideo.id, actionType: 'create',
            snapshotData: fields as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }
        return { actionId: action.id, success: true };
      }

      // ---- Update video ----
      case 'update_video' as string: {
        const videoId = action.target.sceneId; // reutilizar campo target
        if (!videoId) return { actionId: action.id, success: false, error: 'No videoId in target' };

        const updates = buildUpdates(action);
        const { data: before } = await supabase.from('videos').select('*').eq('id', videoId).single();
        if (before) {
          await recordSnapshot(supabase, {
            entityType: 'video', entityId: videoId, actionType: 'update',
            snapshotData: before as unknown as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }
        await supabase.from('videos').update(updates).eq('id', videoId);
        return { actionId: action.id, success: true };
      }

      // ---- Create project ----
      case 'create_project' as string: {
        const fields: Record<string, unknown> = { owner_id: userId };
        for (const change of changes) {
          if (change.field) fields[change.field] = change.newValue;
        }
        if (!fields.status) fields.status = 'draft';
        if (!fields.short_id) fields.short_id = generateShortId();

        const { data: newProj, error: projErr } = await supabase
          .from('projects').insert(fields as never).select('id, short_id').single();

        if (projErr) return { actionId: action.id, success: false, error: projErr.message };
        if (newProj) {
          await recordSnapshot(supabase, {
            entityType: 'project', entityId: newProj.id, actionType: 'create',
            snapshotData: fields as Record<string, unknown>,
            userId, projectId, conversationId,
          });
        }
        return { actionId: action.id, success: true };
      }

      // ---- Create prompt (nuevo formato) ----
      case 'create_prompt' as string: {
        const sceneId = action.target.sceneId;
        if (!sceneId) return { actionId: action.id, success: false, error: 'No sceneId in target' };

        for (const change of changes) {
          const promptText = String(change.newValue ?? '');
          if (!promptText) continue;

          let promptType: string = 'image';
          if (change.field === 'prompt_video' || change.field === 'video') promptType = 'video';
          else if (change.field === 'prompt_narration' || change.field === 'narration') promptType = 'narration';

          const { data: current } = await supabase.from('scene_prompts')
            .select('id, version').eq('scene_id', sceneId).eq('prompt_type', promptType as never).eq('is_current', true).maybeSingle();

          if (current) {
            await supabase.from('scene_prompts').update({ is_current: false }).eq('id', current.id);
          }

          await supabase.from('scene_prompts').insert({
            scene_id: sceneId,
            prompt_type: promptType,
            prompt_text: promptText,
            is_current: true,
            version: (current?.version ?? 0) + 1,
            status: 'draft',
          } as never);
        }
        return { actionId: action.id, success: true };
      }

      // ---- Aliases para compatibilidad ----
      case 'assign_character' as string:
        action.type = 'add_character_to_scene';
        return executeAction(action, projectId, userId, batchId, conversationId);

      case 'remove_character' as string:
        action.type = 'remove_character_from_scene';
        return executeAction(action, projectId, userId, batchId, conversationId);

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
// New-format executor — handles Action[] with placeholder resolution
// ---------------------------------------------------------------------------

/**
 * Replace placeholder strings in an action's data object.
 * Supports: __NEW_SCENE_N_ID__, __NEW_VIDEO_SHORT_ID__, __NEW_CHARACTER_ID__,
 *           __CURRENT_USER_ID__
 */
function resolvePlaceholders(
  data: Record<string, unknown>,
  idMap: Map<string, string>,
  userId: string,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      let v = value;
      if (v === '__CURRENT_USER_ID__') {
        v = userId;
      } else {
        // Replace any __NEW_*_ID__ placeholders from the map
        for (const [placeholder, id] of idMap.entries()) {
          v = v.replace(placeholder, id);
        }
      }
      resolved[key] = v;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      resolved[key] = resolvePlaceholders(value as Record<string, unknown>, idMap, userId);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

/**
 * Execute a single new-format Action against Supabase.
 * Returns the ActionResult and optionally the generated ID for INSERT operations.
 */
async function executeNewAction(
  action: Action,
  supabase: ReturnType<typeof createClient>,
  projectId: string | null,
  userId: string,
  batchId: string,
  conversationId?: string,
): Promise<{ result: ActionResult; generatedId?: string; generatedShortId?: string }> {
  const { type, table, entity_id, data } = action;

  // No-op actions
  if (type === 'navigate' || type === 'explain' || type === 'analyze_video') {
    return { result: { type, success: true } };
  }

  if (!table) {
    return { result: { type, success: true } };
  }

  try {
    if (type.startsWith('create_') || type === 'batch_create_scenes') {
      // INSERT
      const insertData = { ...data };

      // Auto-generate short_id for videos and projects
      if ((type === 'create_video' || type === 'create_project') && !insertData.short_id) {
        insertData.short_id = generateShortId();
      }

      // ---- Normalize project fields to match Supabase enums ----
      if (type === 'create_project') {
        // slug: required unique field — generate from title
        if (!insertData.slug) {
          const raw = (insertData.title as string) ?? 'proyecto';
          const base = raw
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 50);
          insertData.slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
        }
        // style: map human labels → project_style enum
        const STYLE_MAP: Record<string, string> = {
          animado: 'flat_2d', animated: 'flat_2d', anime: 'anime',
          realista: 'realistic', realistic: 'realistic',
          acuarela: 'watercolor', watercolor: 'watercolor',
          plano: 'flat_2d', flat: 'flat_2d', flat_2d: 'flat_2d',
          cyberpunk: 'cyberpunk', futurista: 'cyberpunk',
          pixar: 'pixar', estilizado: 'custom', retro: 'custom',
          minimalista: 'flat_2d', custom: 'custom',
        };
        if (insertData.style) {
          insertData.style = STYLE_MAP[(insertData.style as string).toLowerCase()] ?? 'custom';
        }
        // target_platform: map human labels → target_platform enum
        const PLATFORM_MAP: Record<string, string> = {
          instagram: 'instagram_reels', 'instagram reels': 'instagram_reels',
          instagram_reels: 'instagram_reels',
          youtube: 'youtube', 'youtube shorts': 'youtube',
          tiktok: 'tiktok', 'tik tok': 'tiktok',
          tv: 'tv_commercial', streaming: 'tv_commercial',
          'tv/streaming': 'tv_commercial', 'tv / streaming': 'tv_commercial',
          tv_commercial: 'tv_commercial',
          web: 'web', website: 'web',
          linkedin: 'web', twitter: 'web', 'twitter / x': 'web',
          custom: 'custom',
        };
        // support both `platform` (AI may use this) and `target_platform`
        const rawPlatform = (insertData.platform ?? insertData.target_platform) as string | undefined;
        if (rawPlatform) {
          insertData.target_platform = PLATFORM_MAP[rawPlatform.toLowerCase()] ?? 'custom';
        }
        delete insertData.platform; // not a DB column

        // duration / target_duration_seconds — AI may send any of these names
        const rawDuration = insertData.duration ?? insertData.target_duration ?? insertData.duration_seconds;
        if (rawDuration !== undefined) {
          // Parse strings like "30 segundos", "3 minutos", "3 minutes" → seconds
          let seconds: number;
          if (typeof rawDuration === 'number') {
            seconds = rawDuration;
          } else {
            const str = String(rawDuration).toLowerCase();
            const num = parseFloat(str);
            seconds = str.includes('min') ? num * 60 : num;
          }
          if (!isNaN(seconds) && seconds > 0) {
            insertData.target_duration_seconds = Math.round(seconds);
          }
        }
        delete insertData.duration;
        delete insertData.target_duration;
        delete insertData.duration_seconds;

        // Strip any remaining unknown fields that are not valid project columns
        const VALID_PROJECT_COLUMNS = new Set([
          'owner_id', 'title', 'slug', 'short_id', 'description', 'client_name',
          'style', 'status', 'target_duration_seconds', 'target_platform',
          'color_palette', 'ai_brief', 'tags', 'thumbnail_url', 'cover_image_url',
        ]);
        for (const key of Object.keys(insertData)) {
          if (!VALID_PROJECT_COLUMNS.has(key)) {
            delete insertData[key];
          }
        }
      }

      if (type === 'create_video' && !insertData.slug) {
        const title = (insertData.title as string) ?? 'video';
        insertData.slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50);
      }

      // ---- Auto-fill required fields for characters ----
      if (type === 'create_character') {
        if (!insertData.project_id && projectId) insertData.project_id = projectId;
        // Generate initials from name if missing
        if (!insertData.initials && insertData.name) {
          const words = (insertData.name as string).trim().split(/\s+/);
          insertData.initials = words.map((w) => w[0]?.toUpperCase()).join('').slice(0, 3);
        }
      }

      // ---- Auto-fill required fields for backgrounds ----
      if (type === 'create_background') {
        if (!insertData.project_id && projectId) insertData.project_id = projectId;
        // Generate code from name if missing (REQUIRED field)
        if (!insertData.code && insertData.name) {
          insertData.code = (insertData.name as string)
            .toUpperCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^A-Z0-9_]/g, '')
            .slice(0, 20);
        }
      }

      // ---- Auto-fill project_id for scenes ----
      if (type === 'create_scene') {
        if (!insertData.project_id && projectId) insertData.project_id = projectId;
      }

      const { data: inserted, error } = await supabase
        .from(table as never)
        .insert(insertData as never)
        .select('id, short_id')
        .single();

      if (error) return { result: { type, success: false, error: error.message } };

      const row = inserted as { id?: string; short_id?: string } | null;
      if (row?.id) {
        await recordSnapshot(supabase, {
          entityType: table, entityId: row.id, actionType: 'create',
          snapshotData: insertData,
          userId, projectId, conversationId,
        });
      }

      return {
        result: { type, success: true, entity_id: row?.id },
        generatedId: row?.id,
        generatedShortId: row?.short_id,
      };
    }

    if (type.startsWith('update_') || type === 'assign_character' || type === 'assign_background' || type === 'remove_character') {
      if (type === 'assign_character') {
        const { error } = await supabase.from('scene_characters').insert(data as never);
        if (error) return { result: { type, success: false, error: error.message } };
        return { result: { type, success: true } };
      }
      if (type === 'assign_background') {
        // Upsert: delete existing, then insert
        if (data.scene_id) {
          await supabase.from('scene_backgrounds').delete().eq('scene_id', data.scene_id as string);
        }
        const { error } = await supabase.from('scene_backgrounds').insert(data as never);
        if (error) return { result: { type, success: false, error: error.message } };
        return { result: { type, success: true } };
      }
      if (type === 'remove_character') {
        const { error } = await supabase.from('scene_characters').delete()
          .eq('scene_id', data.scene_id as string)
          .eq('character_id', data.character_id as string);
        if (error) return { result: { type, success: false, error: error.message } };
        return { result: { type, success: true } };
      }
      if (type === 'update_camera') {
        // UPSERT by scene_id
        if (entity_id) {
          await supabase.from(table as never).update(data as never).eq('id', entity_id);
        } else {
          await supabase.from(table as never).upsert(data as never);
        }
        return { result: { type, success: true } };
      }
      if (type === 'update_prompt') {
        // Version prompt: set is_current=false on old, insert new
        const sceneId = data.scene_id as string;
        const promptType = data.prompt_type as string;
        if (sceneId && promptType) {
          const { data: current } = await supabase.from('scene_prompts')
            .select('id, version').eq('scene_id', sceneId).eq('prompt_type', promptType as never).eq('is_current', true).maybeSingle();
          if (current) {
            await supabase.from('scene_prompts').update({ is_current: false }).eq('id', current.id);
          }
          const newData = { ...data, is_current: true, version: ((current?.version as number) ?? 0) + 1, status: 'draft' };
          const { error } = await supabase.from('scene_prompts').insert(newData as never);
          if (error) return { result: { type, success: false, error: error.message } };
        }
        return { result: { type, success: true } };
      }

      // Generic UPDATE
      if (!entity_id) return { result: { type, success: false, error: 'entity_id required for update' } };

      const { data: before } = await supabase.from(table as never).select('*').eq('id', entity_id).single();
      if (before) {
        await recordSnapshot(supabase, {
          entityType: table, entityId: entity_id, actionType: 'update',
          snapshotData: before as Record<string, unknown>,
          userId, projectId, conversationId,
        });
      }
      const { error } = await supabase.from(table as never).update(data as never).eq('id', entity_id);
      if (error) return { result: { type, success: false, error: error.message } };
      return { result: { type, success: true, entity_id } };
    }

    if (type === 'delete_scene' || type.startsWith('delete_')) {
      if (!entity_id) return { result: { type, success: false, error: 'entity_id required for delete' } };

      const { data: before } = await supabase.from(table as never).select('*').eq('id', entity_id).single();
      if (before) {
        await recordSnapshot(supabase, {
          entityType: table, entityId: entity_id, actionType: 'delete',
          snapshotData: before as Record<string, unknown>,
          userId, projectId, conversationId,
        });
      }
      const { error } = await supabase.from(table as never).delete().eq('id', entity_id);
      if (error) return { result: { type, success: false, error: error.message } };
      return { result: { type, success: true, entity_id } };
    }

    if (type === 'create_prompt') {
      const sceneId = data.scene_id as string;
      const promptType = data.prompt_type as string;
      if (!sceneId) return { result: { type, success: false, error: 'scene_id required' } };

      const { data: current } = await supabase.from('scene_prompts')
        .select('id, version').eq('scene_id', sceneId).eq('prompt_type', promptType as never).eq('is_current', true).maybeSingle();
      if (current) {
        await supabase.from('scene_prompts').update({ is_current: false }).eq('id', current.id);
      }
      const newData = { ...data, is_current: true, version: ((current?.version as number) ?? 0) + 1, status: 'draft' };
      const { error } = await supabase.from('scene_prompts').insert(newData as never);
      if (error) return { result: { type, success: false, error: error.message } };
      return { result: { type, success: true } };
    }

    return { result: { type, success: true } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { result: { type, success: false, error: msg } };
  }
}

/**
 * Execute a new-format ActionPlan with placeholder resolution for chained actions.
 * Placeholders like __NEW_SCENE_1_ID__ are replaced with generated UUIDs as actions execute.
 */
export async function executeNewActionPlan(
  plan: ActionPlan,
  projectId: string | null,
  userId: string,
  conversationId?: string,
): Promise<{ results: ActionResult[]; batchId: string; successCount: number; failedCount: number }> {
  const supabase = createClient();
  const batchId = crypto.randomUUID();
  const results: ActionResult[] = [];

  // ID map: placeholder string → actual generated UUID
  const idMap = new Map<string, string>();
  let sceneCreateCount = 0;
  let videoCreateCount = 0;
  let characterCreateCount = 0;

  for (const action of plan.actions) {
    // Resolve placeholders in data before executing
    const resolvedData = action.data
      ? resolvePlaceholders(action.data, idMap, userId)
      : {};
    const resolvedAction: Action = { ...action, data: resolvedData };

    const { result, generatedId, generatedShortId } = await executeNewAction(
      resolvedAction, supabase, projectId, userId, batchId, conversationId,
    );
    results.push(result);

    // Register generated IDs for subsequent placeholder resolution
    if (generatedId) {
      if (action.type === 'create_scene') {
        sceneCreateCount++;
        idMap.set(`__NEW_SCENE_${sceneCreateCount}_ID__`, generatedId);
        // Also register by _placeholder if provided
        if (action.data._placeholder) idMap.set(String(action.data._placeholder), generatedId);
      } else if (action.type === 'create_video') {
        videoCreateCount++;
        idMap.set('__NEW_VIDEO_ID__', generatedId);
        if (generatedShortId) idMap.set('__NEW_VIDEO_SHORT_ID__', generatedShortId);
      } else if (action.type === 'create_character') {
        characterCreateCount++;
        idMap.set('__NEW_CHARACTER_ID__', generatedId);
      } else if (action.type === 'create_project') {
        idMap.set('__NEW_PROJECT_ID__', generatedId);
        if (generatedShortId) idMap.set('__NEW_PROJECT_SHORT_ID__', generatedShortId);
      }
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.length - successCount;
  return { results, batchId, successCount, failedCount };
}

// ---------------------------------------------------------------------------
// Execute full action plan
// ---------------------------------------------------------------------------

export async function executeActionPlan(
  actions: AiAction[],
  projectId: string,
  userId: string,
  conversationId?: string,
): Promise<{ results: AiActionResult[]; batchId: string }> {
  const batchId = crypto.randomUUID();
  const sorted = [...actions].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  const results: AiActionResult[] = [];

  for (const action of sorted) {
    const result = await executeAction(action, projectId, userId, batchId, conversationId);
    results.push(result);
  }

  // Recalc project stats
  const supabase = createClient();
  try { await (supabase.rpc as unknown as (fn: string, params: Record<string, string>) => Promise<unknown>)('recalc_project_stats', { p_id: projectId }); } catch { /* ignore */ }

  return { results, batchId };
}

// ---------------------------------------------------------------------------
// Undo a batch (v4: uses entity_snapshots)
// ---------------------------------------------------------------------------

export async function undoBatch(batchId: string): Promise<{ success: boolean; restoredCount: number }> {
  const supabase = createClient();

  // In v4, undo uses entity_snapshots. For backward compatibility, we look up
  // snapshots that share the same batch window. Since snapshots don't store
  // batch_id directly, this function is a placeholder for the new undo system
  // which should be driven by conversation_id-based snapshot restoration.
  // Keeping signature for API compatibility.

  // Try legacy change_history first for old data
  const { data: entries } = await supabase
    .from('entity_snapshots')
    .select('*')
    .eq('restored', false)
    .order('created_at', { ascending: false });

  if (!entries || entries.length === 0) return { success: false, restoredCount: 0 };

  // Note: Full undo logic needs to be re-implemented with conversation-based
  // snapshot restoration. This is a stub that marks snapshots as restored.
  let restored = 0;
  for (const entry of entries) {
    try {
      const table = entry.entity_type === 'character' ? 'characters'
        : entry.entity_type === 'background' ? 'backgrounds'
        : entry.entity_type === 'scene' ? 'scenes'
        : null;

      if (!table) continue;

      if (entry.action_type === 'delete' && entry.snapshot_data) {
        const data = entry.snapshot_data as Record<string, unknown>;
        const id = data.id as string;
        delete data.id;
        await supabase.from(table).insert({ ...data, id } as never);
        restored++;
      } else if (entry.action_type === 'create') {
        await supabase.from(table).delete().eq('id', entry.entity_id);
        restored++;
      } else if (entry.action_type === 'update' && entry.snapshot_data) {
        const data = entry.snapshot_data as Record<string, unknown>;
        const id = data.id as string;
        delete data.id;
        await supabase.from(table).update(data as never).eq('id', id ?? entry.entity_id);
        restored++;
      }

      // Mark snapshot as restored
      await supabase.from('entity_snapshots').update({
        restored: true,
        restored_at: new Date().toISOString(),
      }).eq('id', entry.id);
    } catch {
      // Continue restoring other entries
    }
  }

  return { success: true, restoredCount: restored };
}
