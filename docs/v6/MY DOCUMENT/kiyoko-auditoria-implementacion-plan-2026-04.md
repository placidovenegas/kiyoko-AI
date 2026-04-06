# Kiyoko AI — Auditoria de implementacion y plan de cierre

Ultima actualizacion: 2026-04-01

## Objetivo

Convertir la carpeta de especificacion en una hoja de ruta ejecutable, cruzando lo documentado en esta carpeta con lo que hoy existe en el codigo.

## Alcance del plan maestro

Este documento pasa a ser el plan de implementacion principal para ordenar el proyecto antes de seguir añadiendo mas superficie.

Su alcance incluye:

- arquitectura de aplicacion
- estrategia de datos con TanStack Query
- uso de IA por dominio y por pagina
- reorganizacion de carpetas
- definicion de componentes reutilizables
- roadmap completo de implementacion
- backlog tecnico por fases
- criterios de cierre para cada etapa

## Avance real de implementacion

### Vertical slice ya iniciado

Se implemento el primer corte real sobre dashboard para usar este dominio como patron del resto del proyecto.

Cambios aplicados:

- [src/app/(dashboard)/dashboard/page.tsx](../../../src/app/(dashboard)/dashboard/page.tsx) ya no es una pagina cliente monolitica y ahora delega en una view de dominio.
- Se creo [src/components/dashboard/DashboardHomeView.tsx](../../../src/components/dashboard/DashboardHomeView.tsx) como vista cliente desacoplada.
- Se creo [src/hooks/useDashboardOverview.ts](../../../src/hooks/useDashboardOverview.ts) como hook agregado.
- Se creo [src/lib/queries/dashboard.ts](../../../src/lib/queries/dashboard.ts) para lectura compuesta del dashboard.
- Se creo la base de IA contextual en [src/components/ai/AiAssistBar.tsx](../../../src/components/ai/AiAssistBar.tsx) y [src/components/ai/AiResultDrawer.tsx](../../../src/components/ai/AiResultDrawer.tsx).
- Se agrego query key de dashboard en [src/lib/query/keys.ts](../../../src/lib/query/keys.ts).

Significado de este avance:

- queda validado el patron page server wrapper + domain view + hook + query layer
- queda validado el inicio de IA contextual sin depender del chat global
- el siguiente dominio a migrar debe ser project overview usando exactamente este patron

Documentos base revisados:

- [kiyoko-estado-implementacion-actual.md](./kiyoko-estado-implementacion-actual.md)
- [kiyoko-implementacion-completa.md](./kiyoko-implementacion-completa.md)
- [kiyoko-v8-especificacion-completa.md](./kiyoko-v8-especificacion-completa.md)
- [kiyoko-motor-escenas-spec.md](./kiyoko-motor-escenas-spec.md)
- [kiyoko-ia-contextual-por-pagina.md](./kiyoko-ia-contextual-por-pagina.md)
- [kiyoko-persistencia-providers-estado.md](./kiyoko-persistencia-providers-estado.md)

## Resumen ejecutivo

El proyecto ya tiene una base funcional amplia: rutas principales, auth, dashboard, proyecto, video, chat global, varias APIs de IA, providers, i18n y parte de la migracion a TanStack Query. El problema no es falta de producto base. El problema es desalineacion entre arquitectura actual y la arquitectura objetivo documentada.

Los tres gaps mas importantes hoy son:

1. La IA contextual por pagina sigue casi toda pendiente.
2. Muchas paginas y hooks siguen con deuda estructural: use client en page.tsx, queries directas y hooks con useState + useEffect.
3. El motor de escenas existe a nivel de datos y pantallas, pero no esta cerrado como flujo guiado de generacion y validacion.

## Vision objetivo

Kiyoko AI debe quedar organizada como una aplicacion de workspace creativo con cuatro capas bien separadas:

1. App Router server-first para composicion de rutas y control de acceso.
2. Query layer unica para todas las lecturas y escrituras de UI.
3. Componentes de dominio desacoplados de las rutas.
4. IA contextual conectada al estado real del proyecto, no a prompts manuales sueltos.

La meta no es reescribir todo. La meta es dejar una arquitectura donde el resto del producto se pueda construir sin seguir acumulando deuda.

## Principios rectores

- Server Components por defecto en page.tsx y layout.tsx.
- TanStack Query para toda lectura que termine en UI.
- Zustand solo para estado de interfaz y preferencias de UI.
- Supabase tipado siempre con Database.
- IA como capa de orquestacion sobre datos reales del proyecto.
- Componentes de dominio reutilizables antes que paginas monoliticas.
- Una sola carpeta por dominio, sin duplicidades de singular y plural.
- Todas las mutaciones relevantes con invalidacion o optimistic updates.

## Arquitectura objetivo

### Capa 1. Rutas

Responsabilidad:

- auth y permisos
- lectura de params y searchParams
- composicion server-first
- render de views del dominio

Reglas:

- page.tsx no contiene use client
- page.tsx no hace fetch cliente directo
- page.tsx no contiene logica de dominio extensa

### Capa 2. Views de dominio

Responsabilidad:

- composicion visual de una pantalla
- coordinacion de hooks
- wiring de acciones de usuario

Ejemplos de nombres objetivo:

- DashboardHomeView
- ProjectOverviewView
- VideoWorkspaceView
- SceneWorkspaceView
- CharactersLibraryView
- TasksBoardView

### Capa 3. Hooks y queries

Responsabilidad:

- encapsular lectura y escritura
- invalidacion coherente
- optimistic updates
- tipado centralizado

Distribucion objetivo:

- [src/hooks](../../../src/hooks): hooks de consumo UI
- [src/lib/queries](../../../src/lib/queries): consultas puras y agregadas
- [src/lib/query](../../../src/lib/query): client, provider, keys y helpers

### Capa 4. IA

Responsabilidad:

- leer contexto real del dominio
- proponer planes
- ejecutar cambios via action-executor
- registrar trazabilidad en snapshots y activity_log

Distribucion objetivo:

- [src/components/ai](../../../src/components/ai): shell de interfaz IA contextual
- [src/lib/ai](../../../src/lib/ai): orquestacion, agentes, prompts, herramientas y ejecucion
- [src/app/api/ai](../../../src/app/api/ai): endpoints server

## Estructura de carpetas objetivo

### App Router

Mantener [src/app](../../../src/app), pero con wrappers finos.

Patron objetivo por ruta:

- page.tsx server wrapper
- loading.tsx y error.tsx por dominio si hace falta
- vista cliente importada desde components del dominio

Ejemplo objetivo:

