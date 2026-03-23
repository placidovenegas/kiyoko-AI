# Kiyoko AI — Sidebar y Menús: Especificación para Implementación

> Este archivo contiene CÓDIGO REAL y especificaciones exactas para Claude Code.
> Cada componente tiene: estructura, props, comportamiento, y código de referencia.

---

## Estructura de archivos a crear/modificar

```
src/components/layout/
├── AppSidebar.tsx              ← NUEVO: Sidebar principal (reemplaza DashboardSidebar/ProjectSidebar/VideoSidebar)
├── sidebar/
│   ├── SidebarHeader.tsx       ← NUEVO: Logo + botón crear + colapsar
│   ├── SidebarSearch.tsx       ← NUEVO: Input buscar que abre CommandMenu
│   ├── SidebarNavMain.tsx      ← NUEVO: Dashboard, Compartidos, Publicaciones, Kiyoko IA
│   ├── SidebarProjects.tsx     ← NUEVO: Sección Recientes con proyectos expandibles
│   ├── SidebarProjectItem.tsx  ← NUEVO: Cada proyecto con hover actions y sub-items vídeos
│   ├── SidebarFavorites.tsx    ← NUEVO: Sección Favoritos
│   ├── SidebarProjectNav.tsx   ← NUEVO: Nav cuando estás dentro de un proyecto
│   ├── SidebarVideoNav.tsx     ← NUEVO: Nav cuando estás dentro de un vídeo
│   ├── SidebarAdmin.tsx        ← NUEVO: Sección admin (si role=admin)
│   ├── SidebarUserFooter.tsx   ← NUEVO: Usuario abajo con dropdown
│   └── SidebarContext.tsx      ← NUEVO: Hook para detectar nivel (dashboard/project/video)
├── SearchModal.tsx             ← NUEVO: Modal de búsqueda tipo Notion (⌘K)
├── Header.tsx                  ← MODIFICAR: Quitar switchers de org/proyecto/video del header
└── DashboardShell.tsx          ← MODIFICAR: Usar nuevo AppSidebar
```

---

## 1. AppSidebar.tsx — El sidebar principal

El sidebar detecta automáticamente dónde estás y muestra el contenido correcto.

```tsx
// src/components/layout/AppSidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { SidebarHeaderSection } from './sidebar/SidebarHeader';
import { SidebarSearch } from './sidebar/SidebarSearch';
import { SidebarNavMain } from './sidebar/SidebarNavMain';
import { SidebarProjects } from './sidebar/SidebarProjects';
import { SidebarFavorites } from './sidebar/SidebarFavorites';
import { SidebarProjectNav } from './sidebar/SidebarProjectNav';
import { SidebarVideoNav } from './sidebar/SidebarVideoNav';
import { SidebarAdmin } from './sidebar/SidebarAdmin';
import { SidebarUserFooter } from './sidebar/SidebarUserFooter';
import { useSidebarContext } from './sidebar/SidebarContext';

export function AppSidebar() {
  const { level, projectShortId, videoShortId } = useSidebarContext();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader>
        <SidebarHeaderSection level={level} projectShortId={projectShortId} />
      </SidebarHeader>

      <SidebarContent>
        {/* Búsqueda siempre visible */}
        <SidebarSearch />

        {level === 'dashboard' && (
          <>
            <SidebarNavMain />
            <SidebarProjects />
            <SidebarFavorites />
            <SidebarAdmin />
          </>
        )}

        {level === 'project' && (
          <SidebarProjectNav projectShortId={projectShortId!} />
        )}

        {level === 'video' && (
          <SidebarVideoNav
            projectShortId={projectShortId!}
            videoShortId={videoShortId!}
          />
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
```

---

## 2. SidebarContext.tsx — Detectar nivel automáticamente

