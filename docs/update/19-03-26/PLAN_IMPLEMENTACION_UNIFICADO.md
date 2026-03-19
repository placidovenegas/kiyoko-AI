# Plan de Implementacion Unificado — Kiyoko AI

**Fuentes:** KIYOKO_AI_MEJORAS_V3.md + v5 (Narracion/Voces) + analisis del storyboard actual + feedback del usuario
**Fecha:** 19 Marzo 2026

**Reglas de implementacion:**
- Todo con shadcn/ui + componentes reutilizables
- Iconos Tabler/Lucide, NUNCA emojis
- Todo funcional y accesible (aria labels, keyboard nav, focus management)
- Dual mode en todo: creacion manual + IA
- Todo visible de un vistazo (no esconder informacion critica)
- Chat IA siempre como panel lateral (desde navbar), NO como pagina separada
- Tablas de notificaciones y mensajes en DB para sistema completo

---

## Estado actual (ya implementado)

- [x] Fix bug arc page: usaba slug como project_id en vez de UUID via ProjectContext
- [x] Creado `src/lib/constants/scene-options.ts` con opciones de lighting, mood, camera, audio flags con iconos Lucide
- [x] Instalado shadcn InputGroup component

---

## SPRINT 0 — Fixes Criticos y Componentes Base (1-2 dias)

### 0.1 Fix slug vs UUID en todas las paginas
- [x] `src/app/(dashboard)/project/[slug]/arc/page.tsx`
- [x] `src/app/(dashboard)/project/[slug]/scenes/page.tsx`
- [x] `src/app/(dashboard)/project/[slug]/timeline/page.tsx`
- [x] `src/app/(dashboard)/project/[slug]/characters/page.tsx`
- [x] `src/app/(dashboard)/project/[slug]/analysis/page.tsx`
- [x] `src/app/(dashboard)/project/[slug]/backgrounds/page.tsx`

### 0.2 Activar Realtime en Storyboard
- [x] Suscripcion realtime a scenes, characters, backgrounds en storyboard (INSERT/UPDATE/DELETE)

### 0.3 Componentes reutilizables con shadcn (iconos, accesibles, reutilizables)
Todos en `src/components/scene/`:
- [x] `SceneSelect.tsx` — Select generico con descripcion por opcion (camera angle, movement, etc.)
- [x] `AudioMultiToggle.tsx` — Toggles independientes con iconos Lucide (no emojis)
- [x] `LightingSelect.tsx` — Dropdown con 14 opciones predefinidas + descripcion
- [x] `MoodSelect.tsx` — Dropdown con 12 opciones predefinidas + descripcion
- [x] `PromptEditor.tsx` — InputGroup con: copy, translate (Chrome API), IA improve, edit-in-place
- [x] `DurationInput.tsx` — Slider con label de segundos, accesible
- [ ] `NarrationField.tsx` — Textarea con estimador de duracion, IA generate, TTS button (Sprint 5)
- [x] `index.ts` — barrel export
Todos usan shadcn `Select`, `InputGroup`, `Textarea`, `Tooltip`, `Button` como base.

---

## SPRINT 1 — Storyboard Mejorado (3-5 dias)

### 1.1 Refactor SceneCard con componentes reutilizables
- [x] Reemplazar TODOS los emojis por iconos Lucide (Users, MapPin, Video, Lightbulb, Volume2, Clock)
- [x] Audio: multi-toggle independiente con AudioMultiToggle (puede ser ambiente + musica + voiceover a la vez)
  - "Silencio total" desactiva los demas
  - Inputs adicionales para musica y ambiente cuando activos
- [x] Lighting: LightingSelect dropdown con 14 opciones predefinidas + descripcion
- [x] Mood: MoodSelect dropdown con 12 opciones predefinidas + descripcion
- [x] Camera angle/movement: SceneSelect con descripcion de cada opcion
- [x] Duration: DurationInput slider accesible con label
- [x] Constantes movidas a `scene-options.ts` (eliminadas del storyboard)

### 1.2 Edicion de prompts aislada
- [x] PromptEditor: Click "Editar" en PROMPT IMAGEN solo abre edicion de ESE prompt
- [x] PromptEditor: Click "Editar" en PROMPT VIDEO solo abre edicion de ESE prompt
- [x] Cada prompt tiene: Copiar, Traducir, Mejorar IA, Editar — TODO funcional
- [x] Guardar prompt individual sin necesidad de edit mode general

