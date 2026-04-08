# Kiyoko AI — Plan Maestro de Acciones

> Documento de referencia para ir implementando mejoras poco a poco.
> Cada seccion tiene tareas concretas, ordenadas por prioridad.
> Marcar [x] cuando se complete.

---

## 0. PRINCIPIOS DE DISEÑO

Todas las mejoras deben seguir estos principios:

- **Modales**: usar siempre `ModalShell` (drawer derecho) o el patron de `WorkspaceSettingsModal` (modal centrado con tabs laterales) segun el caso
- **Header contextual**: el header cambia segun la pagina (ya existe la logica en `Header.tsx` con `scope: dashboard | project | video`)
- **Sin codigo duplicado**: constantes, colores, status → un solo archivo `src/lib/constants/`
- **HeroUI + Tailwind CSS variables**: nunca colores hardcoded
- **Dark-first**: disenar siempre para dark mode primero
- **IA real**: nunca mock/placeholder — conectar siempre a `/api/ai/*`

---

## 1. ARQUITECTURA Y CODIGO — Limpieza

### 1.1 Extraer constantes duplicadas
- [ ] Crear `src/lib/constants/scene.ts`:
  - `PHASE_STYLES` (actualmente duplicado en video/page.tsx, SceneCard.tsx, SceneGeneratorModal.tsx)
  - `PHASE_COLORS` (variante con bordes para modales)
  - `PHASE_LABELS` (Hook, Build, Peak, Close)
  - `SCENE_STATUS_COLORS` (actualmente diferente entre sidebar y page: 400 vs 500 opacity)
  - `SCENE_STATUS_LABELS` (Borrador, Prompt listo, Generando, etc.)
  - `SCENE_STATUS_DOT` (solo el dot color)
- [ ] Crear `src/lib/constants/video.ts`:
  - `VIDEO_STATUS_COLORS`
  - `VIDEO_STATUS_LABELS`
  - `PLATFORM_OPTIONS`
  - `ASPECT_RATIO_OPTIONS`
- [ ] Crear `src/lib/constants/project.ts`:
  - `PROJECT_STATUS_OPTIONS`
  - `PROJECT_STYLE_OPTIONS`
- [ ] Actualizar todos los archivos que definan estas constantes para importar del archivo central
- [ ] Buscar y eliminar todas las definiciones duplicadas

### 1.2 Extraer componentes reutilizables
- [ ] Extraer `EditableText` a `src/components/shared/EditableText.tsx` (actualmente definido inline en 3+ paginas: scene detail, character detail, background detail)
- [ ] Extraer `EditableTextarea` a `src/components/shared/EditableTextarea.tsx`
- [ ] Extraer `ExpandablePrompt` a `src/components/shared/ExpandablePrompt.tsx` (actualmente inline en video/page.tsx)
- [ ] Extraer `StatusBadge` a `src/components/shared/StatusBadge.tsx` (patron repetido en muchos sitios)
- [ ] Extraer `PhaseBadge` a `src/components/shared/PhaseBadge.tsx`

### 1.3 Eliminar codigo muerto
- [ ] Eliminar 6 rutas API no usadas:
  - `/api/ai/analyze-project` (deprecated, redirige a analyze-video)
  - `/api/ai/derive-video` (feature incompleta, sin UI)
  - `/api/ai/generate-extensions` (experimental, sin UI)
  - `/api/ai/generate-image` (reemplazada por generate-scene-prompts)
  - `/api/ai/generate-project` (onboarding incompleto)
  - `/api/ai/voices` (reemplazada por GET generate-voice)
- [ ] Eliminar `SceneCreateModal.tsx` (reemplazado por SceneWorkModal)
- [ ] Eliminar `SceneEditorModal.tsx` si SceneWorkModal lo reemplaza completamente
- [ ] Eliminar `Sidebar.tsx` legacy (marcado deprecated, reemplazado por AppSidebar)
- [ ] Eliminar `ChatInputV2.tsx` si V1 ya no se usa (o viceversa)
- [ ] Eliminar imports no usados en todos los archivos (lint check)

### 1.4 Paginas stub que necesitan implementacion o redireccion
- [ ] `dashboard/tasks/new/page.tsx` (16 lineas, stub) → redirigir al panel de crear tarea
- [ ] `dashboard/tasks/[taskId]/page.tsx` (16 lineas, stub) → implementar o redirigir
- [ ] `project/[shortId]/settings/page.tsx` (3 lineas, returns null) → redirigir a modal settings
- [ ] `project/[shortId]/settings/ai/page.tsx` (2 lineas, returns null) → redirigir
- [ ] `project/[shortId]/chat/page.tsx` (20 lineas, redirect) → verificar que funcione

---

## 2. MODALES — Consistencia Visual

### 2.1 Patron base
Todos los modales deben usar uno de estos dos patrones:
- **ModalShell** (drawer derecho): para crear/editar un recurso simple (video, personaje, fondo, tarea)
- **WorkspaceSettingsModal** (modal centrado + tabs): para settings con multiples secciones

