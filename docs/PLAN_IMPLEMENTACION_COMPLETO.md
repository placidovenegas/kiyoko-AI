# Kiyoko AI — Plan de Implementación y Mejora Completo

> Estado actual: **~65% implementado**. Este documento cubre TODO lo que falta.
> Cada tarea tiene: qué hacer, qué archivos tocar, prioridad y esfuerzo estimado.
> Nada se queda fuera.

---

## Estado Actual — Resumen Rápido

| Área | % Hecho | Nota |
|------|---------|------|
| Base de datos (46 tablas) | 100% | Schema v4 completo + seed + RLS + Realtime |
| Tipos TypeScript | 100% | Derivados de DB, 0 casts manuales |
| Rutas de la app | 85% | 46/54 rutas existen, 16 son stubs |
| Páginas con UI real | 60% | 24 de 40 páginas principales construidas |
| TanStack Query | 70% | 17 páginas lo usan, otras usan useState |
| Componentes del spec | 60% | Faltan publications/, sharing/, ai-settings/ |
| Sistema de IA | 50% | Chat funciona, pero IA no guarda datos en DB |
| Best practices (loading/error/metadata) | 30% | Solo 3 loading.tsx, 1 error.tsx, 0 metadata |
| Diseño visual | 70% | Dark mode OK, pero colores brand incorrectos |

---

## FASE 1: Colores y Tema (1 día)

Los colores actuales usan azul como primario. El spec define teal #0EA5A0 como primario de marca.

