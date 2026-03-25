# Kiyoko AI — Mejoras de organización y consolidación (v9)
Fecha: 2026-03-25

## Objetivo
1. Reducir duplicación de componentes (UI) y lógica repetida (parsers/streaming).
2. Unificar la arquitectura de IA para que:
   - el backend emita un formato consistente,
   - el frontend lo consuma con un único contrato,
   - la selección de proveedor/modelo sea centralizada.
3. Proponer “actualizar todo” como un plan accionable (prioridades + checklist).

## Resumen ejecutivo (lo más importante)
- Hay **dos sistemas de chat/IA en paralelo**:
  - Chat “old/v4” (panel global): `src/components/chat/*` + store/hook `src/hooks/useKiyokoChat.ts` + `src/components/kiyoko/KiyokoPanel.tsx` (es el que realmente se monta en el layout).
  - Chat “new” (directorio `src/components/ai-chat/*` con `@ai-sdk/react`): **parece no estar referenciado** en imports/rutas.
- El backend de chat (`src/app/api/ai/chat/route.ts`) está construido alrededor del **formato nuevo de `ACTION_PLAN` con bloques** (`[ACTION_PLAN]{...}[/ACTION_PLAN]`) tal como indica `src/lib/ai/system-prompt.ts`.
- En el frontend “old”, el **render/ejecución** todavía mezcla:
  - `parseAiMessage()` (nuevo formato con bloques),
  - parsers/convertidores “legacy” duplicados dentro de `src/hooks/useKiyokoChat.ts` y `src/components/chat/ChatMessage.tsx`.
  - Esto provoca cast/compatibilidad insegura (y puede romper UI como “total_scenes_affected” y logs/resultados por acción).

## Hallazgos de duplicación (componentes y lógica)

### 1) Duplicación real de “chat UI” (dos implementaciones completas)
- “Old chat”:
  - Panel montado globalmente: `src/components/kiyoko/KiyokoPanel.tsx` -> `src/components/chat/KiyokoChat.tsx`
  - Mensajería/renderer: `src/components/chat/ChatMessage.tsx`, input: `src/components/chat/ChatInput.tsx`
  - Store/flujo: `src/hooks/useKiyokoChat.ts`
- “New chat” (aparentemente no usado):
  - `src/components/ai-chat/ChatSidebar.tsx`, `ConversationList.tsx`, `ChatMessage.tsx`, `ActionPlanView.tsx`

Recomendación:
- Decidir una sola implementación como “source of truth”.
- Si el “new chat” va a ser el futuro, migrar el panel global (`KiyokoPanel`) a esa versión y eliminar/depreciar `components/chat/*` + `useKiyokoChat`.
- Si se mantiene “old/v4”, entonces eliminar `components/ai-chat/*` o guardarlo como prototipo con etiqueta `@deprecated` y documentación clara.

### 2) Duplicación de parsers de mensajes/bloques
Existe un parser central:
- `src/lib/ai/parse-ai-message.ts`:
  - extrae bloques tipo `[ACTION_PLAN]`, `[OPTIONS]`, `[SCENE_PLAN]`, etc
  - extrae `suggestions`

Pero también se repite lógica en:
- `src/components/chat/ChatMessage.tsx`:
  - `parseActionPlan(content)` (legacy)
  - `extractTextContent(content)` y parse de “workflow actions”, “audio url”, “choices”
- `src/hooks/useKiyokoChat.ts`:
  - `parseActionPlan(content)` (legacy)
  - `parseSuggestions(content)` (legacy)
  - además hace compatibilidad/convert de `parsed.actionPlan` a `legacyPlan`

Recomendación:
- Unificar todo sobre `parseAiMessage()` y eliminar parsers legacy duplicados.
- Crear una capa de “adaptación” explícita si necesitas compatibilidad legacy, por ejemplo:
  - `src/lib/ai/adapters/action-plan-adapter.ts`
  - `src/lib/ai/adapters/action-result-adapter.ts`

### 3) Duplicación/fragmentación de “ActionPlan” y “ActionResult”
Tipos:
- Nuevo formato (KIYOKO_SYSTEM v5):
  - `src/types/ai-actions.ts` => `ActionPlan`, `ActionResult` (nuevos)
  - `ActionPlan` => `{ description, requires_confirmation, actions: Action[] }`
- Legacy:
  - `AiActionPlan`, `AiActionResult` con `summary_es`, `total_scenes_affected`, `warnings`, etc.

Problema típico:
- `parseAiMessage()` devuelve `ActionPlanBlock` (nuevo formato).
- El frontend “old” lo convierte con casts hacia `AiActionPlan` (legacy) para que UI y flujo sigan funcionando.
- Resultado: UI puede mostrar campos incompletos (ej. `total_scenes_affected` fijo en 0) y estados por acción (success/fail) podrían no mapearse bien.

