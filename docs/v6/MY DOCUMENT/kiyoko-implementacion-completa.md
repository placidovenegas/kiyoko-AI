# Kiyoko AI — Plan de Implementación Completo

> Análisis de todo lo existente, lo que falta, puntos fuertes/débiles, y cómo mejorar cada parte.

---

## ÍNDICE

1. [Mapa de rutas existentes](#1-mapa-de-rutas)
2. [Estado de cada página](#2-estado-de-cada-página)
3. [Páginas que faltan](#3-páginas-que-faltan)
4. [Puntos fuertes](#4-puntos-fuertes)
5. [Puntos débiles](#5-puntos-débiles)
6. [Plan de mejora por área](#6-plan-de-mejora)
7. [IA: Integración en componentes](#7-ia-en-componentes)
8. [Design system y UX](#8-design-system)
9. [Performance y arquitectura](#9-performance)
10. [Prioridades de implementación](#10-prioridades)

---

## 1. MAPA DE RUTAS

### Auth (públicas)
| Ruta | Página | Estado |
|------|--------|--------|
| `/login` | Login | ✅ Funcional |
| `/register` | Registro | ✅ Funcional |
| `/forgot-password` | Recuperar contraseña | ✅ Funcional |
| `/pending` | Cuenta pendiente de aprobación | ✅ Funcional |
| `/blocked` | Cuenta bloqueada | ✅ Funcional |

### Dashboard (global)
| Ruta | Página | Estado |
|------|--------|--------|
| `/dashboard` | Dashboard principal con grid de proyectos | ✅ Funcional |
| `/dashboard/shared` | Proyectos compartidos | ⚠️ Básico |
| `/dashboard/publications` | Publicaciones cross-project | ⚠️ Básico |
| `/dashboard/tasks` | Tareas cross-project | ⚠️ Redirect a proyecto |
| `/dashboard/notifications` | Inbox | ❌ Falta como página |
| `/new` | Crear nuevo proyecto | ✅ Funcional |

### Proyecto
| Ruta | Página | Estado |
|------|--------|--------|
| `/project/[id]` | Vista general del proyecto | ✅ Funcional |
| `/project/[id]/videos` | Lista/grid de videos | ✅ Funcional |
| `/project/[id]/tasks` | Tareas del proyecto (kanban) | ✅ Funcional |
| `/project/[id]/tasks/time` | Time tracking | ✅ Funcional |
| `/project/[id]/publications` | Publicaciones del proyecto | ✅ Funcional |
| `/project/[id]/publications/new` | Crear publicación | ✅ Funcional |
| `/project/[id]/publications/[pubId]` | Detalle publicación | ✅ Funcional |
| `/project/[id]/publications/profiles` | Perfiles sociales | ✅ Funcional |
| `/project/[id]/resources/characters` | Lista personajes | ✅ Funcional |
| `/project/[id]/resources/characters/[charId]` | Detalle personaje | ✅ Funcional |
| `/project/[id]/resources/backgrounds` | Lista fondos | ✅ Funcional |
| `/project/[id]/resources/backgrounds/[bgId]` | Detalle fondo | ⚠️ Existe ruta |
| `/project/[id]/resources/styles` | Estilos visuales | ✅ Funcional |
| `/project/[id]/resources/templates` | Prompt templates | ✅ Funcional |
| `/project/[id]/settings` | Ajustes generales | ✅ Funcional |
| `/project/[id]/settings/ai` | Config IA del proyecto | ✅ Funcional |
| `/project/[id]/settings/sharing` | Compartir/colaboradores | ✅ Funcional |
| `/project/[id]/activity` | Feed de actividad | ⚠️ Existe ruta, UI básica |
| `/project/[id]/chat` | Chat en contexto proyecto | ⚠️ Redirect a panel |

### Video
| Ruta | Página | Estado |
|------|--------|--------|
| `/project/[id]/video/[vid]` | Vista general video | ✅ Funcional |
| `/project/[id]/video/[vid]/scenes` | Lista de escenas | ✅ Funcional |
| `/project/[id]/video/[vid]/scene/[sid]` | Editor de escena | ✅ Funcional — más compleja |
| `/project/[id]/video/[vid]/narration` | Narración/TTS | ✅ Funcional |
| `/project/[id]/video/[vid]/analysis` | Análisis IA | ✅ Funcional |
| `/project/[id]/video/[vid]/export` | Exportación | ✅ Funcional |
| `/project/[id]/video/[vid]/timeline` | Timeline visual | ⚠️ Existe ruta, UI básica |
| `/project/[id]/video/[vid]/storyboard` | Storyboard | ⚠️ Existe ruta, UI básica |
| `/project/[id]/video/[vid]/share` | Compartir escenas | ⚠️ Existe ruta, UI básica |
| `/project/[id]/video/[vid]/script` | Guión | ⚠️ Existe ruta |
| `/project/[id]/video/[vid]/derive` | Derivaciones | ⚠️ Existe ruta |

### Admin
| Ruta | Página | Estado |
|------|--------|--------|
| `/admin` | Panel admin | ✅ Funcional |
| `/admin/users` | Gestión usuarios | ✅ Funcional |

### Público
| Ruta | Página | Estado |
|------|--------|--------|
| `/` | Landing page | ✅ Funcional |
| `/share/[token]` | Vista pública de escenas compartidas | ✅ Funcional |
| `/privacy` | Política de privacidad | ✅ Funcional |
| `/terms` | Términos de uso | ✅ Funcional |
| `/docs` | Documentación | ⚠️ Básico |
| `/components` | Showcase de componentes (dev) | ✅ Dev tool |

### Settings (modal)
| Sección | ID | Estado |
|---------|-----|--------|
| Perfil | `perfil` | ✅ Funcional |
| Preferencias | `preferencias` | ✅ Funcional |
| Notificaciones | `notificaciones` | ✅ Funcional |
| Seguridad | `seguridad` | ✅ Funcional |
| Mis organizaciones | `organizaciones` | ✅ Funcional |
| General org | `org-general` | ✅ Funcional |
| Miembros org | `org-miembros` | ✅ Funcional |
| API Keys | `api-keys` | ✅ Funcional |
| Suscripción | `suscripcion` | ✅ Funcional |

---

## 2. ESTADO DE CADA PÁGINA — QUÉ MUESTRA Y QUÉ DEBERÍA MOSTRAR

### Dashboard (`/dashboard`)
**Actual:** Grid de proyectos con filtros (buscar, ordenar, estado), botón crear proyecto, favoritos.
**Debería tener:**
- Resumen rápido: proyectos activos, tareas pendientes, uso IA del mes
- Actividad reciente (últimas 5 acciones)
- Quick actions: "Crear proyecto", "Continuar último video"
- Widget de Kiyoko con sugerencia contextual

### Vista general proyecto (`/project/[id]`)
**Actual:** Header con título/descripción, grid de videos, stats de escenas.
**Debería tener:**
- Progreso visual (barra de progreso por fase)
- Videos con thumbnail y status
- Actividad reciente del proyecto
- Personajes y fondos como chips/tags
- Quick actions: "Crear video", "Abrir último video"
- Botón IA: "Analizar progreso del proyecto"

### Escenas (`/video/[vid]/scenes`)
**Actual:** Lista de escenas con editor.
**Debería tener:**
- Vista grid (thumbnails) + lista (tabla)
- Drag & drop para reordenar
- Bulk actions (seleccionar varias → generar prompts, eliminar)
- Botón IA: "Auto-planificar escenas", "Generar todos los prompts"
- Indicador visual de arco narrativo (hook/build/peak/close)
- Status badges por escena (draft, generating, approved)

### Escena individual (`/video/[vid]/scene/[sid]`)
**Actual:** Editor completo con tabs (prompt, cámara, media, etc.).
**Debería tener:**
- Preview de imagen/video generado a la izquierda
- Editor de prompt a la derecha
- Panel de cámara con selectores visuales (no texto)
- Personajes asignados como chips con drag from sidebar
- Botones IA: "Generar prompt imagen", "Generar prompt video", "Mejorar prompt"
- Historial de versiones del prompt
- Anotaciones del cliente (si compartido)

### Timeline (`/video/[vid]/timeline`)
**Actual:** Página existe pero UI básica.
**Debería tener:**
- Timeline horizontal como Adobe Premiere
- Arcos narrativos con colores (hook=azul, build=ámbar, peak=rojo, close=verde)
- Escenas como bloques arrastrables
- Duración total vs target
- Zoom in/out
- Mini-thumbnails de cada escena

### Storyboard (`/video/[vid]/storyboard`)
**Actual:** Página existe pero UI básica.
**Debería tener:**
- Grid de cards (3-4 columnas)
- Cada card: thumbnail + scene_number + título + diálogo
- Export a PDF con layout imprimible
- Vista print-friendly
- Toggle entre con/sin diálogos

### Narración (`/video/[vid]/narration`)
**Actual:** Editor de narración con preview TTS.
**Debería tener:**
- Editor de texto con marcadores de tiempo
- Selector de voz (ElevenLabs voices)
- Preview por sección
- Botón IA: "Generar narración completa"
- Waveform visual del audio generado
- Sincronización con escenas

### Análisis (`/video/[vid]/analysis`)
**Actual:** Análisis IA con scores.
**Debería tener:**
- Score general con gauge visual
- Fortalezas/debilidades como cards
- Sugerencias accionables con botones
- Comparación con versiones anteriores
- Botón IA: "Re-analizar"

### Compartir (`/video/[vid]/share`)
**Actual:** Página existe pero UI básica.
**Debería tener:**
- Crear link de compartición
- Seleccionar escenas (checkbox)
- Opciones: contraseña, expiración, permitir anotaciones
- Lista de links activos con stats (vistas, anotaciones)
- Vista de anotaciones recibidas

---

## 3. PÁGINAS QUE FALTAN (completamente)

### Dashboard level
| Página | Prioridad | Qué mostrar |
|--------|-----------|-------------|
| `/dashboard/notifications` (Inbox) | **ALTA** | Lista de notificaciones agrupadas por fecha. Filtros: no leídas, por tipo (comment, task, share, system), por proyecto. Acciones: marcar leída, marcar todas, ir al recurso. |
| `/dashboard/activity` | MEDIA | Feed tipo GitHub. Timeline vertical con acciones: "Pedro creó video X", "Ana comentó en escena 3". Filtros por proyecto/usuario/acción. |
| `/dashboard/usage` | MEDIA | Dashboard con charts: tokens consumidos/mes por proveedor, imágenes generadas, videos generados, storage usado, coste estimado. Tabla de detalle. |
| `/dashboard/calendar` | BAJA | Vista mensual. Eventos: tareas con due_date, publicaciones con scheduled_at. Click para ir al recurso. |

### Proyecto level
| Página | Prioridad | Qué mostrar |
|--------|-----------|-------------|
| `/project/[id]/comments` | MEDIA | Todos los comentarios del proyecto agrupados por video/escena. Hilos (parent_id). Resolver comentarios. Filtros: no resueltos, por usuario. |
| `/project/[id]/exports` | BAJA | Historial de exportaciones. Formato, fecha, tamaño, link de descarga. Re-exportar. |

---

## 4. PUNTOS FUERTES

### Arquitectura
- **Next.js 15 App Router** bien estructurado con layouts anidados
- **Supabase** con RLS en todas las tablas (seguro)
- **48 tablas** cubriendo todo el pipeline de producción de video
- **React Query** para data fetching + ahora con persistencia localStorage
- **Zustand** para UI state con persist
- **Organización multi-workspace** funcional

### Features existentes
- **9 agentes IA** especializados (aunque el chat es complejo)
- **Motor de escenas** completo: camera, prompts, media, clips, extensiones
- **Sistema de narración** con TTS (ElevenLabs)
- **Exportación** multi-formato (HTML, JSON, MD, PDF, MP4)
- **Compartición** de escenas con anotaciones externas
- **Time tracking** integrado
- **Publicaciones** con perfiles sociales

### UX
- **Sidebar contextual** 3 niveles (dashboard → proyecto → video)
- **Collapsed mode** funcional con tooltips y popovers
- **Settings modal** completo con 9 secciones
- **Dark mode** first con design system coherente
- **HeroUI v3** integrado para form components

---

## 5. PUNTOS DÉBILES

### Arquitectura
- **Chat hace TODO** — creación, edición, generación, consulta. Difícil de mantener, lento (requiere LLM call para crear un proyecto).
- **Sin endpoint IA simple** — todo pasa por el chat streaming. No hay `POST /api/ai/generate` para botones de generación.
- **Algunas páginas son stubs** — timeline, storyboard, share, script, derive existen como rutas pero tienen UI mínima.
- **useFavorites** usaba `slug` en vez de `short_id` (ya arreglado).
- **SidebarAdmin** hacía query manual en vez de usar `useAuth()` (ya arreglado).

### UX
- **No hay onboarding** — usuario nuevo ve dashboard vacío sin guía.
- **No hay empty states buenos** — muchas páginas muestran "Sin datos" sin contexto ni CTA.
- **No hay breadcrumbs** — difícil saber dónde estás en la jerarquía.
- **No hay feedback visual** — muchas acciones no tienen toast ni confirmación.
- **Loading states inconsistentes** — algunos usan skeleton, otros spinner, otros nada.
- **No hay undo global** — entity_snapshots existe pero no hay UI.
- **No hay keyboard shortcuts** documentados ni configurables.

### Performance
- **Sin lazy loading** de componentes pesados (editor de escena, timeline).
- **Sin virtual scroll** en listas largas (escenas, notificaciones).
- **Sin optimistic updates** en muchas mutaciones.
- **Sin prefetch** de rutas probables (ej: al hover un proyecto, prefetch sus datos).

### Design
- **Colores hardcoded** en algunos componentes (bg-[#xxx]).
- **Tipografía inconsistente** — mezcla de `text-sm`, `text-[13px]`, `text-xs`.
- **Spacing inconsistente** — aunque el sidebar está estandarizado, las páginas varían.
- **Sin motion design** — transiciones abruptas entre estados.

---

## 6. PLAN DE MEJORA POR ÁREA

### 6.1 Dashboard
**Prioridad: ALTA**

Mejorar la página principal para que sea un hub informativo:

```
┌─────────────────────────────────────────────────┐
│ Buenos días, Pedro 👋                            │
│ Tienes 3 tareas pendientes y 2 notificaciones   │
├─────────────────────────────────────────────────┤
│ Quick actions:                                   │
│ [+ Crear proyecto] [Continuar: Video Primavera]  │
├──────────────────────┬──────────────────────────┤
│ Proyectos recientes  │ Actividad reciente       │
│ ┌──────┐ ┌──────┐   │ • Pedro creó Video X     │
│ │ Proj │ │ Proj │   │ • Ana comentó en Esc. 3  │
│ │  A   │ │  B   │   │ • Export completado       │
│ └──────┘ └──────┘   │                          │
├──────────────────────┴──────────────────────────┤
│ Uso este mes: 1.2K tokens · 15 imágenes · 3 vid │
└─────────────────────────────────────────────────┘
```

### 6.2 Páginas de video mejoradas

**Timeline:**
- Horizontal scrollable con zoom
- Arcos narrativos como bandas de color
- Escenas como bloques con thumbnail
- Duración acumulada vs target
- Drag & drop

**Storyboard:**
- Grid responsive (2-4 cols)
- Card: thumbnail + número + título + diálogo truncado
- Hover: expand diálogo completo
- Botón "Export PDF"
- Toggle: con/sin diálogos, con/sin notas director

**Share:**
- Create share link con formulario claro
- Checkboxes de escenas (select all/none)
- Opciones: password, expiry, allow annotations
- Tabla de links activos con stats
- Panel de anotaciones recibidas con resolve

### 6.3 Empty states profesionales

Cada página vacía debería mostrar:
1. **Ilustración/icono** relevante (no un texto seco)
2. **Título** claro ("Sin videos todavía")
3. **Descripción** breve ("Los videos de tu proyecto aparecerán aquí")
4. **CTA primario** ("Crear primer video")
5. **CTA secundario** opcional ("Importar desde...")

### 6.4 Onboarding
Primera vez que un usuario entra:
1. Modal de bienvenida con 3 pasos
2. Crear primera organización (ya existe)
3. Crear primer proyecto con guía paso a paso
4. Tour de la UI con highlights (ej: "Este es el chat de Kiyoko IA")

---

## 7. IA EN COMPONENTES (sin chat)

### Endpoint nuevo: `POST /api/ai/generate`

```typescript
// Request
{
  task: 'image_prompt' | 'video_prompt' | 'narration' | 'scene_plan' |
        'analyze_video' | 'describe_character' | 'describe_background' |
        'suggest_next_steps' | 'improve_prompt',
  context: {
    projectId?: string,
    videoId?: string,
    sceneId?: string,
    characterId?: string,
    backgroundId?: string,
    // ... datos específicos de la tarea
  }
}

// Response
{
  success: true,
  result: { ... resultado estructurado según la tarea ... }
}
```

### Botones IA a implementar

| Botón | Ubicación | Tarea | Input | Output |
|-------|-----------|-------|-------|--------|
| "✨ Generar prompt" | Página escena | `image_prompt` | scene + characters + background + style | prompt_text (EN) |
| "✨ Generar video prompt" | Página escena | `video_prompt` | scene + first_frame + style | prompt_text (EN) |
| "✨ Generar narración" | Página narración | `narration` | video + scenes + style | narration_text |
| "✨ Analizar video" | Página análisis | `analyze_video` | video + scenes | scores + suggestions |
| "✨ Auto-planificar" | Página escenas | `scene_plan` | video + characters + backgrounds | scene[] array |
| "✨ Describir con IA" | Form personaje | `describe_character` | image + name | visual_description + prompt_snippet |
| "✨ Describir con IA" | Form fondo | `describe_background` | image + name | description + prompt_snippet |
| "✨ Mejorar prompt" | Página escena | `improve_prompt` | current prompt + context | improved prompt |
| "✨ Sugerir pasos" | Vista general proyecto | `suggest_next_steps` | project state | action list |

### Componente reutilizable

```tsx
<AIButton
  task="image_prompt"
  context={{ sceneId, projectStyle }}
  onResult={(result) => updatePrompt(result.prompt_text)}
  label="Generar prompt"
/>
```

---

## 8. DESIGN SYSTEM

### Tipografía estandarizada
| Uso | Clase | Tamaño |
|-----|-------|--------|
| Page title | `text-2xl font-semibold tracking-tight` | 24px |
| Section title | `text-lg font-medium` | 18px |
| Card title | `text-sm font-semibold` | 14px |
| Body | `text-sm` | 14px |
| Caption | `text-xs text-muted-foreground` | 12px |
| Sidebar item | `text-[13px]` | 13px |
| Sidebar sub-item | `text-[12px]` | 12px |
| Label | `text-[11px] font-medium tracking-wide` | 11px |

### Espaciado
| Contexto | Valor |
|----------|-------|
| Page padding | `p-6 lg:p-8` |
| Section gap | `space-y-6` |
| Card padding | `p-4` o `p-6` |
| Card gap | `gap-4` |
| Sidebar section padding | `px-1.5 py-1` |
| Sidebar item height | `h-8` (main), `h-7` (sub) |
| Divider | `my-1.5 mx-3 h-px` |

### Componentes base
| Componente | Origen | Status |
|------------|--------|--------|
| Button | HeroUI wrapper | ✅ |
| Input/TextField | HeroUI | ✅ |
| TextArea | HeroUI | ✅ |
| Select | HeroUI | ✅ |
| Switch | HeroUI | ✅ |
| Modal | HeroUI | ✅ |
| Popover | shadcn | ✅ |
| DropdownMenu | shadcn | ✅ |
| Tooltip | HeroUI | ✅ |
| Avatar | HeroUI | ✅ |
| Separator | HeroUI | ✅ |
| Sidebar | shadcn (custom) | ✅ |

---

## 9. PERFORMANCE

### Implementado
- ✅ React Query persist (localStorage cache)
- ✅ Zustand persist para UI state
- ✅ Lazy load de videos en sidebar (enabled: expanded)
- ✅ staleTime: 60s para reducir refetches

### Pendiente
| Mejora | Impacto | Esfuerzo |
|--------|---------|----------|
| Lazy load de páginas pesadas (dynamic import) | Alto | Bajo |
| Virtual scroll en listas largas (>50 items) | Alto | Medio |
| Optimistic updates en mutaciones | Alto | Medio |
| Prefetch al hover en sidebar links | Medio | Bajo |
| Image optimization (next/image everywhere) | Medio | Bajo |
| Bundle splitting por ruta | Alto | Bajo (ya lo hace Next.js) |
| Service Worker para offline básico | Bajo | Alto |

---

## 10. PRIORIDADES DE IMPLEMENTACIÓN

### Fase 1: Foundation (1-2 semanas)
1. **`POST /api/ai/generate`** — endpoint IA sin chat
2. **Empty states** profesionales en todas las páginas
3. **Breadcrumbs** en el header
4. **Loading states** consistentes (skeleton pattern)
5. **Inbox page** (`/dashboard/notifications`)

### Fase 2: AI Buttons (1 semana)
6. **AIButton component** reutilizable
7. Botón "Generar prompt" en página escena
8. Botón "Generar narración" en página narración
9. Botón "Analizar" en página análisis
10. Botón "Auto-planificar" en página escenas

### Fase 3: Pages Polish (2 semanas)
11. **Timeline** — vista horizontal con arcos narrativos
12. **Storyboard** — grid de cards con export PDF
13. **Share** — formulario de compartición con opciones
14. **Dashboard** mejorado con resumen y actividad
15. **Vista general proyecto** con progreso visual

### Fase 4: Collaboration (1 semana)
16. **Comments page** por proyecto
17. **Activity feed** por proyecto
18. **Anotaciones** en escenas compartidas
19. **Realtime updates** con Supabase subscriptions

### Fase 5: Advanced (2 semanas)
20. **Drag & drop** en timeline y escenas
21. **Script page** — editor de guión completo
22. **Derivaciones** — crear adaptaciones de video
23. **Calendar** — vista mensual de tareas/publicaciones
24. **Onboarding** — flujo de primera vez
25. **Keyboard shortcuts** documentados

### Fase 6: Optimization (ongoing)
26. Virtual scroll en listas largas
27. Optimistic updates
28. Prefetch de rutas
29. Image optimization
30. Simplificar chat (reducir a 3 agentes)

---

## 11. INFRAESTRUCTURA EXISTENTE

### Loading & Error handling
- **13 loading.tsx** — skeletons estratégicos (root, admin, dashboard, project, video, scene, publications, resources, settings)
- **10 error.tsx** — error boundaries (root, admin, video, scene, publications, resources, settings)
- **Pattern:** Cada sección importante tiene loading + error. Faltan en algunas rutas nuevas.

### Layouts anidados
| Layout | Scope | Qué provee |
|--------|-------|------------|
| `app/layout.tsx` | Root | Fonts, QueryProvider, KiyokoToaster, dark mode script |
| `(auth)/layout.tsx` | Auth | Split-screen con branding, gradient orbs, grid pattern |
| `(public)/layout.tsx` | Público | Navbar + footer |
| `(dashboard)/layout.tsx` | Dashboard | SidebarProvider, AppSidebar, Header, KiyokoPanel, Modals |
| `project/[shortId]/layout.tsx` | Proyecto | ProjectContext provider |
| `video/[videoShortId]/layout.tsx` | Video | VideoContext provider |

### Páginas existentes con funcionalidad avanzada
| Página | Features destacadas |
|--------|-------------------|
| `/dashboard` | Greeting dinámico, stats cards, grid filtrable, favoritos, actividad |
| `/new` | Wizard de creación asistido por IA, selector de estilo/plataforma, preview |
| `/project/[id]` | Hub con videos, recursos summary, dropdown actions, modal creación |
| `/video/[vid]` | Toggle de vistas (storyboard/list/table/timeline), arcos narrativos, filtros |
| `/video/[vid]/scene/[sid]` | Editor completo con tabs (prompt, cámara, media, clips) |
| `/video/[vid]/narration` | Player con controles, voice selector (ElevenLabs), regenerar |
| `/video/[vid]/export` | Multi-formato (PDF, HTML, JSON, MD, MP3, ZIP) |
| `/video/[vid]/analysis` | Score gauge, strengths/weaknesses, suggestions accionables |
| `/tasks` | Kanban con drag&drop, 4 columnas, prioridades con color |
| `/publications` | Grid/calendar view, tipos (video/image/carousel/story), scheduler |
| `/share/[token]` | Vista pública con password optional, anotaciones, preview |

### Páginas que existen pero necesitan mejora
| Página | Estado actual | Qué mejorar |
|--------|--------------|-------------|
| `/video/[vid]/timeline` | Escenas en fases con colores | Timeline horizontal tipo Premiere, drag&drop, zoom |
| `/video/[vid]/storyboard` | Redirect a video page | Grid de cards con thumbnails + diálogos, export PDF |
| `/video/[vid]/share` | Formulario básico de token | UI completa: checkboxes escenas, password, expiry, stats |
| `/video/[vid]/script` | Editor de narración | Sincronización con escenas, timing markers, preview |
| `/video/[vid]/derive` | WIP | Selector de plataforma destino, heredar escenas, ajustes |
| `/project/[id]/activity` | Existe ruta | Feed tipo GitHub con filtros |
| `/dashboard/shared` | Lista básica | Cards con preview, filtros, acciones |
| `/dashboard/publications` | Lista básica | Calendar view, filtros por estado/plataforma |

---

## 12. RUTAS COMPLETAS DEL APP

```
/                                  → Landing page
├── (auth)/
│   ├── login                      → Login (email + Google OAuth)
│   ├── register                   → Registro con password strength
│   ├── forgot-password            → Reset password por email
│   ├── pending                    → Esperando aprobación (polls 10s)
│   └── blocked                    → Cuenta bloqueada
│
├── (public)/
│   ├── components                 → Showcase dev
│   ├── docs                       → Documentación
│   ├── privacy                    → Política privacidad
│   └── terms                      → Términos de uso
│
├── (dashboard)/
│   ├── dashboard                  → Hub principal
│   ├── dashboard/shared           → Proyectos compartidos
│   ├── dashboard/publications     → Publicaciones globales
│   ├── new                        → Wizard crear proyecto
│   │
│   ├── settings                   → Modal perfil
│   ├── settings/api-keys          → Modal API keys
│   ├── settings/subscription      → Modal suscripción
│   ├── settings/notifications     → Modal notificaciones
│   │
│   ├── admin                      → Panel admin
│   ├── admin/users                → Gestión usuarios
│   │
│   ├── organizations              → Lista workspaces
│   ├── organizations/new          → Crear workspace
│   ├── organizations/[orgId]      → Detalle workspace
│   │
│   ├── project                    → Lista proyectos
│   └── project/[shortId]/
│       ├── (root)                 → Vista general proyecto
│       ├── videos                 → Grid de videos
│       ├── tasks                  → Kanban de tareas
│       ├── tasks/time             → Time tracking
│       ├── activity               → Feed actividad
│       ├── chat                   → Chat IA contexto proyecto
│       │
│       ├── publications/          → Calendario publicaciones
│       │   ├── new                → Crear publicación
│       │   ├── [pubShortId]       → Detalle publicación
│       │   └── profiles           → Perfiles sociales
│       │
│       ├── resources/             → Hub recursos
│       │   ├── characters         → Lista personajes
│       │   ├── characters/[id]    → Detalle personaje
│       │   ├── backgrounds        → Lista fondos
│       │   ├── backgrounds/[id]   → Detalle fondo
│       │   ├── styles             → Estilos visuales
│       │   └── templates          → Prompt templates
│       │
│       ├── settings/              → Ajustes proyecto
│       │   ├── (root)             → General
│       │   ├── ai                 → Config IA
│       │   └── sharing            → Colaboradores
│       │
│       └── video/[videoShortId]/
│           ├── (root)             → Vista general video
│           ├── scenes             → Lista/editor escenas
│           ├── scene/[sceneId]    → Editor escena individual
│           ├── timeline           → Timeline visual
│           ├── storyboard         → Storyboard grid
│           ├── script             → Guión/script
│           ├── narration          → Audio/TTS
│           ├── analysis           → Análisis IA
│           ├── export             → Exportación multi-formato
│           ├── share              → Compartir escenas
│           └── derive             → Crear adaptaciones
│
├── share/[token]                  → Vista pública compartida
└── playground/chat-sandbox        → Sandbox desarrollo
```

**Total: 57 páginas, 6 layouts, 13 loading states, 10 error boundaries.**

---

## 13. INVENTARIO DE COMPONENTES (80+)

### Por dominio

| Dominio | Componentes | Destacados |
|---------|-------------|------------|
| **Chat/IA** | 31 | KiyokoChat, ChatInput, ChatMessage, ActionPlanCard, ScenePlanTimeline, PromptPreviewCard, CreationCards (4), StreamingWave |
| **Settings** | 11 | SettingsModal + 9 secciones (perfil, preferencias, seguridad, org, API keys, suscripción) + shared helpers |
| **Layout** | 8+ | Header, NotificationBell, SearchModal, ThemeToggle, Sidebar components (12 archivos) |
| **Scene** | 6 | PromptEditor, SceneSelect, AudioMultiToggle, DurationInput, LightingSelect, MoodSelect |
| **Auth** | 5 | AuthCard, AuthInput, GoogleButton, PasswordStrength, AuthDivider |
| **Shared** | 5 | ConfirmDialog, CookieBanner, FavoriteButton, FeedbackDialog, KiyokoLogo |
| **Kiyoko** | 3 | KiyokoPanel (sidebar/floating/fullscreen), KiyokoButton (FAB), KiyokoHeader |
| **Project** | 2 | ProjectCard, ProjectGrid |
| **Video** | 3 | SceneCard, ArcBar, VideoCreateModal |
| **Analysis** | 2 | AnalysisCard, ScoreGauge |
| **Narration** | 1 | VoiceSelector |
| **Tasks** | 1 | TaskCreateModal |
| **Workspace** | 1 | WorkspaceCreateModal |
| **Landing** | 1 | LandingPage |
| **Dev** | 1 | ComponentsShowcase |

### Componentes del Chat (el más grande — 31 archivos)

**Creación (formularios embebidos en chat):**
- `CharacterCreationCard` — form completo: nombre, rol, imagen, descripción visual
- `BackgroundCreationCard` — form: nombre, tipo, hora del día, descripción
- `VideoCreationCard` — form: plataforma, duración, estilo
- `ProjectCreationCard` — form: nombre, estilo, descripción
- `CreationSaveProgress` — indicador de pasos de guardado
- `CreationSuccessCard` — confirmación post-creación
- `CreationCancelledCard` — notificación de cancelación

**Visualización de datos IA:**
- `ActionPlanCard` — operaciones pendientes (crear/update/delete) con ejecutar/undo
- `ScenePlanTimeline` — timeline visual con arcos narrativos
- `PromptPreviewCard` — prompt generado con copy button
- `SceneDetailCard` — info completa de escena (personajes, fondo, cámara)
- `VideoSummaryCard` — stats de video (escenas, prompts, narración)
- `ProjectSummaryCard` — overview de proyecto
- `ResourceListCard` — inventario de personajes/fondos
- `DiffView` — comparación antes/después
- `PreviewCard` — preview genérico de cualquier entidad

**Interacción:**
- `ChatInput` / `ChatInputV2` — input con uploads, selector contexto
- `ChatQuestionPrompt` — opciones A/B/C con keyboard nav
- `ChatFollowUpList` — sugerencias de next steps
- `OptionsBlock` — selección de opciones con iconos
- `EntitySelector` — dropdown para seleccionar entidades

**UI/Status:**
- `StreamingWave` — animación logo Kiyoko "Generando..."
- `ThinkingIndicator` — dots pulsantes "Pensando..."
- `ChatContextStrip` — breadcrumb de contexto actual
- `ChatHistorySidebar` — historial de conversaciones

### Componentes que FALTAN (no existen)

| Componente | Para qué | Prioridad |
|------------|----------|-----------|
| `AIButton` / `AIGenerateButton` | Botón IA contextual (generar prompt, narración, análisis) | **ALTA** |
| `Breadcrumbs` | Navegación jerárquica en header | **ALTA** |
| `EmptyState` | Empty state reutilizable (icono + texto + CTA) | **ALTA** |
| `NotificationList` | Lista de notificaciones para Inbox page | ALTA |
| `ActivityFeed` | Feed de actividad con timeline vertical | MEDIA |
| `TimelineView` | Vista timeline horizontal tipo Premiere | MEDIA |
| `StoryboardGrid` | Grid de cards para storyboard | MEDIA |
| `UsageChart` | Gráficos de uso IA | MEDIA |
| `CommentThread` | Hilo de comentarios con resolver | MEDIA |
| `DragDropList` | Lista reordenable para escenas | MEDIA |
| `CalendarView` | Vista calendario para tareas/publicaciones | BAJA |
| `OnboardingWizard` | Flujo primera vez | BAJA |
