# Kiyoko AI — Documento Definitivo de Arquitectura v4

> Este documento define TODA la app: rutas, componentes, hooks, stores, layouts, tema, tiempo real, IA y PWA.
> Cualquier desarrollador debe poder construir la app completa leyendo solo este documento + los MDs de base de datos.

---

## 1. Diseño Visual y Tema

### Colores del logo Kiyoko

Basados en el logo: K con gradiente teal→verde + acento coral/naranja.

```typescript
// src/lib/theme/colors.ts

export const kiyokoColors = {
  // Brand — del logo
  brand: {
    teal:    '#0EA5A0',  // Teal principal
    green:   '#34D399',  // Verde gradiente
    coral:   '#F97316',  // Acento naranja/coral
    gradient: 'linear-gradient(135deg, #0EA5A0, #34D399)',  // Gradiente del logo
  },

  // Modo oscuro (principal — la app es dark-first)
  dark: {
    bg:         '#0A0A0B',   // Fondo principal
    bgCard:     '#111113',   // Fondo de tarjetas y paneles
    bgHover:    '#1A1A1D',   // Hover sobre tarjetas
    bgSidebar:  '#0E0E10',   // Fondo del sidebar
    bgInput:    '#151517',   // Fondo de inputs
    border:     '#1E1E22',   // Bordes sutiles
    borderHover:'#2A2A30',   // Bordes en hover
    text:       '#FAFAFA',   // Texto principal
    textMuted:  '#71717A',   // Texto secundario (zinc-500)
    textDim:    '#3F3F46',   // Texto muy tenue (zinc-700)
  },

  // Modo claro
  light: {
    bg:         '#FFFFFF',
    bgCard:     '#F9FAFB',
    bgHover:    '#F3F4F6',
    bgSidebar:  '#F9FAFB',
    bgInput:    '#FFFFFF',
    border:     '#E5E7EB',
    borderHover:'#D1D5DB',
    text:       '#111827',
    textMuted:  '#6B7280',
    textDim:    '#D1D5DB',
  },

  // Semánticos (iguales en ambos modos)
  status: {
    success:  '#22C55E',
    warning:  '#EAB308',
    error:    '#EF4444',
    info:     '#3B82F6',
  },

  // Escenas / estados de producción
  scene: {
    draft:      '#71717A',  // zinc
    prompt_ready:'#3B82F6', // blue
    generating: '#EAB308',  // yellow (animado)
    generated:  '#8B5CF6',  // purple
    approved:   '#22C55E',  // green
    rejected:   '#EF4444',  // red
  },

  // Arcos narrativos
  arc: {
    hook:  '#EF4444',  // red — gancho
    build: '#EAB308',  // yellow — construcción
    peak:  '#22C55E',  // green — clímax
    close: '#3B82F6',  // blue — cierre
  },
};
```

### Tailwind config

```typescript
// tailwind.config.ts — extender colores
colors: {
  kiyoko: {
    teal: '#0EA5A0',
    green: '#34D399',
    coral: '#F97316',
  },
  surface: {
    DEFAULT: 'var(--surface)',
    card: 'var(--surface-card)',
    hover: 'var(--surface-hover)',
    sidebar: 'var(--surface-sidebar)',
    input: 'var(--surface-input)',
  },
}
```

### CSS Variables (root)

```css
/* src/app/globals.css */
:root {
  --surface: #FFFFFF;
  --surface-card: #F9FAFB;
  --surface-hover: #F3F4F6;
  --surface-sidebar: #F9FAFB;
  --surface-input: #FFFFFF;
  --border: #E5E7EB;
  --text: #111827;
  --text-muted: #6B7280;
  --kiyoko-gradient: linear-gradient(135deg, #0EA5A0, #34D399);
}

.dark {
  --surface: #0A0A0B;
  --surface-card: #111113;
  --surface-hover: #1A1A1D;
  --surface-sidebar: #0E0E10;
  --surface-input: #151517;
  --border: #1E1E22;
  --text: #FAFAFA;
  --text-muted: #71717A;
}
```

### Tipografía

```
Font principal: Inter (Variable) — ya incluida en Next.js
Font mono:      JetBrains Mono — para prompts y código
Tamaños:        text-xs (11px), text-sm (13px), text-base (14px), text-lg (16px)
Peso:           400 normal, 500 medium, 600 semibold
```

---

## 2. Estructura de Carpetas Completa v4

