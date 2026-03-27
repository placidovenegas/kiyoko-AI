# Kiyoko AI Chat — Diagnóstico completo V2

> Análisis profundo del código fuente. Problemas, lo que ya funciona bien,
> y plan detallado paso a paso para arreglarlo todo.

---

## LO QUE YA FUNCIONA BIEN (no tocar, solo ampliar)

Antes de los problemas — el proyecto tiene una base MUY sólida:

### ✅ Sistema de contexto (ya existe y funciona)

**Archivo:** `src/lib/chat/build-context-client-hint.ts`

Ya construye un hint de contexto rico que incluye:
- Nivel de navegación (dashboard/project/video/scene)
- IDs y títulos del proyecto, video y escena activos
- Stats reales: tareas abiertas, conteos de videos/personajes/fondos/escenas
- Count de API keys BYOK activas del usuario
- **Perfil creativo del usuario** (los nuevos campos creative_*)
- Instrucciones de desambiguación ("no pidas proyecto si ya hay project_id")

### ✅ Campos creative_* del perfil (ya existen)

**Archivo:** `src/lib/chat/fetch-profile-creative-context.ts`

Ya fetcha los 5 campos nuevos del perfil:
```typescript
interface ProfileCreativeContextLite {
  creative_video_types: string | null;      // "animación, tutorials, ads"
  creative_platforms: string | null;         // "YouTube, TikTok, Instagram"
  creative_use_context: string | null;       // "agencia, freelance, hobby"
  creative_purpose: string | null;           // "engagement, ventas, educación"
  creative_typical_duration: string | null;  // "30s-60s reels"
}
```

Y se pasan al context hint:
```
Perfil creativo del usuario:
- Tipos de vídeos que suele hacer: animación, tutorials
- Plataformas: YouTube, TikTok
- Contexto de uso: agencia
- Para qué / audiencia: engagement redes sociales
- Duración habitual: 30-60s
```

### ✅ Componentes de creación como dock (ya existen)

**Archivos:**
- `src/components/chat/CharacterCreationCard.tsx` — dock de crear personaje con upload de imagen, análisis IA, campos completos
- `src/components/chat/BackgroundCreationCard.tsx` — dock de crear fondo
- `src/components/chat/VideoCreationCard.tsx` — dock de crear video
- `src/components/chat/ProjectCreationCard.tsx` — dock de crear proyecto

Estos componentes:
- Se renderizan como overlay sobre el input (`dock={true}`)
- Tienen progreso de guardado (`CreationSaveProgress`)
- Tienen card de éxito (`CreationSuccessCard`) con siguiente paso
- Tienen card de cancelación (`CreationCancelledCard`)
- Aceptan `prefill` con datos pre-rellenados por la IA

### ✅ Fase THINK ya implementada

**Archivo:** `src/hooks/useKiyokoChat.ts`

El store tiene `isThinking: boolean` y `randomThinkDurationMs()` para mostrar dots antes del streaming.

### ✅ Parser de bloques (funciona, solo necesita robustez)

**Archivo:** `src/lib/ai/parse-ai-message.ts`

Ya parsea 12 tipos de bloques: ACTION_PLAN, PREVIEW, SELECT, OPTIONS, DIFF, PROMPT_PREVIEW, SCENE_PLAN, PROJECT_SUMMARY, CREATE, SCENE_DETAIL, RESOURCE_LIST, VIDEO_SUMMARY, SUGGESTIONS.

### ✅ Tools del AI SDK (definidos correctamente)

**Archivo:** `src/lib/ai/tools.ts`

15+ tools para: updateScene, createScene, deleteScene, reorderScenes, createCharacter, updateCharacter, deleteCharacter, addCharacterToScene, removeCharacterFromScene, createBackground, updateBackground, deleteBackground, assignBackgroundToScene, updateCamera, updatePrompt.

### ✅ Multi-provider con fallback

**Archivo:** `src/lib/ai/sdk-router.ts`

Soporta OpenAI, Claude, Gemini, Groq, Mistral, Cerebras con fallback automático.

---

## LOS PROBLEMAS (ordenados por impacto)

---

### PROBLEMA 1: Solo 4 intenciones → 80% va al router genérico