### 1.3 Chrome Translate API para prompts
- [x] Integrado en PromptEditor (Chrome Translator API con fallback graceful)
- [x] Boton "Traducir" junto a cada prompt (icono Languages)
- [x] Traduccion colapsable debajo del prompt (azul, solo referencia)

### 1.4 Mejoras visuales y accesibilidad
- [x] Agrupacion en edit mode: Titulo | Camera+Lighting+Mood+Duration | Audio
- [x] aria-labels en todos los botones e inputs
- [ ] Separadores shadcn entre secciones (pendiente refinamiento visual)
- [ ] Focus management avanzado (pendiente)

---

## SPRINT 2 — Base de Datos Completa (1-2 semanas)

### 2.1 Sistema Multi-Video (migracion DB)
- [ ] Renombrar `video_cuts` -> `videos` con campos nuevos
- [ ] Renombrar `video_cut_scenes` -> `video_scenes` con campos de copia
- [ ] Crear tablas `video_narrative_arcs`, `video_timeline_entries`
- [ ] Funciones SQL: `calculate_video_duration`, `copy_scenes_to_video`, `delete_video_safe`, etc.
- [ ] Triggers, RLS policies, indices

### 2.2 Campos de narracion
- [ ] scenes: `narration_text`, `narration_audio_url`, `narration_audio_duration_ms`
- [ ] projects: `narration_mode`, `narration_config`, `narration_full_text`, `narration_full_audio_url`
- [ ] scenes: `music_suggestion`, `sfx_suggestion`, `music_intensity`

### 2.3 Tabla de notificaciones (NUEVO)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id),
  type VARCHAR(50) NOT NULL, -- 'task_due', 'video_scheduled', 'ai_completed', 'scene_updated', 'export_ready'
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link TEXT, -- URL relativa para navegar al contexto
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());
```

### 2.4 Tabla de mensajes / activity log (NUEVO)
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID REFERENCES profiles(id),
  entity_type VARCHAR(50) NOT NULL, -- 'scene', 'video', 'character', 'background', 'task', 'project'
  entity_id UUID,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'generated', 'exported', 'approved'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_project ON activity_log(project_id, created_at DESC);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_own" ON activity_log FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));
```

### 2.5 Tabla de tareas
- [ ] Crear tabla `tasks` con enums, triggers, RLS, indices (como en V3 seccion 11.2)

---

## SPRINT 3 — Pagina de Videos + Navegacion (1 semana)

### 3.1 Store y hooks
- [ ] `src/stores/useVideoStore.ts` (Zustand)
- [ ] `src/hooks/useRealtimeVideo.ts`, `useRealtimeProjectVideos.ts`

### 3.2 Pagina Videos Hub (`/project/[slug]/videos`)
- [ ] Grid de VideoCards con shadcn components
- [ ] `VideoCard`, `VideoGrid`, `VideoStatusBadge`, `VideoPlatformBadge`
- [ ] `VideoCreateModal` — Wizard: manual + opcion "Generar con IA"

### 3.3 Video Individual (`/project/[slug]/videos/[videoSlug]`)
- [ ] Overview del video con stats
- [ ] Sub-paginas filtradas por video_id

### 3.4 Copiar escenas entre videos
- [ ] `SceneCopyModal`, `SceneCopyGrid`, `SceneTrimSlider`
- [ ] Tipos: duplicado, referencia, recortada

---

## SPRINT 4 — Consolidacion de Pantallas (1 semana)

### 4.1 Nueva navegacion del sidebar (de 11 a 7 items)
Actualizar `ProjectSidebar.tsx`:
```
PROYECTO
├── Overview              <- Dashboard + Diagnostico IA fusionados
├── Videos                <- NUEVO: Hub de videos
├── Storyboard            <- Storyboard + Arco + Timeline + Escenas fusionados
├── Recursos              <- Personajes + Fondos + Referencias fusionados (tabs)
├── Tareas                <- NUEVO: Kanban
├── Exportar              <- Mejorar con mas formatos y preview
└── Ajustes               <- Mejorar con mas opciones
```