```
src/
├── app/                              # Next.js App Router (solo rutas, sin lógica)
│   ├── layout.tsx                    # Root: fonts, ThemeProvider, Toaster
│   ├── page.tsx                      # Landing → redirect a /dashboard si auth
│   ├── manifest.ts                   # PWA manifest
│   ├── sw.ts                         # Service Worker (PWA)
│   │
│   ├── (auth)/                       # Rutas sin sidebar
│   │   ├── layout.tsx                # Centrado, logo Kiyoko, sin nav
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── pending/page.tsx
│   │   └── blocked/page.tsx
│   │
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── terms/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── docs/page.tsx
│   │
│   ├── share/[token]/                # Vista pública de escenas compartidas
│   │   └── page.tsx
│   │
│   ├── (dashboard)/                  # Área autenticada con sidebar
│   │   ├── layout.tsx                # ← DashboardShell (Sidebar + Header + ChatPanel)
│   │   │
│   │   ├── dashboard/page.tsx
│   │   ├── dashboard/shared/page.tsx         # NUEVO
│   │   ├── dashboard/publications/page.tsx   # NUEVO
│   │   │
│   │   ├── new/page.tsx
│   │   │
│   │   ├── settings/page.tsx
│   │   ├── settings/api-keys/page.tsx
│   │   ├── settings/subscription/page.tsx    # NUEVO
│   │   ├── settings/notifications/page.tsx   # NUEVO
│   │   │
│   │   ├── organizations/page.tsx
│   │   ├── organizations/new/page.tsx
│   │   ├── organizations/[orgId]/page.tsx    # NUEVO
│   │   │
│   │   ├── admin/page.tsx
│   │   ├── admin/users/page.tsx
│   │   │
│   │   └── project/[shortId]/               # ← shortId en vez de slug
│   │       ├── layout.tsx                    # ← ProjectShell (ProjectProvider + RealtimeSync)
│   │       ├── page.tsx                      # Vista general del proyecto
│   │       │
│   │       ├── videos/page.tsx               # Lista de vídeos
│   │       │
│   │       ├── video/[videoShortId]/         # ← Dentro de un vídeo
│   │       │   ├── layout.tsx                # ← VideoShell (VideoProvider)
│   │       │   ├── page.tsx                  # Vista general del vídeo (=storyboard)
│   │       │   ├── scenes/page.tsx           # Board de escenas
│   │       │   ├── scene/[sceneShortId]/page.tsx  # Detalle de escena
│   │       │   ├── timeline/page.tsx
│   │       │   ├── narration/page.tsx
│   │       │   ├── analysis/page.tsx         # NUEVO
│   │       │   ├── derive/page.tsx           # NUEVO
│   │       │   ├── share/page.tsx            # NUEVO
│   │       │   └── export/page.tsx
│   │       │
│   │       ├── resources/
│   │       │   ├── page.tsx                  # Vista combinada
│   │       │   ├── characters/page.tsx
│   │       │   ├── characters/[charId]/page.tsx
│   │       │   ├── backgrounds/page.tsx
│   │       │   ├── backgrounds/[bgId]/page.tsx
│   │       │   ├── styles/page.tsx           # NUEVO
│   │       │   └── templates/page.tsx        # NUEVO
│   │       │
│   │       ├── publications/                 # NUEVO — todo
│   │       │   ├── page.tsx
│   │       │   ├── profiles/page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [pubShortId]/page.tsx
│   │       │
│   │       ├── tasks/
│   │       │   ├── page.tsx
│   │       │   └── time/page.tsx             # NUEVO
│   │       │
│   │       ├── settings/
│   │       │   ├── page.tsx
│   │       │   ├── ai/page.tsx               # NUEVO
│   │       │   └── sharing/page.tsx          # NUEVO
│   │       │
│   │       ├── activity/page.tsx             # NUEVO
│   │       └── chat/page.tsx
│   │
│   └── api/                          # Server-side API routes
│       ├── ai/
│       │   ├── chat/route.ts
│       │   ├── generate-image/route.ts
│       │   ├── generate-scenes/route.ts      # + video_id
│       │   ├── improve-prompt/route.ts
│       │   ├── analyze-video/route.ts        # RENOMBRADO (era analyze-project)
│       │   ├── generate-project/route.ts
│       │   ├── generate-characters/route.ts
│       │   ├── analyze-image/route.ts        # NUEVO — visión IA para personajes/fondos
│       │   ├── generate-arc/route.ts         # + video_id
│       │   ├── generate-timeline/route.ts    # + video_id
│       │   ├── generate-narration/route.ts   # → video_narrations
│       │   ├── generate-voice/route.ts
│       │   ├── generate-extensions/route.ts  # NUEVO — extensiones de clips
│       │   ├── derive-video/route.ts         # NUEVO — derivar vídeo
│       │   ├── voices/route.ts
│       │   └── providers/status/route.ts
│       ├── export/
│       │   ├── html/route.ts                 # + video_id
│       │   ├── json/route.ts
│       │   ├── markdown/route.ts
│       │   └── pdf/route.ts
│       ├── admin/users/
│       │   ├── route.ts
│       │   └── [userId]/route.ts
│       ├── user/
│       │   ├── api-keys/route.ts
│       │   ├── api-keys/[id]/route.ts
│       │   ├── api-keys/test/route.ts
│       │   └── usage/route.ts
│       └── share/[token]/route.ts            # NUEVO — validar token + contraseña
│
├── components/
│   ├── auth/                         # SIN CAMBIOS
│   ├── chat/                         # Mejorar: + rollback, + video context
│   │   ├── KiyokoChat.tsx            # Panel/Expanded con rollback
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatHistorySidebar.tsx
│   │   ├── ActionPlanCard.tsx
│   │   └── RollbackButton.tsx        # NUEVO
│   ├── landing/                      # SIN CAMBIOS
│   ├── layout/
│   │   ├── DashboardShell.tsx        # NUEVO — wrapper: Sidebar + Header + ChatPanel + Content
│   │   ├── ProjectShell.tsx          # NUEVO — wrapper: ProjectProvider + ProjectSidebar
│   │   ├── VideoShell.tsx            # NUEVO — wrapper: VideoProvider + VideoSidebar
│   │   ├── Header.tsx                # + OrgSwitcher + ProjectSwitcher + VideoSwitcher
│   │   ├── Sidebar.tsx               # Provider de shadcn sidebar
│   │   ├── DashboardSidebar.tsx      # Nav del dashboard
│   │   ├── ProjectSidebar.tsx        # Nav dentro de proyecto (v4 actualizado)
│   │   ├── VideoSidebar.tsx          # NUEVO — nav dentro de vídeo
│   │   ├── ChatPanel.tsx             # Panel lateral derecho resizable
│   │   ├── Breadcrumbs.tsx
│   │   ├── OrgSwitcher.tsx           # Dropdown de organización en header
│   │   ├── ProjectSwitcher.tsx       # NUEVO — dropdown de proyecto en header
│   │   ├── VideoSwitcher.tsx         # NUEVO — dropdown de vídeo en header
│   │   ├── NotificationBell.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── UserMenu.tsx
│   │   └── MobileNav.tsx
│   ├── project/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   └── ProjectOverview.tsx       # NUEVO — vista general del proyecto
│   ├── video/                        # RENOMBRADO (era videos/)
│   │   ├── VideoCard.tsx             # NUEVO
│   │   ├── VideoGrid.tsx             # NUEVO
│   │   ├── VideoCreateModal.tsx      # Mejorado: + tipo director IA
│   │   ├── VideoOverview.tsx         # NUEVO — storyboard visual del vídeo
│   │   └── VideoDeriveChat.tsx       # NUEVO — chat para derivar vídeo
│   ├── scene/
│   │   ├── SceneCard.tsx             # NUEVO — tarjeta en el board
│   │   ├── SceneBoard.tsx            # NUEVO — grid/lista de escenas
│   │   ├── SceneDetail.tsx           # NUEVO — vista completa de escena
│   │   ├── SceneClipPlayer.tsx       # NUEVO — player de clips + extensiones
│   │   ├── SceneAnnotationForm.tsx   # NUEVO — form de anotación del cliente
│   │   ├── PromptEditor.tsx          # EXISTENTE mejorado
│   │   ├── LightingSelect.tsx
│   │   ├── MoodSelect.tsx
│   │   ├── DurationInput.tsx
│   │   └── CameraConfig.tsx          # NUEVO — config de scene_camera
│   ├── characters/
│   │   ├── CharacterCard.tsx         # NUEVO
│   │   ├── CharacterDetail.tsx       # NUEVO — con galería de ángulos
│   │   ├── CharacterImageGallery.tsx # NUEVO — character_images
│   │   └── AiAnalysisBadge.tsx       # NUEVO — muestra ai_prompt_description
│   ├── backgrounds/
│   │   ├── BackgroundCard.tsx        # NUEVO
│   │   └── BackgroundDetail.tsx      # NUEVO
│   ├── analysis/
│   │   ├── VideoAnalysisView.tsx     # NUEVO — fortalezas/debilidades/sugerencias
│   │   ├── ScoreGauge.tsx            # NUEVO — puntuación circular
│   │   └── SuggestionCard.tsx        # NUEVO — con botón "Aplicar"
│   ├── narration/
│   │   ├── NarrationEditor.tsx       # NUEVO — editor de texto narración
│   │   ├── VoiceSelector.tsx         # EXISTENTE
│   │   └── NarrationPlayer.tsx       # EXISTENTE
│   ├── publications/                 # NUEVO — todo
│   │   ├── PublicationCard.tsx
│   │   ├── PublicationCalendar.tsx
│   │   ├── PublicationEditor.tsx
│   │   ├── SocialProfileCard.tsx
│   │   └── PublicationPreview.tsx
│   ├── tasks/
│   │   ├── TaskCreateModal.tsx       # EXISTENTE mejorado
│   │   ├── TaskBoard.tsx             # NUEVO — kanban
│   │   ├── TaskCalendar.tsx          # NUEVO
│   │   └── TimeTracker.tsx           # NUEVO — timer start/stop
│   ├── timeline/
│   │   ├── TimelineView.tsx          # EXISTENTE mejorado
│   │   └── ArcBar.tsx                # NUEVO — barra visual de arco narrativo
│   ├── sharing/                      # NUEVO — todo
│   │   ├── ShareLinkCreator.tsx
│   │   ├── SharedScenesView.tsx      # Vista pública /share/[token]
│   │   └── AnnotationList.tsx
│   ├── ai-settings/                  # NUEVO — todo
│   │   ├── AgentConfigurator.tsx     # Desplegable tipo director + editor system prompt
│   │   ├── GeneratorSettings.tsx     # Config de proveedores externos
│   │   └── ToneSlider.tsx            # Slider creatividad + selector tono
│   ├── shared/
│   │   ├── CommandMenu.tsx
│   │   ├── FavoriteButton.tsx
│   │   ├── FeedbackDialog.tsx
│   │   ├── KiyokoLogo.tsx
│   │   ├── PresenceIndicator.tsx
│   │   ├── EmptyState.tsx            # MOVER desde ui/
│   │   └── LoadingScreen.tsx         # NUEVO — skeleton de carga
│   ├── storyboard/                   # ELIMINAR — integrado en video/VideoOverview
│   ├── arc/                          # ELIMINAR — integrado en timeline/
│   ├── references/                   # ELIMINAR — redundante con resources
│   ├── exports/                      # MOVER lógica a video/export
│   └── ui/                           # Primitivos UI (shadcn) — SIN CAMBIOS
│
├── contexts/
│   ├── ProjectContext.tsx            # EXISTENTE — mejorar: + short_id, + videos[]
│   └── VideoContext.tsx              # EXISTENTE — mejorar: + scenes[], + narrations[]
│
├── hooks/
│   ├── use-mobile.ts                # SIN CAMBIOS
│   ├── useAdmin.ts                  # SIN CAMBIOS
│   ├── useAuth.ts                   # SIN CAMBIOS
│   ├── useDebounce.ts               # SIN CAMBIOS
│   ├── useFavorites.ts              # SIN CAMBIOS
│   ├── useOrganizations.ts          # SIN CAMBIOS
│   ├── usePresence.ts               # SIN CAMBIOS
│   ├── useMobile.ts                 # SIN CAMBIOS (duplicado con use-mobile?)
│   ├── useApiKeys.ts                # SIN CAMBIOS
│   ├── useAiUsage.ts                # SIN CAMBIOS
│   ├── useAiProvider.ts             # SIN CAMBIOS
│   ├── useKiyokoChat.ts             # SIN CAMBIOS
│   │
│   ├── useProject.ts                # ACTUALIZAR: buscar por short_id, cargar videos[]
│   ├── useScenes.ts                 # ACTUALIZAR: + video_id, sin campos v3
│   ├── useCharacters.ts             # ACTUALIZAR: + character_images, + ai_visual_analysis
│   ├── useBackgrounds.ts            # ACTUALIZAR: + ai_visual_analysis
│   ├── useTimeline.ts               # ACTUALIZAR: + video_id
│   ├── useAiChat.ts                 # ACTUALIZAR: + video_id contexto, + rollback
│   ├── useAiGenerate.ts             # ACTUALIZAR: + video_id
│   ├── useExport.ts                 # ACTUALIZAR: + video_id
│   ├── useImageUpload.ts            # ACTUALIZAR: bucket → kiyoko-storage
│   ├── useIssues.ts                 # ELIMINAR → reemplazado por useVideoAnalysis
│   ├── useRealtimeProject.ts        # ACTUALIZAR: + suscripción a videos, scene_camera, etc.
│   │
│   ├── useVideos.ts                 # NUEVO — CRUD de vídeos del proyecto
│   ├── useVideoAnalysis.ts          # NUEVO — análisis IA del vídeo
│   ├── useVideoNarration.ts         # NUEVO — narración completa del vídeo
│   ├── useSceneCamera.ts            # NUEVO — CRUD scene_camera
│   ├── useSceneMedia.ts             # NUEVO — CRUD scene_media
│   ├── useSceneVideoClips.ts        # NUEVO — CRUD scene_video_clips + extensiones
│   ├── useScenePrompts.ts           # NUEVO — historial de prompts
│   ├── usePublications.ts           # NUEVO — CRUD publicaciones
│   ├── useSocialProfiles.ts         # NUEVO — CRUD perfiles de redes
│   ├── useTimeEntries.ts            # NUEVO — timer + registro de tiempo
│   ├── useEntitySnapshots.ts        # NUEVO — rollback de cambios IA
│   ├── useStylePresets.ts           # NUEVO — CRUD style_presets
│   ├── usePromptTemplates.ts        # NUEVO — CRUD prompt_templates
│   ├── useAiAgent.ts                # NUEVO — CRUD project_ai_agents
│   ├── useAiSettings.ts             # NUEVO — CRUD project_ai_settings
│   ├── useSceneShares.ts            # NUEVO — compartir escenas
│   └── useAnnotations.ts            # NUEVO — anotaciones externas
│
├── stores/                           # Zustand — estado global en memoria
│   ├── useProjectStore.ts           # ACTUALIZAR
│   ├── useActiveVideoStore.ts       # ACTUALIZAR
│   ├── useAiChatStore.ts            # SIN CAMBIOS
│   ├── useAiProviderStore.ts        # SIN CAMBIOS
│   ├── useFilterStore.ts            # SIN CAMBIOS
│   ├── useNarrationStore.ts         # ACTUALIZAR: usar video_narrations
│   ├── useOrgStore.ts               # SIN CAMBIOS
│   ├── useUIStore.ts                # ACTUALIZAR: + chatPanelWidth
│   ├── useVideoStore.ts             # NUEVO
│   ├── useScenesStore.ts            # NUEVO — escenas del vídeo activo
│   ├── useResourcesStore.ts         # NUEVO — personajes + fondos + estilos
│   └── useRealtimeStore.ts          # NUEVO — cola de updates en tiempo real
│
├── types/
│   ├── database.types.ts            # Auto-generado por Supabase
│   ├── index.ts                     # Barrel re-exports
│   ├── project.ts                   # ACTUALIZAR a v4
│   ├── video.ts                     # NUEVO
│   ├── scene.ts                     # ACTUALIZAR a v4 (sin campos movidos)
│   ├── scene-details.ts             # NUEVO — SceneCamera, SceneMedia, SceneVideoClip, ScenePrompt
│   ├── character.ts                 # ACTUALIZAR a v4
│   ├── background.ts                # ACTUALIZAR a v4
│   ├── resources.ts                 # NUEVO — StylePreset, PromptTemplate, CharacterImage
│   ├── publication.ts               # NUEVO — Publication, PublicationItem, SocialProfile
│   ├── analysis.ts                  # NUEVO — VideoAnalysis, Strength, Weakness, Suggestion
│   ├── narration.ts                 # NUEVO — VideoNarration
│   ├── sharing.ts                   # NUEVO — SceneShare, SceneAnnotation
│   ├── task.ts                      # NUEVO — Task, TimeEntry (tipos formales)
│   ├── timeline.ts                  # ACTUALIZAR — + video_id
│   ├── ai.ts                        # ACTUALIZAR — + ProjectAiAgent, ProjectAiSettings
│   ├── ai-actions.ts                # SIN CAMBIOS
│   ├── organization.ts              # ACTUALIZAR
│   └── export.ts                    # ACTUALIZAR — sin ProjectIssue
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # ACTUALIZAR: tipar con Database
│   │   ├── server.ts                # ACTUALIZAR: tipar con Database
│   │   ├── admin.ts                 # ACTUALIZAR: tipar con Database
│   │   └── middleware.ts            # SIN CAMBIOS
│   ├── ai/                          # ACTUALIZAR system prompts + añadir analyze-video
│   ├── theme/
│   │   └── colors.ts                # NUEVO — colores centralizados
│   ├── utils/
│   │   ├── nanoid.ts                # NUEVO — generar short_id
│   │   ├── cn.ts
│   │   ├── constants.ts
│   │   ├── crypto.ts
│   │   ├── format-time.ts
│   │   ├── slugify.ts
│   │   └── text-duration.ts
│   └── ...resto sin cambios
│
└── middleware.ts                     # Auth middleware Next.js
```