**Archivo:** `src/lib/ai/detect-intent.ts`
**Impacto:** CRÍTICO — es la causa #1 de respuestas sin sentido

```typescript
// ACTUAL: solo 4 intenciones
export type Intent = 'create_scenes' | 'generate_prompts' | 'edit_scene' | 'general';
```

**Todo lo que NO matchea cae en `'general'`** → va al agente `router` que es genérico y sobrecargado.

**Qué intenciones faltan:**

| Categoría | Intenciones que faltan |
|-----------|----------------------|
| Personajes | `create_character`, `view_character`, `list_characters`, `edit_character`, `delete_character`, `generate_character_image` |
| Fondos | `create_background`, `view_background`, `list_backgrounds`, `edit_background`, `delete_background` |
| Videos | `create_video`, `view_video`, `list_videos`, `delete_video` |
| Tareas | `create_task`, `list_tasks`, `edit_task`, `complete_task`, `delete_task` |
| Narración | `generate_narration`, `edit_narration`, `generate_voiceover` |
| Análisis | `analyze_video`, `analyze_scene`, `scene_readiness` |
| Review | `share_for_review`, `view_annotations`, `resolve_annotation` |
| Cámara | `configure_camera`, `suggest_camera` |
| Navegación | `navigate_to`, `open_page` |
| Ideación | `generate_ideas`, `suggest_video` |
| Proyecto | `view_project_summary`, `edit_project`, `view_activity` |
| Estilos | `view_styles`, `edit_style_preset`, `change_project_style` |
| Exportar | `export_video` |
| Meta | `next_steps`, `what_is_missing`, `help` |

**Solución — reescribir `detect-intent.ts`:**
```typescript
// NUEVO: 30+ intenciones agrupadas
export type Intent =
  // Creación
  | 'create_character' | 'create_background' | 'create_video' | 'create_scene' | 'create_task' | 'create_project'
  // Lectura
  | 'view_character' | 'view_background' | 'view_scene' | 'view_video' | 'view_project'
  | 'list_characters' | 'list_backgrounds' | 'list_scenes' | 'list_tasks'
  // Edición
  | 'edit_character' | 'edit_background' | 'edit_scene' | 'edit_video' | 'edit_project'
  // Eliminación
  | 'delete_entity'
  // Generación IA
  | 'generate_prompt' | 'generate_image' | 'generate_video_clip'
  | 'generate_narration' | 'generate_voiceover'
  | 'generate_ideas'
  // Análisis
  | 'analyze_video' | 'analyze_scene' | 'scene_readiness' | 'next_steps'
  // Cámara
  | 'configure_camera'
  // Review
  | 'share_review' | 'view_annotations'
  // Estilos
  | 'view_styles' | 'edit_styles'
  // Actividad
  | 'view_activity'
  // Navegación
  | 'navigate_to'
  // Export
  | 'export_video'
  // General
  | 'general';
```

---

### PROBLEMA 2: Solo 4 agentes → el router hace todo

**Archivo:** `src/lib/ai/select-agent.ts`
**Impacto:** CRÍTICO — el router tiene un prompt imposible

**Actual:**
```
create_scenes  → scene-creator
generate_prompts → prompt-generator
edit_scene → scene-editor
general → router (SOBRECARGADO — hace TODO lo demás)
```

**El router intenta ser:** director creativo + generador de formularios + visor de datos + planificador + clasificador. Tiene instrucciones contradictorias: "respuestas CORTAS" pero "genera JSON complejo".

**Solución — crear agentes especializados y simplificar el router:**

```
Archivos nuevos necesarios:
src/lib/ai/agents/
  ├── character-agent.ts        ← crear/ver/editar/eliminar personajes
  ├── background-agent.ts       ← crear/ver/editar/eliminar fondos
  ├── task-agent.ts             ← crear/ver/editar/completar tareas
  ├── video-analyzer-agent.ts   ← analizar video, scene readiness, next steps
  ├── narration-agent.ts        ← generar/editar narración y voiceover
  ├── ideation-agent.ts         ← generar ideas desde dashboard
  ├── camera-agent.ts           ← configurar/sugerir cámara
  ├── review-agent.ts           ← compartir, anotaciones, feedback
  └── navigation-agent.ts       ← "llévame a X", "abre Y"

Actualizar: src/lib/ai/select-agent.ts
  → enrutar cada intent al agente correcto
  → el router SOLO maneja 'general' y hace preguntas de clarificación
```

