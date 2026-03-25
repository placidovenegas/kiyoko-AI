# Sistema de acciones (V6) — confirmación + ejecución + undo

## 1) Origen: `[ACTION_PLAN]`
El backend (chat) pide al modelo emitir un bloque `[ACTION_PLAN]` con JSON válido.
El frontend lo parsea como `actionPlan` (ver `src/lib/ai/parse-ai-message.ts`).

## 2) UI: el plan aparece como “tarjeta”
Fuente: `src/components/chat/ChatMessage.tsx`
- Cuando existe `actionPlan`, se renderiza `ActionPlanCard`.
- Al confirmar, se llama al handler del store/hook:
  - `onExecute(message.id, actionPlan)`

## 3) Ejecución: `useKiyokoChat.executeActionPlan`
Fuente: `src/hooks/useKiyokoChat.ts`

Flujo real:
1. Verifica sesión de usuario.
2. Detecta si el plan requiere proyecto:
   - si no hay `projectId` y hay acciones que no sean `create_project` → aborta.
3. Marca el mensaje como `isExecuting=true`.
4. Decide qué executor usar:
   - `isNewFormat = 'table' in plan.actions[0]`
   - si **new**: llama `executeNewActionPlan(plan, projectId, user.id, conversationId?)`
   - si **legacy**: llama `execPlan(plan.actions, projectId ?? '', user.id)`
5. Actualiza la UI con:
   - `executionResults`
   - `executedBatchId` (batchId devuelto por el executor)
6. Guarda conversación en Supabase (`saveConversation(...)` sobre `ai_conversations`).

## 4) Cancelar
`cancelActionPlan(messageId)`:
- elimina el `actionPlan` del mensaje (no revierte mutaciones ya ejecutadas).

## 5) Undo
Fuente: `src/hooks/useKiyokoChat.ts` → `undoBatch(batchId)`
- llama `undoActionBatch(batchId)` en `src/lib/ai/action-executor.ts`.
- actualmente el undo está marcado como “stub” para el nuevo sistema y basado en snapshots en legacy.

## 6) Ajuste necesario para “perfecto”
Hay una mezcla temporal de tipos:
- `executeNewActionPlan()` devuelve `ActionResult[]`
- la UI y tipos legacy esperan `AiActionResult[]`

V6 debería:
- unificar los resultados (o mapear explícitamente new → legacy),
- y luego desactivar el legacy si ya no se necesita.

## 7) Gap crítico: ActionTypes declarados pero no aplicados (legacy)
Aunque `src/types/ai-actions.ts` enumera muchos `ActionType`, el executor legacy (`executeAction`/`executeActionPlan` del mismo archivo) solo implementa una parte en el `switch(action.type)`.

Implicación:
- si el modelo genera un `plan` legacy con un `type` no implementado,
  - el usuario verá error “Tipo de accion no soportado”,
  - y la mejora “V6 perfecta” requiere:
    1) restringir el output del modelo (contrato oficial V6),
    2) o implementar los casos faltantes en el executor,
    3) o migrar completamente a `ActionPlan` nuevo donde el executor sea genérico por `table`.

Referencia:
- `DB/02_map_action_types.md`