---

## 3. Sistema de Layouts

### Cómo se anidan los layouts

```
RootLayout (fonts, ThemeProvider, metadata)
│
├── (auth)/layout.tsx → Pantalla centrada, sin sidebar, logo arriba
│
├── (public)/layout.tsx → Header público simple
│
├── share/[token]/layout.tsx → Layout mínimo para compartir
│
└── (dashboard)/layout.tsx → DashboardShell
    │
    │   ┌──────────────────────────────────────────────────────────┐
    │   │ ┌─────────┐ ┌─────────────────────────┐ ┌────────────┐ │
    │   │ │         │ │  Header                  │ │            │ │
    │   │ │         │ │  [← ] [Org ▾] [Proj ▾]  │ │            │ │
    │   │ │ Sidebar │ │  [Video ▾] / breadcrumbs │ │  Kiyoko    │ │
    │   │ │         │ ├─────────────────────────┤ │  Chat      │ │
    │   │ │ (cambia │ │                          │ │  Panel     │ │
    │   │ │  según  │ │  {children}              │ │            │ │
    │   │ │  la     │ │  (contenido de la página)│ │ (resizable │ │
    │   │ │  ruta)  │ │                          │ │  300-600px │ │
    │   │ │         │ │                          │ │  o expand) │ │
    │   │ └─────────┘ └─────────────────────────┘ └────────────┘ │
    │   └──────────────────────────────────────────────────────────┘
    │
    ├── dashboard/ → DashboardSidebar (proyectos, ajustes, admin)
    │
    └── project/[shortId]/layout.tsx → ProjectShell
        │
        ├── (root pages) → ProjectSidebar (vídeos, recursos, tareas, etc.)
        │
        └── video/[videoShortId]/layout.tsx → VideoShell
            │
            └── (video pages) → VideoSidebar (overview, escenas, timeline, etc.)
```