---

### PROBLEMA 3: La IA no sabe cuándo mostrar componentes

**Archivos:** `src/lib/ai/agents/router.ts`, todos los agentes
**Impacto:** ALTO — los componentes existen pero no se usan bien

**El problema:** Los agentes tienen instrucciones vagas sobre cuándo emitir bloques. El router dice "cuando pidan crear → [CREATE:character]" pero no tiene reglas claras para TODOS los casos.

**Regla que TODOS los agentes deben seguir:**

```
REGLA ABSOLUTA DE COMPONENTES:

1. CREAR cualquier entidad → SIEMPRE mostrar el dock de creación como componente
   "Crear personaje" → [CREATE:character]{prefill}[/CREATE]
   "Crear fondo"     → [CREATE:background]{prefill}[/CREATE]
   "Crear video"     → [CREATE:video]{prefill}[/CREATE]
   "Crear proyecto"  → [CREATE:project]{prefill}[/CREATE]
   
   El dock se renderiza como overlay sobre el input.
   La IA PRE-RELLENA los campos con datos del mensaje del usuario.

2. VER una entidad → SIEMPRE mostrar el componente de detalle
   "Ver personaje Juan"   → [SCENE_DETAIL]{datos}[/SCENE_DETAIL] (o componente específico)
   "Ver escena #3"        → [SCENE_DETAIL]{datos}[/SCENE_DETAIL]
   "Estado del video"     → [VIDEO_SUMMARY]{datos}[/VIDEO_SUMMARY]
   "Resumen del proyecto" → [PROJECT_SUMMARY]{datos}[/PROJECT_SUMMARY]

3. LISTAR entidades → SIEMPRE mostrar componente de lista
   "Personajes"  → [RESOURCE_LIST]{"type":"characters",...}[/RESOURCE_LIST]
   "Fondos"      → [RESOURCE_LIST]{"type":"backgrounds",...}[/RESOURCE_LIST]
   "Tareas"      → [RESOURCE_LIST]{"type":"tasks",...}[/RESOURCE_LIST]
   "Escenas"     → [SCENE_PLAN][escenas]...[/SCENE_PLAN]

4. GENERAR algo → mostrar el resultado como componente
   "Genera prompt" → [PROMPT_PREVIEW]{prompt}[/PROMPT_PREVIEW]
   "Analiza video" → componente de análisis con score + sugerencias

5. COMPARAR cambios → mostrar diff
   "Compara versiones" → [DIFF]{before,after}[/DIFF]

6. ELEGIR opciones → mostrar opciones clickables
   "¿En qué video?" → [OPTIONS]["Video A","Video B","Crear nuevo"][/OPTIONS]

7. SIEMPRE texto introductorio ANTES del componente
   ✅ "Estos son los personajes del proyecto:\n[RESOURCE_LIST]..."
   ❌ "[RESOURCE_LIST]..." (sin texto previo)
```

**Dónde implementar esto:** En el system prompt de CADA agente. Cada agente debe tener estas reglas incorporadas en su prompt, adaptadas a su dominio.

---

### PROBLEMA 4: Falta el perfil creativo en el flujo de onboarding de la IA

**Archivos:** `src/lib/chat/fetch-profile-creative-context.ts` (ya existe), pero falta la lógica de pedirlos
**Impacto:** MEDIO — la IA no personaliza bien las sugerencias

**Lo que ya funciona:** Los campos `creative_*` del perfil se leen y se pasan al contexto. Si están rellenados, la IA los usa.

**Lo que falta:** Si los campos están vacíos, la IA debería **pedir** que los rellene. Flujo:

```
Usuario: "Dame ideas para un video" (creative_video_types = null)

IA: "Para darte mejores ideas, me ayudaría saber un poco sobre ti:"
    
    [OPTIONS]
    ["Vídeos de animación / cartoon", "Vídeos realistas / cinematográficos", 
     "Anuncios / comerciales", "Tutoriales / educativos", "Otro"]
    [/OPTIONS]
    
    (Al elegir → guardar en profiles.creative_video_types)
    
    "¿Para qué plataforma principalmente?"
    
    [OPTIONS]["YouTube", "Instagram/TikTok", "TV/Web", "Presentaciones", "Varias"][/OPTIONS]
    
    (Al elegir → guardar en profiles.creative_platforms)
```

