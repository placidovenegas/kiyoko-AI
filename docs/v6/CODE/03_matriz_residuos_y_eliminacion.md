# Matriz V6 — residuos, riesgo y plan de eliminación sin dejar residuos

Este documento aterriza el “eliminar residuos” en decisiones concretas.

## Ley general (no romper nada)
1. No eliminar mientras haya:
   - imports activos,
   - rutas montando componentes,
   - o lógica usada por endpoints.
2. Eliminar en dos pasos:
   - Paso A: desactivar y marcar `@deprecated`,
   - Paso B: eliminar solo cuando esté comprobado por:
     - build,
     - ejecución manual del chat (crear/editar escenas),
     - revisión de páginas donde se renderiza el panel global.

## Matriz de residuos (según análisis actual del repo)

### R1 — Duplicación de parsers en UI
- Residuo:
  - `src/lib/ai/parse-ai-message.ts` (nuevo)
  - `src/components/chat/ChatMessage.tsx` mantiene parsing legacy (regex + `parseActionPlan`)
- Riesgo: medio (puede introducir inconsistencias o “texto fantasma”)
- Recomendación:
  - hacer del parser nuevo el único camino,
  - dejar el legacy solo como fallback temporal.
- Dependencias:
  - asegurar que el backend emite siempre tags del parser.

### R2 — “Chat new” no montado
- Residuo:
  - `src/components/ai-chat/*` (existe pero no parece integrado en el panel global montado)
- Riesgo: bajo si se deja como prototipo; alto si se elimina sin confirmar.
- Recomendación:
  - marcar como `@deprecated` y documentar “no usado por defecto”.
- Dependencias:
  - confirmar si existe ruta que lo monte.

### R3 — Stores duplicados/no referenciados
- Residuo:
  - `src/stores/useAiChatStore.ts` (identificado como potencialmente no usado)
- Riesgo: bajo si realmente no hay imports.
- Recomendación:
  - buscar referencias en repo antes de eliminar.

### R4 — Providers/router duplicado
- Residuo:
  - `src/lib/ai/sdk-router.ts` vs `src/lib/ai/router.ts`
- Riesgo: medio (fallback/cooldown/logging no consistentes)
- Recomendación:
  - migrar `generate-image` a `sdk-router.ts`
  - luego revisar si `router.ts` queda sin uso y puede eliminarse.

### R5 — Acciones legacy vs nuevo formato
- Residuo:
  - `types/ai-actions.ts` incluye `AiActionPlan` (legacy) y `ActionPlan` (nuevo)
  - UI/Store convierten entre formatos en compatibilidad
- Riesgo: medio-alto (si la conversión no coincide con el executor esperado)
- Recomendación:
  - definir el contrato “oficial V6” (bloques del parser nuevo),
  - luego desactivar el legacy gradualmente.
- Dependencias:
  - confirmar que `[ACTION_PLAN]` nuevo cubre todos los casos actuales.

### R6 — Tablas “docs antiguas” inexistentes
- Residuo:
  - `video_cuts`, `video_cut_scenes` (no existen en DB actual)
- Riesgo: crítico si el sistema intenta usarlas (rompe planes o prompts).
- Recomendación:
  - V6 debe ignorarlas o proponer migración explícita (nunca suponer).

### R7 — Undo nuevo (stub)
- Residuo:
  - `undoBatch()` está documentado como stub/placeholder para el nuevo sistema.
- Riesgo: alto si se confía para deshacer cambios de alto impacto.
- Recomendación:
  - asegurar que el “undo usado” sea consistente con snapshots reales.