### DashboardShell (layout principal)

```typescript
// src/components/layout/DashboardShell.tsx
// Envuelve TODO el área autenticada

export function DashboardShell({ children }) {
  const { chatPanelOpen, chatPanelWidth, chatExpanded } = useUIStore();

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        {/* Sidebar izquierdo (cambia según contexto) */}
        <ContextualSidebar />

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            {chatExpanded ? <KiyokoChat mode="expanded" /> : children}
          </main>
        </div>

        {/* Chat panel derecho (resizable) */}
        {chatPanelOpen && !chatExpanded && (
          <ResizablePanel
            defaultSize={chatPanelWidth}
            minSize={300}
            maxSize={600}
            onResize={(w) => useUIStore.setState({ chatPanelWidth: w })}
          >
            <KiyokoChat mode="panel" />
          </ResizablePanel>
        )}
      </div>
    </SidebarProvider>
  );
}
```

### Sidebar contextual

```typescript
// El sidebar cambia según dónde estés:

function ContextualSidebar() {
  const pathname = usePathname();

  // Dentro de un vídeo → VideoSidebar
  if (pathname.match(/\/project\/[^/]+\/video\/[^/]+/)) {
    return <VideoSidebar />;
  }

  // Dentro de un proyecto → ProjectSidebar
  if (pathname.match(/\/project\/[^/]+/)) {
    return <ProjectSidebar />;
  }

  // Dashboard general → DashboardSidebar
  return <DashboardSidebar />;
}
```