**Implementación:**

1. En el system prompt, añadir regla:
```
Si el usuario pide ideas/sugerencias y sus campos creative_* están vacíos:
- Pregunta amablemente qué tipo de contenido suele hacer
- Guarda las respuestas en el perfil (tool: updateProfile)
- Usa esa info para personalizar sugerencias futuras
```

2. Nuevo tool en `tools.ts`:
```typescript
updateUserProfile: tool({
  description: 'Actualiza preferencias creativas del usuario en su perfil',
  inputSchema: z.object({
    creative_video_types: z.string().optional(),
    creative_platforms: z.string().optional(),
    creative_use_context: z.string().optional(),
    creative_purpose: z.string().optional(),
    creative_typical_duration: z.string().optional(),
  }),
}),
```

3. Cache en Zustand para acceso rápido:
```typescript
// En un store nuevo o en useAiChatStore:
interface CreativeProfileCache {
  profile: ProfileCreativeContextLite | null;
  loaded: boolean;
  setProfile: (p: ProfileCreativeContextLite) => void;
}

// Se carga una vez al abrir el chat, se cachea en Zustand
// Se actualiza cuando la IA guarda nuevos valores
```

---

### PROBLEMA 5: El store de Zustand no cachea contexto rico

**Archivo:** `src/stores/useAiChatStore.ts`
**Impacto:** MEDIO — cada mensaje recalcula contexto innecesariamente

**Actual:** El store solo tiene `messages`, `isStreaming`, `currentStreamText`. Es mínimo.

**Lo que debería cachear:**

```typescript
// AÑADIR al store existente o crear store dedicado:
interface AiContextCache {
  // Perfil creativo (se carga 1 vez, se cachea)
  creativeProfile: ProfileCreativeContextLite | null;
  creativeProfileLoaded: boolean;
  
  // Stats del proyecto actual (se recarga al cambiar de proyecto)
  projectStats: ProjectContextStatsLite | null;
  
  // Recursos del proyecto (para autocompletar en el chat)
  characters: { id: string; name: string; role: string }[];
  backgrounds: { id: string; name: string }[];
  videos: { id: string; title: string; short_id: string }[];
  
  // APIs disponibles (para saber si puede generar)
  hasImageProvider: boolean;
  hasVideoProvider: boolean;
  hasTTSProvider: boolean;
  apiKeyCount: number;
  
  // Métodos
  loadCreativeProfile: () => Promise<void>;
  loadProjectContext: (projectId: string) => Promise<void>;
  invalidate: () => void;
}
```

**Beneficio:** El chat no tiene que hacer queries repetidas. Al cambiar de proyecto, se invalida y recarga.

---

### PROBLEMA 6: No hay desambiguación real

**Archivos:** System prompt dice "no asumas" pero no da mecanismo
**Impacto:** ALTO — la IA inventa datos en vez de preguntar

**Lo que falta:** Reglas explícitas en el system prompt para cada situación:

```
REGLAS DE DESAMBIGUACIÓN:

1. Si el usuario pide algo que necesita un PROYECTO y no hay projectId:
   → "¿En qué proyecto? Tienes: [lista de proyectos reales]"
   → NUNCA inventar un proyecto

2. Si pide algo que necesita un VIDEO y no hay videoId:
   → "¿En qué video? Tienes: [lista de videos del proyecto]"
   
3. Si pide algo que necesita una ESCENA y no hay sceneId:
   → "¿Para qué escena? Las del video actual son: [lista]"
   
4. Si pide algo que necesita un PERSONAJE y hay varios:
   → "¿Cuál de tus personajes? [lista]"

5. Si el mensaje es AMBIGUO (no encaja en ninguna intención clara):
   → "No te he entendido bien. ¿Quieres:"
   → [OPTIONS con 3-4 sugerencias basadas en el contexto actual]
   
6. Si dice "esto", "eso", "la escena", "el personaje" sin especificar:
   → Si hay sceneId/characterId en contexto → usar ese
   → Si no → preguntar cuál
```

