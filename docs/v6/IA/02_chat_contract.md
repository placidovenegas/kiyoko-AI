# Contrato real de IA (V6) — bloques + ejecución

Este documento especifica el **formato que realmente usa el sistema hoy** para que:
- el backend genere salidas con bloques,
- el frontend pueda parsearlas/renderizarlas,
- y el executor pueda aplicar acciones (cuando corresponde).

## 1) Sistema de prompts (backend)
Fuente: `src/lib/ai/system-prompt.ts`

El backend construye un prompt por nivel (`dashboard|project|video|scene`) y define la regla absoluta:
- **cuando el usuario pide crear/modificar/eliminar** → la IA debe incluir un bloque `[ACTION_PLAN]` con JSON válido
- **nunca ejecutar cambios sin confirmación**

Ejemplo de formato (conceptual):
- `[ACTION_PLAN]{ "description": "...", "requires_confirmation": true, "actions": [ ... ] }[/ACTION_PLAN]`

Cada `action` en el plan debe tener:
- `type`: string tipo de acción
- `table`: nombre exacto de tabla Supabase (o `null` para acciones no-DB como `navigate/explain`)
- `entity_id`: solo para `update/delete` (UUID real)
- `data`: campos a insertar/actualizar

## 2) Bloques que el frontend entiende (parser)
Fuente: `src/lib/ai/parse-ai-message.ts`

El parser detecta bloques con tags:
- `[ACTION_PLAN]...[/ACTION_PLAN]` (JSON)
- `[PREVIEW[:subtipo]]...[/PREVIEW]` (JSON)
- `[SELECT[:type]]...` (opcional subtype)
- `[OPTIONS]...[/OPTIONS]` (normalmente JSON o fallback)
- `[DIFF[:subtipo]]...[/DIFF]`
- `[PROMPT_PREVIEW[:subtipo]]...[/PROMPT_PREVIEW]`
- `[SCENE_PLAN]...[/SCENE_PLAN]`
- `[PROJECT_SUMMARY]...[/PROJECT_SUMMARY]`
- `[CREATE[:type]]...[/CREATE]`
- `[SCENE_DETAIL]...[/SCENE_DETAIL]`
- `[RESOURCE_LIST]...[/RESOURCE_LIST]`
- `[VIDEO_SUMMARY]...[/VIDEO_SUMMARY]`
- `[SUGGESTIONS]...[/SUGGESTIONS]`

Notas de compatibilidad:
- existe fallback legacy para ` ```json { "type": "action_plan" } ``` `
- existe fallback para `[SUGERENCIAS]...[/SUGERENCIAS]`
- existe manejo de tags sin cierre (por heurística)

## 3) Render en UI
Fuente: `src/components/chat/ChatMessage.tsx`

El componente:
1. Usa el parser para bloques del mensaje del asistente.
2. Extrae `actionPlan` (usa el campo `message.actionPlan` si existe; si no, intenta parsear legacy con `parseActionPlan()`).
3. Renderiza bloques por tipo:
   - `[SCENE_PLAN]` → `ScenePlanTimeline`
   - `[OPTIONS]` → `OptionsBlock`
   - `[SELECT]` → `EntitySelector`
   - `[DIFF]` → `DiffView`
   - `[PROMPT_PREVIEW]` → `PromptPreviewCard`
   - `[PROJECT_SUMMARY]` → `ProjectSummaryCard`
   - `[CREATE:character|background|video]` → cards de creación
   - `[SCENE_DETAIL]` → `SceneDetailCard`
   - `[RESOURCE_LIST]` → `ResourceListCard`
   - `[VIDEO_SUMMARY]` → `VideoSummaryCard`

## 4) Duplicación que hay que corregir (residuo funcional)
En `ChatMessage.tsx` aún existe:
- `parseActionPlan()` (legacy, basado en ```json ... ```)
- `extractTextContent()` con regex para remover bloques

Mientras que el parser nuevo (`parseAiMessage`) ya cubre bloques `[ACTION_PLAN]` y `[SUGGESTIONS]`.

Implicación:
- hoy conviven “dos contratos/parsers” en el mismo renderer.
- la consecuencia típica es inconsistencia si el backend empieza a emitir solo el formato nuevo.

## 5) Recomendación V6 (regla de oro)
- El contrato “oficial” para V6 debe usar únicamente los tags del parser (`parseAiMessage`).
- El legacy parsing debe quedar:
  - como fallback temporal,
  - con banderas de deprecación,
  - y con eliminación final cuando no sea necesario.