**CAMBIADAS en el sidebar:**
- Chat IA -> SE MANTIENE en sidebar pero al pulsar abre el panel lateral (no navega a pagina)
- ~~Diagnostico~~ -> Seccion en Overview
- ~~Arco Narrativo~~ -> Vista en Storyboard + Pagina Guion/Narracion
- ~~Escenas~~ -> Redundante con Storyboard expandido
- ~~Personajes~~ -> Tab en Recursos
- ~~Fondos~~ -> Tab en Recursos
- ~~Timeline~~ -> Vista en Storyboard
- ~~Referencias~~ -> Tab en Recursos

### 4.2 Fusionar paginas
- [ ] Diagnostico -> seccion/panel en Overview con boton "Regenerar analisis"
- [ ] Arco Narrativo -> barra visual siempre visible en Storyboard
- [ ] Timeline -> modo de vista en Storyboard (vista horizontal temporal)
- [ ] Personajes + Fondos + Referencias -> `/resources` con tabs shadcn
- [ ] Chat IA en sidebar: mantener item pero al pulsar abre panel lateral (no navega a /chat)
- [ ] Eliminar la pagina `/chat` como destino de navegacion

### 4.3 Storyboard con 4 modos de vista
- [ ] Compacto (actual mejorado)
- [ ] Expandido (detalle completo inline)
- [ ] Timeline (barra horizontal temporal proporcional)
- [ ] Arco (escenas agrupadas por fase hook/build/peak/close)

### 4.4 Overview como dashboard de produccion
- [ ] Stats cards: Videos, Escenas, Personajes, Tareas, Duracion
- [ ] Seccion Videos con progreso
- [ ] Seccion Tareas de hoy
- [ ] Seccion Diagnostico IA
- [ ] Mini calendario semanal

### 4.5 Pagina Exportar mejorada
- [ ] Preview del export antes de descargar
- [ ] Mas formatos: PDF storyboard, PDF shot list, HTML interactivo, JSON, Markdown
- [ ] Export por video individual (no solo proyecto completo)
- [ ] Historial de exports con fecha y formato
- [ ] Boton "Exportar con IA" que optimiza el formato automaticamente

### 4.6 Pagina Ajustes mejorada
- [ ] Tabs: General | IA | Narracion | Notificaciones | Peligro
- [ ] General: titulo, descripcion, estilo, plataforma, duracion objetivo, cover
- [ ] IA: provider preferido, API keys del usuario, modelo preferido
- [ ] Narracion: modo (por escena/continua/sin), idioma, tono, voz por defecto
- [ ] Notificaciones: activar/desactivar tipos de notificacion
- [ ] Peligro: eliminar proyecto, exportar datos, archivar

---

## SPRINT 5 — Narracion y Voces (1 semana)

### 5.1 Pagina "Guion y Narracion" (reemplaza Arc page)
- [ ] Selector de modo: Por escena / Continua / Sin narracion
- [ ] Config: idioma, tono, perspectiva, voz
- [ ] Barra de tiempo visual

### 5.2 Narracion por escena
- [ ] Lista con campo editable + estimador duracion + warning si excede
- [ ] Boton "Generar con IA" por escena y "Generar todas"

### 5.3 TTS
- [ ] Web Speech API (default gratis) + Google Cloud TTS (fallback)
- [ ] VoiceSelector, NarrationPlayer (play/pause/download)

### 5.4 Narracion continua
- [ ] Editor guion completo + timestamps + descarga ZIP/MP3

---

## SPRINT 6 — Sistema de Tareas Kanban (1-2 semanas)

### 6.1 UI (todo con shadcn, drag&drop con @dnd-kit)
- [ ] Pagina `/project/[slug]/tasks`
- [ ] Tablero Kanban: Pendiente | En proceso | En revision | Completado
- [ ] Vista Lista (por dia) + Vista Calendario
- [ ] Cards con: titulo, prioridad (iconos), video vinculado, fecha, categoria

### 6.2 Creacion dual (manual + IA)
- [ ] Modal manual con campos
- [ ] IA: generar plan de tareas via chat -> ActionPlan
- [ ] Tools: `createTask`, `generateTaskPlan`, `completeTask`

### 6.3 API routes
- [ ] CRUD de tareas + reorder + generate + calendar

---

## SPRINT 7 — Historial + Notificaciones + IA Everywhere (1-2 semanas)