### VideoSidebar (lo que ves en tu screenshot actual)

```
┌─────────────────────┐
│ Kiyoko AI           │
│ Proyecto ▸          │ ← click → vuelve al proyecto
│                     │
│ Vídeo               │
│ ▶ Presentación Y... │ ← selector de vídeo (dropdown)
│                     │
│ ◻ Overview          │ /project/.../video/.../
│ ▦ Escenas           │ /project/.../video/.../scenes
│ ⏱ Timeline          │ /project/.../video/.../timeline
│ 🎙 Narración         │ /project/.../video/.../narration
│ 📊 Análisis          │ /project/.../video/.../analysis   NUEVO
│ 🔗 Compartir         │ /project/.../video/.../share      NUEVO
│ 📤 Exportar          │ /project/.../video/.../export
│                     │
│ ─── ─── ─── ───    │
│ 💬 Chat IA           │ (abre panel derecho o /chat)
│                     │
│ ┌───────────────┐   │
│ │ 👤 Dev Kiyoko │   │
│ │ dev@kiyoko.ai │   │
│ └───────────────┘   │
└─────────────────────┘
```

---

## 4. Header — Switchers de Organización, Proyecto y Vídeo

```
┌────────────────────────────────────────────────────────────────────┐
│ [←] [🏢 Organizacion ▾] / [📁 Proyecto ▾] / [🎬 principal ▾]      │
│                                          [Feedback] [🔍] [🏠] [⚙] [🔔] [💬] [DK] │
└────────────────────────────────────────────────────────────────────┘
```

### Comportamiento de los switchers

**Al cambiar Organización:**
1. `useOrgStore.setState({ currentOrg: newOrg })`
2. Se recargan los proyectos de esa organización
3. Se resetea el proyecto y vídeo activos
4. Se navega a `/dashboard`
5. El `ProjectContext` se desmonta y remonta

**Al cambiar Proyecto:**
1. `useProjectStore.setState({ project: newProject, videos: [], scenes: [] })`
2. Se navega a `/project/[newShortId]`
3. El `ProjectContext` carga el nuevo proyecto + sus vídeos + recursos
4. Se resetea el vídeo activo