### 2.2 Modales que necesitan migracion
- [ ] `SceneWorkModal` → actualmente usa overlay custom. Mantener (es un caso especial: form + chat)
- [ ] `SceneGeneratorModal` → actualmente usa overlay custom. Evaluar si migrar a ModalShell o mantener
- [ ] `CharacterPickerModal` → actualmente usa overlay custom. Migrar a ModalShell
- [ ] `BackgroundPickerModal` → actualmente usa overlay custom. Migrar a ModalShell
- [ ] `ImagePreviewModal` → verificar que usa patron consistente

### 2.3 Modales que estan bien
- [x] `VideoCreateModal` → usa ModalShell correctamente
- [x] `CharacterCreateModal` → usa ModalShell correctamente
- [x] `BackgroundCreateModal` → usa ModalShell correctamente
- [x] `TaskCreateModal` → usa ModalShell correctamente
- [x] `SettingsModal` → usa WorkspaceSettingsModal correctamente
- [x] `ProjectSettingsModal` → usa WorkspaceSettingsModal correctamente
- [x] `VideoSettingsModal` → usa WorkspaceSettingsModal correctamente

---

## 3. HEADER / NAVBAR — Acciones Contextuales

### 3.1 Header contextual (ya existe logica base)
El header ya detecta scope (dashboard/project/video) y muestra botones diferentes. Falta:

- [ ] **Dashboard**: boton "Nuevo proyecto" directo en header (no solo en pagina)
- [ ] **Proyecto**: botones rapidos "Nuevo video", "Nuevo personaje", "Nuevo fondo"
- [ ] **Video**: botones rapidos "Nueva escena", "Generar todos los prompts", "Exportar"
- [ ] **Escena detail**: botones "Generar prompt", "Copiar prompt imagen", "Copiar prompt video"

### 3.2 Breadcrumbs
- [ ] Crear `src/components/layout/Breadcrumbs.tsx`
- [ ] Mostrar ruta completa: Proyecto > Video > Escena #3
- [ ] Click en cada nivel navega a esa pagina
- [ ] En mobile: solo mostrar el nivel actual con boton "← Atras"

### 3.3 Busqueda global
- [ ] `SearchModal` ya existe — verificar que busca proyectos, videos, escenas
- [ ] Agregar busqueda de personajes y fondos
- [ ] Acceso rapido con Cmd+K (ya implementado)

---

## 4. IA — Mejorar Calidad de Prompts

### 4.1 Consistencia entre escenas (CRITICO)
- [ ] En `/api/ai/generate-scene-prompts`: antes de generar, fetch el prompt de la escena anterior y siguiente
- [ ] Inyectar en el mensaje al AI: "Escena anterior prompt: [resumen]. Mantener consistencia visual."
- [ ] Agregar campo `visual_style_notes` a la tabla `scene_prompts` para tracking de estilo
- [ ] Crear funcion `getAdjacentPrompts(sceneId)` que devuelve prompts vecinos

### 4.2 Estructura estandarizada de prompts
- [ ] Actualizar `SYSTEM_SCENE_GENERATOR` para forzar estructura:
  ```
  [STYLE], [SUBJECT doing ACTION], [SETTING/BACKGROUND],
  [CAMERA ANGLE] shot, [LIGHTING], [MOOD],
  [QUALITY TAGS]. [NEGATIVE: ...]
  ```
- [ ] Agregar negative prompts automaticos: "no text, no watermark, no deformation, no extra fingers"
- [ ] Incluir aspecto ratio en el prompt: "16:9 composition" o "9:16 vertical"
- [ ] Limitar longitud a 60-80 palabras (sweet spot para Flux/Midjourney)

### 4.3 Prompt snippet mejorado
- [ ] En pagina de personaje: editor de prompt_snippet con preview en tiempo real
- [ ] Boton "Mejorar con IA": la IA sugiere mejoras al snippet actual
- [ ] Reglas always/never visibles y editables en la pagina del personaje
- [ ] Lo mismo para fondos: editor de prompt_snippet con preview

### 4.4 Prompts de video mejorados
- [ ] Frame-by-frame: "Second 0-1: [action]. Second 1-2: [action]. Second 2-3: [action]."
- [ ] Transiciones: incluir "fade in", "cut to", "dissolve" segun contexto narrativo
- [ ] Lip sync: si hay dialogo, marcar "character speaking: [dialogo]"
- [ ] Loop indicator: para Reels/TikTok, indicar si el final conecta con el inicio

### 4.5 Motor de prompt
- [ ] Crear `src/lib/ai/prompt-builder.ts` — constructor estandarizado:
  - `buildImagePrompt(scene, characters, backgrounds, camera, project)` → string
  - `buildVideoPrompt(scene, characters, backgrounds, camera, project)` → string
  - `buildNegativePrompt(style)` → string
- [ ] A/B testing: generar 2 variantes del prompt y mostrar ambas al usuario
- [ ] Prompt scoring: evaluar de 1-10 antes de mostrar al usuario
- [ ] Formato por herramienta destino: Grok, Midjourney, Flux, Runway (diferentes estilos)

---

## 5. PAGINAS — Mejoras Especificas

### 5.1 Dashboard
- [ ] Widget "Continuar donde lo dejaste" (ultimo video editado con link directo)
- [ ] Resumen: "X escenas pendientes de prompt, X por generar"
- [ ] Acceso rapido a proyectos recientes