```tsx
// src/components/layout/sidebar/SidebarContext.tsx
'use client';

import { usePathname } from 'next/navigation';

type SidebarLevel = 'dashboard' | 'project' | 'video';

interface SidebarContextValue {
  level: SidebarLevel;
  projectShortId: string | null;
  videoShortId: string | null;
}

export function useSidebarContext(): SidebarContextValue {
  const pathname = usePathname();

  // /project/[shortId]/video/[videoShortId]/*
  const videoMatch = pathname.match(/\/project\/([^/]+)\/video\/([^/]+)/);
  if (videoMatch) {
    return { level: 'video', projectShortId: videoMatch[1], videoShortId: videoMatch[2] };
  }

  // /project/[shortId]/*
  const projectMatch = pathname.match(/\/project\/([^/]+)/);
  if (projectMatch) {
    return { level: 'project', projectShortId: projectMatch[1], videoShortId: null };
  }

  // /dashboard, /new, /settings, /admin, etc.
  return { level: 'dashboard', projectShortId: null, videoShortId: null };
}
```

---

## 3. SidebarHeader.tsx — Logo + back link + botón crear

```tsx
// src/components/layout/sidebar/SidebarHeader.tsx
'use client';

import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KiyokoLogo } from '@/components/shared/KiyokoLogo';

interface Props {
  level: 'dashboard' | 'project' | 'video';
  projectShortId?: string | null;
}

export function SidebarHeaderSection({ level, projectShortId }: Props) {
  const { state } = useSidebar(); // 'expanded' | 'collapsed'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-between px-2 py-1.5">
          {/* Logo + nombre */}
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <KiyokoLogo className="h-7 w-7 shrink-0" />
            {state === 'expanded' && (
              <span className="font-semibold text-sm truncate">Kiyoko AI</span>
            )}
          </Link>

          {/* Botón crear (+) — solo si sidebar expandido */}
          {state === 'expanded' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-6 w-6 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo proyecto
                  </Link>
                </DropdownMenuItem>
                {level !== 'dashboard' && projectShortId && (
                  <DropdownMenuItem>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo vídeo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarMenuItem>

      {/* Back link */}
      {level === 'project' && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild size="sm" className="text-muted-foreground">
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {level === 'video' && projectShortId && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild size="sm" className="text-muted-foreground">
            <Link href={`/project/${projectShortId}`}>
              <ChevronLeft className="h-4 w-4" />
              <span>Proyecto</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
```

---

## 4. SidebarSearch.tsx — Input que abre CommandMenu

```tsx
// src/components/layout/sidebar/SidebarSearch.tsx
'use client';

import { Search } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent, useSidebar } from '@/components/ui/sidebar';

export function SidebarSearch() {
  const { state } = useSidebar();

  const openCommandMenu = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    );
  };

  if (state === 'collapsed') {
    return (
      <SidebarGroup className="px-2 py-1">
        <button
          onClick={openCommandMenu}
          className="h-8 w-8 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-muted-foreground"
        >
          <Search className="h-4 w-4" />
        </button>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="px-3 py-1">
      <SidebarGroupContent>
        <button
          onClick={openCommandMenu}
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Buscar...</span>
          <kbd className="pointer-events-none text-[10px] text-muted-foreground/50 font-mono">⌘K</kbd>
        </button>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

---

## 5. SidebarNavMain.tsx — Links principales (Dashboard, Compartidos, Kiyoko IA)

```tsx
// src/components/layout/sidebar/SidebarNavMain.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Share2, Calendar, MessageCircle } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

const mainItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Compartidos', icon: Share2, href: '/dashboard/shared' },
  { title: 'Publicaciones', icon: Calendar, href: '/dashboard/publications' },
];

