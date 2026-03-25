# Mapeo de `ActionType` → tablas (según executor actual)

El objetivo de este documento es que el contrato de IA no “invente” cambios sobre tablas que el executor no sabe aplicar.

## 1) Dos formatos de acción coexistiendo
1. **Legacy** (v4/v?):
   - `AiActionPlan` con `AiAction[]`
   - endpoint: `src/app/api/ai/execute-actions/route.ts`
   - executor: `executeActionPlan(actions: AiAction[])` en `src/lib/ai/action-executor.ts`
2. **Nuevo formato** (v5 según `KIYOKO_SYSTEM`):
   - `ActionPlan` con `Action[]`
   - executor: `executeNewActionPlan(plan: ActionPlan)` y `executeNewAction(...)`
   - (aún requiere integración en endpoints/UI para que realmente se use)

## 2) Qué cubre el executor legacy (`executeActionPlan`)
En `src/lib/ai/action-executor.ts`, el `switch(action.type)` implementa (entre otros):
1. Escenas
   - `create_scene` → `scenes` (+ opcional `scene_camera`)
   - `update_scene` → `scenes`
   - `delete_scene` → `scenes`
   - `reorder_scenes` → `scenes` (update `sort_order`)
2. Cámara
   - `update_camera` → `scene_camera` (update/insert según exista)
3. Prompts de escena
   - `update_prompt` → `scene_prompts` (versiona: set `is_current=false` + insert nueva versión)
   - `create_prompt` → `scene_prompts` (versiona de forma similar)
4. Personajes
   - `create_character`, `update_character`, `delete_character` → `characters`
   - `assign_character`, `remove_character` → `scene_characters`
5. Fondos
   - `create_background`, `update_background` → `backgrounds`
   - `assign_background` → `scene_backgrounds` (usa delete+insert si ya existía)
6. Video / Proyecto
   - `create_video`, `update_video` → `videos`
   - `create_project` → `projects`

## 3) ActionTypes declarados pero no implementados legacy
Según búsquedas en `action-executor.ts`, **no aparecen casos** para:
- `create_narrative_arc` / `update_narrative_arc`
- `create_clip_prompts` / `update_clip_prompts`
- `create_narration` / `update_narration`
- `update_timeline` / `merge_scenes` / `split_scene`

Implicación:
- Si la IA genera acciones legacy con esos tipos, el legacy executor responderá con error “Tipo de accion no soportado”.
- Para que el sistema sea “perfecto”, o bien:
  1. se restringe el output del modelo a los tipos soportados hoy, o
  2. se implementan los casos faltantes en el executor, o
  3. se migra todo el flujo (endpoint + UI + prompts) al nuevo formato `ActionPlan` donde el executor puede ser genérico por `table`.

## 4) Nuevo executor (`executeNewActionPlan`) — cómo debería usarse
El executor nuevo soporta un patrón:
- `Action.type` empieza con `create_`/`update_` → usa insert/update genéricos contra `Action.table`
- `update_prompt` y `update_camera` tienen lógica especial (versionado y upsert)

Condiciones para que funcione:
1. El contrato debe enviar `table` correcto (nombre exacto de tabla Supabase).
2. Los tipos deben corresponder al patrón (`create_`, `update_`, `delete_`).
3. Para placeholders (IDs generados) se apoya en `__NEW_*_ID__` en `action.data`.

## 5) Regla de oro (para el contrato IA)
- Si un `Action.type` no está implementado en el executor legacy, **no debe salir en el plan legacy**.
- Si va a salir, debe salir en el formato nuevo y con `table` + `data` completos para que `executeNewActionPlan` lo procese.

