# Integridad operativa (undo) — `entity_snapshots` y disciplina de versionado

## 1) Por qué existe `entity_snapshots`
Fuente: `src/lib/ai/action-executor.ts`
- Antes de mutar entidades (legacy executor), se guarda una fila en `entity_snapshots`.
- Esto permite construir “undo” (o al menos restauración basada en snapshot).

## 1.1) Columnas clave de `entity_snapshots` (BD)
Según `src/types/database.types.ts`, esta tabla guarda:
- `entity_type`, `entity_id`
- `action_type`
- `project_id`, `user_id`
- `conversation_id` (nullable)
- `snapshot_data` (Json)
- `restored` / `restored_at` / `restored_by`

## 2) Estado actual del undo
En el executor:
- `undoBatch(batchId)` está implementado como “stub”/parcial:
  - intenta restaurar usando snapshots,
  - pero el comentario indica que el undo completo “debería ser driven por conversation_id-based snapshot restoration”.

## 3) Reglas V6 para que undo sea confiable
1. Cada mutación DB debe registrar snapshot ANTES de mutar.
2. Un snapshot debe ser suficiente para reconstruir el estado “canon” de la entidad.
3. El sistema debe definir claramente el “alcance” del undo:
   - por batch,
   - por conversación,
   - o por entidad.
4. Para prompts/media/narración:
   - preferir versionado (crear nueva versión como `is_current=true` y marcar la anterior como `is_current=false`)
   - en vez de mutar en sitio (para evitar inconsistencias).

