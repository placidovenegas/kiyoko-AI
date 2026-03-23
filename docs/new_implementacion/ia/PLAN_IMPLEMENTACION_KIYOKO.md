# PLAN.md — Implementación de Kiyoko AI

> **Lee primero:** `docs/new_implementacion/ia/KIYOKO_DEFINITIVO (1).md`
> Ese documento contiene TODAS las decisiones de producto. Este archivo es el plan técnico de implementación.

---

## CONTEXTO DEL PROYECTO

Esta es una app Next.js (App Router) con Supabase como base de datos. El proyecto es una plataforma de producción de video donde una IA llamada "Kiyoko" actúa como directora creativa dentro de los proyectos y videos del usuario.

### Stack existente

```
Framework:     Next.js (App Router)
Base de datos: Supabase (PostgreSQL)
Auth:          Supabase Auth
Estado:        Zustand
Estilos:       Tailwind CSS
IA SDKs:       @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google,
               @ai-sdk/groq, @ai-sdk/mistral, @ai-sdk/xai,
               @ai-sdk/react (useChat, useCompletion)
Tipos DB:      Los tipos están en el archivo database_types.ts generado por Supabase
```

### Documento de referencia

ANTES de escribir cualquier código, lee completo el archivo:
```
docs/new_implementacion/ia/KIYOKO_DEFINITIVO (1).md
```

Ese documento define 39 decisiones de producto que guían toda la implementación. Cada decisión tiene un número (Pregunta 1-39). Cuando necesites saber cómo debe comportarse algo, busca la pregunta correspondiente en ese documento.

---

## ARQUITECTURA GENERAL

```
src/
├── app/
│   ├── api/
│   │   └── ai/
│   │       ├── chat/
│   │       │   └── route.ts              ← API route principal del chat
│   │       └── analyze-image/
│   │           └── route.ts              ← Analizar imágenes de personajes/fondos
│   │
│   ├── (dashboard)/                      ← SIN Kiyoko aquí
│   │   └── ...
│   │
│   └── (project)/
│       └── project/[shortId]/
│           ├── layout.tsx                ← Monta <KiyokoProvider> + <KiyokoPanel>
│           ├── page.tsx                  ← Vista proyecto (agente ligero)
│           └── video/[videoShortId]/
│               ├── page.tsx              ← Vista video (agente completo)
│               └── scene/[sceneShortId]/
│                   └── page.tsx          ← Vista escena (agente completo, foco escena)
│
├── components/
│   └── kiyoko/
│       ├── KiyokoProvider.tsx            ← Context provider con Zustand
│       ├── KiyokoPanel.tsx               ← Panel principal (sidebar/flotante/fullscreen)
│       ├── KiyokoHeader.tsx              ← Header del chat
│       ├── KiyokoInput.tsx               ← Input con adjuntar, modelo, voz
│       ├── KiyokoEmptyState.tsx          ← Estado vacío con quick actions
│       ├── KiyokoMessage.tsx             ← Renderiza mensaje con bloques
│       ├── KiyokoHistory.tsx             ← Historial de conversaciones
│       ├── KiyokoButton.tsx              ← Botón flotante para abrir
│       ├── blocks/
│       │   ├── ActionPlanCard.tsx         ← Plan con Ejecutar/Cambiar/Cancelar
│       │   ├── ScenePlanTimeline.tsx      ← Timeline visual de escenas
│       │   ├── OptionsChips.tsx           ← Chips clicables
│       │   ├── DiffView.tsx              ← Antes vs después
│       │   ├── SuggestionsBar.tsx        ← Quick replies sobre input
│       │   └── PromptPreviewCard.tsx     ← Prompt EN + ES + tags
│       └── modes/
│           ├── SidebarMode.tsx            ← Layout sidebar redimensionable
│           ├── FloatingMode.tsx           ← Ventana flotante movible
│           └── FullscreenMode.tsx         ← Pantalla completa
│
├── lib/
│   └── ai/
│       ├── agents/
│       │   ├── router.ts                 ← System prompt del Router
│       │   ├── scene-creator.ts          ← System prompt del Director de Escenas
│       │   ├── prompt-generator.ts       ← System prompt del Generador de Prompts
│       │   └── scene-editor.ts           ← System prompt del Editor de Escenas
│       ├── detect-intent.ts              ← Clasificar intención del usuario
│       ├── select-agent.ts               ← Elegir agente según intención
│       ├── build-context.ts              ← Construir context desde Zustand
│       ├── parse-message.ts              ← Parsear bloques [ACTION_PLAN], [OPTIONS], etc.
│       ├── action-executor.ts            ← Ejecutar acciones en Supabase
│       └── load-video-context.ts         ← Query de Supabase para cargar contexto
│
└── stores/
    ├── kiyoko-store.ts                   ← Estado del chat (modo, abierto, mensajes)
    ├── project-store.ts                  ← Datos del proyecto (personajes, fondos, videos)
    └── video-store.ts                    ← Datos del video (escenas, prompts, clips)
```