- src/app/(dashboard)/dashboard/page.tsx
- src/components/dashboard/DashboardHomeView.tsx
- src/hooks/useDashboardOverview.ts
- src/lib/queries/dashboard.ts

### Componentes

Estructura recomendada:

- [src/components/ui](../../../src/components/ui): primitivas visuales
- [src/components/shared](../../../src/components/shared): wrappers transversales reutilizables
- [src/components/layout](../../../src/components/layout): shell y navegacion
- [src/components/ai](../../../src/components/ai): shell de asistencia contextual
- [src/components/dashboard](../../../src/components/dashboard): vistas y bloques del dashboard
- [src/components/project](../../../src/components/project): overview, stats, cards, activity
- [src/components/video](../../../src/components/video): list, detail, status, derivations
- [src/components/scene](../../../src/components/scene): workspace, cards, prompts, pipeline
- [src/components/character](../../../src/components/character): library, detail, gallery
- [src/components/background](../../../src/components/background): library, detail, usage
- [src/components/task](../../../src/components/task): board, list, create, filters, time
- [src/components/publication](../../../src/components/publication): planner, editor, profiles
- [src/components/analysis](../../../src/components/analysis): score, findings, improvements
- [src/components/narration](../../../src/components/narration): editor, player, voice, segments
- [src/components/timeline](../../../src/components/timeline): bars, blocks, tracks, controls
- [src/components/export](../../../src/components/export): exporters y status

Accion de reorganizacion:

- unificar [src/components/scene](../../../src/components/scene) y [src/components/scenes](../../../src/components/scenes)
- unificar [src/components/video](../../../src/components/video) y [src/components/videos](../../../src/components/videos)
- evaluar si [src/components/ai](../../../src/components/ai) debe absorber parte de [src/components/chat](../../../src/components/chat)

### Lib

Estructura recomendada:

- [src/lib/query](../../../src/lib/query): infraestructura Query
- [src/lib/queries](../../../src/lib/queries): lecturas puras por dominio
- [src/lib/ai](../../../src/lib/ai): router, engine, action-executor, context loaders
- [src/lib/supabase](../../../src/lib/supabase): clients y helpers
- [src/lib/export](../../../src/lib/export): formatos de salida
- [src/lib/narration](../../../src/lib/narration): logica de narracion y ensamblado de texto
- [src/lib/tts](../../../src/lib/tts): providers de voz
- [src/lib/theme](../../../src/lib/theme): helpers de tema
- [src/lib/constants](../../../src/lib/constants): opciones y enums UI

### Hooks

Estructura recomendada:

- hooks base en [src/hooks](../../../src/hooks)
- subcarpeta [src/hooks/queries](../../../src/hooks/queries) para hooks agregados o migraciones grandes

Categorias objetivo:

- auth y workspace
- dashboard
- project
- video
- scene
- resource
- publication
- task
- ai
- realtime

## Catalogo de componentes reutilizables

### Primitivas UI

Ya existentes y aprovechables en [src/components/ui](../../../src/components/ui):

- button
- input
- textarea
- tabs
- tooltip
- popover
- dropdown-menu
- skeleton
- sidebar
- sheet
- slider

Mejoras recomendadas:

- estandarizar props entre button, dropdown y sheet
- crear variantes consistentes de empty state, stat card y section header
- eliminar componentes visuales duplicados fuera de ui si solo son primitivas maquilladas

### Shared reutilizable

Mantener y ampliar [src/components/shared](../../../src/components/shared):

- ConfirmDialog
- FavoriteButton
- FeedbackDialog
- KiyokoLogo

Agregar:

- EmptyState
- ErrorState
- SectionHeader
- MetricCard
- InlineStatusBadge
- LoadingBlock
- DataListHeader
- FilterChips
- SearchInput
- EntityMetaRow

### IA reutilizable

Crear en [src/components/ai](../../../src/components/ai):

- AiAssistBar
- AiResultDrawer
- AiActionButton
- AiSuggestionList
- AiContextBadge
- AiExecutionProgress
- AiEmptyResult
- AiFieldAssist
- AiActionPanel

### Dashboard reutilizable

Crear en [src/components/dashboard](../../../src/components/dashboard):

- DashboardHomeView
- DashboardStatsGrid
- DashboardActivityFeed
- DashboardQuickActions
- DashboardSearchBar
- DashboardProjectFilters

### Project reutilizable

Crear o consolidar en [src/components/project](../../../src/components/project):

- ProjectOverviewView
- ProjectSummaryHero
- ProjectProgressPanel
- ProjectResourceHealth
- ProjectActivityFeed
- ProjectQuickActions

### Video reutilizable

Crear o consolidar en [src/components/video](../../../src/components/video):

- VideoWorkspaceView
- VideoHeader
- VideoSummaryPanel
- VideoStatusRail
- VideoDerivationsList

### Scene reutilizable

Crear o consolidar en [src/components/scene](../../../src/components/scene):

- SceneWorkspaceView
- SceneCard
- SceneReadiness
- ScenePipelineStatus
- ScenePromptPanel
- SceneMediaGallery
- SceneClipList
- SceneCameraPanel
- SceneCastingPanel
- SceneBackgroundPanel
- BatchGenerator
- GenerationFlow

### Resources reutilizable

Crear o consolidar:

- CharacterLibraryView
- CharacterDetailView
- CharacterIdentityPanel
- CharacterGallery
- BackgroundLibraryView
- BackgroundDetailView
- BackgroundUsagePanel
- StylePresetLibraryView
- PromptTemplateLibraryView

### Tasks reutilizable

Crear o consolidar en [src/components/task](../../../src/components/task):

- TasksBoardView
- TaskColumn
- TaskCard
- TaskCreateDialog
- TaskFilters
- TaskTimelineStrip
- TimeTrackerPanel
- TaskSuggestionPanel

### Publications reutilizable

Crear o consolidar en [src/components/publication](../../../src/components/publication):

- PublicationPlannerView
- PublicationEditorView
- PublicationProfilePicker
- PublicationItemsList
- PublicationStatusRail

### Analysis y narration reutilizable

Crear o consolidar:

- AnalysisPanel
- ScoreGauge
- StrengthWeaknessList
- SuggestionsList
- NarrationEditor
- NarrationSegmentsList
- NarrationVoicePanel
- NarrationAudioPreview

### Timeline reutilizable

Crear o consolidar en [src/components/timeline](../../../src/components/timeline):

- TimelineView
- TimelineTrack
- TimelineSceneBlock
- TimelineArcOverlay
- TimelineScale
- TimelineControls

## Mapa de implementacion por dominios

### Dominio dashboard

Objetivo:

- convertir dashboard en view desacoplada
- usar useDashboardOverview
- conectar activity, stats y quick actions
- añadir IA contextual basica

### Dominio proyecto

Objetivo:

- crear overview real de salud del proyecto
- agrupar videos, tareas, actividad y recursos en una sola query compuesta
- activar resumen y recomendaciones IA

### Dominio video

Objetivo:

- unificar overview, timeline, storyboard, script, narration, analysis y export bajo mismo workspace
- compartir hooks y panels base

### Dominio scene engine

Objetivo:

- convertir scene detail en workspace central
- incorporar readiness, prompts, camera, casting, background, media, clips y acciones IA

### Dominio resources

Objetivo:

- dejar characters, backgrounds, styles y templates con comportamiento coherente y vistas reutilizables

### Dominio tasks

Objetivo:

- transformar tareas en backlog operativo del proyecto
- integrarlas con IA, time tracking y prioridades

### Dominio publication

Objetivo:

- convertir publicaciones en flujo de planificacion, redaccion, assets y scheduling

## Roadmap maestro de implementacion

## Fase 0. Congelar deuda nueva

Duracion estimada: 1 a 2 dias

Objetivo:

- parar la deuda mientras se ejecuta el plan

Acciones:

- no crear nuevas pages cliente
- no añadir nuevas queries directas en rutas
- no añadir stores con datos de servidor
- fijar checklist de PR para Query, typing y arquitectura

## Fase 1. Reestructura de base

Duracion estimada: 4 a 6 dias

Objetivo:

- sentar la arquitectura final sin cambiar todavia toda la UX

Entregables:

- inventario completo de rutas a refactorizar
- wrappers server-first para rutas criticas
- estructura inicial de carpetas objetivo
- unificacion de dominios scene y video
- limpieza de stores obsoletos prioritarios

## Fase 2. Migracion total a TanStack Query

Duracion estimada: 6 a 10 dias

Objetivo:

- convertir la capa de datos de UI en un sistema coherente

Entregables:

- hooks faltantes por dominio
- extraccion de consultas a lib/queries
- eliminacion progresiva de fetch directo en pages
- primeras invalidaciones y optimistic updates

## Fase 3. Libreria de componentes reutilizables

Duracion estimada: 4 a 7 dias

Objetivo:

- dejar el sistema de vistas montable por piezas reutilizables

Entregables:

- shared kit ampliado
- bloques de dashboard, project, video y scene
- panels de resources, tasks y publications

## Fase 4. IA contextual minima viable

Duracion estimada: 5 a 7 dias

Objetivo:

- mover la IA desde chat global a experiencia contextual

Entregables:

- AiAssistBar
- AiResultDrawer
- adapters de contexto por pagina
- integracion inicial en 6 vistas clave

## Fase 5. Scene engine completo

Duracion estimada: 6 a 9 dias

Objetivo:

- cerrar el flujo core del producto

Entregables:

- scene workspace query
- readiness
- generation flow
- batch generation
- pipeline visual y estados coherentes

## Fase 6. Vistas complejas de produccion

Duracion estimada: 6 a 10 dias

Objetivo:

- elevar timeline, storyboard, narration, analysis y export

Entregables:

- timeline reutilizable
- storyboard con export real
- narration desacoplada
- analysis panel completo
- export jobs y estados

## Fase 7. Productividad y publicacion

Duracion estimada: 4 a 7 dias

Objetivo:

- cerrar tareas, publicaciones, perfiles sociales y seguimiento de tiempo

Entregables:

- backlog inteligente
- planner de publicaciones
- tracking de tiempo coherente
- sugerencias IA operativas

## Fase 8. Pulido final

Duracion estimada: 3 a 5 dias

Objetivo:

- estabilizar producto

Entregables:

- i18n en vistas prioritarias
- optimistic updates faltantes
- limpieza de naming y archivos legacy
- smoke tests de rutas y APIs criticas

## Prioridad de ejecucion concreta

Orden recomendado de construccion:

1. Dashboard
2. Project overview
3. Scene workspace
4. Narration y analysis
5. Tasks
6. Characters y backgrounds
7. Storyboard y timeline
8. Publications y export

## Definition of done por bloque

Un dominio se considera terminado solo si cumple todo esto:

- la ruta usa wrapper server-first
- la vista usa componentes del dominio
- no hay fetch directo en la pagina
- el estado de datos usa TanStack Query
- las mutaciones invalidan o actualizan cache correctamente
- existe loading state y error state reutilizable
- existe punto de entrada para IA contextual si aplica
- no se usa Zustand para datos de servidor

## Primer backlog ejecutable

Las primeras 12 tareas recomendadas son:

1. Crear carpeta [src/components/dashboard](../../../src/components/dashboard).
2. Crear DashboardHomeView y extraerle la logica a la pagina de dashboard.
3. Crear useDashboardOverview y lib/queries/dashboard.ts.
4. Quitar use client de dashboard page.tsx.
5. Crear useProfile y useUsageTracking.
6. Limpiar [src/stores/useActiveVideoStore.ts](../../../src/stores/useActiveVideoStore.ts).
7. Crear carpeta [src/components/ai](../../../src/components/ai) con shell inicial.
8. Crear useProjectOverview y queries de project summary.
9. Crear SceneWorkspaceView.
10. Migrar useAiSettings y useAiUsage a Query.
11. Unificar carpetas scene y scenes.
12. Unificar carpetas video y videos.

## Lo ya implementado y aprovechable

### Base de producto

- Existen 56 rutas page.tsx activas en [src/app](../../../src/app).
- Existen pantallas para dashboard, proyecto, videos, escenas, recursos, tareas, publicaciones, narracion, analisis, export y share en [src/app](../../../src/app).
- Existe chat global de Kiyoko en [src/components/chat/KiyokoChat.tsx](../../../src/components/chat/KiyokoChat.tsx) y un set amplio de componentes conversacionales en [src/components/chat](../../../src/components/chat).

### Capa IA actual

- Ya hay 18 endpoints bajo [src/app/api/ai](../../../src/app/api/ai): chat, generate-scenes, generate-project, generate-image, generate-narration, generate-timeline, analyze-image, analyze-video, derive-video, execute-actions, entre otros.
- Existe routing de providers IA en [src/lib/ai/router.ts](../../../src/lib/ai/router.ts).

### Estado y datos