Recomendación:
- Opción A (recomendada): migrar UI de `ActionPlanCard` para renderizar el **view-model nuevo**, y ejecutar siempre el executor nuevo cuando sea `ActionPlan` nuevo.
- Opción B: mantener UI legacy pero construir un adapter fiel que:
  - compute `total_scenes_affected`,
  - traduzca campos necesarios para “result indicators”.

### 4) Duplicación de “stream parsing” en el cliente
Hay al menos dos formas de leer streaming:
- `src/hooks/useKiyokoChat.ts`: parsea el protocolo Vercel con líneas `0:` / `3:` + fallback legacy `data: ...`
- `src/hooks/useAiAssist.ts`: vuelve a implementar una lógica propia para acumular `0:`.

Recomendación:
- Extraer helper reutilizable:
  - `src/lib/ai/streams/parse-vercel-ai-data-stream.ts`
  - y usarlo en ambos hooks.

## Cómo se usa la IA hoy (arquitectura y flujo)

### 1) Backend (rutas) — qué hace cada bloque
Las rutas principales están en `src/app/api/ai/*`.
Patrones comunes:
- Autenticación vía Supabase (`createClient()` / `supabase.auth.getUser()`).
- Obtención de modelo:
  - a veces `getUserModel()` (`src/lib/ai/get-user-model.ts`)
  - a veces `getAllAvailableModels()`/`sdk-router`
  - a veces fallback custom
- Logging de uso:
  - `logUsage` en `src/lib/ai/sdk-router.ts` o variantes
- Generación:
  - `generateText` con `Output.object(...)` para esquemas
  - o texto plano con limpieza/parsing manual (ej. narración)
- Persistencia a DB / Storage cuando aplica.

Ejemplos relevantes:
- Chat “director IA”:
  - `src/app/api/ai/chat/route.ts`
  - Construye system prompt por nivel de contexto y agente:
    - detecta intención (`detectIntent`)
    - selecciona agente (`selectAgent`)
  - Carga contexto desde DB (projects/videos/scenes/characters/backgrounds).
  - Maneja multimodal:
    - detecta `[Imagenes adjuntas: ...]`
    - transforma a content array para modelos vision
  - Streaming:
    - usa `streamText` (AI SDK) y emite Data Stream Protocol de Vercel
    - añade headers: `X-AI-Provider`, `X-Active-Agent`, `X-Context-Level`
  - Importante para el contrato del frontend: el contenido que llega debe incluir bloques `[ACTION_PLAN]...[/ACTION_PLAN]`.

- Generación estructurada:
  - `src/app/api/ai/generate-project/route.ts`: `generateText` + `Output.object({ schema: projectOutputSchema })`
  - `src/app/api/ai/analyze-video/route.ts`: `generateText` + `Output.object({ schema: analysisOutputSchema })`

- Generación multimodal (imagen):
  - `src/app/api/ai/generate-image/route.ts`: usa provider de `src/lib/ai/router.ts` (no el sdk-router)
  - Persistencia: descarga imagen, sube a Supabase Storage, inserta en `scene_media`

- Ejecución de planes:
  - `src/app/api/ai/execute-actions/route.ts`
  - Usa `executeActionPlan` / `executeNewActionPlan` desde:
    - `src/lib/ai/action-executor.ts`

### 2) Proveedor/modelo — hay más de un “router”
Hay sistemas distintos:
1. `src/lib/ai/sdk-router.ts` (new): fábrica de modelos + chain + cooldown + helpers
2. `src/lib/ai/router.ts` (old): instancias provider + cadenas `TEXT_PROVIDER_CHAIN`/`IMAGE_PROVIDER_CHAIN`
3. `src/lib/ai/ai-engine.ts`: wrapper de `generateText/streamText` con fallback automático (parece no estar usado)

Recomendación:
- Elegir 1 router como API interna única.
- Eliminar el router viejo o convertirlo en “shim” sobre el nuevo.
- Eliminar `ai-engine.ts` si no se usa (o integrarlo de verdad).

### 3) Contrato actual: system prompt vs parser/renderer
`src/lib/ai/system-prompt.ts` documenta que el AI debe incluir:
- `[ACTION_PLAN] { "description", "requires_confirmation", "actions":[ { type, table, data, entity_id? } ] } [/ACTION_PLAN]`

Pero el frontend “old” todavía:
- usa parsers legacy legacy en varios sitios,
- y/o convierte con casts hacia el formato legacy.

Recomendación:
- Mantener un único contrato:
  - backend emite SIEMPRE blocks new-format,
  - frontend consume SIEMPRE esos blocks,
  - adapters (si se requieren) deben ser explícitos y testeados.

## Plan “Actualizar todo” (prioridades y checklist)

