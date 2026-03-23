'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Plus, Building2, Settings, Users, Search,
  FolderOpen, Share2, CalendarDays, BarChart3, MessageSquareText,
  ChevronRight, Film, MoreHorizontal, Sparkles,
} from 'lucide-react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { SidebarOrgHeader } from './SidebarOrgHeader';
import { SidebarUserFooter } from './SidebarUserFooter';

interface RecentProject {
  id: string;
  short_id: string;
  title: string;
}

interface ProjectVideo {
  id: string;
  short_id: string;
  title: string;
  platform: string | null;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectVideos, setProjectVideos] = useState<Record<string, ProjectVideo[]>>({});
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => { if (data?.role === 'admin') setIsAdmin(true); });
      supabase.from('projects').select('id, short_id, title')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(8)
        .then(({ data }) => { if (data) setRecentProjects(data); });
    });
  }, []);

  // Load videos when a project is expanded
  const loadVideos = useCallback(async (projectId: string) => {
    if (projectVideos[projectId]) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('videos')
      .select('id, short_id, title, platform')
      .eq('project_id', projectId)
      .order('sort_order')
      .limit(10);
    if (data) {
      setProjectVideos(prev => ({ ...prev, [projectId]: data }));
    }
  }, [projectVideos]);

  const toggleProject = useCallback((projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
    } else {
      setExpandedProjectId(projectId);
      loadVideos(projectId);
    }
  }, [expandedProjectId, loadVideos]);

  const openCommandMenu = useCallback(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  }, []);

  return (
    <>
      <SidebarOrgHeader />

      <SidebarContent>
        {/* Búsqueda */}
        <SidebarGroup className="px-3 pt-0 pb-1">
          <button
            onClick={openCommandMenu}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left text-xs">Buscar...</span>
            <kbd className="text-[10px] text-muted-foreground/40 font-mono">⌘K</kbd>
          </button>
        </SidebarGroup>

        {/* Navegación principal */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip="Dashboard" render={<Link href="/dashboard" />}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/dashboard/shared'} tooltip="Compartidos" render={<Link href="/dashboard/shared" />}>
                <Share2 className="h-4 w-4" />
                <span>Compartidos</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/dashboard/publications'} tooltip="Publicaciones" render={<Link href="/dashboard/publications" />}>
                <CalendarDays className="h-4 w-4" />
                <span>Publicaciones</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Kiyoko IA" onClick={openCommandMenu}>
                <Sparkles className="h-4 w-4" />
                <span>Kiyoko IA</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Recientes — proyectos desplegables con vídeos */}
        <SidebarGroup>
          <SidebarGroupLabel>Recientes</SidebarGroupLabel>
          <SidebarMenu>
            {recentProjects.map((proj) => {
              const isExpanded = expandedProjectId === proj.id;
              const isHovered = hoveredProjectId === proj.id;
              const videos = projectVideos[proj.id] ?? [];

              return (
                <SidebarMenuItem
                  key={proj.id}
                  onMouseEnter={() => setHoveredProjectId(proj.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                >
                  <SidebarMenuButton
                    isActive={pathname.startsWith(`/project/${proj.short_id}`)}
                    tooltip={proj.title}
                    render={<Link href={`/project/${proj.short_id}`} />}
                    className="pr-14"
                  >
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProject(proj.id); }}
                      className="shrink-0"
                    >
                      <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', isExpanded && 'rotate-90')} />
                    </button>
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="truncate">{proj.title}</span>
                  </SidebarMenuButton>

                  {/* Hover actions: ··· y + */}
                  {isHovered && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                        title="Opciones"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/project/${proj.short_id}/videos`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                        title="Nuevo vídeo"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* Videos dentro del proyecto expandido */}
                  {isExpanded && (
                    <SidebarMenuSub>
                      {videos.map((video) => (
                        <SidebarMenuSubItem key={video.id}>
                          <SidebarMenuSubButton
                            render={<Link href={`/project/${proj.short_id}/video/${video.short_id}`} />}
                            isActive={pathname.startsWith(`/project/${proj.short_id}/video/${video.short_id}`)}
                          >
                            <Film className="h-3 w-3" />
                            <span className="truncate">{video.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                      {videos.length === 0 && (
                        <SidebarMenuSubItem>
                          <div className="px-2 py-1.5 text-[11px] text-muted-foreground/50">Sin vídeos</div>
                        </SidebarMenuSubItem>
                      )}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          render={<Link href={`/project/${proj.short_id}/videos`} />}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="text-muted-foreground">Nuevo vídeo</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            })}

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Nuevo proyecto" render={<Link href="/new" />}>
                <Plus className="h-4 w-4" />
                <span>Nuevo proyecto</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === '/admin'} tooltip="Panel admin" render={<Link href="/admin" />}>
                  <BarChart3 className="h-4 w-4" />
                  <span>Panel admin</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === '/admin/users'} tooltip="Usuarios" render={<Link href="/admin/users" />}>
                  <Users className="h-4 w-4" />
                  <span>Usuarios</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Cuenta */}
        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === '/settings' || pathname === '/settings/api-keys'} tooltip="Ajustes" render={<Link href="/settings" />}>
                <Settings className="h-4 w-4" />
                <span>Ajustes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/organizations')} tooltip="Organizaciones" render={<Link href="/organizations" />}>
                <Building2 className="h-4 w-4" />
                <span>Organizaciones</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarUserFooter />
    </>
  );
}