- Existe cliente de React Query y persistencia en [src/lib/query/client.ts](../../../src/lib/query/client.ts).
- Existe catalogo central de query keys en [src/lib/query/keys.ts](../../../src/lib/query/keys.ts).
- Ya hay hooks de dominio migrados o parcialmente migrados en [src/hooks/useVideos.ts](../../../src/hooks/useVideos.ts), [src/hooks/useCharacters.ts](../../../src/hooks/useCharacters.ts), [src/hooks/useScenes.ts](../../../src/hooks/useScenes.ts), [src/hooks/useBackgrounds.ts](../../../src/hooks/useBackgrounds.ts), [src/hooks/useTasks.ts](../../../src/hooks/useTasks.ts).
- Existe bootstrap de dashboard en [src/providers/DashboardBootstrap.tsx](../../../src/providers/DashboardBootstrap.tsx).

### Internacionalizacion

- next-intl ya esta integrado en [src/i18n/config.ts](../../../src/i18n/config.ts), [src/i18n/request.ts](../../../src/i18n/request.ts), [messages/es.json](../../../messages/es.json) y [messages/en.json](../../../messages/en.json).

## Gap analysis real del proyecto

## Critico

### 1. La IA contextual por pagina no esta implementada

El documento objetivo pide AiAssistBar, AiResultDrawer y acciones contextuales por vista. Hoy no existen archivos en [src/components/ai](../../../src/components/ai).

Impacto:

- La IA sigue centralizada en chat global, no en la pagina donde el usuario trabaja.
- El usuario sigue teniendo que explicar contexto manualmente.
- La especificacion v8 no se traduce en UX operativa.

Como cerrarlo:

- Crear un shell comun de IA contextual en [src/components/ai](../../../src/components/ai).
- Reutilizar [src/app/api/ai/execute-actions/route.ts](../../../src/app/api/ai/execute-actions/route.ts) y los endpoints ya existentes antes de crear nuevos.
- Integrar primero en 6 vistas de mayor retorno: dashboard, project overview, videos, scenes, scene detail, narration.

### 2. Se incumple la regla de Next.js 15 para page.tsx

Hay 49 paginas con use client en archivos page.tsx bajo [src/app](../../../src/app). Esto contradice la regla del repo de no usar use client en page.tsx y layout.tsx.

Ejemplos:

- [src/app/(dashboard)/dashboard/page.tsx](../../../src/app/(dashboard)/dashboard/page.tsx)
- [src/app/(dashboard)/project/[shortId]/page.tsx](../../../src/app/(dashboard)/project/[shortId]/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/timeline/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/timeline/page.tsx)

Impacto:

- Rompe el patron esperado del App Router.
- Hace mas dificil usar params/searchParams como Promise en Next.js 15.
- Mezcla fetch, UI y estado cliente en un nivel incorrecto.

Como cerrarlo:

- Convertir page.tsx a Server Components y mover la interactividad a componentes cliente en [src/components](../../../src/components).
- Priorizar rutas con mas complejidad y trafico: dashboard, project overview, scene detail, timeline, storyboard, narration.

### 3. Muchas paginas siguen consultando Supabase directamente

La busqueda en [src/app](../../../src/app) devuelve 175 coincidencias de createClient, createBrowserClient o from en page.tsx.

Ejemplos claros:

- [src/app/(dashboard)/dashboard/page.tsx](../../../src/app/(dashboard)/dashboard/page.tsx)
- [src/app/(dashboard)/project/[shortId]/videos/page.tsx](../../../src/app/(dashboard)/project/[shortId]/videos/page.tsx)
- [src/app/(dashboard)/project/[shortId]/resources/characters/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/characters/page.tsx)
- [src/app/(dashboard)/project/[shortId]/resources/backgrounds/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/backgrounds/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/storyboard/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/storyboard/page.tsx)

Impacto:

- Cache inconsistente.
- Logica duplicada.
- Dificulta optimistic updates, invalidaciones y testeo.

Como cerrarlo:

- Crear o completar hooks de dominio con queryKeys centralizados.
- Hacer que las paginas orquesten componentes, no queries directas.
- Mover mutaciones a hooks y dejar la vista como consumidor puro.

### 4. Zustand sigue guardando datos de servidor

El store [src/stores/useActiveVideoStore.ts](../../../src/stores/useActiveVideoStore.ts) mantiene activeVideo y videos[]. Segun las reglas del repo, Zustand debe guardar solo estado de UI.

Impacto:

- Doble fuente de verdad con React Query.
- Riesgo de stale data y sincronizacion manual innecesaria.

Como cerrarlo:

- Dejar en Zustand solo selected video o UI state efimero.
- Mover videos[] al hook de datos ya existente en [src/hooks/useVideos.ts](../../../src/hooks/useVideos.ts).

## Importante

### 5. Persisten hooks legacy con useState + useEffect

En [src/hooks](../../../src/hooks) siguen apareciendo multiples hooks con loading y fetch manual.

Hooks con deuda clara:

- [src/hooks/useAiUsage.ts](../../../src/hooks/useAiUsage.ts)
- [src/hooks/useAiSettings.ts](../../../src/hooks/useAiSettings.ts)
- [src/hooks/useAiAgent.ts](../../../src/hooks/useAiAgent.ts)
- [src/hooks/useAdmin.ts](../../../src/hooks/useAdmin.ts)
- [src/hooks/useApiKeys.ts](../../../src/hooks/useApiKeys.ts)
- [src/hooks/useAnnotations.ts](../../../src/hooks/useAnnotations.ts)
- [src/hooks/useSceneCamera.ts](../../../src/hooks/useSceneCamera.ts)
- [src/hooks/useSceneMedia.ts](../../../src/hooks/useSceneMedia.ts)
- [src/hooks/useScenePrompts.ts](../../../src/hooks/useScenePrompts.ts)
- [src/hooks/useSceneShares.ts](../../../src/hooks/useSceneShares.ts)
- [src/hooks/useSceneVideoClips.ts](../../../src/hooks/useSceneVideoClips.ts)
- [src/hooks/useStylePresets.ts](../../../src/hooks/useStylePresets.ts)
- [src/hooks/useSocialProfiles.ts](../../../src/hooks/useSocialProfiles.ts)
- [src/hooks/useTimeEntries.ts](../../../src/hooks/useTimeEntries.ts)
- [src/hooks/useVideoAnalysis.ts](../../../src/hooks/useVideoAnalysis.ts)
- [src/hooks/useVideoNarration.ts](../../../src/hooks/useVideoNarration.ts)

Como cerrarlo:

- Migrar a useQuery y useMutation por lotes de dominio.
- Empezar por settings, ai, scene detail y narration, porque son los flujos con mas dependencia de datos.

### 6. El motor de escenas no esta cerrado como flujo completo

La especificacion del motor es ambiciosa, pero en producto faltan piezas de orquestacion y validacion.

Señales actuales:

- Hay paginas y hooks de escenas, camara, prompts y media.
- Hay endpoints como [src/app/api/ai/generate-scenes/route.ts](../../../src/app/api/ai/generate-scenes/route.ts), [src/app/api/ai/generate-timeline/route.ts](../../../src/app/api/ai/generate-timeline/route.ts) y [src/app/api/ai/improve-prompt/route.ts](../../../src/app/api/ai/improve-prompt/route.ts).
- Pero no existen componentes de readiness, generation flow o composition engine visibles como capa reutilizable.

Como cerrarlo:

- Crear un modulo scene-engine en [src/lib/ai](../../../src/lib/ai) o [src/lib](../../../src/lib) que componga prompt, contexto, recursos y validaciones.
- Crear 3 componentes operativos: SceneReadiness, GenerationFlow y BatchGenerator.
- Unificar el paso prompt -> imagen -> clip -> extension -> aprobacion.

### 7. Timeline, storyboard y script existen pero siguen en nivel basico

Archivos revisados:

- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/timeline/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/timeline/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/storyboard/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/storyboard/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/script/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/script/page.tsx)

Estado actual:

- Timeline: visualizacion correcta pero simple, sin drag and drop, sin zoom y sin edicion operativa.
- Storyboard: grid util, pero con joins y consultas dentro de la pagina, sin capa reusable ni export real.
- Script/Narration: funcional, pero mezcla demasiada logica, fetch manual y persistencia directa.

Como cerrarlo:

- Extraer componentes de presentacion reutilizables en dominios timeline, storyboard y narration.
- Pasar datos a hooks/query layer.
- Añadir acciones IA contextuales y flujos de guardado optimista.

## Mejora

### 8. La transicion Chat Global -> IA Contextual necesita estrategia, no reemplazo brusco

Hoy el chat global ya concentra mucho valor en [src/components/chat](../../../src/components/chat). Conviene reutilizarlo como motor de cards, no desecharlo.

Recomendacion:

- Mantener KiyokoChat mientras se construye IA contextual.
- Reusar cards existentes como respuesta renderizada de AiResultDrawer.
- Dejar el chat global como vista avanzada o modo exploracion, no como camino principal.

### 9. Hay oportunidad de cerrar el loop de i18n y settings

La base i18n existe, pero faltan paginas grandes y persistencia coherente de preferencias.

Mejoras:

- Traducir dashboard, project overview, scenes, storyboard, narration, analysis y export.
- Persistir idioma y preferencias clave en perfil si el producto lo necesita.

### 10. Faltan optimistic updates en las acciones frecuentes

Acciones candidatas:

- Reordenar escenas.
- Cambiar status de escena.
- Completar tareas.
- Eliminar recursos.
- Crear shares y publicaciones.

## Plan recomendado por fases

## Fase 0. Enderezar arquitectura base

Duracion estimada: 4 a 6 dias

Objetivo: eliminar la deuda que hoy bloquea que el resto escale bien.

Entregables:

- Inventario de page.tsx con use client y plan de extraccion.
- Refactor de las 8 a 10 paginas mas importantes a Server Component + Client View.
- Eliminacion de videos[] de [src/stores/useActiveVideoStore.ts](../../../src/stores/useActiveVideoStore.ts).
- Migracion de 6 hooks legacy prioritarios a TanStack Query.

Criterio de cierre:

- Ninguna pagina critica usa use client.
- Las vistas principales leen datos via hooks/query layer.

## Fase 1. IA contextual minima viable

Duracion estimada: 5 a 7 dias

Objetivo: llevar IA al lugar de trabajo real del usuario.

Entregables:

- Crear AiAssistBar.
- Crear AiResultDrawer.
- Crear contrato comun de acciones contextuales.
- Integracion en:
  - dashboard
  - project overview
  - videos
  - scenes
  - scene detail
  - narration

Criterio de cierre:

- El usuario puede ejecutar acciones IA sin salir de la pagina.
- Cada vista prioritaria aporta contexto automatico a la IA.

## Fase 2. Cerrar motor de escenas

Duracion estimada: 5 a 8 dias

Objetivo: convertir escenas en un pipeline guiado y verificable.

Entregables:

- Compositor de prompt desde scene + character + background + style preset + project rules.
- Checklist SceneReadiness.
- GenerationFlow con estados.
- BatchGenerator para multiples escenas.

Criterio de cierre:

- Se puede saber por que una escena no esta lista.
- El pipeline de generacion queda estandarizado y reutilizable.

## Fase 3. Mejorar vistas complejas

Duracion estimada: 6 a 10 dias

Objetivo: subir timeline, storyboard, script, analysis y export al nivel descrito en la especificacion.

Entregables:

- Timeline con componentes separados, mejor densidad visual y capacidad de accion.
- Storyboard con export real y mejor obtencion de datos.
- Script/narration desacoplado de la pagina.
- Analysis y activity log con componentes dedicados.

Criterio de cierre:

- Estas vistas dejan de ser basic pages y pasan a ser herramientas operativas.

## Fase 4. Cerrar internacionalizacion y UX de producto

Duracion estimada: 3 a 5 dias

Entregables:

- Traduccion de pantallas prioritarias.
- Optimistic updates en acciones criticas.
- Limpieza de stores obsoletos.
- Revisar persistencias duplicadas y preferencias.

## Orden de ejecucion exacto

1. Refactor de page.tsx con use client.
2. Migracion de hooks legacy a TanStack Query.
3. Limpieza de Zustand para que solo guarde UI state.
4. AiAssistBar + AiResultDrawer.
5. Integracion IA contextual en 6 vistas clave.
6. Scene engine operativo.
7. Mejora de timeline, storyboard y script.
8. i18n, optimistic updates y limpieza final.

## Quick wins de alto impacto

Si solo hubiera tiempo para una sesion corta, estas son las primeras tareas que mas retorno dan:

1. Crear inventario real de page.tsx con use client y empezar por dashboard, project overview y scene detail.
2. Migrar [src/hooks/useAiSettings.ts](../../../src/hooks/useAiSettings.ts) y [src/hooks/useAiUsage.ts](../../../src/hooks/useAiUsage.ts) a useQuery.
3. Quitar videos[] de [src/stores/useActiveVideoStore.ts](../../../src/stores/useActiveVideoStore.ts).
4. Crear estructura base de [src/components/ai](../../../src/components/ai) con AiAssistBar y AiResultDrawer vacios pero integrados.
5. Extraer la logica de storyboard a hooks y componentes antes de seguir sumando features.

## Riesgos si no se corrige ahora

