# Kiyoko AI — Arquitectura Completa de la App

> Documento generado analizando todo el código fuente. Refleja el estado ACTUAL de la app (pre-v4).

---

## 1. Estructura de Carpetas

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, theme, metadata)
│   ├── page.tsx                  # Landing / redirect a dashboard
│   │
│   ├── (auth)/                   # Grupo de autenticación
│   │   ├── layout.tsx            # Layout auth (centrado, sin sidebar)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── pending/page.tsx
│   │   └── blocked/page.tsx
│   │
│   ├── (public)/                 # Páginas públicas sin auth
│   │   ├── layout.tsx
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── docs/page.tsx
│   │
│   ├── (dashboard)/              # Área autenticada
│   │   ├── layout.tsx            # Dashboard layout (Sidebar + ChatPanel + Header)
│   │   ├── dashboard/page.tsx    # Panel principal con grid de proyectos
│   │   ├── new/page.tsx          # Crear proyecto (wizard / IA)
│   │   ├── settings/
│   │   │   ├── page.tsx          # Ajustes de usuario
│   │   │   └── api-keys/page.tsx # Gestión de API keys
│   │   ├── organizations/
│   │   │   ├── page.tsx          # Listado de organizaciones
│   │   │   └── new/page.tsx      # Crear organización
│   │   ├── admin/
│   │   │   ├── page.tsx          # Dashboard admin
│   │   │   └── users/page.tsx    # Gestión de usuarios
│   │   │
│   │   └── project/
│   │       ├── page.tsx          # Redirect a dashboard
│   │       └── [slug]/           # ⚠️ Usa slug (v3), v4 cambia a [shortId]
│   │           ├── layout.tsx    # ProjectProvider + RealtimeSync
│   │           ├── page.tsx      # Vista general del proyecto
│   │           ├── storyboard/page.tsx    # ⚠️ ELIMINAR en v4 (storyboard es por vídeo)
│   │           ├── scenes/
│   │           │   ├── page.tsx           # ⚠️ ELIMINAR en v4 (escenas bajo vídeo)
│   │           │   └── [sceneId]/page.tsx # ⚠️ MOVER bajo video/[videoShortId]/scene/
│   │           ├── videos/page.tsx        # Listado de vídeos
│   │           ├── video/[videoSlug]/
│   │           │   ├── layout.tsx         # Layout de vídeo
│   │           │   ├── page.tsx           # Vista del vídeo
│   │           │   ├── storyboard/page.tsx
│   │           │   ├── script/page.tsx
│   │           │   ├── narration/page.tsx
│   │           │   └── export/page.tsx
│   │           ├── characters/page.tsx    # ⚠️ MOVER bajo resources/ en v4
│   │           ├── backgrounds/page.tsx   # ⚠️ MOVER bajo resources/ en v4
│   │           ├── resources/page.tsx
│   │           ├── tasks/page.tsx
│   │           ├── timeline/page.tsx      # ⚠️ MOVER bajo video/ en v4
│   │           ├── arc/page.tsx           # ⚠️ ELIMINAR (se integra en timeline del vídeo)
│   │           ├── narration/page.tsx     # ⚠️ MOVER bajo video/ en v4
│   │           ├── analysis/page.tsx      # ⚠️ MOVER bajo video/ en v4
│   │           ├── chat/page.tsx
│   │           ├── exports/page.tsx       # ⚠️ MOVER bajo video/ en v4
│   │           ├── settings/page.tsx
│   │           └── references/page.tsx    # ⚠️ ELIMINAR (redundante con resources)
│   │
│   └── api/                      # API Routes (server-side)
│       ├── admin/
│       │   └── users/
│       │       ├── route.ts      # GET: listar usuarios
│       │       └── [userId]/route.ts  # PATCH: aprobar/bloquear
│       ├── ai/
│       │   ├── chat/route.ts            # POST: chat streaming con IA
│       │   ├── generate-image/route.ts  # POST: generar imagen
│       │   ├── generate-scenes/route.ts # POST: generar escenas
│       │   ├── improve-prompt/route.ts  # POST: mejorar prompt
│       │   ├── analyze-project/route.ts # POST: analizar proyecto
│       │   ├── generate-project/route.ts # POST: generar proyecto completo
│       │   ├── generate-characters/route.ts # POST: generar personajes
│       │   ├── generate-arc/route.ts    # POST: generar arco narrativo
│       │   ├── generate-timeline/route.ts # POST: generar timeline
│       │   ├── generate-narration/route.ts # POST: generar texto narración
│       │   ├── generate-voice/route.ts  # POST: TTS con ElevenLabs
│       │   ├── voices/route.ts          # GET: listar voces ElevenLabs
│       │   └── providers/status/route.ts # GET: estado de proveedores IA
│       ├── export/
│       │   ├── html/route.ts
│       │   ├── json/route.ts
│       │   ├── markdown/route.ts
│       │   └── pdf/route.ts
│       └── user/
│           ├── api-keys/
│           │   ├── route.ts         # GET/POST: listar/crear API keys
│           │   ├── [id]/route.ts    # PATCH/DELETE: editar/borrar key
│           │   └── test/route.ts    # POST: probar API key
│           └── usage/route.ts       # GET: consumo mensual IA
│
├── components/                   # Componentes React
│   ├── auth/                     # Componentes de autenticación
│   │   ├── AuthCard.tsx          # Card contenedor para login/register
│   │   ├── AuthInput.tsx         # Input estilizado para auth
│   │   ├── AuthDivider.tsx       # Divider "o continúa con"
│   │   ├── GoogleButton.tsx      # Botón OAuth Google
│   │   ├── PasswordStrength.tsx  # Indicador de fortaleza de contraseña
│   │   └── index.ts             # Barrel exports
│   │
│   ├── chat/                     # Chat IA (Kiyoko)
│   │   ├── KiyokoChat.tsx        # Componente principal del chat (panel/expanded)
│   │   ├── ChatMessage.tsx       # Renderizado de mensaje individual
│   │   ├── ChatInput.tsx         # Input con upload de archivos
│   │   ├── ChatHistorySidebar.tsx # Sidebar de historial (modo expandido)
│   │   └── ActionPlanCard.tsx    # Card de plan de acción de la IA
│   │
│   ├── landing/
│   │   └── LandingPage.tsx       # Página de presentación pública
│   │
│   ├── layout/                   # Layout y navegación
│   │   ├── Header.tsx            # Header principal (breadcrumbs, acciones, kiyoko btn)
│   │   ├── Sidebar.tsx           # Sidebar contenedor (provider de shadcn/ui)
│   │   ├── DashboardSidebar.tsx  # Sidebar del dashboard (proyectos, settings, admin)
│   │   ├── ProjectSidebar.tsx    # Sidebar dentro de un proyecto (secciones del proyecto)
│   │   ├── SidebarNav.tsx        # Links de navegación del sidebar
│   │   ├── SidebarProjectNav.tsx # Nav específica de proyecto
│   │   ├── SidebarOrgHeader.tsx  # Header de organización en sidebar
│   │   ├── SidebarUserFooter.tsx # Footer con avatar y logout
│   │   ├── ChatPanel.tsx         # Panel lateral del chat (resizable)
│   │   ├── OrgSwitcher.tsx       # Selector de organización
│   │   ├── Breadcrumbs.tsx       # Breadcrumbs dinámicos
│   │   ├── MobileNav.tsx         # Navegación móvil
│   │   ├── NotificationBell.tsx  # Campana de notificaciones
│   │   ├── ThemeToggle.tsx       # Toggle claro/oscuro
│   │   └── UserMenu.tsx          # Menú de usuario (dropdown)
│   │
│   ├── narration/                # Narración y TTS
│   │   ├── VoiceSelector.tsx     # Selector de voz (ElevenLabs)
│   │   └── NarrationPlayer.tsx   # Reproductor de audio
│   │
│   ├── project/                  # Componentes de proyecto
│   │   ├── ProjectCard.tsx       # Tarjeta de proyecto (grid del dashboard)
│   │   ├── ProjectGrid.tsx       # Grid de tarjetas de proyectos
│   │   └── SceneSelectionBar.tsx # Barra de selección de escenas
│   │
│   ├── scene/                    # Componentes de escena
│   │   ├── LightingSelect.tsx    # Selector de iluminación
│   │   ├── MoodSelect.tsx        # Selector de mood
│   │   ├── DurationInput.tsx     # Input de duración
│   │   ├── AudioMultiToggle.tsx  # Toggle de audio múltiple
│   │   ├── PromptEditor.tsx      # Editor de prompts
│   │   ├── SceneSelect.tsx       # Selector de escenas
│   │   └── index.ts             # Barrel exports
│   │
│   ├── shared/                   # Componentes compartidos
│   │   ├── CommandMenu.tsx       # Cmd+K command palette
│   │   ├── FavoriteButton.tsx    # Botón de favorito (estrella)
│   │   ├── FeedbackDialog.tsx    # Modal de feedback (problema/idea)
│   │   ├── KiyokoLogo.tsx        # Logo de Kiyoko
│   │   └── PresenceIndicator.tsx # Indicador de presencia (quién está online)
│   │
│   ├── storyboard/               # Storyboard
│   │   ├── ChatStoryboard.tsx    # Vista storyboard con chat
│   │   └── HistoryPanel.tsx      # Panel de historial de cambios
│   │
│   ├── tasks/
│   │   └── TaskCreateModal.tsx   # Modal de crear tarea
│   │
│   ├── videos/
│   │   └── VideoCreateModal.tsx  # Modal de crear vídeo
│   │
│   └── ui/                       # Primitivos UI (shadcn/ui + custom)
│       ├── alert-dialog.tsx      # Dialog de confirmación
│       ├── avatar.tsx
│       ├── avatar-upload.tsx     # Upload de avatar con crop
│       ├── badge.tsx
│       ├── button.tsx
│       ├── Card.tsx
│       ├── checkbox.tsx
│       ├── ColorPicker.tsx       # Selector de color
│       ├── command.tsx           # Command palette base
│       ├── CopyButton.tsx        # Botón copiar al portapapeles
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── EmptyState.tsx        # Estado vacío con ilustración
│       ├── ImageCropOverlay.tsx  # Overlay de recorte de imagen
│       ├── ImagePreview.tsx      # Preview de imagen con zoom
│       ├── ImageUpload.tsx       # Componente de subida de imagen
│       ├── input.tsx
│       ├── input-group.tsx       # Input con icono/addon
│       ├── kiyoko-button.tsx     # Botón estilizado Kiyoko
│       ├── kiyoko-select.tsx     # Select estilizado Kiyoko
│       ├── label.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── PromptBlock.tsx       # Bloque de visualización de prompt
│       ├── resizable.tsx         # Panel resizable
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx             # Panel lateral deslizante
│       ├── sidebar.tsx           # Sidebar primitivo (shadcn/ui)
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── StatusBadge.tsx       # Badge de estado con colores
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── hooks/                        # Custom hooks
│   ├── useAdmin.ts              # Verificar si user es admin
│   ├── useAiChat.ts             # Lógica del chat IA (enviar mensajes, streaming)
│   ├── useAiGenerate.ts         # Generar contenido con IA (escenas, prompts)
│   ├── useAiProvider.ts         # Seleccionar proveedor IA activo
│   ├── useAiUsage.ts            # Consumo de IA del usuario
│   ├── useApiKeys.ts            # CRUD de API keys del usuario
│   ├── useAuth.ts               # Autenticación (login, register, session)
│   ├── useBackgrounds.ts        # CRUD de fondos del proyecto
│   ├── useCharacters.ts         # CRUD de personajes del proyecto
│   ├── useDebounce.ts           # Debounce genérico
│   ├── useExport.ts             # Exportar proyecto (HTML, JSON, MD, PDF)
│   ├── useFavorites.ts          # Toggle favorito en proyecto
│   ├── useImageUpload.ts        # Subir imagen a Supabase Storage
│   ├── useIssues.ts             # CRUD de issues/diagnóstico del proyecto
│   ├── useKiyokoChat.ts         # Estado del chat Kiyoko (panel/expanded, imágenes)
│   ├── useMobile.ts             # Detectar si es móvil
│   ├── useOrganizations.ts      # CRUD de organizaciones
│   ├── usePresence.ts           # Presencia en tiempo real (quién está viendo)
│   ├── useProject.ts            # Cargar proyecto con escenas, personajes, fondos
│   ├── useRealtimeProject.ts    # Suscripción realtime a cambios del proyecto
│   ├── useScenes.ts             # CRUD de escenas (crear, editar, reordenar, borrar)
│   └── useTimeline.ts           # CRUD de entradas de timeline
│
├── stores/                       # Zustand stores (estado global)
│   ├── useProjectStore.ts       # Proyecto actual + escenas + personajes + fondos
│   ├── useActiveVideoStore.ts   # Vídeo activo seleccionado en el header
│   ├── useAiChatStore.ts        # Mensajes del chat IA + streaming
│   ├── useAiProviderStore.ts    # Proveedor IA preferido + estado
│   ├── useFilterStore.ts        # Filtros del dashboard (estado, búsqueda, orden)
│   ├── useNarrationStore.ts     # Config de narración + voces + generación TTS
│   ├── useOrgStore.ts           # Organización actual seleccionada
│   └── useUIStore.ts            # UI: sidebar, tema, vista de escenas (persistido)
│
├── types/                        # TypeScript types e interfaces
│   ├── index.ts                 # Barrel: re-exporta todos los tipos
│   ├── database.types.ts        # ✅ Tipos auto-generados de Supabase (v4, 3428 líneas)
│   ├── project.ts               # ⚠️ Project, ProjectStyle, etc. (esquema v3, DESACTUALIZADO)
│   ├── scene.ts                 # ⚠️ Scene con campos v3 (prompt_image, camera_angle en scene)
│   ├── character.ts             # ⚠️ Character sin ai_prompt_description, ai_visual_analysis, rules
│   ├── background.ts            # ⚠️ Background sin ai_prompt_description, ai_visual_analysis
│   ├── timeline.ts              # ⚠️ NarrativeArc con scene_ids/scene_numbers (v3, eliminados en v4)
│   ├── ai.ts                    # AiProvider, AiUsageLog, UserApiKey
│   ├── ai-actions.ts            # AiAction, AiActionPlan (para action executor)
│   ├── export.ts                # ⚠️ Export, ProjectIssue (tabla eliminada en v4), AiConversation (v3)
│   └── organization.ts          # ⚠️ Organization sin org_type enum, OrgRole incompleto
│
└── lib/                          # Lógica de negocio y utilidades
    ├── utils.ts                 # Re-export de cn()
    │
    ├── supabase/                 # Clientes Supabase
    │   ├── client.ts            # ⚠️ createBrowserClient SIN tipos Database
    │   ├── server.ts            # createServerClient para Server Components
    │   ├── admin.ts             # createClient con service_role key
    │   └── middleware.ts        # Middleware de auth para Next.js
    │
    ├── ai/                       # Sistema de IA
    │   ├── router.ts            # AI Router: selección de proveedor + fallback
    │   ├── sdk-router.ts        # Router con Vercel AI SDK
    │   ├── tools.ts             # Tool definitions para el chat IA
    │   ├── action-executor.ts   # Ejecutor de acciones de la IA (actualizar escenas, etc.)
    │   ├── providers/
    │   │   ├── base.ts          # Interfaz base de proveedor
    │   │   ├── openai.ts        # Proveedor OpenAI
    │   │   ├── claude.ts        # Proveedor Claude/Anthropic
    │   │   ├── gemini.ts        # Proveedor Google Gemini
    │   │   ├── groq.ts          # Proveedor Groq
    │   │   ├── stability.ts     # Proveedor Stability AI (imágenes)
    │   │   └── index.ts         # Barrel exports
    │   ├── prompts/              # System prompts para cada tarea
    │   │   ├── system-analyzer.ts           # Analizar proyecto
    │   │   ├── system-character-generator.ts # Generar personajes
    │   │   ├── system-chat-assistant.ts     # Chat general
    │   │   ├── system-chat-director.ts      # Chat como director de vídeo
    │   │   ├── system-narration-generator.ts # Generar narración
    │   │   ├── system-project-generator.ts  # Generar proyecto completo
    │   │   ├── system-scene-generator.ts    # Generar escenas
    │   │   ├── system-scene-improver.ts     # Mejorar escenas existentes
    │   │   ├── system-storyboard-director.ts # Dirigir storyboard
    │   │   └── system-timeline-generator.ts # Generar timeline
    │   └── schemas/              # Schemas de output para IA estructurada
    │       ├── analysis-output.ts
    │       ├── character-output.ts
    │       ├── project-output.ts
    │       ├── scene-output.ts
    │       └── timeline-output.ts
    │
    ├── export/                   # Generadores de exportación
    │   ├── generate-html.ts
    │   ├── generate-json.ts
    │   ├── generate-markdown.ts
    │   └── generate-pdf.ts
    │
    ├── tts/                      # Text-to-speech
    │   ├── elevenlabs.ts        # Cliente ElevenLabs
    │   └── web-speech.ts        # Fallback con Web Speech API
    │
    ├── narration/                # Narración
    │   ├── styles.ts            # Estilos de narración (pixar, dramatic, etc.)
    │   └── utils.ts             # Utilidades de narración
    │
    ├── constants/                # Constantes
    │   ├── scene-options.ts     # Opciones de camera_angle, camera_movement, etc.
    │   └── narration-styles.ts  # Estilos de narración disponibles
    │
    └── utils/                    # Utilidades generales
        ├── cn.ts                # clsx + twMerge
        ├── constants.ts         # Constantes globales de la app
        ├── crypto.ts            # Encriptar/desencriptar API keys
        ├── format-time.ts       # Formatear segundos a mm:ss
        ├── slugify.ts           # Generar slug desde texto
        └── text-duration.ts     # Estimar duración de texto hablado
