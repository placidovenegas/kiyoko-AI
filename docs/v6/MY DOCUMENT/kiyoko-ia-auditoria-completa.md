# Kiyoko AI — Auditoría Completa del Sistema de IA

> Documento generado tras análisis exhaustivo del código fuente real. Describe QUE HAY implementado, QUE FUNCIONA, QUE NO FUNCIONA, y donde están los gaps entre la especificación V8 y la realidad del código.

**Fecha**: 2026-03-26
**Archivos analizados**: ~45 componentes, 12 módulos de lógica, 3 stores, 2 API routes

---

## INDICE

1. [Arquitectura general del flujo IA](#1-arquitectura-general)
2. [Componentes de chat implementados](#2-componentes-implementados)
3. [Componentes especificados pero NO implementados](#3-componentes-no-implementados)
4. [Sistema de agentes y routing](#4-sistema-de-agentes)
5. [System prompts y qué le dice al LLM](#5-system-prompts)
6. [Bloques parseados y renderizado](#6-bloques-parseados)
7. [Flujo de creación (dock overlay)](#7-flujo-creacion)
8. [Action plans y ejecución](#8-action-plans)
9. [Contexto: qué datos se envían al LLM](#9-contexto)
10. [Providers y fallback chain](#10-providers)
11. [Problemas detectados y gaps](#11-problemas)
12. [Mapa de archivos](#12-mapa-archivos)

---

## 1. Arquitectura general del flujo IA {#1-arquitectura-general}

### Flujo completo: Usuario pregunta → IA responde

```
┌─ FRONTEND ──────────────────────────────────────────────────┐
│                                                              │
│  ChatInput.tsx                                               │
│    ↓ usuario escribe + adjunta imágenes opcionales           │
│    ↓ click Send / Enter                                      │
│                                                              │
│  useKiyokoChat.ts (Zustand store - 910 líneas)               │
│    ↓ uploadImages() → Supabase Storage                       │
│    ↓ crea mensaje usuario + placeholder asistente            │
│    ↓ isStreaming=true, isThinking=true                        │
│    ↓ POST /api/ai/chat (SSE)                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ API ROUTE ─────────────────────────────────────────────────┐
│                                                              │
│  /api/ai/chat/route.ts                                       │
│    1. Autenticación (Supabase)                               │
│    2. Detectar contextLevel (dashboard/project/video/scene)  │
│    3. Cargar datos de BD según nivel                         │
│    4. detectIntent() → regex clasifica mensaje               │
│    5. selectAgent() → elige agente + system prompt           │
│    6. Resolver providers (API keys + cooldowns + fallback)   │
│    7. streamText() → Vercel AI SDK                           │
│    8. SSE stream → frontend                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌─ FRONTEND (streaming) ──────────────────────────────────────┐
│                                                              │
│  useKiyokoChat.ts                                            │
│    ↓ THINK phase (800-1200ms) → muestra dots animados        │
│    ↓ STREAM phase → acumula tokens en tiempo real            │
│    ↓ parseAiMessage() → extrae bloques especiales            │
│    ↓ Actualiza messages[] en store                           │
│    ↓ Guarda conversación en BD                               │
│                                                              │
│  ChatMessage.tsx (1000+ líneas)                              │
│    ↓ Renderiza markdown + bloques especiales                 │
│    ↓ Cada [BLOQUE] → componente React específico             │
│                                                              │
│  KiyokoChat.tsx (1000+ líneas)                               │
│    ↓ Si detecta [CREATE:tipo] → abre dock overlay            │
│    ↓ Si hay action plan → muestra botón ejecutar             │
│    ↓ Si hay sugerencias → muestra chips de follow-up         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Fases V8 del chat

| Fase | Duración | Visual | Estado |
|------|----------|--------|--------|
| `idle` | - | Input habilitado | Sin actividad |
| `think` | 800-1200ms | Dots pulsantes (StreamingWave) | `isThinking: true` |
| `stream` | Variable | Texto typewriter | `isStreaming: true, isThinking: false` |
| `dock` | Hasta cierre | Overlay de creación | `creationDockOpen: true` |
| `save` | ~900ms | Barra de progreso (4 pasos) | Guardando en BD |
| `done` | - | Sugerencias + resultado | Todo false |

---

## 2. Componentes de chat IMPLEMENTADOS {#2-componentes-implementados}

### 2.1 Componentes de infraestructura (FUNCIONAN)

| Componente | Archivo | Qué hace | Estado |
|------------|---------|----------|--------|
| **KiyokoPanel** | `kiyoko/KiyokoPanel.tsx` | Contenedor con 3 modos (sidebar/floating/fullscreen) | OK |
| **KiyokoButton** | `kiyoko/KiyokoButton.tsx` | Botón flotante bottom-right para abrir chat | OK |
| **KiyokoHeader** | `kiyoko/KiyokoHeader.tsx` | Cabecera con avatar, agente activo, controles | OK |
| **KiyokoEmptyState** | `kiyoko/KiyokoEmptyState.tsx` | Estado vacío con acciones rápidas contextuales | OK |
| **KiyokoChat** | `chat/KiyokoChat.tsx` | Orquestador principal (~1000 líneas) | OK parcial |
| **ChatMessage** | `chat/ChatMessage.tsx` | Renderiza mensajes con bloques (~1000 líneas) | OK parcial |
| **ChatInput** | `chat/ChatInput.tsx` | Input con imágenes, providers, contexto (~773 líneas) | OK |
| **ChatHistorySidebar** | `chat/ChatHistorySidebar.tsx` | Historial de conversaciones agrupado por fecha | OK |
| **StreamingWave** | `chat/StreamingWave.tsx` | Animación de "pensando" + skeletons contextuales | OK |
| **ChatContextStrip** | `chat/ChatContextStrip.tsx` | Muestra contexto activo (proyecto/video/escena) | OK |
| **ChatFollowUpList** | `chat/ChatFollowUpList.tsx` | Sugerencias de siguiente paso con stagger | OK |
| **ChatInputV2** | `chat/ChatInputV2.tsx` | Versión alternativa del input | Sin usar |
| **ChatQuestionPrompt** | `chat/ChatQuestionPrompt.tsx` | Prompt de pregunta | Sin verificar |
| **ChatSandboxView** | `chat/ChatSandboxView.tsx` | Vista sandbox para playground | Sin verificar |
| **ChatSandboxEmptyState** | `chat/ChatSandboxEmptyState.tsx` | Empty state del sandbox | Sin verificar |
| **ThinkingIndicator** | `chat/ThinkingIndicator.tsx` | Indicador alternativo de pensando | Sin verificar |

### 2.2 Tarjetas de datos (cards inline) — IMPLEMENTADAS

| Componente | Archivo | Qué muestra | Se activa con |
|------------|---------|-------------|---------------|
| **ProjectSummaryCard** | `chat/ProjectSummaryCard.tsx` | Stats grid + lista de videos | `[PROJECT_SUMMARY]` |
| **VideoSummaryCard** | `chat/VideoSummaryCard.tsx` | Metadata del video | `[VIDEO_SUMMARY]` |
| **SceneDetailCard** | `chat/SceneDetailCard.tsx` | Info de escena + prompts | `[SCENE_DETAIL]` |
| **ResourceListCard** | `chat/ResourceListCard.tsx` | Grid de personajes/fondos | `[RESOURCE_LIST]` |
| **ScenePlanTimeline** | `chat/ScenePlanTimeline.tsx` | Timeline de escenas staggered | `[SCENE_PLAN]` |
| **PreviewCard** | `chat/PreviewCard.tsx` | Preview genérica | `[PREVIEW]` |
| **EntitySelector** | `chat/EntitySelector.tsx` | Selector de escena/video/personaje/fondo | `[SELECT:tipo]` |

### 2.3 Tarjetas de creación (dock overlay) — IMPLEMENTADAS

| Componente | Archivo | Qué crea | Se activa con |
|------------|---------|----------|---------------|
| **CharacterCreationCard** | `chat/CharacterCreationCard.tsx` | Personaje (nombre, rol, visual, personalidad) | `[CREATE:character]` |
| **BackgroundCreationCard** | `chat/BackgroundCreationCard.tsx` | Fondo (nombre, tipo, hora, descripción) | `[CREATE:background]` |
| **VideoCreationCard** | `chat/VideoCreationCard.tsx` | Video (título, plataforma, duración) | `[CREATE:video]` |
| **ProjectCreationCard** | `chat/ProjectCreationCard.tsx` | Proyecto (título, descripción, estilo) | `[CREATE:project]` |
| **CreationSuccessCard** | `chat/CreationSuccessCard.tsx` | Confirmación post-creación con next steps | Tras guardar |
| **CreationCancelledCard** | `chat/CreationCancelledCard.tsx` | Cancelación con opción de reintentar | Tras cancelar |
| **CreationSaveProgress** | `chat/CreationSaveProgress.tsx` | Barra de progreso 4 pasos | Durante guardado |

### 2.4 Bloques UI especiales

| Componente | Uso | Nota |
|------------|-----|------|
| **PromptBlock** | `ui/PromptBlock.tsx` | Muestra prompt con botón copiar | Existe |
| **chat-bubble** | `ui/chat-bubble.tsx` | Burbuja base de mensaje | Existe |
| **chat-panel** | `ui/chat-panel.tsx` | Panel base de chat | Existe |

---

## 3. Componentes especificados en V8 pero NO IMPLEMENTADOS {#3-componentes-no-implementados}

La especificación V8 (`kiyoko-v8-especificacion-completa.md`) define **35+ componentes** de chat. Aquí están los que **NO existen** en el código:

### 3.1 Componentes de datos que FALTAN

| Componente spec | Qué debería mostrar | Estado |
|-----------------|---------------------|--------|
| **CharacterCard** (detalle) | Nombre + avatar + rol + identidad visual + reglas + galería + escenas | NO EXISTE — solo hay `CharacterCreationCard` (formulario de creación) |
| **BackgroundCard** (detalle) | Nombre + tipo + thumbnail + ángulos + análisis IA + prompt snippet | NO EXISTE — solo hay `BackgroundCreationCard` |
| **SceneCard** (compacta) | Título + nº + arc_phase + status pipeline | NO EXISTE como componente independiente |
| **VideoCard** (chat) | Título + plataforma + tipo + stats | NO EXISTE — `VideoSummaryCard` es más básico |
| **TaskCard** | Título + prioridad + categoría + status + descripción | NO EXISTE en chat |
| **CameraBlock** | Ángulo + movimiento + lighting + mood + ai_reasoning | NO EXISTE |
| **PromptBlock** (chat) | Prompt actual + versiones + tipo + status | PARCIAL — existe `ui/PromptBlock.tsx` pero no muestra versiones |
| **MediaGallery** | Imágenes/videos generados + versiones + generador | NO EXISTE |
| **ClipBlock** | Clips de video + extensiones + duración | NO EXISTE |
| **CastingBlock** | Personaje → escena + rol_in_scene | NO EXISTE |
| **LocationBlock** | Fondo → escena + ángulo + time_of_day | NO EXISTE |
| **CharImageGallery** | Galería de imágenes del personaje | NO EXISTE |
| **NarrationBlock** | Texto + voz + audio player + velocidad | NO EXISTE |
| **AnalysisBlock** | Score + fortalezas + debilidades + sugerencias | NO EXISTE |
| **ArcTimeline** | Fases del arco narrativo con tiempos y colores | NO EXISTE |
| **StyleBlock** | Prompt prefix/suffix + negative + paleta | NO EXISTE |
| **TemplateBlock** | Template con variables | NO EXISTE |
| **ShareBlock** | Token + link + opciones compartir | NO EXISTE |
| **AnnotationsBlock** | Comentarios del cliente + resolución | NO EXISTE |
| **CommentsBlock** | Comentarios internos | NO EXISTE |
| **ActivityBlock** | Historial de acciones | NO EXISTE |
| **ExportBlock** | Formato + progreso + link descarga | NO EXISTE |
| **ApiStatusBanner** | Providers configurados + estado | NO EXISTE |
| **PublishBlock** | Plataforma + programación + stats | NO EXISTE |
| **TimeBlock** | Tiempo por tarea/video + timer | NO EXISTE |

### 3.2 Componentes de flujo que FALTAN

| Componente spec | Qué debería hacer | Estado |
|-----------------|-------------------|--------|
| **SceneReadiness** | Checklist: ¿personaje? ¿fondo? ¿cámara? ¿prompt? | NO EXISTE |
| **GenerationFlow** | Paso a paso: prompt → imagen → video clip | NO EXISTE |
| **BatchGenerator** | Genera prompts para todas las escenas con progreso | NO EXISTE |
| **ProjectOverview** | Stats agregadas del proyecto completo | PARCIAL — `ProjectSummaryCard` es básico |

---

## 4. Sistema de agentes y routing {#4-sistema-de-agentes}

### 4.1 Detección de intent (regex)

**Archivo**: `src/lib/ai/detect-intent.ts`

| Intent | Keywords que lo activan | Ejemplo |
|--------|------------------------|---------|
| `create_scenes` | "crea escena", "planifica", "estructura video", "plan scenes" | "Crea las escenas para este video" |
| `generate_prompts` | "prompt", "genera imagen", "batch prompt" | "Genera los prompts de imagen" |
| `edit_scene` | "cambia escena", "cámara", "reorden", "asignar personaje" | "Cambia la cámara de la escena 3" |
| `general` | **Todo lo demás** (default) | "Hola", "Resumen del proyecto", "Crea un personaje" |

### PROBLEMA CRITICO: La detección de intent es solo por regex

- "Crea un personaje" → `general` (no matchea ningún regex de create_scenes/generate_prompts/edit_scene)
- "Muéstrame los personajes" → `general`
- "Genera una narración" → `general`
- **El 90% de las preguntas van al agente `router`** porque los regex son muy específicos para escenas/prompts

### 4.2 Agentes disponibles

| Agente | Temperatura | Providers preferidos | Cuándo se usa |
|--------|-------------|---------------------|---------------|
| **Router** | 0.3 | Groq, Gemini, Mistral, Cerebras | Todo lo general (la mayoría de mensajes) |
| **Scene Creator** | 0.7 | OpenAI, Claude, Gemini, Groq | Solo cuando dice "crea escena", "planifica" |
| **Prompt Generator** | 0.8 | Claude, OpenAI, Gemini, Mistral | Solo cuando dice "prompt", "genera imagen" |
| **Scene Editor** | 0.4 | OpenAI, Groq, Gemini, Mistral | Solo cuando dice "cambia escena", "cámara" |
| **Project Assistant** | Variable | Según disponibilidad | Nivel proyecto (sin video/scene) |

### 4.3 System prompt del Router (agente principal)

El router recibe instrucciones de:
- Responder en 2-3 líneas máximo
- Usar componentes visuales en vez de texto largo
- Bloques disponibles: `[ACTION_PLAN]`, `[OPTIONS]`, `[SCENE_PLAN]`, `[SCENE_DETAIL]`, `[RESOURCE_LIST]`, `[VIDEO_SUMMARY]`, `[CREATE:tipo]`, `[SUGGESTIONS]`

**PROBLEMA**: El LLM tiene que generar JSON válido dentro de los bloques. Si el JSON es inválido o el formato del bloque no es exacto, el parser falla silenciosamente y se muestra como texto plano.

---

## 5. System prompts detallados {#5-system-prompts}

### 5.1 Prompt por nivel de contexto

| Nivel | Datos que se cargan de BD | Bloques permitidos |
|-------|--------------------------|-------------------|
| **Dashboard** | Nada (sin proyecto) | `[CREATE:project]`, `[PREVIEW:project]`, `[SUGGESTIONS]` |
| **Proyecto** | Proyecto + todos los videos + personajes + fondos | `[CREATE:video]`, `[CREATE:character]`, `[CREATE:background]`, `[PROJECT_SUMMARY]`, `[RESOURCE_LIST]`, `[OPTIONS]`, `[SUGGESTIONS]` |
| **Video** | Video + todas las escenas + personajes + fondos | `[ACTION_PLAN]`, `[SCENE_PLAN]`, `[SCENE_DETAIL]`, `[RESOURCE_LIST]`, `[VIDEO_SUMMARY]`, `[CREATE:character]`, `[CREATE:background]`, `[OPTIONS]`, `[SUGGESTIONS]` |
| **Escena** | Escena específica + prompts + cámara | `[SCENE_DETAIL]`, `[PROMPT_PREVIEW]`, `[DIFF]`, `[ACTION_PLAN]`, `[SUGGESTIONS]` |

### 5.2 Identidad de Kiyoko

El system prompt define a Kiyoko como:
- **"Directora creativa"** — tono profesional pero cercano
- Respuestas **cortas** (2-3 líneas máximo para el router)
- **Siempre** terminar con `[SUGGESTIONS]` (3-5 sugerencias de siguiente paso)
- Preferir **componentes visuales** sobre texto largo
- Si el usuario pide crear algo → mostrar `[CREATE:tipo]` inmediatamente

### 5.3 Datos del proyecto que recibe el LLM

Cuando estás en nivel **Video**, el LLM recibe:

```
Video: "Product Demo" (youtube, 60s)
Estado: draft

Escenas existentes:
  #1 "Hook" (5s) — hook — personaje: Luna, fondo: Oficina — prompts: 1 ✓
  #2 "Problema" (10s) — build — personaje: Luna — prompts: 0 ⚠️
  #3 "Solución" (15s) — build — sin personaje ⚠️ — prompts: 0 ⚠️

Personajes disponibles: Luna (protagonista), Max (secundario)
Fondos disponibles: Oficina, Ciudad, Parque

Reglas del proyecto: [si existen en global_prompt_rules]
```

---

## 6. Bloques parseados y cómo se renderizan {#6-bloques-parseados}

### 6.1 Parser de mensajes

**Archivo**: `src/lib/ai/parse-ai-message.ts`

El parser busca estos patrones en el texto del LLM:

```
[TIPO:subtipo]
  contenido JSON o texto
[/TIPO]
```

### 6.2 Todos los bloques soportados por el parser

| Bloque | Formato | Componente que renderiza | Funciona? |
|--------|---------|--------------------------|-----------|
| `[ACTION_PLAN]{json}[/ACTION_PLAN]` | JSON con actions[] | `ActionPlanCard` en ChatMessage | SI |
| `[CREATE:character]{json}[/CREATE]` | JSON con prefill data | Abre `CharacterCreationCard` dock | SI |
| `[CREATE:background]{json}[/CREATE]` | JSON con prefill data | Abre `BackgroundCreationCard` dock | SI |
| `[CREATE:video]{json}[/CREATE]` | JSON con prefill data | Abre `VideoCreationCard` dock | SI |
| `[CREATE:project]{json}[/CREATE]` | JSON con prefill data | Abre `ProjectCreationCard` dock | SI |
| `[PROJECT_SUMMARY]{json}[/PROJECT_SUMMARY]` | JSON con stats | `ProjectSummaryCard` | SI — pero datos limitados |
| `[VIDEO_SUMMARY]{json}[/VIDEO_SUMMARY]` | JSON con metadata | `VideoSummaryCard` | SI — pero datos limitados |
| `[SCENE_DETAIL]{json}[/SCENE_DETAIL]` | JSON con scene data | `SceneDetailCard` | SI — pero datos limitados |
| `[RESOURCE_LIST]{json}[/RESOURCE_LIST]` | JSON con items[] | `ResourceListCard` | SI |
| `[SCENE_PLAN]{json}[/SCENE_PLAN]` | JSON con scenes[] | `ScenePlanTimeline` | SI |
| `[SELECT:tipo]{json}[/SELECT]` | JSON con options[] | `EntitySelector` | SI |
| `[OPTIONS]{json}[/OPTIONS]` | JSON con choices[] | `OptionsBlock` inline | SI |
| `[PREVIEW:tipo]{json}[/PREVIEW]` | JSON con preview data | `PreviewCard` | SI |
| `[PROMPT_PREVIEW]{text}[/PROMPT_PREVIEW]` | Texto del prompt | Code block con copy | SI |
| `[DIFF]{json}[/DIFF]` | JSON con old/new | `DiffView` | SI |
| `[SUGGESTIONS][...][/SUGGESTIONS]` | JSON array de strings | `ChatFollowUpList` | SI |
| `[WORKFLOW:id\|label,...][/WORKFLOW]` | Inline buttons | Botones en línea | SI |
| `[AUDIO: url]` | URL de audio | Botón play | SI |

### 6.3 PROBLEMA: El LLM no siempre genera los bloques correctamente

- El JSON dentro de los bloques a veces es inválido (comillas faltantes, trailing commas)
- El LLM a veces usa formato legacy en vez del formato con corchetes
- El parser tiene fallbacks pero no cubre todos los casos
- **Cuando el parser falla, el bloque se muestra como texto plano** — el usuario ve JSON crudo

---

## 7. Flujo de creación (dock overlay) {#7-flujo-creacion}

### 7.1 Cómo se activa

```
1. El LLM genera [CREATE:character]{...prefill...}[/CREATE]
2. parseAiMessage() detecta bloque CREATE
3. ChatMessage renderiza el bloque
4. KiyokoChat detecta el tipo CREATE
5. Abre el dock overlay con el formulario prefilled
6. El chat se oscurece, el input se deshabilita
7. Usuario edita y guarda O cancela
```

### 7.2 Formularios de creación

#### CharacterCreationCard
- **Campos**: nombre, rol (dropdown: protagonista/antagonista/secundario/narrador/extra), descripción, personalidad, visual_description (EN), imagen referencia
- **AI assists**: "Sugerir personalidad", "Sugerir prompt visual"
- **Guarda en**: tabla `characters` + imagen en `characters/{projectId}/{uuid}`

#### BackgroundCreationCard
- **Campos**: nombre, location_type (interior/exterior/mixto), time_of_day (amanecer/día/atardecer/noche), description (EN), imagen referencia
- **AI assists**: "Sugerir descripción"
- **Guarda en**: tabla `backgrounds` + imagen en `backgrounds/{projectId}/{uuid}`

#### VideoCreationCard
- **Campos**: título, platform (instagram_reels/youtube/tiktok/tv_commercial/web), duration (15/30/60/180/300s), descripción
- **AI assists**: "Sugerir título", "Sugerir descripción"
- **Guarda en**: tabla `videos`

#### ProjectCreationCard
- **Campos**: título, descripción, client_name, style (pixar/realistic/anime/watercolor/flat_2d/cyberpunk/custom)
- **AI assists**: "Sugerir título", "Sugerir descripción"
- **Guarda en**: tabla `projects`

### 7.3 Post-creación

Tras guardar exitosamente:
1. Se inyecta `CreationSuccessCard` en el chat con:
   - Avatar con inicial del nombre
   - Badge del tipo (CHARACTER/VIDEO/etc.)
   - "Creado y guardado" con check
   - Lista de next steps (ChatFollowUpList)
2. Navegación automática (si es video/proyecto → navega a la nueva página)

---

## 8. Action Plans y ejecución {#8-action-plans}

### 8.1 Estructura de un action plan

```json
{
  "description": "Crear 5 escenas con arco narrativo completo",
  "requires_confirmation": true,
  "actions": [
    {
      "type": "create_scene",
      "table": "scenes",
      "data": {
        "video_id": "uuid",
        "scene_number": 1,
        "title": "Hook — Impacto visual",
        "duration_seconds": 5,
        "arc_phase": "hook",
        "description": "..."
      }
    },
    {
      "type": "update_scene",
      "table": "scenes",
      "entity_id": "uuid",
      "data": { "title": "Nuevo título" }
    }
  ]
}
```

### 8.2 Acciones soportadas por el executor

**Archivo**: `src/lib/ai/action-executor.ts`

| Tipo de acción | Tabla | Qué hace |
|----------------|-------|----------|
| `create_scene` | `scenes` | Crea escena + opcionalmente `scene_camera` |
| `update_scene` | `scenes` | Actualiza campos de escena |
| `delete_scene` | `scenes` | Elimina escena |
| `update_prompt` | `scene_prompts` | Crea nueva versión del prompt (versionado) |

### 8.3 Sistema de snapshots (undo)

- Antes de cada mutación, guarda snapshot en `entity_snapshots`
- Almacena: entity_type, entity_id, action_type, snapshot_data completo
- Permite deshacer batch completo con `undoBatch(batchId)`
- El botón "Deshacer" aparece en el `ActionPlanCard` tras ejecutar

### 8.4 PROBLEMA: Acciones limitadas

El executor solo soporta operaciones sobre `scenes` y `scene_prompts`. **No puede**:
- Crear/editar personajes (solo el dock overlay puede)
- Crear/editar fondos
- Asignar personajes a escenas (`scene_characters`)
- Asignar fondos a escenas (`scene_backgrounds`)
- Crear/editar tareas
- Modificar configuración de cámara
- Generar imágenes/videos/audio

---

## 9. Contexto: qué datos se envían al LLM {#9-contexto}

### 9.1 Context Client Hint

**Archivo**: `src/lib/chat/build-context-client-hint.ts`

Se construye un texto que se prepende al system prompt con:

```
Nivel de navegación: Vista video
project_id: {uuid}
video_id: {uuid}
Proyecto visible: "Summer Campaign"
Video visible: "Product Demo"
En este proyecto (conteos reales):
  tareas 3 abiertas de 12 totales
  vídeos 2, personajes 4, fondos 3, escenas 12
Claves API propias (BYOK) activas: 1
```

### 9.2 Datos de BD cargados por nivel

#### Dashboard
- **Nada** — sin proyecto ni datos

#### Proyecto
- `projects`: id, title, description, style, status, color_palette, ai_brief, global_prompt_rules, short_id
- `videos`: id, title, short_id, platform, video_type, target_duration_seconds, status, description
- `characters`: Todos los del proyecto (nombre, rol, visual_description, prompt_snippet, etc.)
- `backgrounds`: Todos los del proyecto (nombre, tipo, hora, prompt_snippet, etc.)

#### Video
- Todo lo anterior +
- `scenes`: scene_number, title, description, scene_type, arc_phase, duration_seconds, status, director_notes
- `scene_characters`: qué personaje está en qué escena
- `scene_backgrounds`: qué fondo está en qué escena
- `scene_prompts`: prompts actuales (is_current=true)

#### Escena
- Todo lo anterior +
- Escena específica con todos sus prompts (incluyendo versiones anteriores)
- `scene_camera`: configuración de cámara

### 9.3 PROBLEMA: Mucha información, poco procesamiento

- Se envía TODA la información de TODAS las escenas, personajes y fondos al LLM
- No hay filtrado ni resumen — si un proyecto tiene 30 escenas, las 30 van en el prompt
- Esto puede exceder context windows de providers baratos (Groq, Cerebras)
- No hay caché — cada mensaje recarga todo de la BD

---

## 10. Providers y fallback chain {#10-providers}

### 10.1 Cadena de providers

**Archivo**: `src/lib/ai/sdk-router.ts`

```
Orden de fallback (TEXT_CHAIN):
  1. Groq (gratis)
  2. Mistral (gratis)
  3. Gemini (gratis)
  4. Cerebras (gratis)
  5. Grok (gratis)
  6. DeepSeek (gratis)
  7. Claude (premium)
  8. OpenAI (premium)
```

### 10.2 Comportamiento

- Intenta el primero disponible
- Si falla (rate limit, error), aplica cooldown (3 min) y prueba el siguiente
- Errores de auth/billing → cooldown 24h
- El usuario puede seleccionar un provider preferido en el chip del ChatInput
- Si hay imágenes adjuntas → prioriza providers con visión (Gemini, Claude, OpenAI)

### 10.3 Headers de respuesta

```
X-AI-Provider: gemini          // Qué provider respondió
X-Active-Agent: router         // Qué agente procesó
X-Context-Level: video         // Nivel de contexto
```

### 10.4 PROBLEMA: Provider routing no óptimo

- Los providers gratuitos (Groq, Cerebras) tienen context windows pequeños
- Pero el router los prioriza para TODO, incluyendo consultas con mucho contexto
- No hay lógica que calcule el tamaño del contexto y seleccione provider apropiado
- Resultado: muchas veces el primer provider falla y tiene que hacer fallback

---

## 11. Problemas detectados y gaps {#11-problemas}

### 11.1 CRITICO — Componentes que faltan

La spec V8 define 35+ componentes de chat. **Solo hay 7 componentes de datos** implementados:
- `ProjectSummaryCard`, `VideoSummaryCard`, `SceneDetailCard`, `ResourceListCard`, `ScenePlanTimeline`, `EntitySelector`, `PreviewCard`

**Faltan 25+ componentes** incluyendo todos los de detalle (CharacterCard, BackgroundCard, TaskCard, CameraBlock, MediaGallery, NarrationBlock, AnalysisBlock, etc.)

**Impacto**: Cuando el usuario pregunta "muéstrame los detalles del personaje Luna", el LLM solo puede responder con texto plano. No hay componente visual que muestre la ficha del personaje.

### 11.2 CRITICO — Detección de intent demasiado limitada

El sistema de regex solo detecta 3 intents específicos + general (default). Resultado:
- "Crea un personaje" → `general` (no `create_character`)
- "Muéstrame las tareas" → `general`
- "Analiza el pacing" → `general`
- "Genera una narración" → `general`

**Impacto**: El 90%+ de los mensajes van al agente Router con temperatura 0.3 y providers gratuitos, cuando podrían beneficiarse de agentes especializados.

### 11.3 ALTO — El LLM no siempre genera bloques válidos

- El formato `[TIPO]{json}[/TIPO]` depende de que el LLM genere JSON perfecto
- Providers gratuitos (Groq, Cerebras) con modelos pequeños fallan más
- Cuando el JSON es inválido, el usuario ve texto crudo en vez de componente
- No hay retry ni corrección automática

### 11.4 ALTO — Action executor muy limitado

Solo soporta `create_scene`, `update_scene`, `delete_scene`, `update_prompt`. No puede:
- Crear/editar personajes o fondos via action plan
- Asignar personajes/fondos a escenas
- Generar imágenes/videos
- Crear tareas
- Modificar cámara

**Impacto**: El LLM dice "Voy a asignar el personaje Luna a las escenas 1, 3 y 5" pero no puede ejecutarlo.

### 11.5 MEDIO — Context overflow con providers baratos

Se envía TODO el contexto (30 escenas, 10 personajes, 5 fondos) a providers con 8K-32K context window.

### 11.6 MEDIO — Sin generación de media

La spec menciona GenerationFlow y BatchGenerator pero no existe nada que:
- Llame a APIs de generación de imágenes (DALL-E, Midjourney, etc.)
- Genere video clips
- Genere audio/narración desde el chat
- Muestre progreso de generación

### 11.7 BAJO — Componentes sin usar

- `ChatInputV2.tsx` — versión alternativa del input, no se usa
- `ChatSandboxView.tsx` / `ChatSandboxEmptyState.tsx` — playground, no integrado
- `chatDockOverlay.ts` — utilidad sin verificar uso

### 11.8 RESUMEN: Qué funciona vs qué no

| Funcionalidad | Estado |
|---------------|--------|
| Abrir/cerrar chat panel | OK |
| 3 modos (sidebar/floating/fullscreen) | OK |
| Enviar mensaje y recibir streaming | OK |
| Fase THINK con dots animados | OK |
| Seleccionar provider | OK |
| Historial de conversaciones | OK |
| Adjuntar imágenes | OK |
| Crear personaje/fondo/video/proyecto via dock | OK |
| Ver ProjectSummaryCard | OK (básico) |
| Ver ScenePlanTimeline | OK |
| Ejecutar action plan (crear escenas) | OK |
| Deshacer batch de acciones | OK |
| Sugerencias de follow-up | OK |
| Empty state con acciones rápidas | OK |
| --- | --- |
| Ver detalle de personaje en chat | NO — falta CharacterCard |
| Ver detalle de fondo en chat | NO — falta BackgroundCard |
| Ver tareas en chat | NO — falta TaskCard |
| Ver/editar cámara en chat | NO — falta CameraBlock |
| Ver media generada | NO — falta MediaGallery |
| Generar imágenes/video/audio | NO — falta GenerationFlow |
| Batch de prompts con progreso | NO — falta BatchGenerator |
| Asignar personajes a escenas via IA | NO — executor limitado |
| Analizar pacing/ritmo visual | NO — falta AnalysisBlock |
| Narración/TTS | NO — falta NarrationBlock |
| Compartir/review con clientes | NO — faltan ShareBlock, AnnotationsBlock |
| Exportar desde chat | NO — falta ExportBlock |
| Ver historial de actividad | NO — falta ActivityBlock |
| Publicar en redes | NO — falta PublishBlock |

---

## 12. Mapa de archivos {#12-mapa-archivos}

### Componentes del chat

```
src/components/chat/
├── KiyokoChat.tsx              ← Orquestador principal (~1000 líneas)
├── ChatMessage.tsx             ← Renderiza mensajes (~1000 líneas)
├── ChatInput.tsx               ← Input con imágenes y providers (~773 líneas)
├── ChatInputV2.tsx             ← Versión alternativa (sin usar)
├── ChatHistorySidebar.tsx      ← Historial agrupado por fecha
├── ChatContextStrip.tsx        ← Strip de contexto activo
├── ChatFollowUpList.tsx        ← Sugerencias de follow-up
├── ChatQuestionPrompt.tsx      ← Prompt de pregunta
├── ChatSandboxView.tsx         ← Vista sandbox
├── ChatSandboxEmptyState.tsx   ← Empty state sandbox
├── StreamingWave.tsx           ← Animación think + skeletons
├── ThinkingIndicator.tsx       ← Indicador alternativo
├── chatDockOverlay.ts          ← Utilidad dock
│
├── CharacterCreationCard.tsx   ← Formulario crear personaje
├── BackgroundCreationCard.tsx  ← Formulario crear fondo
├── VideoCreationCard.tsx       ← Formulario crear video
├── ProjectCreationCard.tsx     ← Formulario crear proyecto
├── CreationSuccessCard.tsx     ← Card de éxito post-creación
├── CreationCancelledCard.tsx   ← Card de cancelación
├── CreationSaveProgress.tsx    ← Barra de progreso guardado
│
├── ProjectSummaryCard.tsx      ← Resumen de proyecto
├── VideoSummaryCard.tsx        ← Resumen de video
├── SceneDetailCard.tsx         ← Detalle de escena
├── ResourceListCard.tsx        ← Lista de recursos
├── ScenePlanTimeline.tsx       ← Timeline de escenas
├── PreviewCard.tsx             ← Preview genérica
├── EntitySelector.tsx          ← Selector de entidades
└── (ActionPlanCard inline en ChatMessage)
```

### Panel Kiyoko

```
src/components/kiyoko/
├── KiyokoPanel.tsx             ← Contenedor con 3 modos
├── KiyokoButton.tsx            ← Botón flotante
├── KiyokoHeader.tsx            ← Cabecera con controles
└── KiyokoEmptyState.tsx        ← Estado vacío con acciones
```

### Lógica IA

```
src/lib/ai/
├── system-prompt.ts            ← System prompts por nivel
├── detect-intent.ts            ← Clasificador regex
├── select-agent.ts             ← Selector de agente
├── sdk-router.ts               ← Provider routing + fallback
├── parse-ai-message.ts         ← Parser de bloques
├── action-executor.ts          ← Ejecutor de action plans
└── agents/
    ├── router.ts               ← Agente general
    ├── project-assistant.ts    ← Agente de proyecto
    ├── scene-creator.ts        ← Agente de escenas
    ├── prompt-generator.ts     ← Agente de prompts
    └── scene-editor.ts         ← Agente de edición

src/lib/chat/
├── build-context-client-hint.ts ← Constructor de hint contextual
└── resolve-next-step-route.ts   ← Resolución de rutas post-creación
```

### State

```
src/stores/ai-store.ts          ← Zustand: panel UI state
src/hooks/useKiyokoChat.ts      ← Zustand: chat state + streaming (910 líneas)
src/types/chat-v8.ts            ← Tipos V8 + constantes de timing
```

### API

```
src/app/api/ai/chat/route.ts    ← SSE endpoint principal
```

---

## 13. Mejoras visuales del streaming (implementadas)

### 13.1 Problema: Skeleton generico durante fase THINK

**Antes**: Cuando la IA empezaba a pensar (fase THINK, 800-1200ms), se mostraba el SVG animado de Kiyoko + un skeleton generico inferido del prompt del usuario. Como la inferencia casi siempre fallaba, se veía un skeleton `generic` que no correspondía a nada.

**Después**:
- **Fase THINK**: Solo SVG animado de Kiyoko + dots pulsantes + label "Preparando respuesta...". Sin skeleton.
- **Fase STREAM**: SVG + label contextual ("Montando la ficha de escena...", etc.)
- **Skeleton**: Solo aparece cuando se detecta un tag parcial REAL en el stream (ej: `[PROJECT_SUMMARY]` sin `[/PROJECT_SUMMARY]`). Nunca skeleton `generic`.

### 13.2 Regla visual unificada

```
TODA respuesta de la IA sigue esta secuencia visual:

1. SVG animado de Kiyoko + dots pulsantes (inmediato al enviar)
   → Label: "Preparando respuesta..."

2. Texto typewriter del asistente (cuando llegan tokens)
   → SVG desaparece, texto fluye

3. Si la IA genera un tag de componente [TIPO]:
   → SVG reaparece con label contextual ("Montando el formulario...")
   → Skeleton del componente específico aparece debajo
   → Cuando el tag se cierra [/TIPO]: skeleton reemplazado por componente real

4. Sugerencias de follow-up (stagger 50ms)
```

### 13.3 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `StreamingWave.tsx` | Dots pulsantes junto al SVG, mejor spacing |
| `ChatMessage.tsx` | THINK: sin skeleton. STREAM: skeleton solo con tag parcial real, nunca `generic` |

---

## CONCLUSION

El sistema de IA tiene una **infraestructura sólida** (streaming, providers, agentes, dock overlay, action plans) pero está **muy por debajo de la especificación V8** en cuanto a componentes visuales y capacidades de ejecución.

**Lo que funciona bien:**
- Flujo de streaming V8 (think → stream → done)
- Creación de entidades via dock overlay (4 tipos)
- Creación de escenas via action plans
- Multi-provider con fallback automático
- Persistencia de conversaciones

**Lo que necesita trabajo urgente:**
1. Implementar componentes de datos faltantes (CharacterCard, BackgroundCard, TaskCard, etc.)
2. Ampliar el action executor (asignar personajes, crear tareas, editar cámara)
3. Mejorar detección de intent (NLP o al menos más regex)
4. Implementar generación de media (imágenes, video, audio)
5. Validación de JSON en bloques del LLM con fallback graceful
