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

## 11. ORDEN DE EJECUCION SUGERIDO

### Fase 1: Fundamentos (3-4 dias)
1. Extraer constantes duplicadas
2. Extraer componentes reutilizables
3. Eliminar codigo muerto
4. Consistencia de modales

### Fase 2: Calidad de Prompts (2-3 dias)
5. Consistencia entre escenas adyacentes
6. Estructura estandarizada de prompts
7. Negative prompts automaticos
8. Edicion manual de prompts
9. Prompt builder centralizado

### Fase 3: UX del Storyboard (2-3 dias)
10. Header contextual con acciones rapidas
11. Breadcrumbs
12. Copiar todos los prompts formateado
13. Indicador de calidad de prompt
14. Filtros de escenas

### Fase 4: Personajes y Fondos (2 dias)
15. Edicion post-creacion
16. Prompt snippet editor con preview
17. Turnaround de personajes
18. Variantes de fondos

### Fase 5: Export y Publicacion (2 dias)
19. PDF storyboard funcional
20. ZIP completo
21. Formato optimizado para herramientas de IA
22. Calendario de publicaciones

### Fase 6: Settings y Mobile (2 dias)
23. API Keys con test de conexion
24. Preferencias de IA
25. Mobile responsivo
26. Atajos de teclado

### Fase 7: Polish Final (2 dias)
27. Loading skeletons
28. Animaciones
29. Accesibilidad
30. Performance (paginacion, lazy loading)