```

---

## 2. Rutas de Páginas Actuales vs v4

### Rutas que se MANTIENEN (sin cambios)

| Ruta actual | Descripción |
|-------------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Registro |
| `/forgot-password` | Recuperar contraseña |
| `/pending` | Cuenta pendiente |
| `/blocked` | Cuenta bloqueada |
| `/terms` | Términos de servicio |
| `/privacy` | Privacidad |
| `/docs` | Documentación |
| `/dashboard` | Panel principal |
| `/new` | Crear proyecto |
| `/settings` | Ajustes de usuario |
| `/settings/api-keys` | API keys |
| `/organizations` | Organizaciones |
| `/organizations/new` | Nueva organización |
| `/admin` | Admin dashboard |
| `/admin/users` | Gestión de usuarios |

### Rutas que CAMBIAN (slug → shortId)

| Ruta actual (v3) | Ruta v4 | Estado |
|-------------------|---------|--------|
| `/project/[slug]` | `/project/[shortId]` | Cambiar param |
| `/project/[slug]/videos` | `/project/[shortId]/videos` | Cambiar param |
| `/project/[slug]/tasks` | `/project/[shortId]/tasks` | Cambiar param |
| `/project/[slug]/chat` | `/project/[shortId]/chat` | Cambiar param |
| `/project/[slug]/settings` | `/project/[shortId]/settings` | Cambiar param |
| `/project/[slug]/resources` | `/project/[shortId]/resources` | Cambiar param + expandir sub-rutas |

### Rutas que se ELIMINAN

| Ruta actual | Motivo | Reemplazada por |
|-------------|--------|----------------|
| `/project/[slug]/storyboard` | Storyboard es por vídeo | Vista general del vídeo |
| `/project/[slug]/scenes` | Escenas pertenecen a un vídeo | `/project/.../video/.../scenes` |
| `/project/[slug]/scenes/[sceneId]` | Escena dentro de vídeo | `/project/.../video/.../scene/[sceneShortId]` |
| `/project/[slug]/characters` | Ahora bajo resources | `/project/.../resources/characters` |
| `/project/[slug]/backgrounds` | Ahora bajo resources | `/project/.../resources/backgrounds` |
| `/project/[slug]/narration` | Narración es por vídeo | `/project/.../video/.../narration` |
| `/project/[slug]/analysis` | Análisis es por vídeo | `/project/.../video/.../analysis` |
| `/project/[slug]/timeline` | Timeline es por vídeo | `/project/.../video/.../timeline` |
| `/project/[slug]/arc` | Integrado en timeline del vídeo | `/project/.../video/.../timeline` |
| `/project/[slug]/exports` | Exports es por vídeo | `/project/.../video/.../export` |
| `/project/[slug]/references` | Redundante con resources | `/project/.../resources` |

### Rutas NUEVAS en v4 (no existen aún)

| Ruta v4 | Descripción | Prioridad |
|---------|-------------|-----------|
| `/dashboard/shared` | Proyectos compartidos conmigo | Media |
| `/dashboard/publications` | Calendario publicaciones global | Media |
| `/settings/subscription` | Plan y pagos | Baja |
| `/settings/notifications` | Config notificaciones | Baja |
| `/organizations/[id]` | Detalle de organización | Baja |
| `/share/[token]` | Vista pública escenas compartidas | Media |
| `/project/[shortId]/resources/characters` | Listado de personajes | Alta |
| `/project/[shortId]/resources/characters/[id]` | Detalle de personaje | Alta |
| `/project/[shortId]/resources/backgrounds` | Listado de fondos | Alta |
| `/project/[shortId]/resources/backgrounds/[id]` | Detalle de fondo | Alta |
| `/project/[shortId]/resources/styles` | Presets de estilo | Media |
| `/project/[shortId]/resources/templates` | Templates de prompts | Baja |
| `/project/[shortId]/publications` | Publicaciones del proyecto | Media |
| `/project/[shortId]/publications/profiles` | Perfiles de redes sociales | Media |
| `/project/[shortId]/publications/new` | Crear publicación | Media |
| `/project/[shortId]/publications/[pubShortId]` | Detalle publicación | Media |
| `/project/[shortId]/tasks/time` | Registro de tiempo | Baja |
| `/project/[shortId]/settings/ai` | Config de IA y agente | Alta |
| `/project/[shortId]/settings/sharing` | Colaboradores | Media |
| `/project/[shortId]/activity` | Log de actividad | Baja |
| `/project/[shortId]/video/[videoShortId]/scenes` | Board de escenas del vídeo | Alta |
| `/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]` | Detalle de escena | Alta |
| `/project/[shortId]/video/[videoShortId]/timeline` | Timeline del vídeo | Alta |
| `/project/[shortId]/video/[videoShortId]/analysis` | Análisis IA del vídeo | Media |
| `/project/[shortId]/video/[videoShortId]/derive` | Crear vídeo derivado | Baja |
| `/project/[shortId]/video/[videoShortId]/share` | Compartir escenas | Media |

---

## 3. Types — Estado Actual vs v4

### Tipos que NECESITAN actualización

| Archivo | Problema | Qué cambiar |
|---------|----------|-------------|
| `project.ts` | Usa campos v3 (`target_duration_seconds`, `target_platform`, `image_generator`, etc.) | Eliminar campos movidos a `project_ai_settings`. Añadir `short_id`, `global_prompt_rules`, `organization_id` |
| `scene.ts` | Scene tiene `project_id` pero NO `video_id`. Camera/prompts/media incrustados en Scene | Añadir `video_id`, `short_id`. Eliminar `prompt_image`, `prompt_video`, `camera_angle`, `camera_movement`, `generated_image_url`, etc. Crear tipos separados para `SceneCamera`, `SceneMedia`, `SceneVideoClip`, `ScenePrompt` |
| `character.ts` | Falta `ai_prompt_description`, `ai_visual_analysis`, `rules` | Añadir campos v4 |
| `background.ts` | Falta `ai_prompt_description`, `ai_visual_analysis` | Añadir campos v4 |
| `timeline.ts` | `NarrativeArc` tiene `scene_ids`/`scene_numbers` (eliminados). Falta `video_id` | Actualizar a v4: añadir `video_id`, eliminar arrays |
| `export.ts` | Contiene `ProjectIssue` (tabla eliminada), `AiConversation` sin `video_id`/`user_id` | Eliminar `ProjectIssue`, `ReferenceMap`. Actualizar `AiConversation` |
| `organization.ts` | `OrgType` solo tiene `personal`/`team` (v4 añade `agency`). Falta `billing_email` | Actualizar enum y campos |
| `index.ts` | Re-exporta tipos v3 | Actualizar re-exports |

### Tipos NUEVOS necesarios (no existen)

| Tipo | Para tabla | Contenido |
|------|-----------|-----------|
| `Video` | `videos` | `id`, `short_id`, `project_id`, `title`, `slug`, `video_type`, `platform`, `status`, etc. |
| `VideoNarration` | `video_narrations` | `id`, `video_id`, `version`, `narration_text`, `voice_id`, etc. |
| `VideoAnalysis` | `video_analysis` | `id`, `video_id`, `strengths`, `weaknesses`, `suggestions`, `overall_score` |
| `SceneCamera` | `scene_camera` | `id`, `scene_id`, `camera_angle`, `camera_movement`, `lighting`, `mood` |
| `SceneMedia` | `scene_media` | `id`, `scene_id`, `media_type`, `file_url`, `prompt_used`, `generator` |
| `SceneVideoClip` | `scene_video_clips` | `id`, `scene_id`, `clip_type`, `extension_number`, `prompt_video`, etc. |
| `ScenePrompt` | `scene_prompts` | `id`, `scene_id`, `prompt_type`, `prompt_text`, `version` |
| `CharacterImage` | `character_images` | `id`, `character_id`, `image_type`, `file_url`, `is_primary` |
| `StylePreset` | `style_presets` | `id`, `project_id`, `name`, `prompt_prefix`, `prompt_suffix`, `negative_prompt` |
| `PromptTemplate` | `prompt_templates` | `id`, `project_id`, `name`, `template_text`, `variables` |
| `ProjectAiSettings` | `project_ai_settings` | `id`, `project_id`, `image_provider`, `video_provider`, etc. |
| `ProjectAiAgent` | `project_ai_agents` | `id`, `project_id`, `name`, `system_prompt`, `tone`, `creativity_level` |
| `EntitySnapshot` | `entity_snapshots` | `id`, `entity_type`, `entity_id`, `snapshot_data`, `action_type` |
| `SocialProfile` | `social_profiles` | `id`, `project_id`, `platform`, `account_name` |
| `Publication` | `publications` | `id`, `project_id`, `short_id`, `title`, `publication_type`, `status` |
| `PublicationItem` | `publication_items` | `id`, `publication_id`, `item_type`, `prompt_text` |
| `SceneShare` | `scene_shares` | `id`, `video_id`, `token`, `scene_ids` |
| `SceneAnnotation` | `scene_annotations` | `id`, `scene_share_id`, `scene_id`, `content` |
| `TimeEntry` | `time_entries` | `id`, `project_id`, `user_id`, `started_at`, `duration_minutes` |
| `Task` | `tasks` | Ya existe parcialmente en el modal, pero sin tipo formal |
| `Notification` | `notifications` | `id`, `user_id`, `type`, `title`, `body`, `read` |
| `VideoDerivation` | `video_derivations` | `id`, `source_video_id`, `derived_video_id` |

---

## 4. Supabase Client — Estado Actual

| Archivo | Uso | Problema |
|---------|-----|---------|
| `client.ts` | `createBrowserClient()` sin tipos | ⚠️ No usa `Database` de `database.types.ts`. No hay autocompletado de tablas/columnas |
| `server.ts` | `createServerClient()` para RSC | ⚠️ Mismo problema: sin tipos |
| `admin.ts` | `createClient()` con `service_role` | ⚠️ Sin tipos |
| `middleware.ts` | Auth middleware para Next.js | OK |

**Acción:** Tipar los 3 clientes con `Database` de `database.types.ts`:
```typescript
import { Database } from '@/types/database.types';
createBrowserClient<Database>(url, key);
```

---

## 5. Stores — Estado Actual vs v4

| Store | Estado | Problema en v4 |
|-------|--------|----------------|
| `useProjectStore` | Guarda `Project`, `Scene[]`, `Character[]`, `Background[]` | ⚠️ `Scene` usa schema v3. Falta `Video[]`, `StylePreset[]`. Las scenes ahora van por vídeo, no por proyecto |
| `useActiveVideoStore` | Guarda vídeo seleccionado | OK pero necesita más campos (`short_id`, `status`) |
| `useAiChatStore` | Mensajes + streaming | OK, funcional |
| `useAiProviderStore` | Proveedor IA preferido | OK |
| `useFilterStore` | Filtros del dashboard | OK |
| `useNarrationStore` | Config narración + generación TTS | ⚠️ Queries directas a `scenes` con campos v3 (`narration_text`, `narration_status` etc. que ya no existen en scenes). En v4 la narración está en `video_narrations` |
| `useOrgStore` | Organización actual | OK |
| `useUIStore` | Sidebar, tema, vista | OK |

---

## 6. Hooks — Estado Actual vs v4

| Hook | Qué hace | Problema en v4 |
|------|----------|----------------|
| `useProject` | Carga proyecto + scenes + characters + backgrounds por slug | ⚠️ Busca por `slug`, v4 usa `short_id`. Scenes cargadas directamente del proyecto, v4 las carga por vídeo |
| `useScenes` | CRUD de escenas | ⚠️ Escenas sin `video_id`. Campos v3 (prompt_image, camera_angle en scene) |
| `useCharacters` | CRUD personajes | ⚠️ Falta soporte para `character_images` |
| `useBackgrounds` | CRUD fondos | ⚠️ Falta `ai_prompt_description`, `ai_visual_analysis` |
| `useTimeline` | CRUD timeline entries | ⚠️ Falta `video_id` en queries |
| `useIssues` | CRUD project_issues | ⚠️ Tabla `project_issues` eliminada en v4. El análisis está en `video_analysis` |
| `useExport` | Exportar proyecto | ⚠️ Falta `video_id`. V4 exporta por vídeo, no por proyecto |
| `useRealtimeProject` | Suscripción realtime | ⚠️ Suscrito a tablas v3, necesita añadir `videos`, `scene_camera`, etc. |
| `useAiChat` | Chat IA streaming | Funcional, pero necesita pasar `video_id` como contexto |
| `useAuth` | Login/register/session | OK |
| `useAdmin` | Verificar admin role | OK |
| `useApiKeys` | CRUD API keys | OK |
| `useAiUsage` | Consumo IA | OK |
| `useAiProvider` | Proveedor activo | OK |
| `useAiGenerate` | Generar contenido | ⚠️ Genera escenas sin `video_id` |
| `useFavorites` | Toggle favorito | OK |
| `useOrganizations` | CRUD orgs | OK |
| `usePresence` | Presencia realtime | OK |
| `useImageUpload` | Upload a storage | ⚠️ Usa bucket `project-assets`, v4 usa `kiyoko-storage` |
| `useDebounce` | Debounce genérico | OK |
| `useMobile` | Detectar móvil | OK |
| `useKiyokoChat` | Estado panel chat | OK |

---

## 7. API Routes — Estado Actual

| Ruta API | Método | Qué hace | Estado v4 |
|----------|--------|----------|-----------|
| `/api/ai/chat` | POST | Chat streaming con IA | ⚠️ Necesita `video_id` como contexto |
| `/api/ai/generate-image` | POST | Generar imagen con prompt | OK |
| `/api/ai/generate-scenes` | POST | Generar escenas para un proyecto | ⚠️ Necesita `video_id` |
| `/api/ai/improve-prompt` | POST | Mejorar prompt existente | OK |
| `/api/ai/analyze-project` | POST | Analizar proyecto completo | ⚠️ Renombrar a analyze-video, guardar en `video_analysis` |
| `/api/ai/generate-project` | POST | Generar proyecto desde brief | OK |
| `/api/ai/generate-characters` | POST | Generar personajes | OK |
| `/api/ai/generate-arc` | POST | Generar arco narrativo | ⚠️ Necesita `video_id` |
| `/api/ai/generate-timeline` | POST | Generar timeline | ⚠️ Necesita `video_id` |
| `/api/ai/generate-narration` | POST | Generar texto narración | ⚠️ Guardar en `video_narrations` en vez de en scenes |
| `/api/ai/generate-voice` | POST | TTS con ElevenLabs | OK |
| `/api/ai/voices` | GET | Listar voces ElevenLabs | OK |
| `/api/ai/providers/status` | GET | Estado de proveedores IA | OK |
| `/api/export/*` | POST | Exportar en varios formatos | ⚠️ Necesita `video_id` |
| `/api/admin/users` | GET/PATCH | Gestión de usuarios | OK |
| `/api/user/api-keys/*` | CRUD | API keys del usuario | OK |
| `/api/user/usage` | GET | Consumo mensual | OK |

---

## 8. Resumen de Impacto de la Migración v4

### Prioridad ALTA (bloqueantes)
1. **Tipar clientes Supabase** con `Database` de `database.types.ts`
2. **Actualizar tipos** en `src/types/` para reflejar schema v4 (especialmente `Scene`, `Project`, crear `Video`)
3. **Cambiar rutas** de `[slug]` a `[shortId]`
4. **Actualizar `useProject`** para buscar por `short_id` y cargar vídeos
5. **Actualizar `useScenes`** para trabajar con `video_id` y las nuevas sub-tablas

### Prioridad MEDIA
6. Crear hooks nuevos: `useVideos`, `useVideoAnalysis`, `usePublications`, `useSocialProfiles`
7. Actualizar `useNarrationStore` para usar `video_narrations`
8. Crear páginas nuevas: resources/characters, resources/backgrounds, video/scenes, video/scene/[id]
9. Actualizar componentes de escena para usar `scene_camera`, `scene_video_clips`
10. Cambiar bucket de storage de `project-assets` a `kiyoko-storage`

### Prioridad BAJA
11. Crear páginas de publicaciones, time tracking, compartir
12. Crear componentes de publicaciones
13. Actualizar APIs de exportación y análisis
