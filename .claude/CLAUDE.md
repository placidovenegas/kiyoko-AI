# Kiyoko AI — Instrucciones para Claude Code

## Reglas del proyecto
- TypeScript estricto en TODO el código (no usar `any`)
- Tailwind v4: estilos en CSS con @theme, NO tailwind.config.ts
- Componentes: function components + hooks, nunca clases
- Imports con alias `@/*` → `src/*`
- Supabase: SIEMPRE usar RLS, nunca bypass desde cliente
- IA: SIEMPRE pasar por el AI Router, nunca llamar SDKs directamente
- Archivos nuevos: crear en la ruta correcta según la estructura del spec
- Tests: al menos smoke test para cada API route

## Estructura del proyecto
- `src/app/` — Next.js App Router pages y API routes
- `src/components/` — Componentes React organizados por dominio
- `src/lib/` — Lógica de negocio (supabase, ai, export, utils)
- `src/stores/` — Zustand stores (SOLO estado UI)
- `src/hooks/` — Custom hooks (TanStack Query wrappers)
- `src/types/` — TypeScript types e interfaces

## Organización de componentes (por dominio)
```
src/components/
├── ui/           → Primitivos (shadcn/Radix): button, input, card, dialog, dropdown-menu...
├── layout/       → Sidebar, Breadcrumbs, MobileNav, UserMenu
├── shared/       → Reutilizables: CommandMenu, EmptyState, ConfirmDialog, LoadingScreen
├── project/      → ProjectCard, ProjectGrid, ProjectView
├── video/        → VideoCard, VideoGrid, VideoView
├── scene/        → SceneCard, PromptEditor, configuración de escenas
├── ai-chat/      → Chat con Kiyoko AI
├── narration/    → NarrationPlayer, VoiceSelector
├── timeline/     → Timeline y arcos narrativos
├── analysis/     → AnalysisCard, ScoreGauge
├── exports/      → Componentes de exportación
├── tasks/        → Gestión de tareas
├── characters/   → Gestión de personajes
├── backgrounds/  → Gestión de fondos
├── publications/ → Publicaciones
├── admin/        → Panel de administración
├── settings/     → Configuración
└── landing/      → Landing page
```

## Design System — Estilo Notion + Supabase

### Filosofía
- **Minimal**: sin decoración innecesaria
- **Funcional**: cada elemento tiene propósito claro
- **Respirado**: espaciado generoso (estilo Notion)
- **Dark-first**: diseñar para dark mode primero

### Colores — SOLO variables CSS
```
PROHIBIDO: bg-[#0EA5A0], text-[#111113]
CORRECTO:  bg-primary, text-foreground, border-border
```

### Tipografía
- Títulos de página: `text-2xl font-semibold tracking-tight`
- Títulos de sección: `text-lg font-medium`
- Subtítulos: `text-sm font-medium text-muted-foreground`
- Body: `text-sm text-foreground`
- Caption: `text-xs text-muted-foreground`

### Espaciado
- Page padding: `p-6 lg:p-8`
- Section gap: `space-y-6`
- Card padding: `p-4` o `p-6`
- Grid gap: `gap-4`

### Componentes — Usar SIEMPRE los de `src/components/ui/`
No crear componentes ad-hoc. Si falta uno, crearlo en `ui/` o `shared/`.

## Skills disponibles
- `/create-page` — Nueva página con page.tsx, loading.tsx, error.tsx
- `/create-component` — Nuevo componente (Server o Client)
- `/create-hook` — Hook de TanStack Query (useQuery/useMutation)
- `/create-layout` — Patrones de layout (dropdown, tabla, tabs, sidebar)
- `/design-system` — Consultar y aplicar el design system
- `/ui-audit` — Auditar consistencia visual y design system
- `/refactor` — Reorganizar componentes por dominio
- `/fix-error` — Diagnosticar y corregir errores
- `/supabase-migration` — Crear/modificar tablas, RLS, indices
- `/analyze` — Análisis completo del proyecto (build, tipos, DB, dead code)
- `/db-check` — Verificar estado de la base de datos
- `/db-sync` — Verificar sincronización DB ↔ TypeScript types
- `/status` — Resumen del estado actual del proyecto

## MCP Servers disponibles
- **Supabase MCP**: consultar schema, ejecutar queries, aplicar migraciones
  - Project ID: `dbtlhmndplcvmvbqtioo`
  - 47 tablas, 42 migraciones, schema v4

## Documentación del proyecto
- `/docs/implementation/` — Plan de implementación (fases 00-20)
- `/docs/new_implementacion/` — Arquitectura v4, diseño, rutas, best practices
- `/docs/v5/` — Comportamiento de Kiyoko AI, ejemplos de conversación
- `/docs/update/` — Mejoras y actualizaciones recientes