### 5.2 Proyecto — Vista General
- [ ] Checklist visual "Listo para generar":
  - ✓ Personajes creados (3/3 con snippet)
  - ✓ Fondos creados (2/2 con snippet)
  - ✗ Escenas sin prompt (2 pendientes)
  - ✗ Prompts sin imagen (4 pendientes)
- [ ] Boton "Generar todo" que ejecuta pipeline completo
- [ ] Preview de todas las imagenes generadas en grid

### 5.3 Video — Storyboard
- [x] Tarjetas con prompts expandibles y copiar
- [x] Dropdown acciones: duplicar, eliminar, insertar
- [x] Generacion paralela de prompts
- [ ] **Boton "Copiar todos para Grok"**: formatea prompts como lista numerada para pegar
- [ ] **Indicador de calidad**: icono verde/amarillo/rojo segun evaluacion de prompt
- [ ] **Vista comparativa**: ver prompt EN y descripcion ES lado a lado
- [ ] **Regenerar con instruccion**: "Regenerar pero mas cinematografico"
- [ ] **Preview de imagen**: si existe, mostrar thumbnail en la tarjeta
- [ ] **Drag & drop mejorado**: linea de insercion visible al arrastrar
- [ ] **Filtros**: mostrar solo escenas sin prompt, solo aprobadas, etc.

### 5.4 Escena Detalle
- [ ] **Edicion manual de prompts**: textarea editable con el prompt generado
- [ ] **Historial de versiones**: dropdown para ver/restaurar versiones anteriores
- [ ] **Galeria de imagenes**: multiples versiones lado a lado
- [ ] **Notas del director**: campo dedicado (ya existe en BD pero no en form)
- [ ] **Mood y Lighting**: selectores visuales (ya hay campos en scene_camera)
- [ ] **Modo "refinar"**: la IA analiza el prompt actual y sugiere mejoras puntuales
- [ ] **Copiar para herramienta**: "Copiar para Grok" / "Copiar para Midjourney" (formatos diferentes)

### 5.5 Personajes
- [ ] **Edicion post-creacion**: modal o inline para modificar todos los campos
- [ ] **Prompt snippet editor**: textarea con preview del prompt resultante
- [ ] **Reglas visuales**: UI para agregar/editar reglas always/never
- [ ] **Turnaround**: boton para generar hoja de referencia multi-angulo
- [ ] **Vista de coherencia**: grid de todas las escenas donde aparece este personaje
- [ ] **Variantes**: generar el personaje con diferentes expresiones/poses

### 5.6 Fondos
- [ ] **Edicion post-creacion**: poder cambiar nombre, descripcion, snippet, tipo, hora
- [ ] **Angulos configurables**: UI para marcar que angulos de camara son posibles
- [ ] **Variantes de hora**: generar mismo fondo en manana/tarde/noche
- [ ] **Categorias**: organizar por tipo (interior, exterior, urbano, naturaleza)

### 5.7 Timeline
- [ ] **Reordenar arrastrando**: mover escenas en la barra visual
- [ ] **Editar duracion**: click en barra para ajustar duracion
- [ ] **Marcadores de audio**: donde empieza musica, dialogo, SFX
- [ ] **Detector de incoherencias**: flag cuando hay saltos bruscos de camara/iluminacion entre escenas consecutivas

### 5.8 Narracion
- [ ] **Selector de voz**: dropdown con preview de cada voz
- [ ] **Editar texto antes de generar**: textarea editable por escena
- [ ] **Preview por escena**: reproducir narracion escena a escena
- [ ] **Sincronizacion**: marcas de tiempo por frase

### 5.9 Exportar
- [ ] **PDF storyboard funcional**: implementar con @react-pdf/renderer
- [ ] **ZIP completo**: imagenes + prompts + script + metadata
- [ ] **Formato "Copiar para IA"**: documento con todos los prompts formateados
- [ ] **Export selectivo**: elegir que escenas exportar
- [ ] **CSV**: para importar en otras herramientas de produccion

### 5.10 Publicaciones
- [ ] **Boton crear publicacion** visible en la pagina
- [ ] **Calendario**: vista de calendario para scheduling
- [ ] **Multi-plataforma**: publicar en varias plataformas a la vez
- [ ] **Preview por plataforma**: como se vera en Instagram vs TikTok vs YouTube

---

## 6. SETTINGS — Completar

### 6.1 API Keys
- [ ] Pagina real con formulario visible (no solo modal)
- [ ] Campos: OpenRouter, Gemini, ElevenLabs, Stability
- [ ] Boton "Probar conexion" por key
- [ ] Indicador visual: verde conectado, rojo error, gris no configurado

### 6.2 Preferencias de IA
- [ ] Selector de modelo por tarea (escenas: Qwen, analisis: Gemini, etc.)
- [ ] Temperatura: slider conservador ←→ creativo
- [ ] Estilo por defecto: Pixar 3D / Realista / Anime / etc.
- [ ] Longitud de prompt preferida: corto / medio / detallado

### 6.3 Perfil
- [ ] Cambio de password
- [ ] Foto de perfil
- [ ] Zona horaria

### 6.4 Proyecto Settings
- [ ] Estilo visual global (afecta todos los prompts del proyecto)
- [ ] Reglas globales de prompt
- [ ] Paleta de colores del proyecto
- [ ] Aspecto ratio por defecto

---

## 7. MOBILE — Responsividad

