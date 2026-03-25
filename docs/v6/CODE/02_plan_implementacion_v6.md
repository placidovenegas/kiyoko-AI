# Plan V6 — implementación y limpieza sin romper el sistema

## Objetivo final
1. Quitar residuos (código no usado/duplicado).
2. Unificar contrato IA (bloques) + parser único.
3. Alinear 100% con schema real de Supabase.
4. Mejorar UX del chat: persistencia controlada.
5. Dejar el sistema “perfecto” de forma incremental y segura.

## Fase 0 — Validación (antes de tocar eliminación)
1. Confirmar que el chat funciona con:
   - mensajes con imágenes,
   - planes con `[ACTION_PLAN]`,
   - bloques `[OPTIONS]`, `[SELECT]`, `[SCENE_PLAN]`.
2. Confirmar que el executor aplica correctamente acciones soportadas.
3. Confirmar que “historical chat restore” se comporta como se desea.

## Fase 1 — Quitar duplicación en la capa UI
1. En `src/components/chat/ChatMessage.tsx`:
   - priorizar `parseAiMessage()` como “source of truth”,
   - deprecando `parseActionPlan()` legacy y `extractTextContent()` donde sea posible.
2. Asegurar que la UI no depende de formatos legacy si backend ya emite nuevo contrato.

## Fase 2 — Unificar providers/router
1. Migrar `generate-image` para que use `sdk-router.ts`.
2. Unificar:
   - cooldown,
   - fallback chain,
   - logging a `ai_usage_logs`.

## Fase 3 — Migrar al nuevo formato de ActionPlan (si aplica)
1. Integrar `executeNewActionPlan()` en endpoint `execute-actions`.
2. Asegurar que el contrato del modelo emite:
   - `table` correcto,
   - `data` completo,
   - tipos consistentes.
3. Desarrollar casos faltantes del executor para:
   - narrative/timeline,
   - clips,
   - video_narrations,
   - video_analysis.

## Fase 4 — Eliminación segura (residuos)
Regla: eliminar en dos pasos.
1. Paso A: marcar y desactivar
   - añadir `@deprecated` en código,
   - bloquear imports (no ejecutar) y mantener fallback por 1-2 sprints.
2. Paso B: eliminar
   - solo cuando no haya referencias,
   - y tras pasar pruebas de build + flujo manual del chat.

## Qué se propone desactivar primero (seguro)
- `src/components/ai-chat/*` si realmente no se usa.
- `src/stores/useAiChatStore.ts` si no tiene referencias.
- `src/lib/ai/ai-engine.ts` y `src/lib/ai/tools.ts` si no se invocan.
- `src/lib/ai/router.ts` después de migrar generate-image.
- parsing legacy dentro de `ChatMessage.tsx` al consolidar en parser único.