---

### PROBLEMA 7: Componentes de visualización incompletos

**Archivos:** `src/components/chat/` — 25+ componentes pero faltan algunos clave
**Impacto:** MEDIO — no puede mostrar todo lo que debería

**Componentes que EXISTEN y funcionan:**
```
✅ CharacterCreationCard      — dock crear personaje
✅ BackgroundCreationCard      — dock crear fondo
✅ VideoCreationCard           — dock crear video
✅ ProjectCreationCard         — dock crear proyecto
✅ SceneDetailCard             — detalle de escena
✅ ScenePlanTimeline           — plan de escenas
✅ PromptPreviewCard           — preview de prompt
✅ ProjectSummaryCard          — resumen de proyecto
✅ VideoSummaryCard            — resumen de video
✅ ResourceListCard            — lista de personajes/fondos
✅ ActionPlanCard              — plan de acciones
✅ DiffView                    — comparar cambios
✅ OptionsBlock                — opciones clickables
✅ EntitySelector              — seleccionar entidad
✅ CreationSuccessCard         — éxito de creación
✅ CreationCancelledCard       — cancelación
✅ CreationSaveProgress        — progreso de guardado
✅ ThinkingIndicator           — dots de pensamiento
✅ StreamingWave               — indicador de streaming
```

**Componentes que FALTAN:**
```
❌ TaskListCard               — lista de tareas con prioridad/status/categoría
❌ TaskCreationCard            — dock de crear tarea (existe TaskCreateModal pero no como chat dock)
❌ NarrationCard               — texto de narración editable + player audio
❌ VideoAnalysisCard           — score + fortalezas + debilidades + sugerencias accionables
❌ CameraConfigCard            — selectores de ángulo (10) + movimiento (11) + lighting + mood
❌ SceneReadinessCard          — checklist visual de qué falta en una escena
❌ ApiStatusBanner             — banner cuando falta API configurada
❌ ShareReviewCard             — crear link de review + opciones
❌ AnnotationsCard             — feedback del cliente con timestamps
❌ ActivityLogCard             — historial de actividad del proyecto
❌ StylePresetCard             — visualización de style preset
❌ SceneCreationCard           — dock de crear escena (se crea por tools pero no tiene dock visual)
❌ IdeationCard                — card de ideas generadas por la IA
```

---

### PROBLEMA 8: Sugerencias estáticas en vez de dinámicas

**Archivo:** `src/lib/ai/chat-context.ts` → `getQuickActions()`
**Impacto:** BAJO-MEDIO — las sugerencias no se adaptan a lo que acaba de pasar

**Actual:** Las sugerencias son fijas por página. En `video` siempre muestra: "Ideas para el vídeo", "Generar escenas", "Narración", "Prompts batch", "Analizar".

**Lo que debería pasar:** Después de cada respuesta, las sugerencias cambian:

```
Tras crear personaje → "Ver personaje", "Generar imagen", "Asignar a escena"
Tras ver escena → "Generar prompt", "Configurar cámara", "¿Qué le falta?"
Tras analizar video → "Aplicar sugerencia 1", "Ver escena problemática"
Tras completar tarea → "Ver siguiente tarea", "Ver tareas pendientes"
```

**Implementación:** La IA incluye sugerencias en su respuesta con `[SUGGESTIONS]`:
```
[SUGGESTIONS]["Ver personaje Luna", "Generar imagen de Luna", "Crear otro personaje", "Ver todos los personajes"][/SUGGESTIONS]
```

El parser ya soporta este bloque. Solo falta que los agentes lo emitan consistentemente.

---

## PLAN DE CORRECCIÓN PASO A PASO

### FASE 1: Arreglar el cerebro (detect-intent + agentes)

**Paso 1.1** — Reescribir `src/lib/ai/detect-intent.ts`
- Ampliar de 4 a 30+ intenciones
- Añadir regex para cada entidad y acción
- Archivo: ~150 líneas (actualmente 45)