### Prioridad P0 (bloquea bugs y reduce riesgo)
1. Unificar el contrato de ActionPlan:
   - Crear adapter explícito entre `ActionPlanBlock`/`Action[]` (nuevo) y el view-model que usa la UI.
   - Objetivo: dejar de depender de casts implícitos.
   - Archivos objetivo:
     - `src/lib/ai/parse-ai-message.ts`
     - `src/hooks/useKiyokoChat.ts`
     - `src/components/chat/ChatMessage.tsx`
     - `src/components/chat/ActionPlanCard.tsx` (y/o re-render hacia nuevo formato)
2. Eliminar parsers legacy duplicados:
   - Quitar `parseActionPlan()` y `parseSuggestions()` duplicados del hook y componente, usando `parseAiMessage()` como única fuente.

### Prioridad P1 (organización y reducción de duplicación)
3. Extraer helper de streaming:
   - Implementar un parser único del protocolo Vercel y reutilizarlo en:
     - `useKiyokoChat.ts`
     - `useAiAssist.ts`
4. Consolidar “chat UI” en un solo camino:
   - Decidir si se mantiene “old chat” o se migra a `src/components/ai-chat/*`.
   - Si mantienes old: deprecar el directorio `components/ai-chat/*`.
   - Si migra a new: mover `KiyokoPanel`/layout a usar `ChatSidebar` (y adaptar el contrato de message rendering).
5. Consolidar ActionPlan UI:
   - Hoy existen `ActionPlanCard.tsx` (old) y `ActionPlanView.tsx` (new-ish pero legacy types).
   - Elegir uno (y mover el otro a adapter/shared o eliminarlo).

### Prioridad P2 (router/providers y arquitectura)
6. Unificar router de providers:
   - Reemplazar uso de `src/lib/ai/router.ts` (old) en rutas que generen imagen, si aplica, con `src/lib/ai/sdk-router.ts`.
   - Mantener una sola cadena/cooldown para todo.
7. Integrar o eliminar `src/lib/ai/ai-engine.ts`:
   - Si no se usa, eliminar.
   - Si se usa, reescribir rutas para usarlo (y reducir repetición).

### Prioridad P3 (calidad: tests + seguridad + mantenimiento)
8. Tests de parsers:
   - unit tests para `parseAiMessage()` con ejemplos reales:
     - `[ACTION_PLAN]...[/ACTION_PLAN]`
     - `[OPTIONS]...[/OPTIONS]`
     - casos “uncosed” si tu prompt se equivoca
9. Tests de adaptadores de ActionPlan:
   - asegurar que `total_scenes_affected` y mapping de results funcionan.
10. Refactor de API rutas:
   - crear helper `requireAuth()` y helper `getProjectOwnership()` para evitar errores inconsistentes.
11. Riesgos de seguridad:
   - asegurar que todas las rutas que persisten datos verifican ownership (`owner_id` o `project_id` + `user_id`).
   - revisar logging: evitar imprimir keys o datos sensibles en consola.

## Archivos clave a revisar/actualizar (mapa rápido)
### Chat UI / parsing
- `src/hooks/useKiyokoChat.ts`
- `src/components/chat/ChatMessage.tsx`
- `src/components/chat/KiyokoChat.tsx`
- `src/components/chat/ChatInput.tsx`
- `src/components/chat/ActionPlanCard.tsx`
- `src/lib/ai/parse-ai-message.ts`

### Backend chat / contrato
- `src/app/api/ai/chat/route.ts`
- `src/lib/ai/system-prompt.ts`
- `src/lib/ai/agents/*` (prompts de agentes)

### Providers / model routing
- `src/lib/ai/sdk-router.ts`
- `src/lib/ai/router.ts`
- `src/lib/ai/providers/*`

### Execution
- `src/app/api/ai/execute-actions/route.ts`
- `src/lib/ai/action-executor.ts`

## Criterios de éxito (Definition of Done)
- Solo existe **un** camino de chat activo (old o new) y el otro está claramente deprecado o eliminado.
- El frontend:
  - interpreta el `ACTION_PLAN` con un único contrato,
  - no usa casts inseguros para transformar tipos,
  - renderiza correctamente:
    - summary,
    - conteos (ej. escenas afectadas),
    - estado por acción cuando existan resultados.
- Los parsers de bloques viven en un solo lugar (`parseAiMessage`).
- Streaming se lee con un solo helper.
- Providers utilizan un solo router.

## Nota final (siguiente paso recomendado)
Si quieres, en el próximo mensaje dime cuál estrategia prefieres:
1. “Mantener old/v4 y consolidar” (menos migración UI; más adapters/parsers).
2. “Migrar a new chat” (`src/components/ai-chat/*`) y eliminar old.

Con esa decisión, puedo convertir este plan en un checklist de implementación por PR (o incluso empezar a aplicar cambios si lo pides).