- [ ] Menu hamburguesa funcional en < 768px
- [ ] Bottom navigation: Dashboard, Proyectos, IA, Settings
- [ ] Chat IA: drawer desde abajo en mobile (no sidebar)
- [ ] Tarjetas de escena: stack vertical en mobile
- [ ] Modales: full-screen en mobile, drawer en desktop
- [ ] Swipe gestures: swipe para navegar entre escenas

---

## 8. UX GENERAL

### 8.1 Feedback y estados
- [ ] Loading skeletons en todas las listas (proyectos, videos, escenas)
- [ ] Toast de confirmacion en todas las acciones destructivas
- [ ] Indicador "guardando..." con autosave
- [ ] Animaciones de entrada/salida en modales y paneles

### 8.2 Accesibilidad
- [ ] Keyboard navigation en todos los modales
- [ ] Focus trap en modales abiertos
- [ ] aria-labels en todos los botones de icono
- [ ] Contraste de colores minimo 4.5:1

### 8.3 Atajos de teclado
- [ ] Cmd+K: buscar
- [ ] Cmd+N: crear (proyecto/video/escena segun contexto)
- [ ] Cmd+S: guardar (donde aplique)
- [ ] Cmd+Enter: enviar mensaje en chat
- [ ] Escape: cerrar modal/panel
- [ ] Flechas: navegar entre escenas en storyboard

---

## 9. FLUJO IDEAL — Pipeline Completo

```
PASO 1: Crear proyecto
├── Nombre, estilo visual, brief
├── → Auto-sugerir personajes y fondos basados en brief
└── Status: borrador

PASO 2: Crear personajes
├── IA genera desde descripcion
├── Editar prompt_snippet manualmente
├── Subir imagen de referencia
├── Generar turnaround (referencia multi-angulo)
└── Definir reglas always/never

PASO 3: Crear fondos
├── IA genera desde descripcion
├── Editar prompt_snippet
├── Configurar angulos disponibles
├── Configurar hora del dia
└── Subir imagen de referencia

PASO 4: Crear video
├── Plataforma, duracion, aspecto ratio
└── Brief del video

PASO 5: Generar escenas
├── IA sugiere estructura narrativa completa
├── O crear escena por escena con sugerencias contextuales
├── Asignar personajes y fondos a cada escena
├── Configurar camara, iluminacion, mood
└── Al guardar → auto-genera prompts de imagen Y video

PASO 6: Revisar y refinar prompts
├── Ver cada prompt en la tarjeta del storyboard
├── Editar manualmente si necesario
├── Regenerar con instrucciones especificas
├── IA verifica consistencia visual entre escenas
├── Prompt scoring: ver calidad de cada prompt
└── A/B testing: comparar variantes

PASO 7: Copiar y generar externamente
├── "Copiar todos los prompts" formateados
├── Formato optimizado para Grok/Midjourney/Flux/Runway
├── Generar imagenes y videos en herramienta externa
└── Subir resultados a Kiyoko

PASO 8: Revision final
├── Galeria de todas las imagenes generadas
├── IA analiza coherencia visual del conjunto
├── Aprobar o regenerar escenas individuales
└── Verificar transiciones entre escenas

PASO 9: Exportar
├── PDF storyboard completo
├── ZIP con todo el material
├── Script para edicion de video
└── Publicar en redes sociales
```

---

## 10. INVENTARIO ACTUAL

### Paginas: 60 total
- 5 auth, 3 publicas, 1 landing, 1 share
- 2 dashboard main, 4 tasks, 3 notif/shared/pub
- 4 settings, 2 admin
- 2 proyecto main, 3 videos, 6 video sections
- 3 tasks/resources, 6 resources detail
- 4 publications, 3 project settings
- **5 stubs** que necesitan implementacion o redireccion

### Componentes: 127 total
- 5 auth, 28 chat, 3 dashboard, 4 kiyoko
- 20 layout, 21 modales, 6 scene, 9 settings
- 13 shared, 6 ui, 5 tasks, 3 video
- 4 project, 2 ai, 2 analysis, 1 narration, 1 landing

### Hooks: 32 custom hooks
- 4 queries, 11 core data, 6 AI, 5 realtime, 6 utility

### Stores: 5 Zustand (todos solo UI state, correcto)

### API Routes: 32 total (21 AI, 4 export, 4 storage, 3 user)
- 15 activas, 6 muertas (28% dead code en AI routes)

### Providers AI: 9 configurados
- 7 gratuitos (Groq, Gemini, Mistral, Cerebras, DeepSeek, Grok, OpenRouter)
- 2 premium (Claude, OpenAI) — requieren key del usuario

### Agentes AI: 10 especializados
- router, scene-creator, scene-editor, prompt-generator
- character-agent, background-agent, ideation, project-assistant, task-agent

---

## 11. STACK IA — Simplificar a 3 Proveedores (Stack B)

### Situacion actual
Ahora mismo hay **8 proveedores de texto** configurados en cadena de fallback:
```
Groq → Mistral → Gemini → Cerebras → Grok → DeepSeek → Claude → OpenAI
```
Esto es excesivo. Muchos son redundantes y complican el mantenimiento.

### Stack B oficial (el que debemos usar)
Segun `docs/v6/MY DOCUMENT/guia-director-creativo-stackB.md`:

| Rol | Proveedor | Modelo | Coste | Uso |
|-----|-----------|--------|-------|-----|
| **Cerebro** | Qwen via OpenRouter | qwen3.5-flash / qwen3.5-plus | $0.065-0.26/M tokens | Generar escenas, prompts, chat, todo el texto |
| **Ojos** | Gemini | gemini-2.5-flash | Gratis | Analisis de imagenes (vision), verificar coherencia visual |
| **Voz** | Voxtral (Mistral) | voxtral-tts-2025-03-26 | $0.016/1K chars | Narracion TTS |

**Coste total por proyecto: ~$0.022** (con 60s de narracion)

### Acciones de limpieza

#### 11.1 Simplificar sdk-router.ts
- [ ] Cambiar TEXT_CHAIN a: `['openrouter', 'gemini']` (solo 2 proveedores de texto)
- [ ] Qwen (OpenRouter) como PRIMARIO para todo texto/chat/generacion
- [ ] Gemini como FALLBACK para texto (ya que es gratis)
- [ ] Eliminar de la cadena: Groq, Mistral (solo TTS), Cerebras, Grok, DeepSeek
- [ ] Mantener Claude y OpenAI como opcionales (solo si el usuario pone su API key)

#### 11.2 Archivos de provider a limpiar
- [ ] `src/lib/ai/providers/groq.ts` → eliminar o marcar como opcional
- [ ] `src/lib/ai/providers/claude.ts` → mantener solo para API key del usuario
- [ ] `src/lib/ai/providers/openai.ts` → mantener solo para API key del usuario
- [ ] `src/lib/ai/providers/stability.ts` → eliminar (no se usa, las imagenes las genera el usuario externamente)
- [ ] `src/lib/ai/sdk-router.ts` → simplificar la metadata de providers y la cadena
- [ ] Eliminar env vars innecesarias: `GROQ_API_KEY`, `XAI_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`

#### 11.3 Configuracion de modelos por tarea
```
Generar escenas:           Qwen 3.5 Flash (rapido, barato)
Generar prompts img/video: Qwen 3.5 Flash (rapido, barato)
Chat conversacional:       Qwen 3.5 Flash (rapido)
Insertar escenas complejas: Qwen 3.5 Plus (mas potente)
Mejorar prompts:           Qwen 3.5 Plus (calidad)
Analisis de imagenes:      Gemini 2.5 Flash (vision gratis)
Verificar coherencia:      Gemini 2.5 Flash (vision)
Narracion TTS:             Voxtral (Mistral TTS)
```

#### 11.4 Actualizar API routes
- [ ] `/api/ai/chat` → usar siempre Qwen via OpenRouter (no cadena de fallback larga)
- [ ] `/api/ai/generate-scenes` → Qwen Flash
- [ ] `/api/ai/generate-scene-prompts` → Qwen Flash (ya lo usa)
- [ ] `/api/ai/analyze-image` → Gemini Vision (ya lo usa)
- [ ] `/api/ai/generate-voice` → Voxtral (ya existe pero verificar que sea el default)
- [ ] `/api/ai/improve-prompt` → Qwen Plus (calidad)
- [ ] Eliminar fallback a ElevenLabs en TTS (o mantener como premium del usuario)

#### 11.5 Env vars necesarias (solo 3)
```
OPENROUTER_API_KEY    → Qwen (cerebro)
GOOGLE_AI_API_KEY     → Gemini (ojos)
MISTRAL_API_KEY       → Voxtral TTS (voz)
```

#### 11.6 API keys del usuario (opcionales, en settings)
Si el usuario quiere usar su propia key de Claude/OpenAI, puede configurarla en Settings > API Keys. Pero el sistema funciona completo sin ellas.

---

## 12. BASE DE DATOS — Limpieza de Tablas

### Situacion actual: 41 tablas

### Tablas activas (39) — MANTENER
Todas las tablas principales estan en uso activo:
- Proyecto: `projects`, `project_ai_agents`, `project_ai_settings`, `project_favorites`, `project_shares`
- Video: `videos`, `video_analysis`, `video_derivations`, `video_narrations`
- Escena: `scenes`, `scene_camera`, `scene_media`, `scene_video_clips`, `scene_prompts`, `scene_annotations`, `scene_backgrounds`, `scene_characters`, `scene_shares`
- Recursos: `backgrounds`, `characters`, `character_images`, `style_presets`
- IA: `ai_conversations`, `ai_usage_logs`
- Publicaciones: `publications`, `publication_items`, `social_profiles`
- Contenido: `narrative_arcs`, `prompt_templates`, `timeline_entries`
- Usuario: `profiles`, `notifications`, `user_api_keys`, `user_plans`
- Sistema: `activity_log`, `entity_snapshots`, `feedback`, `realtime_updates`, `usage_tracking`
- Tareas: `tasks` (ver seccion 13 para plan de eliminacion)

### Tablas a eliminar/limpiar (2)
- [ ] `ai_usage_monthly` → vista materializada, nunca consultada desde el app. Eliminar o dejar solo en BD
- [ ] Verificar `video_derivations` → feature "derive" no implementada en UI. Evaluar si mantener

### Tablas ya eliminadas anteriormente
Estas ya fueron dropped y no existen en el schema:
- `time_entries` ✓ eliminada
- `project_members` ✓ eliminada
- `billing_events` ✓ eliminada
- `comments` ✓ eliminada
- `exports` ✓ eliminada