export function SidebarNavMain() {
  const pathname = usePathname();
  const toggleChat = useUIStore((s) => s.toggleChat);
  const chatPanelOpen = useUIStore((s) => s.chatPanelOpen);

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {mainItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Kiyoko IA — como item principal (estilo Notion AI) */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleChat}
              isActive={chatPanelOpen}
              tooltip="Kiyoko IA"
              className={cn(
                'relative',
                chatPanelOpen && 'bg-kiyoko-teal/10 text-kiyoko-teal'
              )}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Kiyoko IA</span>
              {/* Dot de notificación si hay respuesta pendiente */}
              {/* <span className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" /> */}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

---

## 6. SidebarProjects.tsx — Proyectos recientes expandibles (COMPONENTE CLAVE)

```tsx
// src/components/layout/sidebar/SidebarProjects.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, FolderOpen } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { SidebarProjectItem } from './SidebarProjectItem';

export function SidebarProjects() {
  const supabase = createBrowserClient();

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, short_id, title, client_name, cover_image_url, status, is_favorite')
        .order('updated_at', { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Recientes
      </SidebarGroupLabel>

      {/* Botón + al lado del label "Recientes" (aparece en hover del grupo) */}
      <SidebarGroupAction asChild>
        <Link href="/new" title="Nuevo proyecto">
          <Plus className="h-4 w-4" />
        </Link>
      </SidebarGroupAction>

      <SidebarGroupContent>
        <SidebarMenu>
          {projects?.map((project) => (
            <SidebarProjectItem key={project.id} project={project} />
          ))}

          {(!projects || projects.length === 0) && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Sin proyectos recientes
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

---

## 7. SidebarProjectItem.tsx — Proyecto con hover actions y vídeos expandibles (COMPONENTE MÁS IMPORTANTE)

```tsx
// src/components/layout/sidebar/SidebarProjectItem.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, MoreHorizontal, Plus, Film, FolderOpen,
  Link2, Copy, Pencil, Star, Trash2, ExternalLink,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  short_id: string;
  title: string;
  client_name: string | null;
  status: string;
  is_favorite: boolean;
}

interface Props {
  project: Project;
}