- La deuda de arquitectura seguira ralentizando cada nueva feature.
- La IA contextual se volvera mas cara de integrar si primero se siguen multiplicando pantallas cliente con fetch manual.
- El motor de escenas seguira siendo percibido como conjunto de pantallas sueltas y no como workflow consistente.

## Recomendacion final

No conviene abrir mas paginas ni mas features grandes antes de cerrar Fase 0 y Fase 1. El producto ya tiene suficiente superficie. El retorno real ahora esta en consolidar arquitectura, llevar la IA al contexto correcto y convertir escenas en el flujo central mejor resuelto del sistema.

## Plan TanStack Query para todas las peticiones

### Estado verificado

La base ya existe y es utilizable:

- Cliente y defaults en [src/lib/query/client.ts](../../../src/lib/query/client.ts).
- Provider con persistencia en localStorage en [src/lib/query/provider.tsx](../../../src/lib/query/provider.tsx).
- Query keys centrales en [src/lib/query/keys.ts](../../../src/lib/query/keys.ts).

El problema no es de infraestructura. El problema es de adopcion parcial.

### Regla objetivo

Toda peticion de lectura que termine en UI debe pasar por TanStack Query.

Distribucion objetivo:

- page.tsx: solo composicion server, auth, params y carga inicial minima.
- componentes cliente: solo consumen hooks.
- hooks en [src/hooks](../../../src/hooks): usan useQuery o useMutation.
- consultas puras en [src/lib/queries](../../../src/lib/queries): encapsulan Supabase y joins.
- endpoints en [src/app/api](../../../src/app/api): solo para procesos server, acciones IA, integraciones externas, exports y operaciones privilegiadas.

### Regla de oro por tipo de llamada

- Lectura en UI: useQuery.
- Escritura desde UI: useMutation con invalidacion u optimistic update.
- Datos derivados compartidos: query select o helper en lib/queries.
- Realtime: subscription que invalida query keys, nunca store con copia permanente de datos.
- Server actions futuras: permitidas, pero la UI sigue revalidando via Query.

### Que hay que migrar exactamente

#### Dashboard y shell global

- [src/app/(dashboard)/dashboard/page.tsx](../../../src/app/(dashboard)/dashboard/page.tsx)
- [src/app/(dashboard)/organizations/page.tsx](../../../src/app/(dashboard)/organizations/page.tsx)
- [src/app/(dashboard)/organizations/[orgId]/page.tsx](../../../src/app/(dashboard)/organizations/[orgId]/page.tsx)
- [src/app/(dashboard)/settings/page.tsx](../../../src/app/(dashboard)/settings/page.tsx)
- [src/app/(dashboard)/settings/notifications/page.tsx](../../../src/app/(dashboard)/settings/notifications/page.tsx)
- [src/app/(dashboard)/settings/subscription/page.tsx](../../../src/app/(dashboard)/settings/subscription/page.tsx)
- [src/app/(dashboard)/settings/api-keys/page.tsx](../../../src/app/(dashboard)/settings/api-keys/page.tsx)

Hooks que faltan o deben reforzarse:

- useProfile
- useDashboardOverview
- useOrganizationsDetail
- useNotifications
- useUserPlan
- useUsageTracking
- useApiKeys

#### Proyecto y video

- [src/app/(dashboard)/project/[shortId]/page.tsx](../../../src/app/(dashboard)/project/[shortId]/page.tsx)
- [src/app/(dashboard)/project/[shortId]/videos/page.tsx](../../../src/app/(dashboard)/project/[shortId]/videos/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/timeline/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/timeline/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/storyboard/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/storyboard/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/script/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/script/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/narration/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/narration/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/analysis/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/analysis/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/export/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/export/page.tsx)
- [src/app/(dashboard)/project/[shortId]/video/[videoShortId]/share/page.tsx](../../../src/app/(dashboard)/project/[shortId]/video/[videoShortId]/share/page.tsx)

Hooks necesarios:

- useProjectDetail
- useProjectOverview
- useVideoDetail
- useNarrativeArcs
- useTimelineEntries
- useStoryboard
- useVideoNarration
- useVideoAnalysis
- useSceneShares
- useExportJobs

#### Recursos y productividad

- [src/app/(dashboard)/project/[shortId]/resources/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/page.tsx)
- [src/app/(dashboard)/project/[shortId]/resources/characters/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/characters/page.tsx)
- [src/app/(dashboard)/project/[shortId]/resources/characters/[charId]/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/characters/[charId]/page.tsx)
- [src/app/(dashboard)/project/[shortId]/resources/backgrounds/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/backgrounds/page.tsx)
- [src/app/(dashboard)/project/[shortId]/resources/backgrounds/[bgId]/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/backgrounds/[bgId]/page.tsx)
- [src/app/(dashboard)/project/[shortId]/resources/styles/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/styles/page.tsx)
- [src/app/(dashboard)/project/[shortId]/resources/templates/page.tsx](../../../src/app/(dashboard)/project/[shortId]/resources/templates/page.tsx)
- [src/app/(dashboard)/project/[shortId]/tasks/page.tsx](../../../src/app/(dashboard)/project/[shortId]/tasks/page.tsx)
- [src/app/(dashboard)/project/[shortId]/tasks/time/page.tsx](../../../src/app/(dashboard)/project/[shortId]/tasks/time/page.tsx)
- [src/app/(dashboard)/project/[shortId]/publications/page.tsx](../../../src/app/(dashboard)/project/[shortId]/publications/page.tsx)
- [src/app/(dashboard)/project/[shortId]/publications/new/page.tsx](../../../src/app/(dashboard)/project/[shortId]/publications/new/page.tsx)
- [src/app/(dashboard)/project/[shortId]/publications/[pubShortId]/page.tsx](../../../src/app/(dashboard)/project/[shortId]/publications/[pubShortId]/page.tsx)
- [src/app/(dashboard)/project/[shortId]/publications/profiles/page.tsx](../../../src/app/(dashboard)/project/[shortId]/publications/profiles/page.tsx)

Hooks necesarios:

- useCharacterDetail
- useCharacterImages
- useBackgroundDetail
- useStylePresets
- usePromptTemplates
- useTasks
- useTimeEntries
- usePublications
- usePublicationDetail
- useSocialProfiles

### Orden recomendado de migracion Query

1. Dashboard home y project overview.
2. Scene detail y narration.
3. Tasks, resources y publications.
4. Timeline, storyboard, analysis y export.
5. Settings, admin y shared pages.

### Convenciones recomendadas de hooks

- Un hook por agregado o entidad, no por pagina.
- Devolver siempre data, isLoading, error, refetch y mutaciones relacionadas cuando aplique.
- Mantener queryKey estable y centralizada.
- No duplicar la misma query en la pagina y en el hook.