### Mejoras al schema
- [ ] Agregar campo `negative_prompt` a `scene_prompts` (para prompts negativos)
- [ ] Agregar campo `prompt_quality_score` a `scene_prompts` (evaluacion de calidad 1-10)
- [ ] Agregar campo `target_tool` a `scene_prompts` (grok/midjourney/flux/runway)
- [ ] Agregar campo `visual_style_notes` a `scene_prompts` (para tracking de estilo entre escenas)
- [ ] Verificar que `scene_camera.lighting` y `scene_camera.mood` tengan valores estandarizados

---

## 13. TAREAS — Plan de Eliminacion (Defer para Despues)

### Que se elimina
El modulo de tareas es funcional pero no es core para la creacion de videos. Se puede quitar de la app ahora y reimplementar mejor despues.

### Archivos a eliminar/ocultar

#### Paginas (7 archivos)
- [ ] `src/app/(dashboard)/dashboard/tasks/page.tsx`
- [ ] `src/app/(dashboard)/dashboard/tasks/new/page.tsx` (stub)
- [ ] `src/app/(dashboard)/dashboard/tasks/[taskId]/page.tsx` (stub)
- [ ] `src/app/tasks/page.tsx`
- [ ] `src/app/tasks/new/page.tsx`
- [ ] `src/app/tasks/[taskId]/page.tsx`
- [ ] `src/app/(dashboard)/project/[shortId]/tasks/page.tsx`

#### Componentes (5 archivos)
- [ ] `src/components/tasks/TaskCreateModal.tsx`
- [ ] `src/components/tasks/TaskCreatePanel.tsx`
- [ ] `src/components/tasks/TaskDocumentEditor.tsx`
- [ ] `src/components/tasks/TaskIconPickerModal.tsx`
- [ ] `src/components/tasks/TaskWorkspacePage.tsx`

#### Hooks (2 archivos)
- [ ] `src/hooks/useTasks.ts`
- [ ] `src/hooks/useDashboardTasks.ts`

#### Dashboard views (1 archivo)
- [ ] `src/components/dashboard/DashboardTasksView.tsx`

#### Shared (1 archivo)
- [ ] `src/components/shared/TaskPreviewCard.tsx`

### Sidebar — Quitar enlace
- [ ] En `SidebarNavFixed.tsx` o `SidebarNavMain.tsx`: eliminar el item "Tareas" del menu
- [ ] En `Header.tsx`: eliminar el boton "Global task action" del header

### Layout — Quitar panel
- [ ] En `src/app/(dashboard)/layout.tsx`: eliminar `TaskCreatePanel` condicional
- [ ] Eliminar import de `TaskCreatePanel`

### NO eliminar
- La tabla `tasks` en la BD → dejarla, no hace daño y los datos se conservan
- El agente `task-agent.ts` → desactivar pero no eliminar
- Las referencias en el chat → la IA puede mencionar tareas pero no crear/editar

### Total: ~16 archivos eliminados, sidebar + header simplificados

---

## 14. IA QUE APRENDE — Sistema de Reglas y Aprendizaje de Prompts

### El problema
Ahora mismo cuando le dices a la IA "mejora el prompt" o "añade camara", la IA no sabe:
- Como TU quieres que sean los prompts (estructura, longitud, estilo)
- Que reglas son importantes para TI (siempre incluir lighting, siempre poner negatives)
- Que herramienta usas (Grok necesita un formato, Midjourney otro, Flux otro)
- Que ha funcionado bien en el pasado

### Lo que YA existe en la BD (pero la UI no lo usa bien)

| Tabla | Para que | Estado actual |
|-------|----------|---------------|
| `prompt_templates` | Plantillas reutilizables con variables | Pagina existe pero basica, no se inyectan bien |
| `style_presets` | Prefijo, sufijo, negative prompt, paleta | Pagina existe pero no se aplican al generar |
| `global_prompt_rules` | Reglas globales del proyecto | Se inyecta en el prompt pero sin UI clara |
| `project_ai_settings` | Config de proveedores por proyecto | Existe pero desconectado de la generacion |

### 14.1 Sistema de Reglas de Prompt (Project Settings)

Añadir seccion "Reglas de Prompt" en Project Settings con:

#### A) Estructura preferida
- [ ] Selector de orden: Subject → Action → Setting → Camera → Lighting → Quality
- [ ] O personalizado: el usuario arrastra las secciones en el orden que quiera
- [ ] Preview en tiempo real: muestra como queda un prompt ejemplo con esa estructura
- [ ] Guardar en `prompt_templates` con `template_type: 'scene_description'` y `is_default: true`

#### B) Reglas globales (editable)
```
Ejemplo de reglas que el usuario escribe:
- Siempre incluir "cinematic lighting, 4K, detailed"
- Siempre poner negative prompt: "no text, no watermark, no deformations"
- Duracion exacta en prompts de video: "Duration: exactly Xs"
- Si hay dialogo, incluir lip sync markers
- Estilo visual: "Pixar 3D animation style"
- Aspecte ratio en cada prompt: "16:9 composition"
```
- [ ] Textarea editable en Project Settings > Contexto IA
- [ ] Se inyecta en CADA llamada a generate-scene-prompts y improve-prompt
- [ ] Guardar en `projects.global_prompt_rules`