---

## IMPLEMENTACIÓN PASO A PASO

### FASE 1 — Stores y carga de datos

Implementar primero los stores de Zustand y la carga de datos. Sin datos, la IA no puede funcionar.

#### 1.1 — Store del proyecto (`stores/project-store.ts`)

```typescript
// Este store se carga al entrar en /project/[shortId]
// Contiene: proyecto, personajes, fondos, videos, tasks, aiSettings

interface ProjectStore {
  // Datos
  project: Project | null;
  characters: Character[];
  backgrounds: Background[];
  videos: Video[];
  tasks: Task[];
  aiSettings: ProjectAiSettings | null;
  aiAgent: ProjectAiAgent | null;

  // Estado
  isLoading: boolean;
  error: string | null;

  // Acciones
  loadProject: (shortId: string) => Promise<void>;
  refreshCharacters: () => Promise<void>;
  refreshBackgrounds: () => Promise<void>;
  refreshVideos: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  reset: () => void;
}
```

Datos a cargar desde Supabase:
- `projects` — el proyecto por shortId
- `characters` — WHERE project_id = X, ORDER BY sort_order
- `backgrounds` — WHERE project_id = X, ORDER BY sort_order
- `videos` — WHERE project_id = X, ORDER BY sort_order
- `tasks` — WHERE project_id = X AND status != 'completed', LIMIT 20
- `project_ai_settings` — WHERE project_id = X
- `project_ai_agents` — WHERE project_id = X AND is_default = true

#### 1.2 — Store del video (`stores/video-store.ts`)

```typescript
// Este store se carga al entrar en /project/[shortId]/video/[videoShortId]
// Contiene: video + escenas con TODAS sus relaciones

interface VideoStore {
  video: Video | null;
  scenes: SceneWithRelations[];

  isLoading: boolean;
  error: string | null;

  loadVideo: (videoShortId: string, projectId: string) => Promise<void>;
  refreshScenes: () => Promise<void>;
  reset: () => void;
}

// Una escena con todas sus relaciones cargadas
interface SceneWithRelations {
  // Datos de scenes
  id: string;
  title: string;
  scene_number: number;
  sort_order: number;
  duration_seconds: number | null;
  description: string | null;
  dialogue: string | null;
  director_notes: string | null;
  arc_phase: 'hook' | 'build' | 'peak' | 'close' | null;
  scene_type: string;
  status: string;
  is_filler: boolean | null;

  // Relaciones
  assigned_characters: Array<{
    character_id: string;
    name: string;
    role_in_scene: string | null;
  }>;
  assigned_background: {
    background_id: string;
    name: string;
    angle: string | null;
    time_of_day: string | null;
    is_primary: boolean;
  } | null;
  camera: {
    camera_angle: string | null;
    camera_movement: string | null;
    lighting: string | null;
    mood: string | null;
    camera_notes: string | null;
  } | null;
  image_prompt: { id: string; prompt_text: string; version: number } | null;
  video_prompt: { id: string; prompt_text: string; version: number } | null;
  clip: {
    id: string;
    prompt_image_first_frame: string | null;
    prompt_video: string | null;
    status: string | null;
    version: number | null;
  } | null;
}
```

La query de Supabase para cargar escenas con relaciones:
```typescript
const { data: scenes } = await supabase
  .from('scenes')
  .select(`
    *,
    scene_characters(character_id, role_in_scene, characters(name)),
    scene_backgrounds(background_id, angle, time_of_day, is_primary, backgrounds(name)),
    scene_camera(*),
    scene_prompts(id, prompt_text, prompt_type, version, is_current),
    scene_video_clips(id, prompt_image_first_frame, prompt_video, status, version, is_current)
  `)
  .eq('video_id', videoId)
  .order('sort_order');
```

Filtrar scene_prompts donde is_current = true y separar por prompt_type ('image' vs 'video').
Filtrar scene_video_clips donde is_current = true.

#### 1.3 — Store de Kiyoko (`stores/kiyoko-store.ts`)