**Al cambiar Vídeo:**
1. `useActiveVideoStore.setState({ video: newVideo })`
2. Se navega a `/project/[shortId]/video/[newVideoShortId]`
3. El `VideoContext` carga las escenas + narración + análisis del nuevo vídeo
4. Las escenas del store se reemplazan

---

## 5. Zustand Stores — Qué va en cada uno

### Principio: NO recargar constantemente

```
Supabase → hook fetch → Zustand store → componentes leen del store
                ↑
                └── Realtime listener actualiza el store directamente
```

**Regla:** La primera carga viene del hook (useProject, useScenes, etc.). Después, Supabase Realtime actualiza el store directamente sin re-fetch. Solo se hace re-fetch completo al cambiar de proyecto/vídeo.

### useProjectStore

```typescript
interface ProjectStore {
  // Datos
  project: Project | null;
  videos: Video[];
  characters: Character[];
  backgrounds: Background[];
  stylePresets: StylePreset[];

  // Estado
  isLoading: boolean;
  error: string | null;

  // Acciones
  setProject: (p: Project) => void;
  setVideos: (v: Video[]) => void;
  updateVideo: (id: string, data: Partial<Video>) => void;
  addVideo: (v: Video) => void;
  removeVideo: (id: string) => void;
  setCharacters: (c: Character[]) => void;
  setBackgrounds: (b: Background[]) => void;
  reset: () => void;  // Al cambiar de proyecto
}
```

### useVideoStore (NUEVO)

```typescript
interface VideoStore {
  video: Video | null;
  scenes: Scene[];
  narration: VideoNarration | null;
  analysis: VideoAnalysis | null;
  arcs: NarrativeArc[];

  setVideo: (v: Video) => void;
  setScenes: (s: Scene[]) => void;
  updateScene: (id: string, data: Partial<Scene>) => void;
  addScene: (s: Scene) => void;
  removeScene: (id: string) => void;
  reorderScenes: (from: number, to: number) => void;
  setNarration: (n: VideoNarration) => void;
  setAnalysis: (a: VideoAnalysis) => void;
  reset: () => void;
}
```

### useScenesStore (NUEVO — escenas del vídeo activo)

```typescript
interface ScenesStore {
  scenes: Scene[];
  sceneDetails: Record<string, {
    camera: SceneCamera | null;
    media: SceneMedia[];
    clips: SceneVideoClip[];
    prompts: ScenePrompt[];
    characters: Character[];
    backgrounds: Background[];
  }>;

  // Carga lazy: los detalles se cargan al abrir una escena
  loadSceneDetails: (sceneId: string) => Promise<void>;
  updateSceneDetail: (sceneId: string, key: string, data: any) => void;
}
```

### useUIStore (ACTUALIZAR)

```typescript
interface UIStore {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Chat panel
  chatPanelOpen: boolean;
  chatPanelWidth: number;       // 300-600px
  chatExpanded: boolean;        // Pantalla completa

  // Tema
  theme: 'light' | 'dark' | 'system';

  // Vista de escenas
  scenesView: 'grid' | 'list' | 'timeline';

  // Acciones
  toggleChat: () => void;
  expandChat: () => void;
  collapseChat: () => void;
  setChatWidth: (w: number) => void;
}

// Persistido en localStorage
const useUIStore = create(
  persist(store, { name: 'kiyoko-ui' })
);
```

### useRealtimeStore (NUEVO)

```typescript
interface RealtimeStore {
  // Quién está online viendo el proyecto
  onlineUsers: { userId: string; name: string; avatar: string; page: string }[];

  // Updates recientes (para mostrar "María editó escena 3")
  recentUpdates: RealtimeUpdate[];

  // Escenas que se han actualizado (para refrescar solo esas)
  dirtySceneIds: Set<string>;

  addUpdate: (u: RealtimeUpdate) => void;
  markSceneDirty: (id: string) => void;
  clearDirtyScenes: () => void;
}
```

---

## 6. Tiempo Real — Cómo funciona

### Suscripciones Supabase Realtime

```typescript
// src/hooks/useRealtimeProject.ts

export function useRealtimeProject(projectId: string) {
  const updateScene = useVideoStore(s => s.updateScene);
  const addUpdate = useRealtimeStore(s => s.addUpdate);

  useEffect(() => {
    const channel = supabase
      .channel(`project:${projectId}`)

      // Escenas actualizadas
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scenes',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          updateScene(payload.new.id, payload.new);
          addUpdate({
            type: 'scene_updated',
            entityId: payload.new.id,
            userId: payload.new.last_updated_by,
            timestamp: new Date(),
          });
        }
      })

      // Vídeos actualizados
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'videos',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        // Actualizar store
      })

      // Cola de realtime_updates (para notificaciones)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'realtime_updates',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        addUpdate(payload.new);
        // Si es una escena que tenemos cargada, marcarla dirty
        if (payload.new.scene_id) {
          useRealtimeStore.getState().markSceneDirty(payload.new.scene_id);
        }
      })

      // Presencia
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Actualizar onlineUsers en store
      })

      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUser.id,
            name: currentUser.full_name,
            page: window.location.pathname,
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);
}
```

### Cómo se recargan las escenas editadas

```
1. María edita la escena 3 en su navegador
2. El hook useScenes hace UPDATE en Supabase
3. Supabase Realtime envía el cambio a TODOS los suscriptores
4. El listener en useRealtimeProject recibe el payload
5. Actualiza la escena directamente en useVideoStore (sin re-fetch)
6. Los componentes que leen esa escena se re-renderizan automáticamente
7. Se muestra un toast: "María actualizó Escena 3"
```

### Cuándo se hace re-fetch completo (NO realtime)