**Paso 1.2** — Crear 8 agentes nuevos en `src/lib/ai/agents/`
- `character-agent.ts` — prompt enfocado en personajes
- `background-agent.ts` — prompt enfocado en fondos
- `task-agent.ts` — prompt enfocado en tareas
- `video-analyzer-agent.ts` — análisis + readiness + next steps
- `narration-agent.ts` — narración y voiceover
- `ideation-agent.ts` — ideas desde dashboard
- `camera-agent.ts` — configuración de cámara
- `review-agent.ts` — compartir y anotaciones

**Paso 1.3** — Actualizar `src/lib/ai/select-agent.ts`
- Enrutar cada intent al agente correcto
- Simplificar el router: solo maneja `'general'`

**Paso 1.4** — Simplificar `src/lib/ai/agents/router.ts`
- SOLO clasificar y preguntar
- NO generar JSON complejo
- Si no entiende → [OPTIONS] con sugerencias contextuales

### FASE 2: Enriquecer el contexto

**Paso 2.1** — Ampliar `src/app/api/ai/chat/route.ts`
- Cargar `project_ai_settings` (saber qué APIs tiene)
- Cargar `user_api_keys` count (saber si puede generar)
- Cargar `tasks` count pendientes/urgentes
- Cargar `video_narrations` (si hay narración)
- Cargar `video_analysis` (si hay análisis reciente)
- Pasar todo al system prompt

**Paso 2.2** — Cache en Zustand
- Crear `useAiContextStore.ts` con perfil creativo + stats + recursos
- Se carga 1 vez al abrir chat, se invalida al cambiar proyecto
- El hook `useKiyokoChat` lee del store en vez de hacer queries

**Paso 2.3** — Perfil creativo: flujo de onboarding
- Si `creative_*` están vacíos y el usuario pide ideas → preguntar
- Nuevo tool `updateUserProfile` en `tools.ts`
- Guardar respuestas en `profiles` + actualizar cache Zustand

### FASE 3: Componentes faltantes

**Paso 3.1** — Crear componentes de chat P0:
- `TaskListCard` — renderiza tareas con filtros
- `SceneReadinessCard` — checklist de qué falta
- `ApiStatusBanner` — banner cuando falta API
- `SceneCreationCard` — dock para crear escena

**Paso 3.2** — Crear componentes P1:
- `CameraConfigCard` — selectores de 10 ángulos + 11 movimientos
- `NarrationCard` — texto editable + selector de voz + player
- `VideoAnalysisCard` — score + sugerencias accionables
- `TaskCreationCard` — dock de crear tarea

**Paso 3.3** — Crear componentes P2:
- `ShareReviewCard`, `AnnotationsCard`, `ActivityLogCard`
- `StylePresetCard`, `IdeationCard`

### FASE 4: Desambiguación y sugerencias

**Paso 4.1** — Añadir reglas de desambiguación al system prompt base
- Reglas para cada nivel faltante (proyecto, video, escena, personaje)
- Regla de "no te he entendido" con [OPTIONS]
- Regla de "esto/eso" → usar contexto o preguntar

**Paso 4.2** — Sugerencias dinámicas
- Cada agente emite [SUGGESTIONS] al final de su respuesta
- Las sugerencias dependen de: qué se acaba de hacer + contexto + datos faltantes
- El frontend reemplaza las quickActions estáticas por las dinámicas

### FASE 5: Robustez

**Paso 5.1** — Mejorar parser de bloques
- Si JSON inválido → intentar reparar (trailing commas, unclosed brackets)
- Fallback graceful: mostrar el texto sin el componente roto

**Paso 5.2** — Regla de siempre-texto-primero
- En cada agente: "SIEMPRE escribe una frase introductoria ANTES de cualquier bloque"
- Verificar en ChatMessage.tsx que el texto se renderiza antes del componente

---

## TABLA RESUMEN: ARCHIVOS A TOCAR