| # | Tarea | Archivo(s) | Esfuerzo |
|---|-------|-----------|----------|
| 1.1 | Actualizar CSS variables con colores Kiyoko (teal, green, coral) | `src/app/globals.css` | Bajo |
| 1.2 | Actualizar --color-primary de azul a #0EA5A0 en todo el CSS | `globals.css` | Bajo |
| 1.3 | Verificar que KButton, badges y componentes usan la variable CSS | `src/components/ui/kiyoko-button.tsx`, etc. | Bajo |
| 1.4 | Verificar gradientes del logo (linear-gradient 135deg, #0EA5A0, #34D399) | `KiyokoLogo.tsx` | Bajo |

---

## FASE 2: IA — Fixes Críticos (3-5 días)

La IA genera contenido pero NO lo guarda en la base de datos. Es el problema más grave.

### 2.1 Usar el agente IA del proyecto

| # | Tarea | Archivo(s) | Esfuerzo |
|---|-------|-----------|----------|
| 2.1.1 | En `/api/ai/chat`: cargar `project_ai_agents` y usar su `system_prompt` | `src/app/api/ai/chat/route.ts` | Medio |
| 2.1.2 | En `/api/ai/chat`: cargar `project_ai_settings` para saber qué provider usar | `src/app/api/ai/chat/route.ts` | Bajo |
| 2.1.3 | Pasar `creativity_level` como `temperature` al modelo | `src/app/api/ai/chat/route.ts` | Bajo |
| 2.1.4 | Filtrar escenas del chat por `video_id` (no cargar TODAS las del proyecto) | `src/app/api/ai/chat/route.ts` | Medio |

### 2.2 Persistir datos generados

| # | Tarea | Archivo(s) | Esfuerzo |
|---|-------|-----------|----------|
| 2.2.1 | `/api/ai/generate-image`: subir imagen a `kiyoko-storage` + insertar en `scene_media` | `src/app/api/ai/generate-image/route.ts` | Medio |
| 2.2.2 | `/api/ai/generate-image`: leer `style_presets` y aplicar prefix/suffix al prompt | Mismo archivo | Bajo |
| 2.2.3 | `/api/ai/generate-scenes`: insertar escenas en DB con `video_id`, `short_id` | `src/app/api/ai/generate-scenes/route.ts` | Alto |
| 2.2.4 | `/api/ai/generate-scenes`: crear `scene_camera` y `scene_prompts` por cada escena | Mismo archivo | Medio |
| 2.2.5 | `/api/ai/generate-narration`: guardar texto en `video_narrations` | `src/app/api/ai/generate-narration/route.ts` | Medio |
| 2.2.6 | `/api/ai/generate-voice`: subir audio a Storage + actualizar `video_narrations.audio_url` | `src/app/api/ai/generate-voice/route.ts` | Medio |
| 2.2.7 | `/api/ai/generate-voice`: verificar cuota ElevenLabs antes de generar | Mismo archivo | Bajo |
| 2.2.8 | `/api/ai/analyze-project`: renombrar a `analyze-video`, recibir `video_id`, guardar en `video_analysis` | Renombrar ruta + reescribir | Alto |
| 2.2.9 | `/api/ai/generate-arc`: recibir `video_id`, guardar en `narrative_arcs` | `src/app/api/ai/generate-arc/route.ts` | Bajo |
| 2.2.10 | `/api/ai/generate-timeline`: recibir `video_id`, guardar en `timeline_entries` | `src/app/api/ai/generate-timeline/route.ts` | Bajo |

### 2.3 Action Executor v4

| # | Tarea | Archivo(s) | Esfuerzo |
|---|-------|-----------|----------|
| 2.3.1 | Migrar `add_character_to_scene` para usar tabla `scene_characters` (N:N) | `src/lib/ai/action-executor.ts` | Medio |
| 2.3.2 | Migrar `remove_character_from_scene` para usar `scene_characters` | Mismo archivo | Medio |
| 2.3.3 | Migrar `update_prompt` para usar tabla `scene_prompts` | Mismo archivo | Medio |
| 2.3.4 | Al crear escena, crear `scene_camera` automáticamente | Mismo archivo | Bajo |
| 2.3.5 | Guardar `entity_snapshots` en cada acción (reemplazar `change_history`) | Mismo archivo | Alto |
| 2.3.6 | Añadir acciones: `update_camera`, `assign_background` | `src/lib/ai/tools.ts` + executor | Medio |

### 2.4 Nuevas rutas de IA

| # | Tarea | Archivo(s) | Esfuerzo |
|---|-------|-----------|----------|
| 2.4.1 | Crear `/api/ai/providers/status` (ya tiene función, falta el handler) | Nuevo: `src/app/api/ai/providers/status/route.ts` | Bajo |
| 2.4.2 | Crear `/api/ai/analyze-image` (visión IA para personajes/fondos) | Nuevo archivo | Alto |
| 2.4.3 | Crear `/api/ai/generate-extensions` (extensiones de clips de vídeo) | Nuevo archivo | Alto |
| 2.4.4 | Crear `/api/ai/derive-video` (crear vídeo derivado completo) | Nuevo archivo | Alto |

### 2.5 API Keys del usuario en todas las rutas

| # | Tarea | Archivo(s) | Esfuerzo |
|---|-------|-----------|----------|
| 2.5.1 | Función helper `getModelForUser(userId, providerId)` que busca key del usuario | `src/lib/ai/sdk-router.ts` | Medio |
| 2.5.2 | Usar este helper en TODAS las rutas de IA (no solo chat) | Todas las rutas `/api/ai/*` | Medio |
| 2.5.3 | Verificar presupuesto mensual antes de usar key del usuario | Helper + rutas | Bajo |

---

## FASE 3: Páginas Stub → Completas (5-7 días)

16 páginas son stubs "En construcción". Convertirlas en páginas funcionales.

### Prioridad Alta (bloquean uso)

| # | Página | Qué construir | Esfuerzo |
|---|--------|--------------|----------|
| 3.1 | `/project/:shortId/video/:vid/derive` | Chat IA para derivar vídeo. Propuesta de escenas + aprobación + creación | Alto |
| 3.2 | `/project/:shortId/video/:vid/share` | Ya parcial — completar: copiar link, password, expiración | Medio |
| 3.3 | `/project/:shortId/video/:vid/export` | Formatos: PDF storyboard, JSON, Markdown, MP4 (futuro) | Medio |
| 3.4 | `/share/:token` | Vista pública: validar token, mostrar escenas, form de anotaciones | Alto |
| 3.5 | `/project/:shortId/activity` | Timeline vertical con activity_log, filtros por tipo/usuario | Medio |
| 3.6 | `/project/:shortId/chat` | Chat IA pantalla completa (reusar KiyokoChat mode=expanded) | Bajo |

### Prioridad Media

| # | Página | Qué construir | Esfuerzo |
|---|--------|--------------|----------|
| 3.7 | `/dashboard/shared` | Grid de proyectos compartidos conmigo (via project_shares) | Medio |
| 3.8 | `/dashboard/publications` | Calendario global de publicaciones de todos los proyectos | Medio |
| 3.9 | `/project/:shortId/resources/characters/:charId` | Galería de imágenes, análisis IA, reglas, escenas | Ya existe — verificar |
| 3.10 | `/project/:shortId/resources/backgrounds/:bgId` | Similar a personaje pero para fondos | Ya existe — verificar |
| 3.11 | `/project/:shortId/resources/styles` | CRUD de style_presets con preview | Ya existe — verificar |
| 3.12 | `/project/:shortId/resources/templates` | CRUD de prompt_templates con variables | Ya existe — verificar |
| 3.13 | `/project/:shortId/publications/profiles` | Gestión de perfiles de redes sociales | Ya existe — verificar |
| 3.14 | `/project/:shortId/publications/new` | Wizard: perfil → tipo → items → caption → programar | Ya existe — verificar |

### Prioridad Baja

| # | Página | Qué construir | Esfuerzo |
|---|--------|--------------|----------|
| 3.15 | `/project/:shortId/tasks/time` | Timer start/stop + historial + reportes | Medio |
| 3.16 | `/project/:shortId/settings/sharing` | Invitar colaboradores, gestionar roles | Medio |
| 3.17 | `/settings/subscription` | Plan actual, upgrade, historial pagos | Bajo (UI only) |
| 3.18 | `/settings/notifications` | Checkboxes de qué notificaciones recibir | Bajo |
| 3.19 | `/organizations/:orgId` | Detalle de org: miembros, roles, invitaciones | Medio |
| 3.20 | `/project/:shortId/video/:vid/storyboard` | Eliminar — redirigir a video overview | Bajo |

---

## FASE 4: Componentes Faltantes (3-5 días)

### Carpetas de componentes a crear

| # | Carpeta | Componentes | Esfuerzo |
|---|---------|-------------|----------|
| 4.1 | `src/components/publications/` | PublicationCard, PublicationCalendar, PublicationEditor, SocialProfileCard, PublicationPreview | Alto |
| 4.2 | `src/components/sharing/` | ShareLinkCreator, SharedScenesView, AnnotationList | Medio |
| 4.3 | `src/components/ai-settings/` | AgentConfigurator, GeneratorSettings, ToneSlider | Medio |
| 4.4 | `src/components/video/` | VideoCard, VideoGrid, VideoOverview, VideoDeriveChat (solo 2 de 6+ existen) | Medio |

### Componentes individuales faltantes

| # | Componente | En carpeta | Para qué |
|---|-----------|-----------|----------|
| 4.5  | SceneClipPlayer     |  `scene/`  | Reproducir base + extensiones encadenados |
| 4.6  | SceneAnnotationForm |  `scene/`  | Form de anotación del cliente |
| 4.7  | CameraConfig        |  `scene/`  | Selectores de ángulo, movimiento, luz, mood |
| 4.8  | RollbackButton      |  `chat/`   | Botón deshacer bajo acciones del chat |
| 4.9  | ProjectSwitcher     |  `layout/` | Dropdown de proyectos en header |
| 4.10 | VideoSwitcher       |  `layout/` | Dropdown de vídeos en header |
| 4.11 | LoadingScreen       |  `shared/` | Skeleton de carga genérico |
| 4.12 | TimeTracker         |  `tasks/`  | Timer start/stop para time_entries |
| 4.13 | TaskCalendar        |  `tasks/`  | Vista calendario de tareas |
| 4.14 | ArcBar legend       |  `video/`  | Leyenda de colores del ArcBar |

### Carpetas de componentes a eliminar

| # | Carpeta | Motivo |
|---|---------|--------|
| 4.15 | `src/components/storyboard/` | Ya eliminada — verificar que no queden refs |
| 4.16 | `src/components/arc/` | No existe — confirmar |
| 4.17 | `src/components/references/` | No existe — confirmar |

---

## FASE 5: Best Practices Next.js (2-3 días)

### 5.1 loading.tsx en cada grupo de rutas

| # | Ruta | Archivo a crear |
|---|------|----------------|
| 5.1.1 | `/project/:shortId/video/:vid/` | `video/[videoShortId]/loading.tsx` |
| 5.1.2 | `/project/:shortId/video/:vid/scene/:sid/` | `scene/[sceneShortId]/loading.tsx` |
| 5.1.3 | `/project/:shortId/resources/` | `resources/loading.tsx` |
| 5.1.4 | `/project/:shortId/publications/` | `publications/loading.tsx` |
| 5.1.5 | `/project/:shortId/tasks/` | `tasks/loading.tsx` |
| 5.1.6 | `/project/:shortId/settings/` | `settings/loading.tsx` |
| 5.1.7 | `/settings/` | `settings/loading.tsx` |
| 5.1.8 | `/admin/` | `admin/loading.tsx` |

Cada loading.tsx: skeleton con `animate-pulse` acorde al layout de la página.

### 5.2 error.tsx en cada grupo de rutas

| # | Ruta | Archivo a crear |
|---|------|----------------|
| 5.2.1-8 | Mismas rutas que arriba | `error.tsx` con mensaje + botón reintentar |

### 5.3 generateMetadata dinámico

| # | Página | Qué incluir en metadata |
|---|--------|------------------------|
| 5.3.1 | `/project/:shortId` | `title: "{projectTitle} | Kiyoko AI"` |
| 5.3.2 | `/project/:shortId/video/:vid` | `title: "{videoTitle} | {projectTitle} | Kiyoko AI"` |
| 5.3.3 | `/project/:shortId/video/:vid/scene/:sid` | `title: "Escena {n}: {sceneTitle} | Kiyoko AI"` |
| 5.3.4 | `/share/:token` | `title: "Revisión de escenas | Kiyoko AI"` |

**Nota:** generateMetadata requiere que page.tsx sea un Server Component async. Las páginas actuales son `'use client'`. Para implementar esto sin reescribirlas, se puede crear un wrapper Server Component que hace el prefetch y pasa datos al Client Component via HydrationBoundary (patrón del best_practices.md).

### 5.4 Migrar páginas restantes a TanStack Query

| # | Página | Estado actual | Cambio |
|---|--------|--------------|--------|
| 5.4.1 | `/project/:shortId/videos` | useState+useCallback | Migrar a useQuery |
| 5.4.2 | `/settings` | useState | Migrar a useQuery |
| 5.4.3 | `/settings/api-keys` | useState+useEffect | Migrar a useQuery+useMutation |
| 5.4.4 | `/admin/users` | useState+useEffect | Migrar a useQuery |
| 5.4.5 | `/organizations` | useState+useEffect | Migrar a useQuery |

### 5.5 Eliminar stores duplicados

| # | Store | Reemplazado por |
|---|-------|----------------|
| 5.5.1 | `useProjectStore` (datos del servidor) | TanStack Query via ProjectContext |
| 5.5.2 | `useScenesStore` (escenas del servidor) | TanStack Query via VideoContext |
| 5.5.3 | `useVideoStore` (vídeo del servidor) | TanStack Query via VideoContext |

**Mantener:** `useUIStore`, `useOrgStore`, `useFilterStore`, `useAiChatStore`, `useAiProviderStore`, `useNarrationStore`, `useActiveVideoStore`, `useRealtimeStore` (estos son estado UI, no datos del servidor).

---

## FASE 6: Diseño Visual — Alineación con Spec (3-5 días)

### 6.1 Header

| # | Tarea | Detalle |
|---|-------|---------|
| 6.1.1 | Añadir ProjectSwitcher al header | Dropdown que lista proyectos de la org, al cambiar navega |
| 6.1.2 | Añadir VideoSwitcher al header | Dropdown que lista vídeos del proyecto, al cambiar navega |
| 6.1.3 | Mejorar breadcrumbs | [Org] / [Proyecto] / [Vídeo] con dropdowns |
| 6.1.4 | Añadir botón ⌘K visible | Input de búsqueda con CommandMenu |
| 6.1.5 | Verificar altura h-14 (56px) | Ya debería estar hecho |

### 6.2 Sidebars

| # | Tarea | Detalle |
|---|-------|---------|
| 6.2.1 | Verificar VideoSidebar tiene todos los links del spec | Overview, Escenas, Timeline, Narración, Análisis, Compartir, Exportar |
| 6.2.2 | Añadir selector de vídeo en VideoSidebar | Dropdown para cambiar de vídeo sin volver al proyecto |
| 6.2.3 | Añadir sección Favoritos en DashboardSidebar | Ya parcialmente implementado |
| 6.2.4 | Verificar sidebar width 240px / 64px collapsed | CSS variable --sidebar-width |

### 6.3 Páginas principales — polish visual

| # | Página | Qué mejorar |
|---|--------|-------------|
| 6.3.1 | Dashboard | Añadir widget de actividad reciente |
| 6.3.2 | Project overview | Mejorar hero gradient, añadir tags visuales |
| 6.3.3 | Video overview | Mejorar ArcBar con leyenda, mejor empty state |
| 6.3.4 | Scene detail | Mejorar clip player visual, versiones de imagen |
| 6.3.5 | Tasks | Mejorar kanban con drag-and-drop real (dnd-kit) |
| 6.3.6 | Characters | Mejorar galería de imágenes con grid |

### 6.4 Responsive

| # | Tarea | Detalle |
|---|-------|---------|
| 6.4.1 | < 768px: sidebar como sheet, chat como sheet desde abajo | Verificar MobileNav |
| 6.4.2 | 768-1024px: sidebar colapsada 64px | Verificar |
| 6.4.3 | Grids: 2 cols mobile, 3 tablet, 4 desktop | Verificar scene grid |
| 6.4.4 | Scene detail: tabs en mobile en vez de 2 columnas | Implementar |

---

## FASE 7: Funcionalidades Avanzadas (2+ semanas)

### 7.1 Visión IA

| # | Tarea | Detalle |
|---|-------|---------|
| 7.1.1 | `/api/ai/analyze-image` endpoint | Recibe URL de imagen, devuelve análisis estructurado |
| 7.1.2 | Flujo: subir imagen personaje → auto-analizar → generar ai_prompt_description | Integrar con character detail page |
| 7.1.3 | Flujo: subir imagen fondo → auto-analizar → generar prompt_snippet | Integrar con background detail page |
| 7.1.4 | Generar ángulos de personaje con IA (front, side, back, etc.) | Botón en character detail |

### 7.2 Generación de clips de vídeo

| # | Tarea | Detalle |
|---|-------|---------|
| 7.2.1 | `/api/ai/generate-extensions` endpoint | Genera extensión desde último frame del clip |
| 7.2.2 | UI: botón "Generar extensión" en scene detail | Usa prompt de extensión |
| 7.2.3 | Guardar clips en `scene_video_clips` con parent_clip_id | Encadenar base + ext1 + ext2 |

### 7.3 Derivar vídeos

| # | Tarea | Detalle |
|---|-------|---------|
| 7.3.1 | `/api/ai/derive-video` endpoint | Analiza vídeo original, propone plan, crea nuevo vídeo |
| 7.3.2 | UI: chat de derivación con plan visual | Mostrar escenas a mantener/modificar/eliminar |
| 7.3.3 | Al aprobar: crear vídeo + copiar escenas adaptadas + insertar video_derivation | Full flow |

### 7.4 Publicaciones

| # | Tarea | Detalle |
|---|-------|---------|
| 7.4.1 | Wizard de creación de publicación | Perfil → tipo → items → caption → hashtags → programar |
| 7.4.2 | Preview de publicación como se vería en la red social | Instagram, TikTok, YouTube |
| 7.4.3 | Generación de imágenes/vídeos para publicación con IA | Usar prompts de publication_items |
| 7.4.4 | Calendario visual de publicaciones | Vista mes con dots de colores |

### 7.5 Compartir y anotaciones

| # | Tarea | Detalle |
|---|-------|---------|
| 7.5.1 | `/share/:token` completo | Validar token, contraseña, mostrar escenas, form de anotación |
| 7.5.2 | Vista de anotaciones recibidas en la page de share del vídeo | Lista con estado resuelto/pendiente |
| 7.5.3 | Notificar al owner cuando se recibe una anotación | Insertar en notifications |

### 7.6 Time tracking

| # | Tarea | Detalle |
|---|-------|---------|
| 7.6.1 | Componente Timer con start/stop/pause | Guarda en time_entries |
| 7.6.2 | Historial de entradas con filtros | Por vídeo, categoría, persona |
| 7.6.3 | Reportes visuales | Barras por categoría, horas/día |

---

## FASE 8: Realtime y Performance (1 semana)

| # | Tarea | Detalle |
|---|-------|---------|
| 8.1 | Integrar Supabase Realtime con TanStack Query cache | `setQueryData` en listeners |
| 8.2 | Presence: mostrar quién está viendo el proyecto | Dot verde en sidebar |
| 8.3 | Toast cuando otro usuario edita una escena | "María editó Escena 3" |
| 8.4 | Eliminar stores duplicados (ProjectStore, VideoStore, ScenesStore) | Usar solo TQ cache |
| 8.5 | Prefetch con Server Components + HydrationBoundary | Para las 4 páginas principales |

---

## FASE 9: PWA y Accesibilidad (3 días)

| # | Tarea | Detalle |
|---|-------|---------|
| 9.1 | `src/app/manifest.ts` con info de Kiyoko | name, icons, theme_color |
| 9.2 | Meta tags para iOS (apple-mobile-web-app) | En layout.tsx |
| 9.3 | Service Worker básico para cache offline | next-pwa o manual |
| 9.4 | Keyboard shortcuts: ⌘K, ⌘/, ⌘B, Esc | Integrar en CommandMenu |
| 9.5 | ARIA labels en todos los botones e inputs | Audit |
| 9.6 | Focus management en modales y sheets | Verificar |

---

## Resumen por Prioridad

### CRÍTICO (Semana 1) — Sin esto la app no funciona bien
- [ ] 1.1-1.4: Colores de marca
- [ ] 2.1.1-2.1.4: IA usa agente del proyecto
- [ ] 2.2.1-2.2.2: Imágenes se guardan en Storage
- [ ] 2.2.8: Análisis guarda en video_analysis
- [ ] 2.4.1: Endpoint /api/ai/providers/status

### ALTO (Semana 2-3) — Necesario para usar la app en producción
- [ ] 2.2.3-2.2.10: Todas las rutas IA guardan en DB
- [ ] 2.3.1-2.3.6: Action executor migrado a v4
- [ ] 2.5.1-2.5.3: API keys del usuario en todas las rutas
- [ ] 3.1-3.6: Páginas stub de prioridad alta
- [ ] 5.1.1-5.1.8: loading.tsx en cada ruta
- [ ] 5.2.1-5.2.8: error.tsx en cada ruta

### MEDIO (Semana 3-4) — Mejora significativa de UX
- [ ] 3.7-3.14: Páginas stub restantes
- [ ] 4.1-4.4: Carpetas de componentes faltantes
- [ ] 5.3.1-5.3.4: generateMetadata
- [ ] 5.4.1-5.4.5: Migrar páginas restantes a TanStack Query
- [ ] 6.1-6.4: Polish visual y responsive

### BAJO (Semana 4+) — Polish y funcionalidades avanzadas
- [ ] 7.1-7.6: Visión IA, clips, derivar, publicaciones, compartir, time tracking
- [ ] 8.1-8.5: Realtime y performance
- [ ] 9.1-9.6: PWA y accesibilidad

---

## Conteo Total de Tareas

| Fase | Tareas | Días estimados |
|------|--------|---------------|
| 1. Colores | 4 | 1 |
| 2. IA Fixes | 25 | 5-7 |
| 3. Páginas stub | 20 | 5-7 |
| 4. Componentes | 17 | 3-5 |
| 5. Best practices | 20 | 2-3 |
| 6. Diseño visual | 15 | 3-5 |
| 7. Avanzadas | 15 | 10-14 |
| 8. Realtime | 5 | 3-5 |
| 9. PWA | 6 | 2-3 |
| **TOTAL** | **127 tareas** | **~5-7 semanas** |