#### C) Herramienta destino
- [ ] Selector: "¿Para que herramienta generas?" → Grok / Midjourney / Flux / DALL-E / Runway / Kling / Custom
- [ ] Cada herramienta tiene formato optimo diferente:
  - **Grok**: prompts largos y descriptivos, soporta estilos con referencia
  - **Midjourney**: prompts cortos (60 palabras max), parametros --ar --v --s
  - **Flux**: prompts detallados, soporta negative prompts con --no
  - **DALL-E**: prompts naturales, max 400 chars
  - **Runway**: prompts de video con movimiento frame-by-frame
- [ ] Guardar en `style_presets.generator` o `project_ai_settings.image_provider`
- [ ] El prompt builder adapta el formato segun la herramienta

#### D) Style Presets (ya existe la tabla)
- [ ] Mejorar UI de `resources/styles/page.tsx`:
  - Editor de `prompt_prefix` (se añade al inicio de cada prompt)
  - Editor de `prompt_suffix` (se añade al final)
  - Editor de `negative_prompt` (lo que NO debe aparecer)
  - Imagen de referencia para el estilo
  - Paleta de colores del proyecto
- [ ] Aplicar automaticamente el preset marcado como `is_default` a toda generacion
- [ ] Poder tener multiples presets y elegir por video

### 14.2 Aprendizaje de Ediciones del Usuario

Cuando el usuario edita manualmente un prompt, la IA debe aprender:

#### A) Registro de correcciones
- [ ] Crear tabla `prompt_corrections` (o usar `entity_snapshots`):
  ```sql
  prompt_corrections:
    id, scene_prompt_id, original_text, corrected_text,
    correction_type (style/camera/lighting/character/structure/length),
    project_id, created_at
  ```
- [ ] Cada vez que el usuario edita un prompt y guarda, registrar el diff
- [ ] Despues de 5+ correcciones, la IA analiza los patrones

#### B) Aprendizaje activo
- [ ] Funcion `analyzeUserCorrections(projectId)`:
  - Buscar correcciones recientes del proyecto
  - Detectar patrones: "el usuario siempre añade 'cinematic lighting'" o "siempre quita 'cartoon style'"
  - Generar reglas sugeridas automaticamente
  - Mostrar: "He notado que siempre añades X. ¿Quieres que lo haga automatico?"
- [ ] Guardar reglas aprendidas en `global_prompt_rules` con tag "[auto-learned]"

#### C) Feedback por prompt
- [ ] Boton 👍/👎 en cada prompt generado
- [ ] Si 👎: popup "¿Que no te gusta?" → opciones rapidas:
  - Muy largo / Muy corto
  - Mal estilo / Mal camara
  - Falta detalle / Demasiado detalle
  - Personaje incorrecto / Fondo incorrecto
- [ ] Guardar feedback en `scene_prompts.generation_config` como JSON

### 14.3 Prompt Builder Inteligente

#### A) Funcion centralizada
- [ ] Crear `src/lib/ai/prompt-builder.ts`:
```typescript
interface PromptConfig {
  project: { style, globalRules, colorPalette }
  scene: { title, description, duration, arcPhase, dialogue }
  camera: { angle, movement, lighting, mood }
  characters: Array<{ promptSnippet, rules }>
  backgrounds: Array<{ promptSnippet, locationType, timeOfDay }>
  stylePreset: { prefix, suffix, negativePrompt }
  targetTool: 'grok' | 'midjourney' | 'flux' | 'dalle' | 'runway'
  adjacentPrompts: { prev?: string, next?: string }
  userCorrections: Array<{ pattern, replacement }>
}

function buildImagePrompt(config: PromptConfig): string
function buildVideoPrompt(config: PromptConfig): string
function buildNegativePrompt(config: PromptConfig): string
```

#### B) Inyeccion de contexto adyacente
- [ ] Antes de generar prompt de escena #3, fetch prompts de #2 y #4
- [ ] Añadir al mensaje de la IA: "Prompt anterior: [resumen]. Mantener continuidad visual."
- [ ] Verificar que personajes/fondos usan el mismo snippet en escenas consecutivas

#### C) Auto-mejora en 2 pasadas
- [ ] Pasada 1: generar prompt base con Qwen Flash (rapido)
- [ ] Pasada 2: evaluar con Qwen Plus (calidad) — puntuacion 1-10
- [ ] Si < 7: regenerar con instrucciones de mejora especificas
- [ ] Mostrar score al usuario en la tarjeta del prompt

### 14.4 Chat IA que Entiende Instrucciones de Prompt

Cuando el usuario dice en el chat:

| El usuario dice | La IA hace |
|-----------------|-----------|
| "Mejora el prompt" | Llama a improve-prompt con las reglas del proyecto |
| "Hazlo mas cinematico" | Añade lighting, depth of field, lens flare al prompt |
| "Pon primer plano" | Cambia camera_angle a close_up y regenera |
| "Añade movimiento de camara" | Cambia camera_movement y regenera prompt de video |
| "Mas corto" | Reduce la duracion y ajusta el prompt de video |
| "Pon a Ana mirando a la camara" | Modifica la posicion del personaje en el prompt |
| "Cambia el fondo a noche" | Modifica lighting y time_of_day del background |
| "Quita el dialogo" | Cambia audio_config y añade "SILENT SCENE. NO DIALOGUE." |
| "Formato para Midjourney" | Reestructura con parametros --ar --v --s |