| Archivo | Qué hacer | Fase |
|---------|-----------|------|
| `src/lib/ai/detect-intent.ts` | Reescribir: 4 → 30+ intenciones | 1.1 |
| `src/lib/ai/select-agent.ts` | Actualizar: enrutar a agentes nuevos | 1.3 |
| `src/lib/ai/agents/router.ts` | Simplificar: solo clasificar y preguntar | 1.4 |
| `src/lib/ai/agents/character-agent.ts` | NUEVO: agente de personajes | 1.2 |
| `src/lib/ai/agents/background-agent.ts` | NUEVO: agente de fondos | 1.2 |
| `src/lib/ai/agents/task-agent.ts` | NUEVO: agente de tareas | 1.2 |
| `src/lib/ai/agents/video-analyzer-agent.ts` | NUEVO: análisis de video | 1.2 |
| `src/lib/ai/agents/narration-agent.ts` | NUEVO: narración/voiceover | 1.2 |
| `src/lib/ai/agents/ideation-agent.ts` | NUEVO: ideas desde dashboard | 1.2 |
| `src/lib/ai/agents/camera-agent.ts` | NUEVO: configurar cámara | 1.2 |
| `src/lib/ai/agents/review-agent.ts` | NUEVO: compartir/review | 1.2 |
| `src/app/api/ai/chat/route.ts` | Ampliar: cargar más datos de contexto | 2.1 |
| `src/stores/useAiContextStore.ts` | NUEVO: cache de contexto en Zustand | 2.2 |
| `src/lib/ai/tools.ts` | Añadir: updateUserProfile tool | 2.3 |
| `src/components/chat/TaskListCard.tsx` | NUEVO: componente tareas | 3.1 |
| `src/components/chat/SceneReadinessCard.tsx` | NUEVO: checklist escena | 3.1 |
| `src/components/chat/ApiStatusBanner.tsx` | NUEVO: banner API | 3.1 |
| `src/components/chat/SceneCreationCard.tsx` | NUEVO: dock crear escena | 3.1 |
| `src/components/chat/CameraConfigCard.tsx` | NUEVO: config cámara | 3.2 |
| `src/components/chat/NarrationCard.tsx` | NUEVO: narración + player | 3.2 |
| `src/components/chat/VideoAnalysisCard.tsx` | NUEVO: análisis video | 3.2 |
| `src/components/chat/TaskCreationCard.tsx` | NUEVO: dock crear tarea | 3.2 |
| `src/lib/ai/system-prompt.ts` | Añadir: reglas de desambiguación | 4.1 |
| `src/lib/ai/parse-ai-message.ts` | Robustez: reparar JSON inválido | 5.1 |

---

## DIAGRAMA: FLUJO CORRECTO vs ACTUAL

```
FLUJO ACTUAL (roto):
  Usuario → detect-intent (4 opciones) → 80% va a router → 
  router intenta hacer TODO → JSON mal formado → componente roto o texto sin sentido

FLUJO CORRECTO:
  Usuario → detect-intent (30+ opciones) → agente especializado →
  agente genera texto intro + bloque correcto → parser → componente visual →
  sugerencias dinámicas post-acción
```

```
CREACIÓN (flujo correcto):
  "Crea un personaje Luna, valiente" 
  → detect: create_character
  → character-agent genera: "Vamos a crear a Luna:\n[CREATE:character]{name:'Luna',personality:'valiente'}[/CREATE]"
  → parser extrae bloque CREATE
  → ChatMessage renderiza CharacterCreationCard como dock con prefill
  → Usuario revisa/edita → pulsa "Crear"
  → CreationSaveProgress (validar → guardar → creado)
  → CreationSuccessCard ("Luna creada ✓")
  → Sugerencias: "Ver personaje", "Generar imagen", "Asignar a escena"

VISUALIZACIÓN (flujo correcto):
  "Muéstrame los personajes"
  → detect: list_characters
  → character-agent genera: "El proyecto tiene 3 personajes:\n[RESOURCE_LIST]{type:'characters',...}[/RESOURCE_LIST]"
  → parser extrae bloque
  → ChatMessage renderiza ResourceListCard con datos reales
  → Sugerencias: "Ver detalle de Juan", "Crear personaje", "Ver fondos"

DESAMBIGUACIÓN (flujo correcto):
  "Genera el prompt" (sin sceneId)
  → detect: generate_prompt
  → prompt-agent lee contexto: no hay sceneId
  → genera: "¿Para qué escena genero el prompt?\n[OPTIONS]['#1 Hook','#2 Build','#3 Peak','Todas'][/OPTIONS]"
  → usuario elige → se envía como mensaje → agente genera el prompt
```

---

*Diagnóstico V2 completo. Usar con los docs de referencia en `docs/v6/MY DOCUMENT/` para la implementación.*