- Al cargar la página por primera vez
- Al cambiar de proyecto (switch en header)
- Al cambiar de vídeo (switch en header)
- Si el usuario lleva >5 min inactivo y vuelve
- Si hay un error de conexión realtime y se reconecta

---

## 7. Chat IA (Kiyoko) — Comportamiento

### Dos modos

**Panel lateral (por defecto):**
- Se abre con el botón 💬 en el header o sidebar
- Ancho resizable: 300px min, 600px max
- Arrastrando el borde izquierdo del panel
- Botón ↗ para expandir a pantalla completa
- Se cierra con X o ESC
- El `chatPanelWidth` se guarda en useUIStore (localStorage)

**Pantalla completa (expanded):**
- Reemplaza el {children} del layout
- Muestra sidebar de historial de conversaciones a la izquierda
- Chat ocupa el resto del ancho
- Botón ↙ para volver al panel lateral
- Se accede también desde `/project/[shortId]/chat`

### Contexto automático

```typescript
// El chat detecta dónde estás y envía contexto:

const chatContext = {
  projectId: project?.id,
  projectTitle: project?.title,
  videoId: activeVideo?.id,
  videoTitle: activeVideo?.title,
  currentPage: pathname,  // "/project/.../video/.../scenes"
  // Si estás en una escena específica:
  sceneId: currentScene?.id,
  sceneTitle: currentScene?.title,
};

// Se envía como metadata en cada mensaje al API
```

### Rollback de cambios

```
1. El chat muestra: "He actualizado las escenas 3, 5 y 7"
2. Debajo del mensaje aparece: [↩ Deshacer cambios]
3. Al pulsar:
   a. Se buscan los entity_snapshots con conversation_id de esta conversación
   b. Se restauran en orden inverso
   c. Se actualiza el store
   d. Se muestra: "Cambios revertidos"
```

### Qué puede hacer la IA desde el chat

- Crear escenas (pregunta anotación → plano → genera)
- Editar escenas existentes ("cambia la escena 3, quita a Raúl")
- Generar prompts de imagen y vídeo
- Analizar el vídeo (fortalezas/debilidades)
- Sugerir mejoras y aplicarlas
- Derivar vídeos ("hazme un reel de 30s con lo mejor")
- Generar narración del vídeo
- Generar arco narrativo
- Batch update ("actualiza todas las escenas donde aparece Conchi")

### Qué NO hace la IA desde el chat

- No sube imágenes (eso es desde la UI de personajes/fondos)
- No configura generadores (eso es desde settings/ai)
- No gestiona tareas ni tiempo
- No gestiona publicaciones
- No cambia ajustes del proyecto

---

## 8. PWA — Progressive Web App

```typescript
// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kiyoko AI',
    short_name: 'Kiyoko',
    description: 'Producción de vídeo con IA para redes sociales',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#0EA5A0',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

```html
<!-- src/app/layout.tsx -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

---

## 9. Qué hay en cada página — Definición completa

### `/dashboard`

**Acceso:** Tras login, o click en 🏠 en header.

**Contenido:**
- Saludo: "Buenos días, [nombre]"
- Stats rápidas: X proyectos, Y tareas pendientes, Z horas hoy
- Grid de proyectos (ProjectCard): thumbnail, título, cliente, estado (badge), progreso (barra), fecha. Click → `/project/[shortId]`
- Filtros: todos / en progreso / completados / archivados
- Búsqueda por nombre
- Ordenar: recientes / nombre / progreso
- Botón "Nuevo proyecto" → `/new`
- Si no hay proyectos: EmptyState con CTA

**Store:** useProjectStore (lista de proyectos), useFilterStore

---

### `/project/[shortId]`

**Acceso:** Click en ProjectCard del dashboard.

**Contenido:**
- Portada del proyecto (imagen o gradiente)
- Título, cliente, descripción, tags
- Stats: X vídeos, Y escenas totales, Z personajes, W fondos
- Grid de vídeos del proyecto (VideoCard): título, plataforma (badge), duración, estado, progreso
- Botón "Nuevo vídeo" → modal
- Actividad reciente (últimos 5 cambios)
- Accesos rápidos: recursos, tareas, chat IA

**Store:** useProjectStore

---

### `/project/[shortId]/video/[videoShortId]`

**Acceso:** Click en VideoCard, o selector de vídeo en header.

**Contenido:**
- Header del vídeo: título, plataforma (badge), duración objetivo vs actual, estado
- Barra de arco narrativo visual (ArcBar): secciones coloreadas proporcionales
- Storyboard visual: grid de SceneCards con:
  - Nº escena, thumbnail (scene_media actual), título
  - Badge de estado (coloreado)
  - Avatares de personajes asignados
  - Duración + nº de clips (base + extensiones)
  - Badge si tiene anotación del cliente
- Botones: "Nueva escena", "Analizar vídeo", "Narración", "Exportar", "Derivar"
- Si no hay escenas: EmptyState con CTA "Crear escenas con IA"

**Store:** useVideoStore, useScenesStore

---

### `/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]`

**Acceso:** Click en SceneCard del board.

**Contenido (layout de 3 columnas en desktop):**

Panel izquierdo (info):
- Título editable
- Descripción editable (textarea)
- Anotación del cliente (badge de fuente: client/ai/none)
- Diálogo (textarea con formato personaje: línea)
- Personajes asignados (avatares + botón añadir)
- Fondos asignados (thumbnails + botón añadir)
- Notas del director

Panel central (media):
- Imagen actual (scene_media is_current=true) con zoom
- Player de clips de vídeo: reproduce base → ext1 → ext2 encadenados
- Indicador visual de clips: [■ base 6s][■ ext1 6s][■ ext2 6s]
- Botones: "Regenerar imagen", "Regenerar clips"