```typescript
interface KiyokoStore {
  // Estado del panel
  isOpen: boolean;
  mode: 'minimized' | 'sidebar' | 'floating' | 'fullscreen';
  sidebarWidth: number; // default 420

  // Conversación actual
  conversationId: string | null;
  messages: Message[];

  // Agente activo (para mostrar en header)
  activeAgent: 'router' | 'scenes' | 'prompts' | 'editor';

  // Acciones
  open: (mode?: KiyokoStore['mode']) => void;
  close: () => void;
  setMode: (mode: KiyokoStore['mode']) => void;
  setSidebarWidth: (width: number) => void;
  setActiveAgent: (agent: KiyokoStore['activeAgent']) => void;
  reset: () => void;
}
```

Guardar `mode` y `sidebarWidth` en localStorage para persistir preferencia.

---

### FASE 2 — Los 4 agentes (system prompts + detección de intención)

#### 2.1 — Detección de intención (`lib/ai/detect-intent.ts`)

```typescript
export type Intent = 'create_scenes' | 'generate_prompts' | 'edit_scene' | 'general';

export function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();

  // Crear/planificar escenas
  if (/crea.*escena|genera.*escena|planifica|plan de escenas|cuántas escenas|empez.*escena/i.test(lower))
    return 'create_scenes';

  // Generar/mejorar prompts
  if (/prompt|genera.*prompt|mejora.*prompt|first.?frame|imagen.*escena|video.*escena|genera.*imagen/i.test(lower))
    return 'generate_prompts';

  // Editar escenas existentes
  if (/cambi|edit|modific|cámara|reorden|quit|asign|elimin|borr|duraci|mover|intercambi/i.test(lower))
    return 'edit_scene';

  return 'general';
}
```

IMPORTANTE: Esta es una primera versión simple con regex. En el futuro se puede mejorar con un clasificador LLM o con el propio Router como primer paso.

#### 2.2 — Selección de agente (`lib/ai/select-agent.ts`)

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';