Ejemplo objetivo:

- useProjectOverview(projectId)
- useVideoWorkspace(videoId)
- useSceneWorkspace(sceneId)
- useDashboardOverview(orgId)

### Politica de optimistic updates

Aplicar primero en:

- tasks status
- reorder scenes
- update prompt current
- toggle favorite
- remove character/background
- create or revoke share

### Deuda confirmada hoy

Aunque ya existe [src/hooks/useTasks.ts](../../../src/hooks/useTasks.ts) y [src/hooks/useScenes.ts](../../../src/hooks/useScenes.ts), siguen coexistiendo llamadas directas a tasks y scenes en paginas, componentes y chat. La migracion debe ser total, no parcial.

## Uso de la IA en el producto

### Arquitectura IA actual verificada

- Router de providers en [src/lib/ai/router.ts](../../../src/lib/ai/router.ts).
- Ejecutor de planes IA en [src/lib/ai/action-executor.ts](../../../src/lib/ai/action-executor.ts).
- Endpoint de ejecucion de acciones en [src/app/api/ai/execute-actions/route.ts](../../../src/app/api/ai/execute-actions/route.ts).
- Chat global y cards en [src/components/chat](../../../src/components/chat).

### Donde debe usarse la IA realmente

#### Dashboard

Objetivo:

- resumir avance
- detectar bloqueos
- sugerir siguiente accion util
- mostrar riesgo de proyecto y consumo IA

Tablas fuente:

- projects
- tasks
- ai_usage_logs
- activity_log
- notifications

#### Proyecto

Objetivo:

- generar o refinar ai_brief
- resumir consistencia creativa
- sugerir personajes, fondos y videos faltantes
- detectar si faltan recursos para completar pipeline

Tablas fuente:

- projects
- videos
- characters
- backgrounds
- style_presets
- prompt_templates
- tasks

#### Videos y escenas

Objetivo:

- generar escenas desde brief
- proponer arco narrativo
- mejorar prompts
- validar continuidad
- detectar huecos en casting, fondo, camara, duracion o estado

Tablas fuente:

- videos
- scenes
- narrative_arcs
- timeline_entries
- scene_camera
- scene_characters
- scene_backgrounds
- scene_prompts
- scene_media
- scene_video_clips

#### Personajes y fondos

Objetivo:

- generar descripcion visual consistente
- producir prompt visual
- analizar referencias
- detectar inconsistencias entre recursos y escenas

Tablas fuente:

- characters
- character_images
- backgrounds
- reference_maps
- scene_characters
- scene_backgrounds

#### Narracion y analisis

Objetivo:

- generar narracion continua o por escena
- sintetizar audio
- analizar ritmo, claridad, hook y cierre
- proponer mejoras accionables

Tablas fuente:

- video_narrations
- video_analysis
- scenes
- videos
- ai_usage_logs

#### Tareas y publicaciones

Objetivo:

- generar tareas desde gaps del proyecto
- priorizar backlog
- sugerir publicaciones derivadas
- adaptar copy a plataforma

Tablas fuente:

- tasks
- time_entries
- publications
- publication_items
- social_profiles

### Contrato recomendado para IA contextual

Cada pagina debe entregar a la IA:

- contexto de pagina
- entityId principal
- resumen normalizado del estado
- acciones permitidas
- tablas relacionadas relevantes

Salida esperada:

- respuesta conversacional breve
- plan estructurado de acciones
- cambios sugeridos
- acciones ejecutables y reversibles cuando aplique

### Recomendacion operativa

No crear una IA distinta por dominio. Crear un protocolo comun con adapters por pagina. Eso permite reusar el ejecutor ya existente y las cards del chat actual.

## Analisis de tablas desde el esquema actual de Supabase

Nota operativa: se intento consultar el esquema y los advisors por MCP de Supabase, pero el proyecto no respondio correctamente en este momento. Se uso como fuente de verdad el esquema local tipado en [src/types/database.types.ts](../../../src/types/database.types.ts), que hoy refleja el modelo mas completo del proyecto.

### Dominio 1. Identidad, acceso y workspace

Tablas:

- profiles
- organizations
- organization_members
- project_members
- project_shares
- user_plans
- user_api_keys
- notifications
- feedback
- billing_events

Lectura funcional:

- Este grupo resuelve multi-tenant, permisos, suscripcion y configuracion de acceso.
- Falta consolidar mejor project_members frente a project_shares para evitar reglas paralelas de acceso.

Mejoras:

- Crear hooks separados de membership y sharing.
- Centralizar verificacion de acceso alrededor de user_has_project_access.
- Separar mejor configuracion personal de configuracion organizacional en UI y carpetas.

### Dominio 2. Nucleo creativo del proyecto

Tablas:

- projects
- videos
- scenes
- narrative_arcs
- timeline_entries
- video_derivations

Lectura funcional:

- Este es el centro del producto.
- projects ya guarda ai_brief, reglas globales, estilo y metadatos creativos.
- scenes y videos concentran casi todo el flujo de produccion.

Mejoras:

- Crear vistas agregadas de project overview y video workspace.
- Evitar que timeline_entries y narrative_arcs compitan como dos fuentes paralelas del mismo relato; definir rol de cada tabla.
- Añadir capa query compuesta para overview y timeline.

### Dominio 3. Recursos creativos

Tablas:

- characters
- character_images
- backgrounds
- style_presets
- prompt_templates
- reference_maps

Lectura funcional:

- El dominio esta bien separado y soporta consistencia visual.
- Hay buena base para IA de generacion y consistencia, pero la UI todavia no la explota del todo.

Mejoras:

- Crear caracter detail y background detail como agregados completos, no como pantallas con queries manuales.
- Unificar referencias visuales y consistencia en un engine compartido.

### Dominio 4. Generacion y pipeline audiovisual

Tablas:

- scene_camera
- scene_characters
- scene_backgrounds
- scene_prompts
- scene_media
- scene_video_clips
- video_narrations
- video_analysis
- exports

Lectura funcional:

- Este grupo define el verdadero motor de escenas y postproduccion.
- La estructura es potente: versiones, current item, estado, media, prompts, clips y analisis.

Mejoras:

- Crear query compuesta scene workspace.
- Estandarizar flags is_current y version para prompts, media, clips, analysis y narrations.
- Añadir componentes de pipeline con estados coherentes de punta a punta.

### Dominio 5. Revision, auditoria y realtime

Tablas:

- scene_shares
- scene_annotations
- comments
- activity_log
- entity_snapshots
- realtime_updates
- change_history
- ai_conversations
- ai_usage_logs
- usage_tracking

