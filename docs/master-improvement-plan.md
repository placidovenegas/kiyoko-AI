# Kiyoko AI — Plan Maestro de Mejoras

> Documento de referencia para el equipo de desarrollo.
> Cubre: IA, diseño, páginas, chat, sidebar, modales, y roadmap.
> Última actualización: Abril 2026

---

## Índice

1. [Estado actual](#1-estado-actual)
2. [Arquitectura IA](#2-arquitectura-ia)
3. [Chat IA — Cómo mejorarlo](#3-chat-ia)
4. [Sidebar — Mejoras](#4-sidebar)
5. [Páginas — Qué crear, mejorar, eliminar](#5-páginas)
6. [Modales — Sistema completo](#6-modales)
7. [Diseño visual — Estándares](#7-diseño-visual)
8. [Flujo del usuario](#8-flujo-del-usuario)
9. [Base de datos](#9-base-de-datos)
10. [Roadmap de implementación](#10-roadmap)

---

## 1. Estado actual

### Lo que funciona
- ✅ Dashboard minimalista con stats y proyectos
- ✅ Storyboard detallado con 3 vistas (Storyboard/Compacto/Timeline)
- ✅ Generación de prompts con IA (API funcional)
- ✅ SceneGeneratorModal — crear escenas con IA conversacional
- ✅ SceneEditorModal — editar escenas con acciones rápidas + markdown + typing
- ✅ Scene Detail — editor completo con prompts editables
- ✅ 6 proveedores IA (OpenRouter/Qwen, Gemini Vision, Voxtral TTS)
- ✅ Colores del logo teal integrados
- ✅ 10 agentes IA especializados
- ✅ Narración con TTS
- ✅ Export JSON/MD/HTML
- ✅ Sistema de publicaciones básico

### Lo que falta
- ❌ Chat IA contextual mejorado (enviar datos reales de la escena)
- ❌ Selector de personajes/fondos en scene detail
- ❌ Upload de imágenes en escenas
- ❌ Análisis de imagen subida → mejora prompt video
- ❌ PDF export
- ❌ Preview mockup de publicaciones
- ❌ APIs conectadas al frontend (7 rutas sin UI)

---

## 2. Arquitectura IA

### Stack B (producción, $0.022/proyecto)

```
┌─────────────────────────────────────────────┐
│  OJOS     → Gemini 2.5 Flash               │
│             Analiza imágenes subidas         │
│             Composición, mood, estilo        │
│                                              │
│  CEREBRO  → Qwen 3.5 Flash (OpenRouter)     │
│             Genera prompts, escenas          │
│             $0.065/M tokens                  │
│                                              │
│  CEREBRO+ → Qwen 3.5 Plus (OpenRouter)      │
│             Análisis complejos, consejos     │
│             $0.26/M tokens                   │
│                                              │
│  VOZ      → Voxtral TTS (Mistral)           │
│             Narración, clonación de voz      │
│             $0.016/1K chars                  │
└─────────────────────────────────────────────┘
```

### Cómo usa la IA cada página

| Página | Acción IA | API | Estado |
|--------|-----------|-----|--------|
| **Vista General** | Generar prompts por escena | `/api/ai/generate-scene-prompts` | ✅ Funciona |
| **Vista General** | Generar todas las escenas | SceneGeneratorModal | ✅ Mock, falta API real |
| **Vista General** | Editar escena con IA | SceneEditorModal | ✅ Mock, falta API real |
| **Scene Detail** | Generar prompts imagen+video | `/api/ai/generate-scene-prompts` | ✅ Funciona |
| **Scene Detail** | Mejorar prompt existente | `/api/ai/improve-prompt` | ❌ No conectado |
| **Scene Detail** | Analizar imagen subida | `/api/ai/analyze-image` | ❌ No conectado |
| **Timeline** | Generar arco narrativo | `/api/ai/generate-arc` | ❌ No conectado |
| **Timeline** | Generar desglose temporal | `/api/ai/generate-timeline` | ❌ No conectado |
| **Narración** | Generar texto narración | `/api/ai/generate-narration` | ✅ Funciona |
| **Narración** | Generar audio TTS | `/api/ai/generate-voice` | ✅ Funciona |
| **Análisis** | Analizar video completo | `/api/ai/analyze-video` | ✅ Funciona |
| **Personajes** | Generar personaje desde texto | `/api/ai/generate-characters` | ❌ No conectado |
| **Publicaciones** | Generar captions/hashtags | No existe | ❌ Por crear |

### APIs sin frontend (conectar)

| API | Qué hace | Dónde poner el botón |
|-----|----------|---------------------|
| `/api/ai/generate-arc` | Genera arco narrativo | Timeline: "Generar arco con IA" |
| `/api/ai/generate-timeline` | Genera desglose temporal | Timeline/Scene Detail: "Generar timeline" |
| `/api/ai/improve-prompt` | Mejora prompt existente | Scene Detail: "Mejorar prompt" |
| `/api/ai/analyze-image` | Analiza imagen subida | Scene Detail: al subir imagen |
| `/api/ai/generate-characters` | Genera personajes batch | Personajes: "Generar con IA" |
| `/api/ai/generate-extensions` | Extiende escena | SceneEditorModal: "Extender" |
| `/api/ai/derive-video` | Adapta video a otra plataforma | Video: "Adaptar para TikTok" |

---

## 3. Chat IA

### Estado actual
- Panel lateral derecho (sidebar mode)
- 10 agentes especializados
- Detecta intents del mensaje
- Puede crear/editar entidades
- Historial guardado en DB

### Problemas
1. **Contexto incompleto** — no envía datos reales de la escena al abrir
2. **No ejecuta acciones directas** — "cambia el ángulo" no cambia nada
3. **Sin sugerencias contextuales** — no muestra chips al abrir
4. **Resultado no visual** — texto plano sin markdown ni botones

### Plan de mejora

#### Fase 1: Contexto completo
Cuando el chat se abre desde una escena, enviar TODO:
```typescript
contextClientHint: {
  level: 'scene',
  sceneId: scene.id,
  sceneTitle: scene.title,
  sceneDescription: scene.description,
  currentImagePrompt: promptText,
  currentVideoPrompt: videoPromptText,
  cameraAngle: camera.angle,
  cameraMovement: camera.movement,
  characters: assignedCharacters.map(c => c.name),
  background: assignedBackground?.name,
  audioConfig: scene.audio_config,
  duration: scene.duration_seconds,
  arcPhase: scene.arc_phase,
}
```

#### Fase 2: Sugerencias contextuales
Al abrir el chat, mostrar chips clicables:
```
[Mejorar prompts] [Cambiar cámara] [Añadir personaje] [Extender escena]
```

#### Fase 3: Acciones directas
El chat devuelve action plans que se ejecutan:
```json
{
  "action": "update_scene",
  "changes": {
    "camera_angle": "low_angle",
    "camera_movement": "crane"
  }
}
```
→ Se ejecuta automáticamente y se muestra confirmación.

#### Fase 4: Resultados visuales
Las respuestas del chat renderizan:
- Markdown con negritas, bullets, emojis ✅ (ya implementado en SceneEditorModal)
- Botones de acción inline ✅ (ya implementado)
- Preview de prompts con botón "Actualizar"
- Comparación antes/después

### Dónde se abre el chat

| Contexto | Agente | Sugerencias |
|----------|--------|-------------|
| Dashboard | router | "Crear proyecto", "Resumen" |
| Proyecto | project | "Crear video", "Añadir personaje" |
| Video storyboard | scenes | "Generar escenas", "Mejorar prompt" |
| Scene detail | scenes | "Mejorar", "Cambiar cámara", "Extender" |
| Personajes | characters | "Generar personaje", "Mejorar descripción" |
| Fondos | backgrounds | "Generar fondo", "Mejorar prompt" |
| Timeline | editor | "Generar arco", "Reordenar escenas" |
| Narración | editor | "Generar narración", "Cambiar voz" |

---

## 4. Sidebar

### Estado actual
- 3 niveles: Dashboard / Proyecto / Video
- Colapsable a modo icono
- Lista de escenas con dots de estado
- Footer con Ajustes

### Mejoras

| Mejora | Detalle | Prioridad |
|--------|---------|-----------|
| **Badge de progreso** | Mostrar % de escenas con prompts junto al video | ALTA |
| **Quick status** | Dot de color junto a cada recurso (personaje sin imagen = amber) | MEDIA |
| **Búsqueda inline** | Filtrar escenas/videos en el sidebar | MEDIA |
| **Drag reorder** | Arrastrar escenas para reordenar en el sidebar | BAJA |
| **Notificación badge** | Número de tareas pendientes junto a "Tareas" | MEDIA |

### Estructura propuesta del sidebar (Video level)

```
Vista general ←(activa)
Timeline
Narración
Análisis
───────────────
ESCENAS (16)        [+ Nueva]
● 1  Cold open: tijeras ASMR
● 2  Logo reveal: DOMENECH
● 3  Fachada exterior
  ...
───────────────
ACCIONES
↗ Compartir
↓ Exportar
```

---

## 5. Páginas

### Páginas actuales (mantener)

| Página | URL | Estado | Mejora necesaria |
|--------|-----|--------|-----------------|
| Dashboard | `/dashboard` | ✅ Rediseñado | Conectar IA real al asistente |
| Proyecto Overview | `/project/[id]` | ✅ Rediseñado | Barra de progreso global |
| Video Overview | `/project/[id]/video/[id]` | ✅ Rediseñado | Drag-and-drop escenas |
| Scene Detail | `.../scene/[id]` | ✅ Rediseñado | Selector personajes/fondos, upload |
| Timeline | `.../timeline` | ✅ Funcional | Botón "Generar arco IA" |
| Narración | `.../narration` | ✅ Mejorado | Voxtral TTS, selector voz |
| Análisis | `.../analysis` | ✅ Mejorado | Auto-análisis al completar |
| Exportar | `.../export` | ✅ Mejorado | PDF funcional |
| Compartir | `.../share` | ✅ Funcional | Preview de página pública |
| Personajes Lista | `.../characters` | ✅ Funcional | Generar con IA |
| Personaje Detalle | `.../characters/[id]` | ✅ Rediseñado | Upload referencia |
| Fondos Lista | `.../backgrounds` | ✅ Mejorado | Generar con IA |
| Fondo Detalle | `.../backgrounds/[id]` | ✅ Rediseñado | Upload referencia |
| Estilos | `.../styles` | ✅ Básico | Templates de prompts |
| Templates | `.../templates` | ✅ Básico | Guardar prompts exitosos |
| Publicaciones | `.../publications` | ✅ Básico | Preview mockup + IA captions |
| Tareas | `.../tasks` | ✅ Rediseñado | Auto-crear desde IA |

### Páginas eliminadas (ya borradas)

| Página | Razón |
|--------|-------|
| `/scenes` | Redundante con Vista General |
| `/storyboard` | Redundante con Vista General tab |
| `/script` | Confusa con Narración |
| `/settings` | Stub vacío (hay modal) |
| `/derive` | WIP incompleto |

### Páginas nuevas (por crear)

| Página | URL | Función |
|--------|-----|---------|
| **Publication Preview** | `/publications/[id]/preview` | Mockup visual de cómo se ve en Instagram/TikTok/YouTube |
| **Prompt Library** | `/project/[id]/resources/prompts` | Biblioteca de prompts exitosos guardados |

---

## 6. Modales

### Sistema actual de modales

| Modal | Trigger | Estado |
|-------|---------|--------|
| **SettingsModal** | Sidebar "Ajustes" | ✅ HeroUI Modal, 6 secciones |
| **ProjectCreatePanel** | Dashboard "Nuevo proyecto" | ✅ Overlay HTML |
| **ProjectSettingsModal** | Header Settings2 | ✅ HTML overlay |
| **VideoSettingsModal** | Header Settings2 | ✅ HTML overlay |
| **VideoCreateModal** | Proyecto "Nuevo video" | ✅ HeroUI |
| **SceneCreateModal** | Vista General "Nueva escena" | ✅ HeroUI Drawer |
| **SceneGeneratorModal** | Vista General "Generar con IA" | ✅ HTML overlay, chat+escenas |
| **SceneEditorModal** | Storyboard "Editar con IA" | ✅ HTML overlay, acciones+chat |
| **CharacterCreateModal** | Personajes "Nuevo" | ✅ HeroUI |
| **BackgroundCreateModal** | Fondos "Nuevo" | ✅ HeroUI |
| **TaskCreateModal** | Header "Nueva tarea" | ✅ HeroUI |
| **TaskCreatePanel** | Dashboard cola de foco | ✅ Overlay |
| **SearchModal** | Cmd+K | ✅ Funcional |
| **ConfirmDialog** | Eliminar recursos | ✅ Framer Motion |
| **FeedbackDialog** | Header "Feedback" | ✅ Funcional |
| **ImagePreviewModal** | Click en imagen | ✅ Lightbox |

### Modales por crear

| Modal | Función | Prioridad |
|-------|---------|-----------|
| **CharacterPickerModal** | Seleccionar personaje para asignar a escena | ALTA |
| **BackgroundPickerModal** | Seleccionar fondo para asignar a escena | ALTA |
| **VoicePickerModal** | Seleccionar voz para narración | MEDIA |
| **PromptEditorModal** | Editor rico para prompts (no solo textarea) | MEDIA |
| **PublicationPreviewModal** | Preview de cómo se ve el post en redes | MEDIA |

---

## 7. Diseño visual

### Principios
1. **Dark-first** — diseñar para dark mode primero
2. **Minimal** — sin decoración innecesaria
3. **Funcional** — cada elemento tiene propósito
4. **Respirado** — espaciado generoso
5. **Consistente** — mismas clases CSS en toda la app

### CSS estándar (usar SIEMPRE)

```css
/* Page wrapper */
.page { @apply mx-auto max-w-7xl px-4 py-6 space-y-6; }

/* Cards */
.card { @apply rounded-xl border border-border bg-card; }

/* Section labels */
.label { @apply text-xs font-semibold uppercase tracking-wider text-muted-foreground; }

/* Primary button */
.btn-primary { @apply rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors; }

/* Ghost button */
.btn-ghost { @apply rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors; }

/* Input */
.input { @apply w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10; }

/* Todos los botones tienen cursor-pointer (global CSS) */
```

### Colores (variables CSS)

| Variable | Uso | Hex (dark) |
|----------|-----|-----------|
| `primary` | Acciones principales | #058B96 (teal) |
| `foreground` | Texto principal | #ebebeb |
| `muted-foreground` | Texto secundario | #71717a |
| `background` | Fondo página | #191919 |
| `card` | Fondo cards | #202020 |
| `border` | Bordes | #2e2e2e |
| `accent` | Hover backgrounds | #282828 |
| `destructive` | Peligro | #f31260 |

### Gradiente de fondo (body)
```css
background-image:
  radial-gradient(ellipse 80% 60% at 10% 0%, rgba(5,139,150,0.10), transparent 60%),
  radial-gradient(ellipse 60% 50% at 90% 100%, rgba(254,106,60,0.06), transparent 60%);
background-attachment: fixed;
```

### Componentes compartidos (reutilizar)

| Componente | Ubicación | Props principales |
|-----------|-----------|-------------------|
| `MetricCard` | `shared/MetricCard.tsx` | icon, label, value, helper, tone |
| `EmptyState` | `shared/EmptyState.tsx` | icon, title, description, actions |
| `FilterPills` | `shared/FilterPills.tsx` | filters, active, onChange |
| `ActivityItem` | `shared/ActivityItem.tsx` | action, entityType, timestamp |
| `TaskPreviewCard` | `shared/TaskPreviewCard.tsx` | title, projectName, priority |

---

## 8. Flujo del usuario

### Flujo ideal (completo)

```
1. CREAR PROYECTO
   Dashboard → "Nuevo proyecto" → título, estilo, brief

2. CREAR PERSONAJES
   Proyecto → Recursos → Personajes → "Nuevo personaje"
   → nombre, descripción, imagen referencia
   → IA genera prompt_snippet automáticamente

3. CREAR FONDOS
   Proyecto → Recursos → Fondos → "Nuevo fondo"
   → nombre, tipo, hora del día, imagen referencia
   → IA genera prompt_snippet

4. CREAR VIDEO
   Proyecto → "Nuevo video" → plataforma, duración, aspect ratio

5. GENERAR ESCENAS CON IA
   Video → SceneGeneratorModal
   → configurar duración + tipo
   → describir o usar sugerencia
   → IA genera N escenas con arco, cámara, prompts
   → seleccionar y guardar

6. REVISAR/EDITAR ESCENAS
   Video → Storyboard → click escena
   → ver prompts generados
   → "Editar con IA" → SceneEditorModal
   → mejorar, cambiar cámara, extender, regenerar

7. COPIAR PROMPTS → GENERAR EN GROK/FLOW
   Video → Export → "Copiar todos los prompts"
   → pegar en Grok/Flow → generar imágenes

8. SUBIR IMÁGENES GENERADAS
   Scene Detail → "Subir imagen"
   → IA analiza imagen → mejora prompt de video

9. COPIAR PROMPT VIDEO → GENERAR EN GROK/FLOW
   Scene Detail → "Copiar prompt video"
   → pegar en Grok → generar clip de video

10. NARRACIÓN
    Video → Narración → "Generar con IA"
    → texto narración → TTS → audio MP3

11. EXPORTAR
    Video → Exportar → JSON / MD / HTML / PDF

12. PUBLICAR
    Proyecto → Publicaciones → "Nueva publicación"
    → preview en Instagram/TikTok
    → IA genera captions + hashtags
    → programar fecha
```

### Flujo rápido (power user)

```
1. Crear proyecto → 2. Crear video → 3. SceneGeneratorModal (genera todo)
→ 4. "Copiar todos los prompts" → 5. Generar en Grok
→ 6. Subir resultados → 7. Exportar
```

---

## 9. Base de datos

### Tablas activas (38)

**Core:**
projects, videos, scenes, scene_camera, scene_prompts, scene_media,
scene_video_clips, scene_characters, scene_backgrounds

**Recursos:**
characters, character_images, backgrounds, style_presets, prompt_templates

**Narración:**
video_narrations, video_analysis, narrative_arcs, timeline_entries

**Publicaciones:**
publications, publication_items, social_profiles

**Sistema:**
profiles, user_plans, user_api_keys, project_ai_settings, project_ai_agents,
project_favorites, project_shares, tasks, ai_conversations, entity_snapshots,
activity_log, ai_usage_logs, notifications, realtime_updates, scene_shares,
scene_annotations, video_derivations, feedback, usage_tracking

### Tablas eliminadas
project_members, exports, billing_events, comments, time_entries

### Campos añadidos recientemente
```sql
scenes.audio_config     -- jsonb: {music, dialogue, sfx, voiceover, lip_sync}
scenes.time_of_day      -- text: day/night/sunset/etc
scenes.continuation_of_scene_id  -- uuid: link to parent scene
```

---

## 10. Roadmap de implementación

### Sprint 1 — Conectar IA (1 semana)

| Tarea | Archivo | Detalle |
|-------|---------|---------|
| Conectar SceneGeneratorModal a API real | `SceneGeneratorModal.tsx` | Llamar `/api/ai/generate-scene-prompts` con brief |
| Conectar SceneEditorModal a API real | `SceneEditorModal.tsx` | Llamar APIs de improve/regenerate |
| Botón "Generar arco" en Timeline | `timeline/page.tsx` | Llamar `/api/ai/generate-arc` |
| Botón "Mejorar prompt" en Scene Detail | `scene/[id]/page.tsx` | Llamar `/api/ai/improve-prompt` |
| Botón "Generar personaje" en Personajes | `characters/page.tsx` | Llamar `/api/ai/generate-characters` |

### Sprint 2 — Upload + Análisis (1 semana)

| Tarea | Archivo | Detalle |
|-------|---------|---------|
| Upload imagen en Scene Detail | `scene/[id]/page.tsx` | Drag&drop + Supabase Storage |
| Análisis de imagen → mejora prompt | Nueva API | Gemini Vision + Qwen mejora |
| CharacterPickerModal | `modals/character/` | Selector de personajes para escena |
| BackgroundPickerModal | `modals/background/` | Selector de fondos para escena |

### Sprint 3 — Chat mejorado (1 semana)

| Tarea | Archivo | Detalle |
|-------|---------|---------|
| Contexto completo en chat | `useKiyokoChat.ts` | Enviar datos de escena al chat |
| Sugerencias contextuales | `KiyokoChat.tsx` | Chips al abrir chat |
| Acciones directas desde chat | `action-executor.ts` | Ejecutar cambios sin confirmación |
| Markdown en respuestas del chat | `ChatMessage.tsx` | Renderizar ** bullets emojis |

### Sprint 4 — Publicaciones + Export (1 semana)

| Tarea | Archivo | Detalle |
|-------|---------|---------|
| Preview mockup publicaciones | `publications/` | Instagram/TikTok frame mockup |
| IA captions + hashtags | Nueva API | Generar texto optimizado |
| PDF export | `/api/export/pdf` | Storyboard con imágenes |
| Voxtral TTS integrado | `narration/page.tsx` | Selector de proveedor TTS |

### Sprint 5 — Polish (1 semana)

| Tarea | Detalle |
|-------|---------|
| Loading states en 20+ páginas | Añadir loading.tsx y error.tsx |
| Server-side search | Buscar en Supabase full-text |
| Notificaciones automáticas | "Prompts generados" al completar |
| Mobile optimization | Scene Detail responsive |
| Performance audit | Bundle size, queries N+1 |

---

## Métricas de éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Páginas con diseño consistente | 17/17 | 17/17 ✅ |
| APIs conectadas al frontend | 11/18 | 18/18 |
| Tiempo crear video completo | ~30 min | ~10 min |
| Clicks para copiar prompt | 3 | 1 |
| Escenas generadas sin escribir | 0 | ∞ (IA genera) |
| Build errors | 0 | 0 ✅ |
| Líneas de código eliminadas | ~5000 | — |
| Componentes reutilizables | 5 | 10+ |

---

*Generado por Claude Code — Abril 2026*
*Repositorio: github.com/placidovenegas/kiyoko-AI*
*Rama: claude/stoic-elbakyan*
