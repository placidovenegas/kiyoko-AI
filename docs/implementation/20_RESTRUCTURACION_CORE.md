# Fase 20 — Reestructuración Core: URLs, Nav, Favoritos, Orgs, Auth, Realtime

## Estado: ✅ COMPLETADO

## Objetivo

Modernizar la navegación, estructura de URLs, sistema de favoritos, organizaciones, autenticación con Google y colaboración en tiempo real.

## Cambios Implementados

### 20.1 URLs: `/p/[slug]` → `/project/[slug]` ✅
- Directorio movido de `src/app/(dashboard)/p/[slug]/` a `src/app/(dashboard)/project/[slug]/`
- Slug con short ID automático: `generateProjectSlug()` genera slugs tipo `domenech-peluquerias-k8x3mq7`
- Todos los links, queries y params actualizados (~30 archivos)
- `/project` index redirige a `/dashboard`
- Archivos modificados: layout, page, 13 subpages, Sidebar, Header, ProjectCard, CommandMenu, new/page

### 20.2 Sidebar Contextual ✅
- **Fuera de proyecto**: Sidebar muestra OrgSwitcher, Dashboard, Nuevo, Favoritos, Admin, Ajustes
- **Dentro de proyecto**: Sidebar cambia completamente a: ← Volver, Nombre del proyecto + ⭐ + Presencia, 11 tabs, Ajustes
- Barra horizontal de tabs eliminada del layout del proyecto
- Archivos: `ProjectSidebar.tsx` (nuevo), `Sidebar.tsx` (modificado), `project/[slug]/layout.tsx` (simplificado)

### 20.3 Sistema de Favoritos ✅
- Tabla `project_favorites` con RLS (via MCP Supabase)
- Hook `useFavorites.ts`: toggle, isFavorite, lista de favoritos
- Componente `FavoriteButton.tsx`: estrella toggle
- Integrado en: Sidebar (muestra favoritos), ProjectSidebar (estrella junto al nombre), ProjectCard (estrella en la card)

### 20.4 Organizaciones ✅
- Tablas: `organizations`, `organization_members` (via MCP Supabase)
- `organization_id` añadido a `projects`
- Trigger `handle_new_user` actualizado: auto-crea org personal al registrarse
- Data migration: creó org personal para usuarios existentes y asignó sus proyectos
- RLS: miembros leen su org, owner/admin gestionan miembros, miembros de org pueden leer proyectos de su org
- Hook `useOrganizations.ts`: CRUD orgs, switch, create (max 3)
- Store `useOrgStore.ts`: currentOrgId persistido en localStorage
- Componente `OrgSwitcher.tsx`: dropdown en sidebar con selector de org + crear nueva
- Tipos: `src/types/organization.ts`

### 20.5 Google OAuth ✅
- Decisión: Supabase Auth + Google OAuth nativo (no Clerk)
- `useAuth.ts`: añadido `signInWithGoogle()`
- Login: botón "Continuar con Google" con icono SVG + separador "o"
- Register: botón "Registrarse con Google" con mismo diseño
- Requiere config en Supabase Dashboard: habilitar Google provider + Client ID/Secret

### 20.6 Colaboración en Tiempo Real ✅
- Realtime habilitado en: scenes, characters, backgrounds, narrative_arcs, timeline_entries, project_issues
- Hook `useRealtimeProject.ts`: subscribe a cambios INSERT/UPDATE/DELETE, actualiza Zustand store
- Hook `usePresence.ts`: Supabase Realtime Presence, muestra quién está online
- Componente `PresenceIndicator.tsx`: avatares con dot verde de online
- Integrado en project layout (RealtimeSync) y ProjectSidebar (PresenceIndicator)

## Archivos Nuevos (14)
```
src/components/layout/ProjectSidebar.tsx
src/components/layout/OrgSwitcher.tsx
src/components/shared/FavoriteButton.tsx
src/components/shared/PresenceIndicator.tsx
src/hooks/useFavorites.ts
src/hooks/useOrganizations.ts
src/hooks/useRealtimeProject.ts
src/hooks/usePresence.ts
src/stores/useOrgStore.ts
src/types/organization.ts
src/app/(dashboard)/project/page.tsx (redirect)
```

## Migraciones SQL (via MCP)
```
00006_project_favorites — Tabla de favoritos con RLS
00007_organizations — Tablas orgs + members + update projects + trigger + data migration
00008_realtime_enable — Habilitar Realtime en 6 tablas
```

## Archivos Modificados (~30)
- `src/app/(dashboard)/project/[slug]/` — Todas las 16 páginas (params.slug, queries)
- `src/components/layout/Sidebar.tsx` — OrgSwitcher + favoritos + ProjectSidebar switch
- `src/components/layout/Header.tsx` — Breadcrumbs regex actualizado
- `src/components/project/ProjectCard.tsx` — Link + FavoriteButton
- `src/contexts/ProjectContext.tsx` — Query por slug
- `src/hooks/useProject.ts` — generateProjectSlug
- `src/hooks/useAuth.ts` — signInWithGoogle
- `src/lib/utils/slugify.ts` — generateProjectSlug()
- `src/app/(dashboard)/new/page.tsx` — generateProjectSlug + redirect
- `src/app/(auth)/login/page.tsx` — Botón Google OAuth
- `src/app/(auth)/register/page.tsx` — Botón Google OAuth

## Config pendiente (manual en Supabase Dashboard)
- [ ] Habilitar Google provider en Authentication > Providers
- [ ] Configurar Google Client ID + Secret (Google Cloud Console)
- [ ] Configurar Redirect URL: `https://dbtlhmndplcvmvbqtioo.supabase.co/auth/v1/callback`
