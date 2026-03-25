# Historial de chat y undo (V6) — especificación operativa

Este documento especifica el ciclo completo:
- creación de conversación,
- persistencia de mensajes,
- y cuándo/como se aplica undo.

## 1) Persistencia del chat (BD)
Fuente: `src/hooks/useKiyokoChat.ts`

Cuando se ejecuta un chat:
- el store acumula `messages` en memoria,
- y al final de ejecución guarda la conversación en:
  - `ai_conversations.messages` (Json),
  - actualiza `message_count` y `title`.

### Reglas V6
1. No “auto-restaurar” al montar una página (esto es un comportamiento de UX, no de BD).
2. Sí permitir:
   - cargar historial (lista de conversaciones),
   - cargar una conversación concreta cuando el usuario la elige.

## 2) Undo (seguridad operativa)
Fuente: `src/lib/ai/action-executor.ts`

En el executor legacy:
- antes de mutar una entidad, se inserta un registro en `entity_snapshots`.
- el undo/restore usa esos snapshots para reconstruir estado.

### Estado actual del undo
- el undo nuevo está marcado como “stub/placeholder” (según el comentario en el executor).

### Reglas V6 para que undo sea perfecto
1. Snapshot ANTES de cualquier `update/delete/insert` relevante.
2. Versionado preferido para canon:
   - prompts → `scene_prompts` (`is_current`, `version`)
   - media → `scene_media` (`is_current`, `version`)
   - narración → `video_narrations` (`is_current`, `version`)
3. El undo debe restaurar una estrategia consistente:
   - por conversación/batch o por entidad (definir alcance).

