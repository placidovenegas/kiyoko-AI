# Arquitectura IA ↔ BD ↔ UI (V6) — visión end-to-end

## Objetivo V6
Convertir el sistema en una cadena coherente:
1. **El backend** arma contexto desde Supabase.
2. **El modelo** responde con un texto + bloques (contrato).
3. **El frontend** parsea bloques y renderiza UI interactiva.
4. **Si hay cambios** → el usuario confirma → el frontend ejecuta el plan contra Supabase.
5. **Todo queda versionado** y logueado para trazabilidad.

## Mapa de componentes (código real)

### 1) Contexto + system prompt
- `src/app/api/ai/chat/route.ts`
  - determina `level` (`dashboard|project|video|scene`)
  - carga desde Supabase: `projects`, `project_ai_agents`, `characters`, `backgrounds`, `videos`, `scenes` (con relaciones) según nivel
  - arma `systemPrompt` con `buildSystemPrompt` en `src/lib/ai/system-prompt.ts`

### 2) Router de modelos / proveedores
- `src/app/api/ai/chat/route.ts` usando `src/lib/ai/sdk-router.ts`
  - resuelve providers con fallback chain `TEXT_CHAIN`
  - prioriza proveedores con visión si hay imágenes
  - aplica cooldowns y logging en `ai_usage_logs`

### 3) Contrato de salida: bloques
- Backend pide al modelo incluir bloques como:
  - `[ACTION_PLAN]...[/ACTION_PLAN]` (si crea/edita/elimina)
  - `[OPTIONS]`, `[SELECT]`, `[SCENE_PLAN]`, `[SUGGESTIONS]`, etc.

### 4) Parser único de bloques
- `src/lib/ai/parse-ai-message.ts`
  - convierte el texto en `ParsedMessage` con `blocks` tipados
  - extrae `actionPlan` como parte del contenido

### 5) Render + confirmación
- `src/components/chat/ChatMessage.tsx`
  - renderiza bloques interactivos
  - muestra `ActionPlanCard` cuando hay un plan
  - al confirmar llama `onExecute(message.id, actionPlan)`

### 6) Ejecución del plan contra Supabase
- `src/hooks/useKiyokoChat.ts`
  - `executeActionPlan(messageId, plan)`
  - detecta si el plan es nuevo o legacy:
    - nuevo: `action` tiene `table` + `data`
    - legacy: usa executor existente `executeActionPlan(actions, ...)`
  - guarda resultados/estado en el mensaje
  - persiste la conversación en `ai_conversations`

### 7) Versionado y seguridad operativa
- `src/lib/ai/action-executor.ts`
  - para legacy: usa `entity_snapshots` para undo (y snapshots antes de mutar)
  - para prompts: versiona `scene_prompts` con `is_current` + `version`
  - para media: (en rutas específicas) usa `scene_media` con `media_type` + `version`

## Principio V6 (anti-regresión)
- Cuando el sistema implemente “nuevo contrato”:
  - el frontend debe parsear/renderizar **solo** desde el parser nuevo,
  - y la ejecución debe seguir la versión correcta del executor.