- [ ] En el chat sidebar del SceneWorkModal: detectar intents de prompt
- [ ] Cada intent ejecuta una accion especifica (no solo texto)
- [ ] Resultado: el prompt se actualiza EN EL FORMULARIO (no solo en el chat)

### 14.5 Templates de Prompt Reutilizables

La tabla `prompt_templates` ya existe. Mejorar:

- [ ] UI para crear/editar templates con variables:
  ```
  Template: "{{style}}, {{character}} {{action}} in {{background}},
            {{camera}} shot, {{lighting}}, {{mood}}, cinematic 4K"
  Variables: [style, character, action, background, camera, lighting, mood]
  ```
- [ ] Selector de template al generar prompts
- [ ] Templates por defecto segun estilo del proyecto (Pixar, Realista, Anime)
- [ ] El usuario puede guardar un prompt que le gusto como template
- [ ] Boton "Guardar como template" en cada prompt generado

---

## 15. ORDEN DE EJECUCION SUGERIDO (ACTUALIZADO)

### Fase 0: Limpieza Inmediata (1 dia) ← HACER PRIMERO
1. Eliminar modulo de tareas (16 archivos, sidebar, header)
2. Simplificar stack IA a 3 proveedores (Qwen + Gemini + Voxtral)
3. Eliminar 6 API routes muertas
4. Eliminar archivos legacy (Sidebar.tsx, SceneCreateModal, ChatInputV2)

### Fase 1: Fundamentos (2-3 dias)
5. Extraer constantes duplicadas (PHASE_STYLES, STATUS_COLORS → un archivo)
6. Extraer componentes reutilizables (EditableText, ExpandablePrompt, StatusBadge)
7. Consistencia de modales (migrar los que no usan ModalShell)
8. Mejorar schema BD (negative_prompt, prompt_quality_score, target_tool)

### Fase 2: Calidad de Prompts + Aprendizaje IA (3-4 dias)
9. Prompt builder centralizado (`src/lib/ai/prompt-builder.ts`) con PromptConfig
10. Consistencia entre escenas adyacentes (inyectar contexto del prompt previo)
11. Estructura estandarizada (Subject → Action → Setting → Camera → Lighting → Quality)
12. Negative prompts automaticos (desde style_presets.negative_prompt)
13. Edicion manual de prompts en escena detalle
14. Herramienta destino: selector Grok/Midjourney/Flux y formato adaptado
15. Reglas de prompt en Project Settings (UI para global_prompt_rules)
16. Style presets aplicados automaticamente (prefix, suffix, negative)
17. Chat IA detecta intents de prompt ("hazlo mas cinematico" → accion real)

### Fase 3: UX del Storyboard (2-3 dias)
14. Header contextual con acciones rapidas por pagina
15. Breadcrumbs (Proyecto > Video > Escena)
16. Boton "Copiar todos para Grok/Flow" formateado
17. Indicador de calidad de prompt
18. Filtros de escenas (sin prompt, aprobadas, etc.)

### Fase 4: Personajes y Fondos (2 dias)
19. Edicion post-creacion de personajes y fondos
20. Prompt snippet editor con preview en tiempo real
21. Turnaround de personajes (hoja de referencia multi-angulo)
22. Variantes de fondos (diferentes horas del dia)

### Fase 5: Export y Publicacion (2 dias)
23. PDF storyboard funcional
24. ZIP completo
25. Formato optimizado para herramientas de IA
26. Calendario de publicaciones

### Fase 6: Settings y Mobile (2 dias)
27. API Keys con test de conexion (solo 3: OpenRouter, Gemini, Mistral)
28. Preferencias de IA (modelo, temperatura, estilo)
29. Mobile responsivo
30. Atajos de teclado

### Fase 7: Polish Final (2 dias)
31. Loading skeletons
32. Animaciones
33. Accesibilidad
34. Performance (paginacion, lazy loading)

---

## 15. RESUMEN DE ARCHIVOS A ELIMINAR

### Por simplificacion de IA (6 archivos)
- `src/lib/ai/providers/groq.ts` (o marcar opcional)
- `src/lib/ai/providers/stability.ts`
- `src/app/api/ai/analyze-project/route.ts`
- `src/app/api/ai/derive-video/route.ts`
- `src/app/api/ai/generate-extensions/route.ts`
- `src/app/api/ai/generate-image/route.ts`
- `src/app/api/ai/generate-project/route.ts`
- `src/app/api/ai/voices/route.ts`

### Por eliminacion de tareas (16 archivos)
- 7 paginas de tareas
- 5 componentes de tareas
- 2 hooks de tareas
- 1 vista de dashboard
- 1 componente shared

### Por limpieza de legacy (3-4 archivos)
- `src/components/layout/Sidebar.tsx` (deprecated)
- `src/components/modals/scene/SceneCreateModal.tsx` (reemplazado por SceneWorkModal)
- `src/components/chat/ChatInputV2.tsx` (si hay duplicado)

### Total estimado: ~30 archivos eliminados, app mas limpia y mantenible