export function SidebarProjectItem({ project }: Props) {
  const [expanded, setExpanded] = useState(false);
  const supabase = createBrowserClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Cargar vídeos SOLO cuando se expande (lazy load)
  const { data: videos, isLoading: loadingVideos } = useQuery({
    queryKey: queryKeys.videos.byProject(project.id),
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, short_id, title, platform, status')
        .eq('project_id', project.id)
        .order('sort_order');
      return data ?? [];
    },
    enabled: expanded, // Solo fetch cuando está expandido
  });

  const handleToggleFavorite = async () => {
    await supabase
      .from('projects')
      .update({ is_favorite: !project.is_favorite })
      .eq('id', project.id);
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/project/${project.short_id}`
    );
  };

  const platformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return '📺';
      case 'tiktok': return '📱';
      case 'instagram': return '📷';
      default: return '🎬';
    }
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setExpanded(!expanded)}
          tooltip={project.title}
          className="group/project"
        >
          <ChevronRight
            className={cn(
              'h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform duration-200',
              expanded && 'rotate-90'
            )}
          />
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span className="truncate">{project.title}</span>
        </SidebarMenuButton>

        {/* Hover actions: ··· menú y + crear vídeo */}
        {/* Estos aparecen al hacer hover sobre el proyecto (grupo/project) */}
        <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0.5 opacity-0 group-hover/project:opacity-100 transition-opacity">
          {/* Menú ··· */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal className="h-4 w-4" />
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-52">
              <DropdownMenuItem asChild>
                <Link href={`/project/${project.short_id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir proyecto
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="mr-2 h-4 w-4" />
                Copiar link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleFavorite}>
                <Star className={cn('mr-2 h-4 w-4', project.is_favorite && 'fill-yellow-500 text-yellow-500')} />
                {project.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400 focus:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botón + crear vídeo (solo aparece en hover) */}
          <SidebarMenuAction
            showOnHover
            onClick={(e) => {
              e.stopPropagation();
              // TODO: abrir modal crear vídeo con project_id precargado
              router.push(`/project/${project.short_id}/videos`);
            }}
          >
            <Plus className="h-4 w-4" />
          </SidebarMenuAction>
        </div>
      </SidebarMenuItem>

      {/* Sub-items: vídeos del proyecto (expandidos) */}
      {expanded && (
        <SidebarMenuSub>
          {loadingVideos && (
            <SidebarMenuSubItem>
              <div className="px-3 py-1.5 text-xs text-muted-foreground animate-pulse">
                Cargando vídeos...
              </div>
            </SidebarMenuSubItem>
          )}

          {videos?.map((video) => (
            <SidebarMenuSubItem key={video.id}>
              <SidebarMenuSubButton asChild>
                <Link href={`/project/${project.short_id}/video/${video.short_id}`}>
                  <span className="text-xs">{platformIcon(video.platform)}</span>
                  <span className="truncate">{video.title}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}

          {videos && videos.length === 0 && (
            <SidebarMenuSubItem>
              <div className="px-3 py-1 text-xs text-muted-foreground">
                Sin vídeos
              </div>
            </SidebarMenuSubItem>
          )}

          {/* Crear vídeo directo desde el sidebar */}
          <SidebarMenuSubItem>
            <SidebarMenuSubButton className="text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3" />
              <span>Nuevo vídeo</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      )}
    </>
  );
}
```

---

## 8. SearchModal.tsx — Modal de búsqueda tipo Notion

```tsx
// src/components/layout/SearchModal.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  FolderOpen, Film, FrameIcon, Users, Mountain,
  Settings, Search, MessageCircle, LayoutDashboard,
  Calendar, CheckSquare,
} from 'lucide-react';

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();

  // ⌘K para abrir
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Búsqueda en proyectos, vídeos, escenas, personajes
  const { data: results } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return null;
      const q = `%${query}%`;

      const [projects, videos, scenes, characters] = await Promise.all([
        supabase.from('projects').select('id, short_id, title, client_name').ilike('title', q).limit(5),
        supabase.from('videos').select('id, short_id, title, project_id, projects!inner(short_id, title)').ilike('title', q).limit(5),
        supabase.from('scenes').select('id, short_id, title, scene_number, video_id, videos!inner(short_id, project_id, projects!inner(short_id))').ilike('title', q).limit(5),
        supabase.from('characters').select('id, name, role, project_id, projects!inner(short_id, title)').ilike('name', q).limit(5),
      ]);

      return {
        projects: projects.data ?? [],
        videos: videos.data ?? [],
        scenes: scenes.data ?? [],
        characters: characters.data ?? [],
      };
    },
    enabled: open && query.length >= 2,
    staleTime: 10_000,
  });

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery('');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar proyectos, vídeos, escenas, personajes..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query.length < 2
            ? 'Escribe al menos 2 caracteres para buscar...'
            : 'No se encontraron resultados.'
          }
        </CommandEmpty>

        {/* Navegación rápida (sin búsqueda) */}
        {!query && (
          <CommandGroup heading="Navegación">
            <CommandItem onSelect={() => navigate('/dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => navigate('/dashboard/publications')}>
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              Publicaciones
            </CommandItem>
            <CommandItem onSelect={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              Ajustes
            </CommandItem>
            <CommandItem onSelect={() => navigate('/settings/api-keys')}>
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              API Keys
            </CommandItem>
          </CommandGroup>
        )}

        {/* Resultados de búsqueda */}
        {results?.projects && results.projects.length > 0 && (
          <CommandGroup heading="Proyectos">
            {results.projects.map((p: any) => (
              <CommandItem
                key={p.id}
                value={p.title}
                onSelect={() => navigate(`/project/${p.short_id}`)}
              >
                <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{p.title}</span>
                  {p.client_name && (
                    <span className="text-xs text-muted-foreground">{p.client_name}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.videos && results.videos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Vídeos">
              {results.videos.map((v: any) => (
                <CommandItem
                  key={v.id}
                  value={v.title}
                  onSelect={() => navigate(`/project/${v.projects?.short_id}/video/${v.short_id}`)}
                >
                  <Film className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{v.title}</span>
                    <span className="text-xs text-muted-foreground">{v.projects?.title}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results?.scenes && results.scenes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Escenas">
              {results.scenes.map((s: any) => (
                <CommandItem
                  key={s.id}
                  value={s.title}
                  onSelect={() => navigate(
                    `/project/${s.videos?.projects?.short_id}/video/${s.videos?.short_id}/scene/${s.short_id}`
                  )}
                >
                  <FrameIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>#{s.scene_number} {s.title}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results?.characters && results.characters.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Personajes">
              {results.characters.map((c: any) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => navigate(
                    `/project/${c.projects?.short_id}/resources/characters/${c.id}`
                  )}
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.role} · {c.projects?.title}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
```

---

## 9. SidebarProjectNav.tsx — Menú dentro de un proyecto

```tsx
// src/components/layout/sidebar/SidebarProjectNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Film, Palette, Users, Mountain,
  Paintbrush, FileText, Smartphone, CheckSquare,
  Activity, Settings, Bot, UserPlus, MessageCircle,
  ChevronRight,
} from 'lucide-react';
import {
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

interface Props {
  projectShortId: string;
}

export function SidebarProjectNav({ projectShortId }: Props) {
  const pathname = usePathname();
  const base = `/project/${projectShortId}`;
  const toggleChat = useUIStore((s) => s.toggleChat);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* PROYECTO */}
      <SidebarGroup>
        <SidebarGroupLabel>Proyecto</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === base}>
                <Link href={base}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Vista general</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(`${base}/videos`)}>
                <Link href={`${base}/videos`}>
                  <Film className="h-4 w-4" />
                  <span>Vídeos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Recursos — Expandible como en Notion */}
            <Collapsible defaultOpen={isActive(`${base}/resources`)} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isActive(`${base}/resources`)}>
                    <Palette className="h-4 w-4" />
                    <span>Recursos</span>
                    <ChevronRight className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive(`${base}/resources/characters`)}>
                        <Link href={`${base}/resources/characters`}>
                          <Users className="h-3 w-3" />
                          <span>Personajes</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive(`${base}/resources/backgrounds`)}>
                        <Link href={`${base}/resources/backgrounds`}>
                          <Mountain className="h-3 w-3" />
                          <span>Fondos</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive(`${base}/resources/styles`)}>
                        <Link href={`${base}/resources/styles`}>
                          <Paintbrush className="h-3 w-3" />
                          <span>Estilos</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive(`${base}/resources/templates`)}>
                        <Link href={`${base}/resources/templates`}>
                          <FileText className="h-3 w-3" />
                          <span>Templates</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(`${base}/publications`)}>
                <Link href={`${base}/publications`}>
                  <Smartphone className="h-4 w-4" />
                  <span>Publicaciones</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(`${base}/tasks`)}>
                <Link href={`${base}/tasks`}>
                  <CheckSquare className="h-4 w-4" />
                  <span>Tareas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(`${base}/activity`)}>
                <Link href={`${base}/activity`}>
                  <Activity className="h-4 w-4" />
                  <span>Actividad</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* AJUSTES */}
      <SidebarGroup>
        <SidebarGroupLabel>Ajustes</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === `${base}/settings`}>
                <Link href={`${base}/settings`}>
                  <Settings className="h-4 w-4" />
                  <span>General</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(`${base}/settings/ai`)}>
                <Link href={`${base}/settings/ai`}>
                  <Bot className="h-4 w-4" />
                  <span>IA y Agente</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(`${base}/settings/sharing`)}>
                <Link href={`${base}/settings/sharing`}>
                  <UserPlus className="h-4 w-4" />
                  <span>Colaboradores</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* CHAT IA */}
      <SidebarGroup className="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleChat}>
                <MessageCircle className="h-4 w-4" />
                <span>Chat IA</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