### 7.1 Pagina Historial funcional (NUEVO)
- [ ] Pagina `/project/[slug]/history` o seccion en Overview
- [ ] Timeline visual de actividad del proyecto (usa `activity_log`)
- [ ] Filtros: por tipo (escena, video, tarea), por fecha, por usuario
- [ ] Cada entrada: icono + descripcion + timestamp + link al recurso
- [ ] Poder deshacer cambios recientes (link a undo del change_history)
- [ ] Diseño limpio con shadcn, iconos, sin emojis

### 7.2 Sistema de Notificaciones (NUEVO)
- [ ] Componente `NotificationBell` en el navbar con badge de count
- [ ] Dropdown con lista de notificaciones recientes
- [ ] Tipos: tarea vence, video cerca de fecha, IA termino, export listo
- [ ] Marcar como leida, marcar todas como leidas
- [ ] Click navega al contexto (escena, video, tarea)
- [ ] Pagina `/notifications` con historial completo

### 7.3 IA Multi-Video
- [ ] System prompt con contexto del video activo
- [ ] Nuevos tools de IA para videos
- [ ] ActionPlanCard extendido

### 7.4 IA de 3 niveles
- [ ] Nivel 1: Botones [IA] inline en cada campo (un click, sin chat)
- [ ] Nivel 2: Chat lateral (mejorado con nuevos tools)
- [ ] Nivel 3: Barra de sugerencias proactivas (reglas deterministicas)

### 7.5 Pipeline imagen + video
- [ ] Providers de imagen: DALL-E 3, Flux, Stable Diffusion
- [ ] Providers de video: Runway, Kling, Pika
- [ ] Botones "Generar" en cada escena con flujo completo

---

## SPRINT 8 — Pulido Final (1 semana)

### 8.1 UX avanzada
- [ ] Drag & drop reordenar escenas (@dnd-kit)
- [ ] Filtros persistidos en URL (query params)
- [ ] Previsualizador video (slideshow)
- [ ] Calendario publicaciones
- [ ] Command Menu ampliado (videos, tareas, recursos)
- [ ] Atajos de teclado

### 8.2 Produccion
- [ ] Sugerencias musica/SFX por escena
- [ ] Checklist produccion auto-calculado
- [ ] Preview multi-formato (16:9, 9:16, 1:1)
- [ ] Shot list PDF/MD
- [ ] Storyboard imprimible PDF
- [ ] Templates proyecto

---

## SPRINT 9 — Editor de Video en Navegador (2-3 semanas)

### 9.1 Motor de composicion (WebCodecs + Canvas API)
Tecnologias clave:
- **WebCodecs API** — decodificar/encodificar video frames en el navegador (sin servidor)
- **Canvas API** — componer frames: video + texto overlay + transiciones
- **Web Audio API** — mezclar audio: narracion + musica + ambiente
- **MediaRecorder API** — exportar el resultado final como MP4/WebM

### 9.2 Timeline Editor visual
- [ ] Componente `VideoTimeline` — timeline multi-pista visual (tipo Premiere simplificado)
  - Pista Video: clips de escenas (arrastrables, recortables)
  - Pista Audio 1: narracion/voiceover (sincronizado con escenas)
  - Pista Audio 2: musica de fondo
  - Pista Audio 3: efectos de sonido / ambiente
  - Pista Texto: overlays de texto (titulos, CTAs, subtitulos)
- [ ] Cada pista: clips arrastrables con resize handles para trim
- [ ] Playhead (cabezal) draggable con preview en tiempo real
- [ ] Zoom in/out del timeline (1s = 50px hasta 1s = 200px)
- [ ] Snap-to-grid y snap-to-clip para alineacion
- [ ] Usar @dnd-kit para drag & drop de clips

### 9.3 Preview en tiempo real
- [ ] Componente `VideoPreview` — canvas que renderiza frame actual
- [ ] Play/Pause con sincronizacion de todas las pistas
- [ ] Controles: velocidad (0.5x, 1x, 2x), frame anterior/siguiente
- [ ] Aspect ratio toggle (16:9, 9:16, 1:1)
- [ ] Fullscreen mode

