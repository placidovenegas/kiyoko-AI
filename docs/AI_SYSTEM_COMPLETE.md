# Kiyoko AI — Sistema de IA: Documentación Completa

> Documento generado el 2026-03-23. Cubre toda la arquitectura del sistema de IA, el chat, la ejecución de acciones y la integración con Supabase.

---

## Tabla de Contenidos

1. [Arquitectura General](#1-arquitectura-general)
2. [Sistema de Proveedores](#2-sistema-de-proveedores)
3. [AI Engine](#3-ai-engine)
4. [Provider Registry](#4-provider-registry)
5. [Gestión de Claves de Usuario](#5-gestión-de-claves-de-usuario)
6. [Sistema de Chat](#6-sistema-de-chat)
7. [API Route `/api/ai/chat`](#7-api-route-apiaichat)
8. [Sistema de Ejecución de Acciones](#8-sistema-de-ejecución-de-acciones)
9. [Definición de Tools](#9-definición-de-tools)
10. [System Prompts](#10-system-prompts)
11. [Output Schemas](#11-output-schemas)
12. [API Routes (todas)](#12-api-routes-todas)
13. [Zustand Store — AI](#13-zustand-store--ai)
14. [Custom Hooks de IA](#14-custom-hooks-de-ia)
15. [Chat Context](#15-chat-context)
16. [Componentes de Chat](#16-componentes-de-chat)
17. [Interacción con Base de Datos](#17-interacción-con-base-de-datos)
18. [Manejo de Errores y Fallback](#18-manejo-de-errores-y-fallback)
19. [Imágenes y Archivos](#19-imágenes-y-archivos)
20. [Variables de Entorno](#20-variables-de-entorno)
21. [Flujos Completos](#21-flujos-completos)
22. [Funcionalidades Pendientes / Deuda Técnica](#22-funcionalidades-pendientes--deuda-técnica)

---

## 1. Arquitectura General

### Stack Principal

| Capa | Tecnología |
|------|-----------|
| AI SDK | Vercel `ai` SDK v4+ (streaming SSE) |
| Proveedores | 8 proveedores con fallback automático |
| Base de datos | Supabase + RLS |
| Estado UI | Zustand |
| Estado servidor | TanStack Query |
| Tiempo real | Supabase Realtime |
| Lenguaje | TypeScript estricto (no `any`) |

### Diagrama de Capas

```
┌──────────────────────────────────────────────────────────┐
│           INTERFAZ DE USUARIO (React / Next.js 15)        │
│  KiyokoChat · ChatMessage · ChatInput · ActionPlanCard    │
└────────────────────────┬─────────────────────────────────┘
                         │ hooks
┌────────────────────────▼─────────────────────────────────┐
│                    HOOKS                                  │
│  useKiyokoChat · useAiAgent · useAiSettings              │
│  use-execute-ai-actions · useVideos · useSceneCamera      │
└────────────────────────┬─────────────────────────────────┘
                         │ store
┌────────────────────────▼─────────────────────────────────┐
│                ZUSTAND STORES                             │
│       ai-store.ts  ·  useUIStore                         │
└────────────────────────┬─────────────────────────────────┘
                         │ fetch/SSE
┌────────────────────────▼─────────────────────────────────┐
│              API ROUTES  /api/ai/*  (Server)             │
│  chat · execute-actions · generate-* · analyze-*         │
│  providers/status · improve-prompt · generate-voice      │
└────────────────────────┬─────────────────────────────────┘
                         │ lib
┌────────────────────────▼─────────────────────────────────┐
│                   AI ENGINE                               │
│      src/lib/ai/ai-engine.ts                             │
│      executeAI()  ·  streamAI()                          │
└────────────────────────┬─────────────────────────────────┘
                         │ providers
┌────────────────────────▼─────────────────────────────────┐
│              SDK ROUTER / PROVIDER REGISTRY               │
│  src/lib/ai/sdk-router.ts                                │
│  src/lib/ai/provider-registry.ts                         │
│  getModel() · resolveProviderChain()                     │
└────────────────────────┬─────────────────────────────────┘
                         │ SDKs
┌────────────────────────▼─────────────────────────────────┐
│                   PROVEEDORES                             │
│  Groq · Mistral · Gemini · Cerebras · Grok               │
│  DeepSeek · Claude · OpenAI · ElevenLabs (TTS)           │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Sistema de Proveedores

**Archivo:** `src/lib/ai/sdk-router.ts`

### Tabla de Proveedores

| ID | Proveedor | Modelo por defecto | Gratis | Tokens máx | Velocidad |
|---|---|---|---|---|---|
| `groq` | Groq | `llama-3.3-70b-versatile` | ✅ | 128K | Ultra-rápido |
| `mistral` | Mistral | `mistral-large-latest` | ✅ | 32K | Rápido |
| `gemini` | Google Gemini | `gemini-2.0-flash` | ✅ | 1M | Muy rápido |
| `cerebras` | Cerebras | `llama3.1-8b` | ✅ | 8K | Ultra-rápido |
| `grok` | xAI Grok | `grok-3-fast` | ✅ | — | Rápido |
| `deepseek` | DeepSeek | `deepseek-chat` | ✅ | — | Rápido |
| `claude` | Anthropic | `claude-sonnet-4-20250514` | ❌ | 4K | Buena calidad |
| `openai` | OpenAI | `gpt-4o-mini` | ❌ | 128K | Estable |

### Cadena de Fallback para Chat (texto)

```
Groq → Mistral → Gemini → Cerebras → Grok → DeepSeek → Claude → OpenAI
```

### Funciones Principales

```typescript
// Obtener primer modelo disponible (respeta cooldowns)
getModel(preferredId?: string): Promise<ResolvedModel>

// Todos los modelos disponibles en orden
getAllAvailableModels(): ResolvedModel[]

// Crear modelo con clave del usuario
createModelWithKey(providerId: string, apiKey: string): LanguageModel

// Marcar proveedor en cooldown
markProviderFailed(id: string, errorMessage: string): void

// Estado de todos los proveedores (para /api/ai/providers/status)
getAllProviderStatuses(): ProviderStatus[]
```

### Sistema de Cooldown

- **Error transitorio:** 3 minutos de cooldown
- **Error de auth/facturación:** 24 horas (no se recupera automáticamente)
- **Parseo de `Retry-After`:** si la API devuelve este header, se respeta exactamente
- El cooldown se almacena en memoria del proceso servidor (se resetea con cold start)

---

## 3. AI Engine

**Archivo:** `src/lib/ai/ai-engine.ts`

El AI Engine es la capa central que abstrae la selección de proveedor y expone dos funciones de alto nivel.

### `executeAI(options)` — Generación sin streaming

```typescript
interface AIEngineOptions {
  task?: AITask;                        // 'chat' | 'vision' | 'narration' | 'image_gen'
  mode?: string;                        // 'auto' | providerId específico
  userKeys?: Record<string, string>;    // claves API del usuario descifradas
  system?: string;                      // system prompt
  messages: CoreMessage[];              // array Vercel AI SDK
  temperature?: number;                 // por defecto 0.7
  maxTokens?: number;                   // por defecto según proveedor
}

interface AIEngineResult {
  text: string;
  providerId: string;
  inputTokens: number;
  outputTokens: number;
}
```

- Sin reintentos (`maxRetries: 0`)
- Fallback automático a través de la cadena del proveedor
- Lanza error solo cuando se agotan todos los proveedores

### `streamAI(options)` — Generación con streaming SSE

```typescript
interface StreamAIResult {
  stream: ReadableStream<string>;
  providerId: string;
}
```

- **Verificación del primer chunk** antes de retornar el stream — evita que el cliente reciba un stream que falla silenciosamente
- `ReadableStream` personalizado que bufferiza y reensambla chunks
- Protocolo: Vercel AI Data Stream Protocol

---

## 4. Provider Registry

**Archivo:** `src/lib/ai/provider-registry.ts`

Gestiona las cadenas de fallback por tipo de tarea.

### Cadenas por Tarea

```typescript
const CHAIN_ORDER = {
  chat:      ['groq', 'mistral', 'gemini', 'cerebras', 'deepseek', 'grok', 'claude', 'openai'],
  vision:    ['gemini', 'mistral', 'openai', 'grok', 'claude'],
  narration: ['mistral', 'groq', 'gemini', 'cerebras', 'deepseek', 'claude', 'openai'],
  image_gen: ['gemini', 'grok', 'openai'],
};
```

### Función Principal

```typescript
resolveProviderChain(
  task: AITask,
  mode: string,                         // 'auto' | providerId
  userKeys?: Record<string, string>     // claves descifradas
): ResolvedModel[]
```

**Lógica interna:**
1. Obtiene la cadena de orden para la tarea
2. Para cada proveedor: verifica clave de entorno del servidor
3. Si no existe clave de servidor: busca clave del usuario en `userKeys`
4. Filtra proveedores en cooldown
5. Si `mode` = providerId específico: coloca ese proveedor al frente
6. Devuelve lista ordenada de `ResolvedModel[]`

```typescript
interface ResolvedModel {
  providerId: string;
  model: LanguageModel;     // instancia del Vercel AI SDK
  priority: number;
}
```

---

## 5. Gestión de Claves de Usuario

### `src/lib/ai/get-user-model.ts`

- Carga las claves cifradas del usuario desde la tabla `user_api_keys`
- Las descifra con `crypto.decrypt()`
- Orden de preferencia: clave de usuario → clave de servidor
- Soporta selección de proveedor específico

### `src/lib/ai/load-user-keys.ts`

```typescript
loadUserKeys(userId: string): Promise<Record<string, string>>
// Devuelve: { groq: 'sk-...', openai: 'sk-...' }
```

- Solo carga claves `is_active = true`
- Ignora silenciosamente claves corruptas o inválidas
- Las claves se cifran en la DB con el algoritmo de `src/lib/encryption.ts`

---

## 6. Sistema de Chat

**Archivo principal:** `src/hooks/useKiyokoChat.ts` (~758 líneas)

### Estado Completo

```typescript
interface KiyokoChatState {
  // Mensajes de la conversación actual
  messages: KiyokoMessage[];
  isStreaming: boolean;

  // Conversación activa
  conversationId: string | null;

  // Contexto de proyecto
  projectId: string | null;
  projectSlug: string | null;

  // Historial de conversaciones
  conversations: Conversation[];

  // UI
  isExpanded: boolean;
  suggestions: string[];
  activeProvider: string | null;        // proveedor que respondió

  // Imágenes adjuntas (mensaje en curso)
  attachedImages: ImageAttachment[];

  // Video cuts (contexto de video)
  videoCuts: VideoCut[];
  activeVideoCutId: string | null;
}
```

### Tipo de Mensaje

```typescript
interface KiyokoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];                    // URLs en Supabase Storage
  audioUrl?: string;                    // URL de audio TTS generado
  actionPlan?: AiActionPlan;            // plan de acciones parseado del JSON
  executionResults?: AiActionResult[];  // resultados tras ejecutar
  executedBatchId?: string;             // ID para undo
  isExecuting?: boolean;                // spinner durante ejecución
}
```

### Método: `sendMessage(text, images?)`

Flujo completo:

```
1. Sube imágenes a Supabase Storage (chat-attachments/{projectId}/{uuid}.{ext})
2. Construye mensaje de usuario y lo agrega al estado local
3. Agrega mensaje de placeholder del asistente (vacío, para animación)
4. POST /api/ai/chat con:
   - messages: historial completo + nuevo mensaje
   - projectId, videoId, sceneId (contexto)
   - aiMode (preferencia de proveedor)
   - conversationId (si existe)
   - images: URLs de imágenes subidas
5. Lee el stream SSE (Vercel AI Data Stream Protocol):
   - "0:..." → chunk de texto, acumula en buffer
   - "3:..." → error del servidor
   - "d:..." → metadata final (tokens, finishReason)
   - "f:..." → función/tool call (no usado en chat)
6. Parsea el actionPlan del contenido final (bloque ```json {...}```)
7. Parsea sugerencias del bloque [SUGERENCIAS]...[/SUGERENCIAS]
8. Extrae el proveedor del header X-AI-Provider
9. Actualiza el mensaje del asistente en el estado local
10. Guarda/actualiza la conversación en ai_conversations
11. Si es nueva conversación: genera título automático (primeras palabras)
```

### Método: `executeActionPlan(messageId, plan)`

```
1. Marca el mensaje como isExecuting = true
2. POST /api/ai/execute-actions con { plan, projectId, conversationId }
3. Recibe { batchId, results, successCount, failedCount }
4. Actualiza el mensaje con executionResults y executedBatchId
5. Invalida queries de TanStack Query (escenas, personajes, fondos)
6. Toast de éxito/error
```

### Método: `undoBatch(batchId)`

```
1. POST /api/ai/undo con { batchId }
2. El servidor restaura entity_snapshots en orden inverso
3. Invalida queries
4. Toast de confirmación
```

### Gestión de Conversaciones

```typescript
loadConversations(): Promise<void>           // Carga todas las del usuario
loadConversation(convId: string): Promise<void>  // Restaura mensajes
deleteConversation(id: string): Promise<void>
renameConversation(id: string, title: string): Promise<void>
startNewConversation(): void                 // Limpia estado local
```

### Helpers Internos

```typescript
parseActionPlan(content: string): AiActionPlan | null
// Busca bloque ```json { actions: [...] }``` en el contenido del mensaje

parseSuggestions(content: string): string[]
// Busca [SUGERENCIAS]item1|item2|item3[/SUGERENCIAS]

uploadImage(file: File, projectId: string): Promise<string>
// Sube a storage y devuelve URL pública
```

---

## 7. API Route `/api/ai/chat`

**Archivo:** `src/app/api/ai/chat/route.ts` (~356 líneas)

### Request

```typescript
// POST /api/ai/chat
interface ChatRequestBody {
  messages: ChatMessage[];          // historial completo incluyendo el nuevo mensaje
  projectId?: string;
  videoId?: string;
  sceneId?: string;
  aiMode?: string;                  // 'auto' | providerId
  conversationId?: string;
  images?: string[];                // URLs de Supabase Storage
  preferredProvider?: string;       // alias de aiMode
}
```

### Proceso del Servidor

```
1. Verifica autenticación (JWT Supabase, lanza 401 si no)
2. Si hay projectId: carga contexto completo del proyecto
   ├── tabla projects (metadata, color_palette, ai_brief)
   ├── tabla videos/scenes (con scene_characters)
   ├── tabla characters
   ├── tabla backgrounds
   └── tabla project_ai_agents (prompt personalizado)
3. buildSystemPrompt(context) → string del system prompt
   └── Si hay custom agent prompt → lo usa en su lugar
4. loadUserKeys(userId) → claves descifradas del usuario
5. resolveProviderChain(task='chat', mode, userKeys) → lista de modelos
6. streamText() del Vercel AI SDK con:
   - model: primer modelo de la cadena
   - system: system prompt construido
   - messages: historial completo
   - maxTokens / temperature
   - onError: markProviderFailed() + reintentar con siguiente
7. Emite Vercel AI Data Stream Protocol (SSE)
8. Tras completar: log a ai_usage_logs (userId, providerId, tokens, cost)
9. Devuelve response con header X-AI-Provider: groq|mistral|...
```

### Response

- Streaming SSE con Vercel AI Data Stream Protocol
- Header `X-AI-Provider: {providerId}`
- Header `Content-Type: text/event-stream`

---

## 8. Sistema de Ejecución de Acciones

**Archivo:** `src/lib/ai/action-executor.ts` (~631 líneas)

### Tipos de Acciones

```typescript
type AiActionType =
  | 'update_scene'              // Actualizar campos de una escena
  | 'delete_scene'              // Eliminar escena
  | 'create_scene'              // Crear nueva escena
  | 'reorder_scenes'            // Reordenar sort_order
  | 'update_character'          // Actualizar campos de personaje
  | 'remove_character_from_scene' // Quitar de scene_characters
  | 'add_character_to_scene'    // Añadir a scene_characters
  | 'update_prompt'             // Crear nueva versión en scene_prompts
  | 'update_camera'             // Crear/actualizar scene_camera
  | 'assign_background'         // Asignar fondo a escena
  | 'update_timeline'           // Actualizar narrative_arcs / timeline_entries
  | 'batch_update'              // Múltiples updates en una acción
  | 'merge_scenes'              // Fusionar dos escenas
  | 'split_scene'               // Dividir escena en dos
  | 'explain';                  // Solo explicación, sin mutaciones
```

### Estructura de una Acción

```typescript
interface AiAction {
  id: string;
  type: AiActionType;
  target: {
    sceneId?: string;
    sceneNumber?: string;        // alternativa cuando no hay UUID
    characterId?: string;
    characterName?: string;      // alternativa cuando no hay UUID
    backgroundId?: string;
  };
  description_es: string;        // descripción en español para mostrar al usuario
  changes: AiActionChange[];     // [{field, oldValue, newValue}]
  reason: string;                // por qué la IA propone este cambio
  requiresNewPrompt: boolean;    // si hay que regenerar el prompt visual
  priority: number;              // orden de ejecución (menor = primero)
}
```

### Estructura del Plan de Acciones

```typescript
interface AiActionPlan {
  summary_es: string;                   // resumen en español del plan
  actions: AiAction[];
  total_scenes_affected: number;
  warnings: string[];                   // advertencias antes de ejecutar
}
```

### Resultado de Ejecución

```typescript
interface AiActionResult {
  actionId: string;
  type: AiActionType;
  success: boolean;
  description_es: string;
  error?: string;
  affectedEntityId?: string;
  affectedEntityType?: string;
}
```

### Función Principal: `executeActionPlan`

```typescript
executeActionPlan(
  actions: AiAction[],
  projectId: string,
  userId: string,
  conversationId?: string
): Promise<{ results: AiActionResult[]; batchId: string }>
```

**Proceso:**
1. Genera `batchId` único
2. Ordena acciones por `priority` (ascendente)
3. Para cada acción:
   - **Graba snapshot** en `entity_snapshots` ANTES de mutar
   - Ejecuta el handler según `action.type`
   - Registra resultado en `AiActionResult[]`
4. Llama a RPC `recalc_project_stats(projectId)` al finalizar
5. Devuelve `{ results, batchId }`

### Función: `undoBatch`

```typescript
undoBatch(batchId: string): Promise<void>
```

**Proceso:**
1. Consulta `entity_snapshots` donde `batch_id = batchId`
2. Ordena en inverso al orden de ejecución
3. Para cada snapshot:
   - Si acción era `create` → `DELETE` la entidad
   - Si acción era `delete` → `INSERT` con los datos del snapshot
   - Si acción era `update` → `UPDATE` restaurando el `snapshot_data`

### Handlers por Tipo de Acción

| Tipo | Tabla(s) afectada(s) | Notas |
|------|---------------------|-------|
| `update_scene` | `scenes` | Actualiza campos individuales |
| `create_scene` | `scenes`, `scene_camera` | Crea escena + cámara opcional |
| `delete_scene` | `scenes` | Soft delete (is_deleted) o hard delete |
| `reorder_scenes` | `scenes` | Actualiza sort_order |
| `update_prompt` | `scene_prompts` | Crea nueva versión (v4 versioned) |
| `update_character` | `characters` | Actualiza campos |
| `add_character_to_scene` | `scene_characters` | Inserción en junction |
| `remove_character_from_scene` | `scene_characters` | Delete de junction |
| `update_camera` | `scene_camera` | Upsert |
| `assign_background` | `scene_backgrounds` | Upsert con ángulo y hora |

### Tabla `entity_snapshots`

```sql
entity_snapshots (
  id              uuid PRIMARY KEY,
  batch_id        uuid NOT NULL,        -- agrupa acciones del mismo plan
  entity_type     text,                 -- 'scene' | 'character' | ...
  entity_id       uuid,
  action_type     text,                 -- 'create' | 'update' | 'delete'
  snapshot_data   jsonb,                -- datos ANTES de la mutación
  sort_order      int,                  -- para restaurar en orden inverso
  user_id         uuid,
  project_id      uuid,
  conversation_id uuid,
  created_at      timestamptz
)
```

---

## 9. Definición de Tools

**Archivo:** `src/lib/ai/tools.ts` (~167 líneas)

Las herramientas están definidas con validación Zod pero **sin función `execute`**. Son solo esquemas para que la IA genere acciones estructuradas. La ejecución real ocurre en el servidor vía `action-executor.ts` después de que el usuario confirma.

### Tools de Escenas

```typescript
updateScene: tool({
  description: 'Actualizar campos de una escena existente',
  parameters: z.object({
    sceneId: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    duration_seconds: z.number().optional(),
    scene_type: z.enum(['intro', 'main', 'transition', 'outro']).optional(),
    arc_phase: z.string().optional(),
    director_notes: z.string().optional(),
    status: z.string().optional(),
  }),
})

createScene: tool({
  description: 'Crear una nueva escena en el proyecto',
  parameters: z.object({
    title: z.string(),
    description: z.string(),
    scene_type: z.enum([...]).optional(),
    duration_seconds: z.number().optional(),
    sort_order: z.number().optional(),
    camera: z.object({ angle, movement, lighting, mood }).optional(),
    prompts: z.object({ visual, narration }).optional(),
  }),
})

deleteScene: tool({ parameters: z.object({ sceneId: z.string() }) })

reorderScenes: tool({
  parameters: z.object({
    scenes: z.array(z.object({ sceneId: z.string(), sort_order: z.number() })),
  }),
})
```

### Tools de Personajes

```typescript
createCharacter: tool({
  parameters: z.object({
    name: z.string(),
    role: z.enum(['protagonist', 'antagonist', 'secondary', 'narrator', 'extra']).optional(),
    description: z.string().optional(),
    visual_description: z.string().optional(),
    personality: z.string().optional(),
    signature_clothing: z.string().optional(),
    hair_description: z.string().optional(),
    color_accent: z.string().optional(),
  }),
})

updateCharacter: tool({ /* mismos campos + characterId */ })
deleteCharacter: tool({ parameters: z.object({ characterId: z.string() }) })
addCharacterToScene: tool({ parameters: z.object({ sceneId, characterId }) })
removeCharacterFromScene: tool({ parameters: z.object({ sceneId, characterId }) })
```

### Tools de Fondos

```typescript
createBackground: tool({
  parameters: z.object({
    name: z.string(),
    code: z.string().optional(),          // identificador corto: 'INT-OFICINA-01'
    description: z.string().optional(),
    location_type: z.enum(['interior', 'exterior', 'virtual']).optional(),
    time_of_day: z.string().optional(),
    prompt_snippet: z.string().optional(), // snippet para generación de imagen
  }),
})

updateBackground: tool({ /* mismos campos + backgroundId */ })
```

### Tools de Cámara

```typescript
updateCamera: tool({
  parameters: z.object({
    sceneId: z.string(),
    angle: z.string().optional(),         // 'close-up' | 'medium' | 'wide' | ...
    movement: z.string().optional(),      // 'static' | 'pan' | 'zoom' | ...
    lighting: z.string().optional(),
    mood: z.string().optional(),
    notes: z.string().optional(),
  }),
})
```

### Tools de Asignación

```typescript
assignBackground: tool({
  parameters: z.object({
    sceneId: z.string(),
    backgroundId: z.string(),
    camera_angle: z.string().optional(),
    time_of_day: z.string().optional(),
  }),
})
```

### Tool de Análisis

```typescript
explainStoryboard: tool({
  parameters: z.object({
    format: z.enum(['summary', 'detailed', 'timeline']),
    includeCharacters: z.boolean().optional(),
    includeBackgrounds: z.boolean().optional(),
  }),
})
```

---

## 10. System Prompts

### Constructor: `src/lib/ai/system-prompt.ts`

#### Interfaces de Contexto

```typescript
interface ProjectContext {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  target_platform: string | null;
  target_duration_seconds: number | null;
  status: string | null;
  color_palette: Record<string, string> | null;
  ai_brief: string | null;
  global_rules: unknown[] | null;
  total_scenes: number | null;
  total_characters: number | null;
  total_backgrounds: number | null;
  estimated_duration_seconds: number | null;
  completion_percentage: number | null;
  narration_mode: string | null;
}

interface SceneContext {
  id: string;
  scene_number: string | null;
  title: string | null;
  description: string | null;
  scene_type: string | null;
  arc_phase: string | null;
  duration_seconds: number | null;
  status: string | null;
  sort_order: number | null;
  director_notes: string | null;
  scene_characters?: {
    character_id: string;
    characters: { id: string; name: string } | null;
  }[];
}

interface CharacterContext {
  id: string;
  name: string;
  role: string | null;
  description: string | null;
  visual_description: string | null;
  personality: string | null;
  signature_clothing: string | null;
  hair_description: string | null;
  color_accent: string | null;
}

interface BackgroundContext {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  location_type: string | null;
  time_of_day: string | null;
  prompt_snippet: string | null;
}
```

#### Función `buildSystemPrompt`

```typescript
buildSystemPrompt(params: {
  project?: ProjectContext;
  scenes?: SceneContext[];
  characters?: CharacterContext[];
  backgrounds?: BackgroundContext[];
  customAgentPrompt?: string;
}): string
```

#### Formato de Output del System Prompt

```
Eres Kiyoko AI, directora creativa y asistente de producción audiovisual.
[instrucciones generales de comportamiento]

═══════════════════════════════════════════════════════
PROYECTO: [título]
═══════════════════════════════════════════════════════
- Descripción: ...
- Estilo visual: ...
- Plataforma objetivo: ...
- Duración estimada: ...
- Color palette: ...
- Brief IA: ...
- Reglas globales: ...
- Estadísticas: X escenas · Y personajes · Z fondos

═══════════════════════════════════════════════════════
ESCENAS (X en total)
═══════════════════════════════════════════════════════
[E01] Título de la escena
  Tipo: intro | Fase: setup | Duración: 15s | Estado: draft
  Descripción: ...
  Personajes: Nombre1, Nombre2
  Director: [notas de dirección]

═══════════════════════════════════════════════════════
PERSONAJES (Y en total)
═══════════════════════════════════════════════════════
[ROL] Nombre
  Descripción: ...
  Visual: ...
  Personalidad: ...
  Ropa: ...
  Pelo: ...
  Color accent: #hex

═══════════════════════════════════════════════════════
FONDOS (Z en total)
═══════════════════════════════════════════════════════
[CODIGO] Nombre
  Tipo: interior/exterior | Hora: day/night
  Descripción: ...
  Prompt: ...
```

### Archivos de Prompts por Función

| Archivo | Uso |
|---------|-----|
| `system-chat-assistant.ts` | Kiyoko chat director (principal) |
| `system-project-generator.ts` | Generación de proyectos completos |
| `system-scene-generator.ts` | Generación de escenas |
| `system-character-generator.ts` | Generación de personajes |
| `system-analyzer.ts` | Análisis de proyectos/videos |
| `system-scene-improver.ts` | Mejora de escenas |
| `system-timeline-generator.ts` | Generación de arcos narrativos |

---

## 11. Output Schemas

**Directorio:** `src/lib/ai/schemas/`

Schemas Zod para validar respuestas estructuradas de la IA via `Output.object()`.

```typescript
// Uso con Vercel AI SDK
const { experimental_output: output } = await generateText({
  model,
  system: SYSTEM_PROJECT_GENERATOR,
  prompt: userPrompt,
  output: Output.object({ schema: projectOutputSchema }),
  experimental_telemetry: { isEnabled: true },
});
```

| Schema | Campos principales |
|--------|-------------------|
| `project-output.ts` | title, description, color_palette, style, target_platform, ai_brief, global_rules |
| `scene-output.ts` | title, description, scene_type, arc_phase, duration_seconds, sort_order, director_notes, camera, prompts |
| `character-output.ts` | name, role, description, visual_description, personality, signature_clothing, hair_description, color_accent |
| `analysis-output.ts` | score (0-100), strengths[], weaknesses[], suggestions[], missing_elements[] |
| `timeline-output.ts` | phases[], milestones[], total_duration_seconds, recommended_cuts[] |

---

## 12. API Routes (todas)

### Resumen de endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ai/chat` | Chat streaming con SSE |
| POST | `/api/ai/execute-actions` | Ejecutar plan de acciones IA |
| GET | `/api/ai/providers/status` | Estado de todos los proveedores |
| POST | `/api/ai/generate-project` | Generar proyecto completo |
| POST | `/api/ai/generate-scenes` | Generar escenas para un proyecto |
| POST | `/api/ai/generate-characters` | Generar personajes |
| POST | `/api/ai/generate-arc` | Generar arco narrativo |
| POST | `/api/ai/generate-timeline` | Generar timeline/schedule |
| POST | `/api/ai/generate-narration` | Generar narración por escenas |
| POST | `/api/ai/generate-image` | Generar imagen con AI |
| POST | `/api/ai/generate-voice` | TTS (ElevenLabs + Google fallback) |
| POST | `/api/ai/improve-prompt` | Mejorar prompt de imagen |
| POST | `/api/ai/analyze-project` | Analizar proyecto completo |
| POST | `/api/ai/analyze-image` | Analizar imagen (vision) |
| POST | `/api/ai/analyze-video` | Analizar video |
| POST | `/api/ai/derive-video` | Derivar video de otro |

### `/api/ai/execute-actions` — Detallado

```typescript
// Request
{ plan: AiActionPlan, projectId: string, conversationId?: string }

// Response
{
  batchId: string,
  results: AiActionResult[],
  successCount: number,
  failedCount: number
}
```

**Post-ejecución:**
- Emite evento a tabla `realtime_updates` (para sincronizar otros usuarios)
- Inserta en `activity_log` con el resumen de cambios

### `/api/ai/providers/status` — Detallado

```typescript
// Response
{
  providers: ProviderStatus[],
  activeTextProvider: string | null,
  activeImageProvider: string | null
}

interface ProviderStatus {
  id: string;
  name: string;
  status: 'available' | 'cooldown' | 'no_key';
  description: string;
  signupUrl: string;
  retryInSeconds: number | null;    // si en cooldown
  lastError: string | null;
}
```

### `/api/ai/generate-narration` — Detallado

```typescript
// Request
{
  mode: 'per_scene' | 'continuous',
  scenes: { id, title, description, duration_seconds }[],
  config: {
    style?: string,         // 'documentary' | 'dramatic' | 'conversational'
    voice_tone?: string,
    max_words_per_scene?: number
  }
}

// Response
{
  success: boolean,
  narration: { sceneId: string, text: string }[],
  provider: string
}
```

Limpia el texto de respuesta: elimina JSON embebido, bloques markdown, prefijos como "Narración:" etc.

### `/api/ai/generate-voice` — Detallado

```typescript
// Request
{
  text: string,
  voice_id?: string,              // ElevenLabs voice ID
  provider?: 'elevenlabs' | 'google'
}

// Response (binary audio / URL)
{
  success: boolean,
  audioUrl: string,               // URL de Supabase Storage
  provider: string,
  duration_seconds?: number
}
```

Primario: ElevenLabs. Fallback: Google Text-to-Speech.

---

## 13. Zustand Store — AI

**Archivo:** `src/stores/ai-store.ts`

```typescript
interface AIState {
  // Panel de chat
  isOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;

  // Modo de proveedor
  aiMode: string;               // 'auto' | 'groq' | 'mistral' | etc.
  setAIMode: (mode: string) => void;

  // Conversación activa
  conversationId: string | null;
  setConversationId: (id: string | null) => void;

  // Plan pendiente de confirmación
  pendingPlan: AiActionPlan | null;
  setPendingPlan: (plan: AiActionPlan | null) => void;

  // Cache de análisis de imagen
  lastImageAnalysis: Record<string, unknown> | null;
  setLastImageAnalysis: (analysis: Record<string, unknown> | null) => void;
}
```

**Persistencia en localStorage (`kiyoko-ai-store`):**
- Persiste: `isOpen`, `aiMode`
- No persiste: `conversationId`, `pendingPlan`, `lastImageAnalysis` (estado transitorio)

---

## 14. Custom Hooks de IA

### `useAiAgent(projectId?)`

```typescript
// Fetch del agente IA personalizado del proyecto
// Lee tabla: project_ai_agents
const { agent, isLoading, fetchAgent, updateAgent } = useAiAgent(projectId);
```

### `useAiSettings(projectId?)`

```typescript
// Configuración de IA del proyecto
// Lee tabla: project_ai_settings
const { settings, isLoading, fetchSettings, updateSettings } = useAiSettings(projectId);
```

### `use-execute-ai-actions`

```typescript
// TanStack Query mutation para ejecutar acciones IA
const mutation = useExecuteAiActions();
mutation.mutate({ plan, projectId, conversationId });
```

**Post-éxito:**
- Invalida automáticamente queries: `['scenes']`, `['characters']`, `['backgrounds']`, `['projects']`, `['conversations']`
- Muestra toast de éxito con conteo: "3 cambios aplicados correctamente"
- En error: toast de error con descripción

---

## 15. Chat Context

**Archivo:** `src/lib/ai/chat-context.ts`

Define el contexto del chat según la ruta actual del usuario.

### Tipos de Localización

```typescript
type ChatLocation =
  | 'dashboard'       // Sin proyecto activo
  | 'project'         // Nivel de proyecto
  | 'video'           // Video dentro de proyecto
  | 'scene'           // Escena dentro de video
  | 'characters'      // Gestión de personajes
  | 'backgrounds'     // Gestión de fondos
  | 'settings';       // Configuración de proyecto
```

### Funciones

```typescript
// Detectar dónde está el usuario según la URL
getChatLocationFromPath(pathname: string, params: Record<string, string>): ChatLocation

// Mensaje de bienvenida contextual
getWelcomeMessage(location: ChatLocation): string

// Acciones rápidas según contexto
getQuickActions(location: ChatLocation): QuickAction[]
```

### Acciones Rápidas por Contexto

| Contexto | Acciones Disponibles |
|----------|---------------------|
| `dashboard` | Crear proyecto, Generar ideas |
| `project` | Nuevo video, Añadir personaje, Resumen del proyecto |
| `video` | Generar escenas, Generar narración, Analizar video |
| `scene` | Generar prompt, Mejorar prompt, Analizar escena, Configurar cámara |
| `characters` | Analizar imagen, Crear personaje nuevo |
| `backgrounds` | Crear fondo nuevo |

---

## 16. Componentes de Chat

### `KiyokoChat.tsx`

Componente contenedor principal del chat.

**Props:**
```typescript
interface KiyokoChatProps {
  projectId?: string;
  videoId?: string;
  sceneId?: string;
  mode?: 'panel' | 'expanded';
}
```

**Características:**
- Panel lateral colapsable o modo expandido (full-screen)
- Sidebar de historial de conversaciones (resizable)
- Lista de mensajes con auto-scroll al fondo
- Input de chat con soporte para imágenes
- Popover de acciones rápidas
- Visualización de planes de acción (ActionPlanCard)
- Botón de undo para el último batch ejecutado

### `ChatMessage.tsx`

Renderiza un mensaje individual.

**Funcionalidades:**
- Renderizado Markdown con GFM (GitHub Flavored Markdown)
- Muestra `ActionPlanCard` cuando el mensaje contiene un plan
- Lista de sugerencias clicables bajo el mensaje
- Audio player si el mensaje tiene `audioUrl`
- Botón de copiar contenido
- Botón de undo (si el mensaje tiene `executedBatchId`)
- Timestamp formateado
- Avatar diferenciado usuario/asistente

### `ChatInput.tsx`

Input del chat.

**Funcionalidades:**
- Textarea que se auto-expande
- Envío con Enter (Shift+Enter para salto de línea)
- Botón de adjuntar imagen (hasta 5 imágenes)
- Previews de imágenes con botón de eliminar
- Selector de proveedor (dropdown con todos los proveedores disponibles)
- Indicador de estado del proveedor activo
- Deshabilitado durante streaming

### `ChatHistorySidebar.tsx`

Sidebar de historial.

**Funcionalidades:**
- Lista de conversaciones del usuario para el proyecto
- Conversación activa resaltada
- Menú contextual: Renombrar, Eliminar
- Botón "Nueva conversación"
- Panel resizable con drag

### `ActionPlanCard.tsx`

Muestra el plan de acciones antes de ejecutarlo.

**Funcionalidades:**
- Título con resumen en español
- Contador de escenas afectadas
- Lista de acciones individuales con descripción y razón
- Advertencias destacadas en amarillo
- Botones: **Ejecutar** (verde) / **Cancelar** (rojo)
- Estados post-ejecución: ✓ éxito / ✗ error por acción
- Animación de carga durante ejecución

---

## 17. Interacción con Base de Datos

### Tablas Leídas por el Sistema de IA

| Tabla | Propósito |
|-------|-----------|
| `projects` | Metadata, color_palette, ai_brief |
| `videos` | Video cuts del proyecto |
| `scenes` | Detalle completo de escenas |
| `scene_characters` | Junction escena↔personaje |
| `characters` | Definiciones de personajes |
| `backgrounds` | Fondos/localizaciones |
| `scene_backgrounds` | Junction escena↔fondo |
| `narrative_arcs` | Arcos narrativos |
| `timeline_entries` | Hitos del timeline |
| `scene_camera` | Configuración de cámara por escena |
| `scene_prompts` | Prompts versionados por escena |
| `project_ai_agents` | Prompt personalizado del agente IA |
| `project_ai_settings` | Configuración de IA del proyecto |
| `user_api_keys` | Claves API cifradas del usuario |

### Tablas Escritas por el Sistema de IA

| Tabla | Quién escribe | Cuándo |
|-------|--------------|--------|
| `scenes` | `action-executor` | Al crear/actualizar/eliminar escenas |
| `characters` | `action-executor` | Al crear/actualizar personajes |
| `backgrounds` | `action-executor` | Al crear/actualizar fondos |
| `scene_characters` | `action-executor` | Al añadir/quitar personajes de escenas |
| `scene_backgrounds` | `action-executor` | Al asignar fondos a escenas |
| `scene_camera` | `action-executor` | Al actualizar cámara |
| `scene_prompts` | `action-executor` | Al crear versión de prompt |
| `ai_conversations` | `useKiyokoChat` | Al guardar/actualizar conversación |
| `ai_usage_logs` | `/api/ai/chat` | Después de cada respuesta (tokens, cost) |
| `entity_snapshots` | `action-executor` | Antes de CADA mutación (para undo) |
| `realtime_updates` | `/api/ai/execute-actions` | Para sincronizar otros usuarios |
| `activity_log` | `/api/ai/execute-actions` | Registro de actividad |

---

## 18. Manejo de Errores y Fallback

### Fallback de Proveedores

```
1. Resolver cadena de proveedores
2. Intentar con provider[0]
3. Si falla:
   ├── markProviderFailed(id, error)  → en cooldown
   └── Intentar con provider[1]
4. Repetir hasta agotar cadena
5. Si todos fallan: 503 "No hay proveedores disponibles"
```

### Tipos de Error y Cooldown

| Tipo de Error | Cooldown | Recuperación |
|--------------|---------|-------------|
| Rate limit / 429 | Según `Retry-After` (mínimo 3min) | Automática |
| Error de red / timeout | 3 minutos | Automática |
| Error de auth (401/403) | 24 horas | No automática |
| Error de facturación | 24 horas | No automática |
| Error 5xx del proveedor | 3 minutos | Automática |

### Verificación del Stream

Antes de retornar el stream al cliente, el sistema intenta leer el primer chunk:
- Si llega → el stream está funcionando, se devuelve al cliente
- Si falla → se marca el proveedor y se intenta el siguiente
- Esto evita que el cliente empiece a parsear un stream que falla a mitad

### Feedback al Usuario

- **Toasts** (via `sonner`): éxito, error, warning
- **Mensajes de error en el chat**: si el streaming falla después de comenzar
- **Indicador de proveedor**: muestra qué proveedor respondió
- **Respuestas parciales preservadas**: si el usuario aborta, se guarda lo recibido
- **Conteo en ejecución de acciones**: "3 de 5 cambios aplicados"

---

## 19. Imágenes y Archivos

### Adjuntos de Chat

```
Bucket: chat-attachments
Ruta: chat-attachments/{projectId}/{uuid}.{ext}
```

- Hasta 5 imágenes por mensaje
- Formatos: jpg, png, webp, gif
- URL pública tras upload → enviada al modelo en el mensaje
- Las URLs se revocan del memory local (object URLs) tras uso

### Imágenes Generadas (scene_media)

```
Bucket: projects
Ruta: projects/{projectId}/videos/{videoId}/scenes/{sceneId}/images/{uuid}.{ext}
```

- Se debe escribir en tabla `scene_media` tras generación
- Asociadas a la escena + tipo (image_gen, reference, etc.)

### Audio Generado (TTS)

```
Bucket: narrations
Ruta: narrations/{projectId}/{sceneId}/{uuid}.mp3
```

---

## 20. Variables de Entorno

```bash
# Proveedores de IA (texto)
GOOGLE_AI_API_KEY=...          # Gemini (gemini-2.0-flash)
GROQ_API_KEY=...               # Groq (llama-3.3-70b)
MISTRAL_API_KEY=...            # Mistral (mistral-large-latest)
ANTHROPIC_API_KEY=...          # Claude (claude-sonnet-4)
OPENAI_API_KEY=...             # OpenAI (gpt-4o-mini)
XAI_API_KEY=...                # Grok (grok-3-fast)
DEEPSEEK_API_KEY=...           # DeepSeek (deepseek-chat)
CEREBRAS_API_KEY=...           # Cerebras (llama3.1-8b)

# TTS
ELEVENLABS_API_KEY=...         # ElevenLabs (voz principal)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Cifrado de claves de usuario
ENCRYPTION_SECRET=...          # clave para cifrar user_api_keys
```

---

## 21. Flujos Completos

### Flujo: Enviar mensaje de chat

```
[Usuario escribe mensaje]
         │
         ▼
useKiyokoChat.sendMessage(text, images?)
         │
         ├── Si hay imágenes → uploadImage() → Supabase Storage
         │
         ├── Agrega mensaje usuario al estado local
         │
         ├── Agrega placeholder del asistente (vacío)
         │
         ▼
POST /api/ai/chat
   │  body: { messages, projectId, videoId, sceneId, aiMode, conversationId, images }
   │
   ├── Auth check (JWT)
   ├── Carga contexto del proyecto (scenes, characters, backgrounds)
   ├── buildSystemPrompt(context)
   ├── loadUserKeys(userId) → descifra claves
   ├── resolveProviderChain('chat', mode, userKeys)
   ├── streamText(model, systemPrompt, messages)
   └── Emite SSE stream
         │
         ▼
Cliente parsea SSE:
   │  "0:texto" → acumula en buffer
   │  "d:{tokens}" → metadata final
   │  "3:error" → error del servidor
   │
   ├── Actualiza placeholder en tiempo real (typing effect)
   │
   ├── Al finalizar:
   │    ├── parseActionPlan(content) → extrae JSON
   │    ├── parseSuggestions(content) → extrae sugerencias
   │    ├── Lee header X-AI-Provider
   │    ├── Guarda conversación en ai_conversations
   │    └── Actualiza estado final del mensaje
         │
         ▼
[Mensaje visible en UI con plan y sugerencias]
```

### Flujo: Ejecutar plan de acciones

```
[Usuario ve ActionPlanCard con plan propuesto]
         │
[Click "Ejecutar"]
         │
         ▼
useKiyokoChat.executeActionPlan(messageId, plan)
         │
         ▼
POST /api/ai/execute-actions
   │  body: { plan, projectId, conversationId }
   │
   ├── Auth check
   ├── executeActionPlan(actions, projectId, userId, conversationId)
   │    │
   │    ├── Genera batchId único
   │    ├── Ordena acciones por priority
   │    └── Para cada acción:
   │         ├── recordSnapshot() → entity_snapshots ANTES de mutar
   │         ├── executeHandler(action) → mutación en DB
   │         └── Registra resultado
   │
   ├── RPC recalc_project_stats(projectId)
   ├── INSERT realtime_updates → broadcast a otros usuarios
   ├── INSERT activity_log → auditoría
   └── Devuelve { batchId, results, successCount, failedCount }
         │
         ▼
Cliente:
   ├── Invalida queries (scenes, characters, etc.)
   ├── Actualiza mensaje con executionResults
   ├── Guarda executedBatchId para undo
   └── Toast: "X cambios aplicados"
```

### Flujo: Undo de acciones

```
[Usuario click "Deshacer" en mensaje]
         │
         ▼
useKiyokoChat.undoBatch(batchId)
         │
         ▼
POST /api/ai/undo
   │  body: { batchId }
   │
   ├── Auth check
   ├── undoBatch(batchId)
   │    ├── Consulta entity_snapshots WHERE batch_id = batchId
   │    ├── Ordena en reverso (sort_order DESC)
   │    └── Para cada snapshot:
   │         ├── Si acción fue 'create' → DELETE entidad
   │         ├── Si acción fue 'delete' → INSERT con snapshot_data
   │         └── Si acción fue 'update' → UPDATE restaurando snapshot_data
   └── Devuelve { success: true }
         │
         ▼
Cliente:
   ├── Invalida queries
   └── Toast: "Cambios revertidos"
```

### Flujo: Selección de proveedor

```
[aiMode del usuario: 'auto' | 'groq' | 'mistral' | ...]
         │
         ▼
resolveProviderChain(task, mode, userKeys)
         │
         ├── Obtiene cadena base del task: ['groq', 'mistral', ...]
         ├── Para cada proveedor:
         │    ├── ¿Tiene clave de servidor (env)?
         │    ├── ¿Tiene clave del usuario (user_api_keys)?
         │    └── ¿Está en cooldown?
         ├── Si mode = providerId específico → lo mueve al frente
         └── Devuelve lista filtrada y ordenada
                   │
                   ▼
              streamAI / executeAI
                   │
                   ├── Intenta provider[0]
                   ├── Si falla → markProviderFailed() → provider[1]
                   ├── Continúa hasta éxito o agotamiento
                   └── Devuelve resultado con providerId usado
```

---

## 22. Funcionalidades Pendientes / Deuda Técnica

| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Filtrado de escenas por video activo | Pendiente | Actualmente carga TODAS las escenas del proyecto |
| Persistencia automática del contenido generado | Parcial | Solo chat guarda; generate-* no inserta en DB automáticamente |
| Almacenamiento de imágenes tras generación | Pendiente | Se genera pero no se guarda en `scene_media` |
| Check de cuota ElevenLabs antes de TTS | Pendiente | Puede fallar silenciosamente |
| Integración de style presets en prompts de imagen | Pendiente | Tabla `style_presets` existe pero no se usa en prompts |
| Uso completo de entity_snapshots para rollback | Parcial | La grabación está implementada, el undo parcialmente |
| Generación recursiva con inserción en DB | Pendiente | `generate-scenes` devuelve JSON pero no inserta automáticamente |
| Rate limiting por usuario en API routes | Pendiente | Sin protección ante abuso |
| Telemetría de uso por proyecto | Parcial | `ai_usage_logs` existe pero no hay dashboard |

---

*Documento generado automáticamente a partir del análisis del código fuente. Mantener actualizado tras cambios en `src/lib/ai/`, `src/hooks/useKiyokoChat.ts`, `src/app/api/ai/` y `src/components/chat/`.*
