# Residuos (V6) — qué está en desuso y qué hay que actualizar/eliminar

Este documento enumera **código y documentación que hoy no está alineado** con el “camino V6” (contrato de IA con bloques + schema real + chat con persistencia controlada).

## 1) UI y chat: duplicación de parsers
- `src/lib/ai/parse-ai-message.ts`
  - parser “nuevo” de bloques: `[ACTION_PLAN]`, `[OPTIONS]`, `[SCENE_PLAN]`, etc.
- `src/components/chat/ChatMessage.tsx`
  - aún contiene parsing/heurísticas legacy:
    - `parseActionPlan()` (basado en ```json ... ```)
    - `extractTextContent()` (regex para remover bloques)

Riesgo:
- si el backend emite SOLO el formato nuevo, el parser legacy puede quedar innecesariamente activo o introducir inconsistencias.

Objetivo:
- V6 debe usar un único camino de parse/render.

## 2) “Chat new” no montado
- Directorio `src/components/ai-chat/*`
  - `ChatSidebar.tsx` existe, pero no aparece referenciado en imports/rutas usadas por el panel global.

Objetivo:
- o bien migrar el panel global hacia ese chat,
- o bien marcarlo como `@deprecated` y eliminarlo tras completar migración.

## 3) Stores no usados
- `src/stores/useAiChatStore.ts`
  - no es referenciado en la ruta principal del chat montado globalmente.

## 4) Lógica AI no usada
- `src/lib/ai/ai-engine.ts`
- `src/lib/ai/tools.ts`

Objetivo:
- confirmar si están conectados a alguna ruta/endpoints.
- si no se usan, deprecarlas y luego eliminarlas.

## 5) Providers: router duplicado
- `src/lib/ai/sdk-router.ts` (nuevo, usado por `chat` y rutas nuevas)
- `src/lib/ai/router.ts` (antiguo, usado por `generate-image`)

Objetivo:
- eliminar discrepancias de fallback/cooldown/logging unificando endpoints y migrando `generate-image`.

## 6) Tablas “docs antiguas”
- `video_cuts` y `video_cut_scenes`
  - no existen en la BD actual.

Objetivo:
- V6 no debe generar acciones ni UI que asuma esas tablas.

## 7) Persistencia de chat: comportamiento ahora corregido
- ya se ajustó para que el chat **no restaure automáticamente** la última conversación al entrar a la página.

El siguiente paso es documentar (y luego revisar):
- cómo interactúa esto con el historial,
- y qué conviene persistir (ids vs mensajes vs contexto).