### 9.4 Importar assets al editor
- [ ] Auto-importar imagenes generadas de cada escena como clips
- [ ] Auto-importar audio de narracion generado
- [ ] Upload de archivos de video/audio propios del usuario
- [ ] Upload de musica de fondo
- [ ] Biblioteca de transiciones (fade, dissolve, slide, cut)

### 9.5 Composicion y efectos
- [ ] Transiciones entre clips: fade in/out, dissolve, slide, wipe
- [ ] Ken Burns effect en imagenes estaticas (pan + zoom lento)
- [ ] Texto overlay: posicion, fuente, color, animacion (fade in, slide up)
- [ ] Filtros basicos: brightness, contrast, saturation, sepia, B&W
- [ ] Ajuste de volumen por clip de audio con curvas

### 9.6 Exportar video final
- [ ] Render en navegador con WebCodecs (sin servidor)
- [ ] Formatos: MP4 (H.264), WebM (VP9)
- [ ] Resoluciones: 720p, 1080p, 4K
- [ ] Barra de progreso durante render
- [ ] Guardar en Supabase Storage + `videos.rendered_url`
- [ ] Descargar directamente al dispositivo
- [ ] Opcion de exportar solo audio (MP3)

### 9.7 Pagina del Editor
- [ ] Ruta: `/project/[slug]/videos/[videoSlug]/editor`
- [ ] Layout: Preview arriba (60%) + Timeline abajo (40%)
- [ ] Panel lateral: biblioteca de assets, propiedades del clip seleccionado
- [ ] Auto-save del estado del editor en localStorage + Supabase
- [ ] Colaboracion: guardar `editor_state` JSONB en tabla `videos`

### 9.8 DB para editor
```sql
ALTER TABLE videos ADD COLUMN editor_state JSONB DEFAULT '{}';
ALTER TABLE videos ADD COLUMN rendered_url TEXT;
ALTER TABLE videos ADD COLUMN rendered_at TIMESTAMPTZ;
ALTER TABLE videos ADD COLUMN render_status VARCHAR(20) DEFAULT 'none'; -- none, rendering, completed, failed
```

---

## SPRINT 10 — Compartir y Colaboracion (1-2 semanas)

### 10.1 Sistema de compartir proyectos
```sql
CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES profiles(id),
  shared_with_email VARCHAR(255), -- si es por email (invitacion)
  shared_with_user UUID REFERENCES profiles(id), -- si ya tiene cuenta
  role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- 'viewer', 'editor', 'admin'
  token VARCHAR(64) UNIQUE, -- para links publicos
  is_public_link BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shares_project ON project_shares(project_id);
CREATE INDEX idx_shares_user ON project_shares(shared_with_user);
CREATE INDEX idx_shares_token ON project_shares(token) WHERE token IS NOT NULL;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
```

### 10.2 Roles y permisos
| Rol | Ver | Editar escenas | Editar config | Eliminar | Compartir | Exportar |
|-----|-----|---------------|--------------|----------|-----------|---------|
| **Viewer** | Si | No | No | No | No | Si (solo ver) |
| **Editor** | Si | Si | No | No | No | Si |
| **Admin** | Si | Si | Si | Si | Si | Si |
| **Owner** | Si | Si | Si | Si | Si | Si |

### 10.3 UI de compartir
- [ ] Boton "Compartir" en header del proyecto
- [ ] Modal: invitar por email, copiar link publico, gestionar accesos
- [ ] Badge de rol en sidebar cuando ves un proyecto compartido
- [ ] Vista de "Proyectos compartidos conmigo" en dashboard
- [ ] Notificacion cuando alguien te comparte un proyecto

### 10.4 Links publicos (sin cuenta)
- [ ] Generar link con token unico: `/shared/[token]`
- [ ] Vista read-only del storyboard completo
- [ ] Opcion de proteger con password
- [ ] Expiracion configurable (24h, 7d, 30d, nunca)
- [ ] Contador de visitas

### 10.5 Comentarios en escenas
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES comments(id), -- para respuestas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- [ ] Burbuja de comentarios en cada escena del storyboard
- [ ] Thread de respuestas
- [ ] Marcar como resuelto
- [ ] Mencion @usuario
- [ ] Notificacion al ser mencionado

---

## SPRINT 11 — Billing y Planes de Usuario (1-2 semanas)