Panel derecho (técnico):
- Config de cámara: ángulo (select), movimiento (select), notas, luz, mood
- Historial de prompts: lista expandible, más reciente arriba
- Prompt de imagen actual (editable, botón "Mejorar con IA")
- Prompt de vídeo actual (editable, con secciones de extensión)

**Store:** useScenesStore (sceneDetails[sceneId])

---

### `/project/[shortId]/video/[videoShortId]/analysis`

**Acceso:** Botón "Analizar" en vista del vídeo, o sidebar.

**Contenido:**
- Score gauge circular: 82/100
- Resumen del análisis (texto)
- Sección "Fortalezas" (lista verde): título + detalle + escenas clickeables
- Sección "Debilidades" (lista naranja/roja): título + detalle + severidad + escenas
- Sección "Sugerencias" (lista azul): título + detalle + tipo + botón "Aplicar" (si auto_applicable)
- Botón "Re-analizar" (regenera el análisis)
- Historial de análisis anteriores (versiones)

**Store:** useVideoStore.analysis

---

### `/project/[shortId]/publications`

**Acceso:** Sidebar del proyecto.

**Contenido:**
- Tabs: Calendario / Grid
- Calendario: vista mes con dots de colores por publicación programada
- Grid: tarjetas de publicación con preview visual, caption truncada, plataforma, fecha, estado
- Filtros: por perfil, estado, tipo
- Botón "Nueva publicación" → `/publications/new`

---

### `/project/[shortId]/settings/ai`

**Acceso:** Sidebar proyecto → Settings → IA.

**Contenido:**
- Sección "Director IA":
  - Desplegable tipo: "Director Pixar" / "Director Realista" / "Director Anime" / "Director Comedia" / "Director Publicitario"
  - Al cambiar, genera automáticamente un system prompt nuevo
  - Textarea del system prompt (editable)
  - Slider de creatividad (0.0 - 1.0)
  - Selector de tono (warm / serious / comedic / dramatic / casual)
  - Selector de idioma
- Sección "Generadores externos":
  - Proveedor de imagen + config
  - Proveedor de vídeo + config + duraciones + extensiones
  - Proveedor TTS + config
  - Proveedor de visión + modelo

---

## 10. Migración de Rutas — Exactamente qué hacer

### Carpetas a RENOMBRAR

```
src/app/(dashboard)/project/[slug]/       → src/app/(dashboard)/project/[shortId]/
src/app/(dashboard)/project/[slug]/video/[videoSlug]/
                                          → src/app/(dashboard)/project/[shortId]/video/[videoShortId]/
```

### Carpetas a ELIMINAR

```
src/app/(dashboard)/project/[shortId]/storyboard/     → Vista del vídeo IS el storyboard
src/app/(dashboard)/project/[shortId]/scenes/          → Bajo video/
src/app/(dashboard)/project/[shortId]/arc/             → Integrado en timeline
src/app/(dashboard)/project/[shortId]/references/      → Redundante con resources
src/app/(dashboard)/project/[shortId]/narration/       → Bajo video/
src/app/(dashboard)/project/[shortId]/analysis/        → Bajo video/
src/app/(dashboard)/project/[shortId]/exports/         → Bajo video/
src/app/(dashboard)/project/[shortId]/characters/      → Bajo resources/
src/app/(dashboard)/project/[shortId]/backgrounds/     → Bajo resources/
src/app/(dashboard)/project/[shortId]/timeline/        → Bajo video/

src/components/storyboard/    → Integrado en video/VideoOverview
src/components/arc/           → Integrado en timeline/
src/components/references/    → Eliminar
src/components/exports/       → Mover lógica a video/
```

### Carpetas a CREAR

```
src/app/(dashboard)/dashboard/shared/page.tsx
src/app/(dashboard)/dashboard/publications/page.tsx
src/app/(dashboard)/settings/subscription/page.tsx
src/app/(dashboard)/settings/notifications/page.tsx
src/app/(dashboard)/organizations/[orgId]/page.tsx
src/app/share/[token]/page.tsx

src/app/(dashboard)/project/[shortId]/video/[videoShortId]/scene/[sceneShortId]/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/scenes/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/timeline/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/analysis/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/derive/page.tsx
src/app/(dashboard)/project/[shortId]/video/[videoShortId]/share/page.tsx

src/app/(dashboard)/project/[shortId]/resources/characters/page.tsx
src/app/(dashboard)/project/[shortId]/resources/characters/[charId]/page.tsx
src/app/(dashboard)/project/[shortId]/resources/backgrounds/page.tsx
src/app/(dashboard)/project/[shortId]/resources/backgrounds/[bgId]/page.tsx
src/app/(dashboard)/project/[shortId]/resources/styles/page.tsx
src/app/(dashboard)/project/[shortId]/resources/templates/page.tsx

src/app/(dashboard)/project/[shortId]/publications/page.tsx
src/app/(dashboard)/project/[shortId]/publications/profiles/page.tsx
src/app/(dashboard)/project/[shortId]/publications/new/page.tsx
src/app/(dashboard)/project/[shortId]/publications/[pubShortId]/page.tsx

src/app/(dashboard)/project/[shortId]/tasks/time/page.tsx
src/app/(dashboard)/project/[shortId]/settings/ai/page.tsx
src/app/(dashboard)/project/[shortId]/settings/sharing/page.tsx
src/app/(dashboard)/project/[shortId]/activity/page.tsx

src/components/video/
src/components/publications/
src/components/sharing/
src/components/ai-settings/
```

### Hooks a ELIMINAR

```
src/hooks/useIssues.ts  → Reemplazado por useVideoAnalysis
```

### Componentes carpetas a ELIMINAR

```
src/components/storyboard/
src/components/arc/
src/components/references/
```