```

---

## 10. SidebarVideoNav.tsx — Menú dentro de un vídeo

```tsx
// src/components/layout/sidebar/SidebarVideoNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Film, Clock, Mic, BarChart3,
  Share2, Download, MessageCircle, ChevronDown,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import {
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/useUIStore';

interface Props {
  projectShortId: string;
  videoShortId: string;
}

export function SidebarVideoNav({ projectShortId, videoShortId }: Props) {
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const toggleChat = useUIStore((s) => s.toggleChat);
  const base = `/project/${projectShortId}/video/${videoShortId}`;

  // Cargar vídeo actual + lista de vídeos para el dropdown
  const { data: currentVideo } = useQuery({
    queryKey: ['video-meta', videoShortId],
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, title, platform, project_id')
        .eq('short_id', videoShortId)
        .single();
      return data;
    },
  });

  const { data: allVideos } = useQuery({
    queryKey: queryKeys.videos.byProject(currentVideo?.project_id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, short_id, title, platform')
        .eq('project_id', currentVideo!.project_id)
        .order('sort_order');
      return data ?? [];
    },
    enabled: !!currentVideo?.project_id,
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navItems = [
    { title: 'Overview', icon: LayoutDashboard, href: base },
    { title: 'Escenas', icon: Film, href: `${base}/scenes` },
    { title: 'Timeline', icon: Clock, href: `${base}/timeline` },
    { title: 'Narración', icon: Mic, href: `${base}/narration` },
    { title: 'Análisis', icon: BarChart3, href: `${base}/analysis` },
    { title: 'Compartir', icon: Share2, href: `${base}/share` },
    { title: 'Exportar', icon: Download, href: `${base}/export` },
  ];

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Vídeo</SidebarGroupLabel>
        <SidebarGroupContent>
          {/* Dropdown para cambiar de vídeo */}
          <div className="px-2 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors">
                  <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left truncate">
                    {currentVideo?.title ?? 'Cargando...'}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                {allVideos?.map((v) => (
                  <DropdownMenuItem key={v.id} asChild>
                    <Link href={`/project/${projectShortId}/video/${v.short_id}`}>
                      <Film className="mr-2 h-4 w-4" />
                      {v.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Nav items */}
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={item.href === base ? pathname === base : isActive(item.href)}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Chat IA */}
      <SidebarGroup className="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleChat}>
                <MessageCircle className="h-4 w-4" />
                <span>Chat IA</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
```

---

## 11. SidebarUserFooter.tsx — Usuario con dropdown

```tsx
// src/components/layout/sidebar/SidebarUserFooter.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
  ChevronsUpDown, Settings, CreditCard, LogOut, Moon, Sun,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/useUIStore';
import {
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function SidebarUserFooter() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  // TODO: obtener del contexto de auth
  const user = {
    name: 'Desarrollador Kiyoko',
    email: 'dev@kiyoko.ai',
    initials: 'DK',
    avatar_url: null as string | null,
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="rounded-lg bg-red-600 text-white text-xs">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            side="top"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Ajustes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings/api-keys')}>
              <CreditCard className="mr-2 h-4 w-4" />
              API Keys
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
```

---

## 12. Cómo montar todo en el layout

```tsx
// src/app/(dashboard)/layout.tsx
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SearchModal } from '@/components/layout/SearchModal';
import { Header } from '@/components/layout/Header';
import { ChatPanel } from '@/components/layout/ChatPanel';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <ChatPanel />
      <SearchModal />
    </SidebarProvider>
  );
}
```

---

## 13. Header simplificado (ya no necesita switchers)

```tsx
// src/components/layout/Header.tsx — SIMPLIFICADO
// Ya no necesita dropdowns de Org/Proyecto/Video porque el sidebar los gestiona

'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationBell } from './NotificationBell';
import { useUIStore } from '@/stores/useUIStore';
import { MessageCircle, Home, Settings } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const toggleChat = useUIStore((s) => s.toggleChat);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumbs dinámicos */}
      <Breadcrumbs />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Acciones del header */}
      <div className="flex items-center gap-1">
        <Link
          href="/dashboard"
          className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4" />
        </Link>
        <Link
          href="/settings"
          className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <NotificationBell />
        <button
          onClick={toggleChat}
          className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
```