export function selectAgent(intent: Intent, videoContext, projectAgent) {
  switch (intent) {
    case 'create_scenes':
      return {
        model: openai('gpt-4o'),
        systemPrompt: buildSceneCreatorPrompt(videoContext, projectAgent),
        temperature: 0.7,
      };
    case 'generate_prompts':
      return {
        model: anthropic('claude-sonnet-4-20250514'),
        systemPrompt: buildPromptGeneratorPrompt(videoContext, projectAgent),
        temperature: 0.8,
      };
    case 'edit_scene':
      return {
        model: openai('gpt-4o-mini'),
        systemPrompt: buildSceneEditorPrompt(videoContext, projectAgent),
        temperature: 0.4,
      };
    default:
      return {
        model: groq('llama-3.3-70b-versatile'),
        systemPrompt: buildRouterPrompt(videoContext, projectAgent),
        temperature: 0.3,
      };
  }
}
```

NOTA: Si el usuario ha forzado un modelo desde el selector del input, usar ese modelo en vez del automático. El selector envía el model id en el body del request.

#### 2.3 — System prompts (`lib/ai/agents/*.ts`)

Los 4 system prompts COMPLETOS están en la sección 19 del documento KIYOKO_DEFINITIVO.md. Cada archivo exporta una función `buildXxxPrompt(videoContext, projectAgent)` que:

1. Recibe los datos del video (del videoStore) y la config del agente (del projectStore)
2. Interpola los datos en el template del system prompt
3. Devuelve el string completo del prompt

Los templates son exactamente los de la sección 19 del documento. NO inventar prompts nuevos. Copiar los templates y hacerlos funciones que interpolan datos.

Punto crítico para el Generador de Prompts: SIEMPRE incluir los `prompt_snippet` de personajes y fondos como base obligatoria. Esto es la razón por la que se reescribió todo el sistema. Si el prompt no incluye los snippets, el sistema está roto.

---

### FASE 3 — API route del chat

#### 3.1 — Route handler (`app/api/ai/chat/route.ts`)

```typescript
import { streamText } from 'ai';

export async function POST(req: Request) {
  const {
    messages,
    videoContext,     // VideoStore data (video + scenes + relations)
    projectContext,   // ProjectStore data (project + characters + backgrounds)
    projectAgent,     // ProjectAiAgent config (tone, creativity, system_prompt)
    forcedModel,      // string | null — si el usuario forzó un modelo
    contextLevel,     // 'project' | 'video' | 'scene'
  } = await req.json();

  // Si estamos a nivel proyecto (sin video), usar agente ligero
  if (contextLevel === 'project') {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: buildProjectAssistantPrompt(projectContext, projectAgent),
      messages,
      temperature: 0.3,
    });
    return result.toDataStreamResponse();
  }

  // Nivel video o escena → sistema de 4 agentes
  const lastMessage = messages[messages.length - 1].content;
  const intent = detectIntent(lastMessage);

  const agent = selectAgent(intent, { ...videoContext, ...projectContext }, projectAgent);

  // Si el usuario forzó un modelo, usarlo
  const model = forcedModel ? resolveModel(forcedModel) : agent.model;

  const result = streamText({
    model,
    system: agent.systemPrompt,
    messages,
    temperature: agent.temperature,
  });

  // Devolver también qué agente se activó (para el header)
  // Esto se puede enviar como custom header o como metadata del stream
  return result.toDataStreamResponse({
    headers: {
      'X-Active-Agent': intent === 'general' ? 'router'
        : intent === 'create_scenes' ? 'scenes'
        : intent === 'generate_prompts' ? 'prompts'
        : 'editor',
    },
  });
}

function resolveModel(modelId: string) {
  // Mapear IDs del selector a instancias del AI SDK
  const models = {
    'gpt-4o': openai('gpt-4o'),
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'claude-sonnet': anthropic('claude-sonnet-4-20250514'),
    'groq-llama': groq('llama-3.3-70b-versatile'),
    // ... más según user_api_keys
  };
  return models[modelId] || openai('gpt-4o');
}
```

---

### FASE 4 — Parser de mensajes y componentes

#### 4.1 — Parser (`lib/ai/parse-message.ts`)

```typescript
const BLOCK_REGEX =
  /\[(ACTION_PLAN|SCENE_PLAN|OPTIONS|DIFF|SUGGESTIONS|PROMPT_PREVIEW)\]([\s\S]*?)\[\/\1\]/g;

export interface UIBlock {
  type: string;
  data: any;
}

export interface ParsedMessage {
  text: string;
  blocks: UIBlock[];
}

export function parseAiMessage(content: string): ParsedMessage {
  const blocks: UIBlock[] = [];
  let text = content;

  let match;
  const regex = new RegExp(BLOCK_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    text = text.replace(match[0], '');
    try {
      blocks.push({ type: match[1], data: JSON.parse(match[2].trim()) });
    } catch {
      blocks.push({ type: match[1], data: match[2].trim() });
    }
  }

  return { text: text.trim(), blocks };
}
```

#### 4.2 — Componente de mensaje (`components/kiyoko/KiyokoMessage.tsx`)

Renderiza texto markdown + bloques interactivos. Ver sección 20 del documento KIYOKO_DEFINITIVO para el mapeo completo de tipo de bloque → componente React.

Los componentes de bloques están en `components/kiyoko/blocks/`:
- `ActionPlanCard` — El más importante. Muestra descripción del plan + lista de acciones + 3 botones:
  - **Ejecutar** → llama a action-executor.ts
  - **Cambiar** → envía "Quiero cambiar algo de este plan" como mensaje
  - **Cancelar** → descarta el plan
- `ScenePlanTimeline` — Timeline horizontal/vertical de escenas con personaje y fondo
- `OptionsChips` — Fila de chips. Al pulsar uno, envía su texto como mensaje del usuario
- `DiffView` — Dos columnas: antes (rojo) y después (verde)
- `SuggestionsBar` — Se renderiza fuera del mensaje, sobre el input
- `PromptPreviewCard` — Prompt en inglés + "lo que se verá" en español + tags

---

### FASE 5 — Action Executor

#### 5.1 — Executor (`lib/ai/action-executor.ts`)

```typescript
export async function executeActionPlan(
  plan: ActionPlan,
  supabase: SupabaseClient,
  userId: string,
  projectId: string
) {
  const idMap = new Map<string, string>();
  const results = [];

  for (const action of plan.actions) {
    // 1. Resolver placeholders (__PLACEHOLDER_scene_1__ → uuid real)
    const resolvedData = resolvePlaceholders(action.data, idMap);

    // 2. Snapshot previo (solo para update/delete)
    if (isModifyAction(action.type)) {
      await createSnapshot(supabase, action, resolvedData, userId, projectId);
    }

    // 3. Ejecutar
    const result = await executeAction(supabase, action.type, action.table, resolvedData);

    // 4. Guardar ID generado para placeholders
    if (action._placeholder && result?.id) {
      idMap.set(`__PLACEHOLDER_${action._placeholder}__`, result.id);
    }

    // 5. Activity log
    await createActivityLog(supabase, action, result, userId, projectId);

    results.push({ action: action.type, success: true, id: result?.id });
  }

  return { results };
}
```

Para cada action type, la función `executeAction` hace:
- `create_scene` → `supabase.from('scenes').insert(data).select().single()`
- `update_scene` → `supabase.from('scenes').update(data).eq('id', entity_id)`
- `delete_scene` → `supabase.from('scenes').delete().eq('id', entity_id)`
- `assign_character` → `supabase.from('scene_characters').insert(data)`
- `create_prompt` → PRIMERO: `supabase.from('scene_prompts').update({ is_current: false }).eq('scene_id', data.scene_id).eq('prompt_type', data.prompt_type).eq('is_current', true)` DESPUÉS: `supabase.from('scene_prompts').insert({ ...data, is_current: true })`
- `update_camera` → UPSERT: `supabase.from('scene_camera').upsert(data, { onConflict: 'scene_id' })`

Después de ejecutar, SIEMPRE refrescar el store de Zustand correspondiente (videoStore.refreshScenes(), projectStore.refreshCharacters(), etc.)

---

### FASE 6 — UI del panel de chat

#### 6.1 — KiyokoProvider (`components/kiyoko/KiyokoProvider.tsx`)

Context provider que se monta en el layout del proyecto. Proporciona acceso a los stores y al chat.

Se monta en `app/(project)/project/[shortId]/layout.tsx`:
```tsx
<KiyokoProvider projectShortId={params.shortId}>
  {children}
  <KiyokoPanel />
</KiyokoProvider>
```

#### 6.2 — KiyokoPanel (`components/kiyoko/KiyokoPanel.tsx`)

Componente principal que renderiza según el modo:
```tsx
function KiyokoPanel() {
  const { isOpen, mode } = useKiyokoStore();

  if (!isOpen) return <KiyokoButton />;

  switch (mode) {
    case 'sidebar':
      return <SidebarMode><ChatContent /></SidebarMode>;
    case 'floating':
      return <FloatingMode><ChatContent /></FloatingMode>;
    case 'fullscreen':
      return <FullscreenMode><ChatContent /></FullscreenMode>;
  }
}
```

#### 6.3 — Modos

- `SidebarMode` — div con `position: relative`, ancho controlado por drag del borde izquierdo, min 320px max 600px. Empuja el contenido.
- `FloatingMode` — div con `position: fixed`, draggable, resizable, default 450x500 en esquina inferior derecha.
- `FullscreenMode` — div que ocupa 100% del área de contenido (no cubre el sidebar de navegación de la app).

#### 6.4 — Responsive

```tsx
// En KiyokoPanel, detectar tamaño de pantalla
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(max-width: 1024px)');

// En móvil: siempre fullscreen
// En tablet: sidebar o flotante
// En desktop: todos los modos
```

#### 6.5 — Estado vacío (`components/kiyoko/KiyokoEmptyState.tsx`)

Muestra avatar de Kiyoko + resumen contextual + quick actions. Las quick actions cambian según:
- `getQuickActions(contextLevel, projectStore, videoStore)` devuelve las opciones relevantes.

Al pulsar una quick action, se envía su texto como mensaje al chat via `useChat`.

---

## REGLAS CRÍTICAS DE IMPLEMENTACIÓN

```
1. NUNCA guardar sin confirmación.
   Todo cambio pasa por ActionPlanCard → botón Ejecutar.
   Sin excepciones. (Pregunta 21)

2. Los prompts de imagen/video SIEMPRE usan prompt_snippet.
   Si el prompt generado no empieza con el prompt_snippet del personaje,
   hay un bug. (Pregunta 13, 27)

3. Cámara y prompts están ACOPLADOS.
   Cambiar la cámara SIEMPRE regenera los prompts de esa escena.
   No son independientes. (Pregunta 19)

4. Prompts son VERSIONADOS, no se hacen UPDATE.
   Siempre INSERT nueva versión con is_current = true.
   El executor pone is_current = false en la versión anterior.
   (Sección 21 del documento)

5. scene.video_id es OBLIGATORIO.
   Cada escena DEBE pertenecer a un video. El campo es NOT NULL.
   No se pueden crear escenas sueltas.

6. Personajes y fondos pertenecen al PROYECTO.
   Se crean a nivel de proyecto. Están disponibles para todos los videos.
   (Pregunta 27)

7. Conversación NUEVA cada vez que se entra a un video.
   No se restaura la conversación anterior.
   El contexto siempre es fresco desde Zustand.
   (Pregunta 20)

8. Kiyoko NO existe fuera de proyectos.
   En el dashboard no hay botón, no hay chat, no hay nada.
   (Pregunta 1)

9. Prompts siempre en INGLÉS + descripción en idioma del usuario.
   La IA detecta el idioma del usuario automáticamente,
   pero los prompts de imagen/video son siempre en inglés.
   (Pregunta 23)

10. Antes de generar prompts → preguntar config de audio.
    Diálogos, música, narración. Se guarda en el video.
    Afecta a TODOS los prompts. (Pregunta 13)
```

---

## ORDEN DE IMPLEMENTACIÓN

```
FASE 1 — Stores y datos (sin esto nada funciona)
  [ ] project-store.ts con loadProject y queries
  [ ] video-store.ts con loadVideo y query de escenas con relaciones
  [ ] kiyoko-store.ts con estado del panel
  [ ] Montar stores en los layouts correspondientes

FASE 2 — Agentes (el cerebro)
  [ ] detect-intent.ts
  [ ] select-agent.ts
  [ ] agents/router.ts — buildRouterPrompt()
  [ ] agents/scene-creator.ts — buildSceneCreatorPrompt()
  [ ] agents/prompt-generator.ts — buildPromptGeneratorPrompt()
  [ ] agents/scene-editor.ts — buildSceneEditorPrompt()

FASE 3 — API route
  [ ] app/api/ai/chat/route.ts con streamText
  [ ] Detectar contextLevel (project vs video vs scene)
  [ ] Seleccionar agente según intención
  [ ] Soporte para modelo forzado por el usuario

FASE 4 — Parser y componentes de bloques
  [ ] parse-message.ts con regex de bloques
  [ ] KiyokoMessage.tsx que renderiza texto + bloques
  [ ] ActionPlanCard.tsx con Ejecutar/Cambiar/Cancelar
  [ ] OptionsChips.tsx
  [ ] ScenePlanTimeline.tsx
  [ ] DiffView.tsx
  [ ] SuggestionsBar.tsx
  [ ] PromptPreviewCard.tsx

FASE 5 — Action Executor
  [ ] action-executor.ts con resolución de placeholders
  [ ] Snapshot antes de update/delete (entity_snapshots)
  [ ] Activity log después de cada acción
  [ ] Versionado de prompts (is_current)
  [ ] Refresh de stores después de ejecutar

FASE 6 — UI del panel de chat
  [ ] KiyokoProvider.tsx
  [ ] KiyokoPanel.tsx (switch de modos)
  [ ] KiyokoHeader.tsx (avatar, contexto, agente, botones)
  [ ] KiyokoInput.tsx (adjuntar, texto, modelo, voz, enviar)
  [ ] KiyokoEmptyState.tsx (avatar + resumen + quick actions)
  [ ] KiyokoButton.tsx (botón flotante)
  [ ] SidebarMode.tsx (redimensionable 320-600px)
  [ ] FloatingMode.tsx (450x500, movible, redimensionable)
  [ ] FullscreenMode.tsx (100% área contenido)
  [ ] KiyokoHistory.tsx (popover o panel según modo)
  [ ] Responsive (fullscreen móvil, sidebar/flotante tablet)

FASE 7 — Mejoras
  [ ] Análisis de imagen con API de visión al subir personaje/fondo
  [ ] Undo (1 nivel) con entity_snapshots
  [ ] Streaming con barra de progreso
  [ ] Botón detener durante streaming
  [ ] Config de audio del video
  [ ] Verificación de providers/cuota antes de generar
  [ ] Botón de voz (speech-to-text)
```

---

## CÓMO EMPEZAR

Empieza por la FASE 1. Implementa los stores de Zustand y verifica que los datos se cargan correctamente al navegar a un proyecto y a un video. Puedes probar con `console.log` que los datos llegan.

Después FASE 2 + 3 juntas: crea los system prompts y la API route. Prueba que el chat funciona en su forma más básica (un input que envía mensajes y recibe streaming de texto).

Después FASE 4: parser de bloques para que los componentes interactivos aparezcan en el chat.

Después FASE 5: action executor para que "Ejecutar" realmente guarde cosas en Supabase.

Por último FASE 6: la UI completa del panel con modos, header, input avanzado, etc.

NO intentes implementar todo de golpe. Fase a fase, probando que cada fase funciona antes de pasar a la siguiente.