### 11.1 Modelo de planes
| Plan | Precio | Proyectos | Videos/proyecto | Escenas | IA texto | IA imagen | IA video | Storage | Compartir |
|------|--------|-----------|----------------|---------|----------|-----------|----------|---------|-----------|
| **Free** | 0 | 2 | 1 | 30 | 50 msg/dia | 0 | 0 | 100MB | Solo viewer |
| **Pro** | 19/mes | 10 | 5 | 200 | Ilimitado | 50/mes | 10/mes | 5GB | Editor + viewer |
| **Business** | 49/mes | Ilimitado | Ilimitado | Ilimitado | Ilimitado | 200/mes | 50/mes | 50GB | Admin + editor |
| **Enterprise** | Custom | Ilimitado | Ilimitado | Ilimitado | Ilimitado | Ilimitado | Ilimitado | Ilimitado | Todo |

### 11.2 DB para billing
```sql
CREATE TABLE user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free', -- free, pro, business, enterprise
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  period_start DATE NOT NULL, -- primer dia del mes
  ai_text_messages INTEGER DEFAULT 0,
  ai_images_generated INTEGER DEFAULT 0,
  ai_videos_generated INTEGER DEFAULT 0,
  tts_characters INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  UNIQUE(user_id, period_start)
);
CREATE INDEX idx_usage_user_period ON usage_tracking(user_id, period_start);

CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  event_type VARCHAR(50) NOT NULL, -- 'subscription_created', 'payment_succeeded', 'payment_failed', 'plan_changed', 'usage_limit_reached'
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'EUR',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.3 Integracion Stripe
- [ ] Checkout session para suscripcion
- [ ] Webhook para eventos de pago
- [ ] Portal de cliente para gestionar suscripcion
- [ ] Pagina `/settings/billing` con plan actual, uso, facturas

### 11.4 Control de uso (middleware)
- [ ] Middleware que verifica limites antes de cada operacion costosa
- [ ] `checkUsageLimit(userId, 'ai_text')` -> permite o bloquea
- [ ] Incrementar contadores en `usage_tracking` tras cada uso
- [ ] Mostrar barra de uso en el dashboard: "42/50 imagenes IA este mes"
- [ ] Warning al acercarse al limite (80%)
- [ ] Bloqueo con CTA de upgrade al llegar al limite

### 11.5 UI de Billing
- [ ] Pagina de pricing publica `/pricing`
- [ ] Pagina `/settings/billing` — plan actual, uso del mes, historial de pagos
- [ ] Banner de upgrade cuando se acerca al limite
- [ ] Modal "Has alcanzado el limite" con comparativa de planes
- [ ] Badge de plan en el perfil del usuario

---

## Resumen de Sprints

| Sprint | Nombre | Duracion | Dependencias |
|--------|--------|----------|-------------|
| **0** | Fixes + Componentes base | 1-2 dias | Ninguna |
| **1** | Storyboard mejorado | 3-5 dias | Sprint 0 |
| **2** | DB completa (multi-video, narracion, notificaciones, tasks) | 1-2 semanas | Paralelo a Sprint 1 |
| **3** | Pagina Videos + Navegacion | 1 semana | Sprint 2 |
| **4** | Consolidacion pantallas (11->7) + Exportar/Ajustes mejorados | 1 semana | Sprint 3 |
| **5** | Narracion y Voces | 1 semana | Sprint 2 |
| **6** | Tareas Kanban | 1-2 semanas | Sprint 2 |
| **7** | Historial + Notificaciones + IA Everywhere | 1-2 semanas | Sprint 3, 6 |
| **8** | Pulido + Produccion | 1 semana | Todo lo anterior |
| **9** | Editor de Video en Navegador | 2-3 semanas | Sprint 5 (narracion), 7 (pipeline) |
| **10** | Compartir y Colaboracion | 1-2 semanas | Sprint 3 |
| **11** | Billing y Planes de Usuario | 1-2 semanas | Ninguna (paralelo) |

**Total estimado: 12-18 semanas**

---

## Archivos ya creados/modificados

```
src/lib/constants/scene-options.ts               <- NUEVO: constantes compartidas
src/app/(dashboard)/project/[slug]/arc/page.tsx   <- FIX: usa ProjectContext
src/components/ui/input-group.tsx                  <- NUEVO: shadcn InputGroup
```

---

*Plan actualizado 19 Marzo 2026 — Kiyoko AI*