Lectura funcional:

- Aqui estan los cimientos de colaboracion, trazabilidad y observabilidad.
- entity_snapshots y activity_log son muy valiosos para deshacer, revisar y auditar acciones IA.

Mejoras:

- Favorecer entity_snapshots sobre mecanismos legacy de historial.
- Llevar activity_log y ai_usage_logs a dashboards reales de producto.
- Modelar comments y scene_annotations con una experiencia de revision unificada.

### Dominio 6. Produccion operativa y publicacion

Tablas:

- tasks
- time_entries
- social_profiles
- publications
- publication_items

Lectura funcional:

- Este bloque soporta ejecucion y distribucion del trabajo.
- tasks ya tiene campos para IA, dependencia, prioridad, asignacion y relacion con scene o video.

Mejoras:

- Convertir tasks en backlog inteligente por proyecto y video.
- Hacer que publicaciones consuman de forma mas clara scenes, videos y assets generados.
- Llevar time_entries a una experiencia mas integrada con tareas.

### Vistas y funciones utiles ya presentes

- Vista ai_usage_monthly.
- Funcion user_has_project_access.
- Funciones de admin y aprobacion.

Recomendacion:

- Consumir ai_usage_monthly via Query para dashboard de coste.
- Apoyar todas las rutas sensibles en user_has_project_access cuando corresponda.

## Mejora de tareas y backlog del proyecto

### Principio

Las tareas no deben ser una lista aislada. Deben ser el backlog operativo derivado del estado real del proyecto y de la IA contextual.

### Mejoras funcionales para tasks

- Generar tareas automaticamente desde gaps de escenas, narracion, analisis y publicacion.
- Soportar plantillas de tareas por tipo de proyecto.
- Añadir sugerencias IA de prioridad, dependencias y asignacion.
- Conectar tareas con entity snapshots y activity log para trazabilidad.
- Hacer kanban con optimistic updates reales.

### Tareas tecnicas recomendadas para el backlog maestro

#### Bloque A. Fundacion de datos

- Crear hooks faltantes de dashboard, profile, notifications, usage, shares y exports.
- Eliminar fetch directo en las paginas principales.
- Mover consultas compuestas a [src/lib/queries](../../../src/lib/queries).

#### Bloque B. IA contextual

- Crear AiAssistBar.
- Crear AiResultDrawer.
- Integrar resumen de contexto por pagina.
- Conectar planes IA con execute-actions y snapshots.

#### Bloque C. Scene engine

- Crear scene workspace query.
- Crear scene readiness.
- Crear generation flow.
- Crear batch generation.

#### Bloque D. Vistas complejas

- Reescribir timeline.
- Reescribir storyboard.
- Reescribir script y narration con hooks.
- Crear panel de analysis y activity.

#### Bloque E. UX y estructura

- Traducir vistas prioritarias.
- Limpiar stores obsoletos.
- Eliminar duplicidad de carpetas y naming.
- Consolidar rutas por dominio.

## Mejora de carpetas, rutas y convenciones

### Problemas actuales

- Hay duplicidad conceptual entre [src/components/scene](../../../src/components/scene) y [src/components/scenes](../../../src/components/scenes).
- Hay duplicidad entre [src/components/video](../../../src/components/video) y [src/components/videos](../../../src/components/videos).
- En rutas existe mezcla entre vistas de dominio y vistas de workspace dentro de [src/app/(dashboard)/project/[shortId]](../../../src/app/(dashboard)/project/[shortId]).
- Hay logica de datos repartida entre page.tsx, components, chat y hooks.

### Estructura objetivo recomendada

#### En rutas

Mantener App Router, pero con este patron:

- page.tsx server wrapper
- ClientPageView dentro de un dominio de componentes
- hooks de dominio desacoplados de la ruta

Ejemplo:

- [src/app/(dashboard)/dashboard/page.tsx](../../../src/app/(dashboard)/dashboard/page.tsx) solo orquesta.
- Nuevo componente: src/components/dashboard/DashboardHomeView.tsx.
- Nuevo hook: src/hooks/useDashboardOverview.ts.

#### En componentes

Unificar nombres de dominio y evitar singular y plural en paralelo.

Propuesta:

- dashboard
- project
- video
- scene
- character
- background
- publication
- task
- analysis
- narration
- timeline
- ai
- shared
- ui

Si un dominio necesita subareas, usar subcarpetas internas y no un dominio duplicado.

#### En lib

Separar de forma estricta:

- [src/lib/queries](../../../src/lib/queries): lecturas puras tipadas.
- [src/lib/ai](../../../src/lib/ai): orquestacion IA y acciones.
- [src/lib/supabase](../../../src/lib/supabase): clientes.
- [src/lib/export](../../../src/lib/export): exporters.
- [src/lib/narration](../../../src/lib/narration) o [src/lib/tts](../../../src/lib/tts): voz.

### Rutas que conviene revisar primero

- dashboard
- project overview
- video overview
- scene detail
- tasks
- resources/characters
- resources/backgrounds
- storyboard
- timeline
- script
- narration

### Decisiones de naming recomendadas

- Usar un solo termino para el dominio en componentes: scene, no scene y scenes a la vez.
- Usar un solo termino para video: video, no video y videos a la vez, salvo cuando el plural sea solo una vista list.
- Reservar modals para UI y no para hooks o logica de datos.

## Caso concreto de la pagina dashboard

La pagina [src/app/(dashboard)/dashboard/page.tsx](../../../src/app/(dashboard)/dashboard/page.tsx) es un ejemplo claro de lo que hay que corregir.

Problemas actuales:

- usa use client en page.tsx
- mezcla estado de UI con lectura de datos
- consulta profile, projects, tasks, ai_usage_logs y activity_log directamente

Refactor recomendado:

1. Convertir page.tsx en Server Component.
2. Extraer un componente DashboardHomeView en componentes.
3. Crear useDashboardOverview para stats, actividad y datos agregados.
4. Crear useProfile o reutilizar DashboardBootstrap para saludo y contexto.
5. Sustituir queries inline por hooks y selectors.

## Limitaciones encontradas durante este analisis

- La llamada a mcp_supabase_generate_typescript_types devolvio que el proyecto no estaba activo o sano.
- Los advisors de seguridad y performance de Supabase devolvieron timeout.

Conclusión practica:

- El analisis de tablas y mejoras se apoya en el esquema local tipado, que es suficiente para planificar el trabajo.
- Cuando el MCP de Supabase vuelva a responder, conviene ejecutar una segunda pasada para validar advisors, RLS, indices y drift entre base y tipos.