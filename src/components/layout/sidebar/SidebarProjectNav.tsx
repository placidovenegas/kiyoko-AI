'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Film, Palette, Users, Mountain,
  Paintbrush, FileText, Smartphone, CheckSquare,
  Settings, Bot, UserPlus, ChevronRight, Plus, FolderClosed,
} from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { useSidebar } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils/cn';

interface Props {
  projectShortId: string;
}

// ── Shared item components ─────────────────────────────────────────────────

function NavItem({ href, icon: Icon, label, pathname, isCollapsed }: {
  href: string; icon: React.ElementType; label: string; pathname: string; isCollapsed: boolean;
}) {
  const isActive = pathname === href || pathname.startsWith(href + '/');
  const btn = (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-md transition-colors cursor-pointer',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isCollapsed ? 'justify-center size-8' : 'w-full gap-2.5 px-2 h-8 text-[13px]',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
  return (
    <li>
      {isCollapsed ? (
        <Tooltip>
          <Tooltip.Trigger>{btn}</Tooltip.Trigger>
          <Tooltip.Content placement="right">{label}</Tooltip.Content>
        </Tooltip>
      ) : btn}
    </li>
  );
}

const VIDEO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-400',
  prompting: 'bg-blue-400',
  generating: 'bg-amber-400',
  review: 'bg-purple-400',
  approved: 'bg-emerald-400',
  exported: 'bg-emerald-600',
};

function VideoItem({ href, label, status, pathname }: { href: string; label: string; status?: string; pathname: string }) {
  const isActive = pathname.startsWith(href);
  const dotColor = VIDEO_STATUS_COLORS[status ?? 'draft'] ?? 'bg-zinc-400';
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
        <Film className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

function SubNavItem({ href, icon: Icon, label, pathname }: { href: string; icon: React.ElementType; label: string; pathname: string }) {
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function SidebarProjectNav({ projectShortId }: Props) {
  const pathname = usePathname();
  const supabase = createClient();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const base = `/project/${projectShortId}`;
  const [resourcesOpen, setResourcesOpen] = useState(pathname.startsWith(`${base}/resources`));

  const { data: project } = useQuery({
    queryKey: ['project-nav', projectShortId],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, title')
        .eq('short_id', projectShortId)
        .single();
      return data;
    },
  });

  const { data: videos } = useQuery({
    queryKey: queryKeys.videos.byProject(project?.id ?? ''),
    queryFn: async () => {
      if (!project) return [];
      const { data } = await supabase
        .from('videos')
        .select('id, short_id, title, status')
        .eq('project_id', project.id)
        .order('sort_order');
      return data ?? [];
    },
    enabled: !!project?.id,
  });

  // ── Collapsed ────────────────────────────────────────────────────────────

  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-0">
        {/* Main nav icons */}
        <div className="px-2 py-1.5">
          <ul className="flex flex-col gap-0.5">
            <NavItem href={base} icon={LayoutDashboard} label="Vista general" pathname={pathname} isCollapsed />
            <NavItem href={`${base}/tasks`} icon={CheckSquare} label="Tareas" pathname={pathname} isCollapsed />
            <NavItem href={`${base}/publications`} icon={Smartphone} label="Publicaciones" pathname={pathname} isCollapsed />
          </ul>
        </div>

        <div className="mx-3 h-px bg-sidebar-border" />

        {/* Videos popover */}
        <div className="px-2 py-0.5">
          <Popover>
            <Tooltip>
              <Tooltip.Trigger>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                  >
                    <Film className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
              </Tooltip.Trigger>
              <Tooltip.Content placement="right">Videos</Tooltip.Content>
            </Tooltip>
            <PopoverContent side="right" align="start" sideOffset={8} className="w-52 p-1">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-[11px] font-medium text-muted-foreground">Videos</p>
                <Link href={`${base}/videos`} className="flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              </div>
              {videos?.map((v) => {
                const dotColor = VIDEO_STATUS_COLORS[v.status ?? 'draft'] ?? 'bg-zinc-400';
                return (
                  <Link
                    key={v.id}
                    href={`${base}/video/${v.short_id}`}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors',
                      pathname.startsWith(`${base}/video/${v.short_id}`)
                        ? 'bg-accent font-medium text-foreground'
                        : 'text-foreground/80 hover:bg-accent',
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
                    <Film className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{v.title}</span>
                  </Link>
                );
              })}
              {videos && videos.length === 0 && (
                <p className="px-2 py-2 text-xs text-muted-foreground">Sin vídeos</p>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Resources popover */}
        <div className="px-2 py-0.5">
          <Popover>
            <Tooltip>
              <Tooltip.Trigger>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                  >
                    <Palette className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
              </Tooltip.Trigger>
              <Tooltip.Content placement="right">Recursos</Tooltip.Content>
            </Tooltip>
            <PopoverContent side="right" align="start" sideOffset={8} className="w-48 p-1">
              <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">Recursos</p>
              {[
                { href: `${base}/resources/characters`, icon: Users, label: 'Personajes' },
                { href: `${base}/resources/backgrounds`, icon: Mountain, label: 'Fondos' },
                { href: `${base}/resources/styles`, icon: Paintbrush, label: 'Estilos' },
                { href: `${base}/resources/templates`, icon: FileText, label: 'Templates' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors',
                    (pathname === item.href || pathname.startsWith(item.href + '/'))
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-foreground/80 hover:bg-accent',
                  )}
                >
                  <item.icon className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <div className="mx-3 h-px bg-sidebar-border" />

        {/* Settings icons */}
        <div className="px-2 py-1.5">
          <ul className="flex flex-col gap-0.5">
            <NavItem href={`${base}/settings`} icon={Settings} label="General" pathname={pathname} isCollapsed />
            <NavItem href={`${base}/settings/ai`} icon={Bot} label="Director IA" pathname={pathname} isCollapsed />
            <NavItem href={`${base}/settings/sharing`} icon={UserPlus} label="Compartir" pathname={pathname} isCollapsed />
          </ul>
        </div>
      </div>
    );
  }

  // ── Expanded ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0">
      {/* Main nav */}
      <div className="px-1.5 py-1.5">
        <ul className="flex flex-col gap-0.5">
          <NavItem href={base} icon={LayoutDashboard} label="Vista general" pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/tasks`} icon={CheckSquare} label="Tareas" pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/publications`} icon={Smartphone} label="Publicaciones" pathname={pathname} isCollapsed={false} />
        </ul>
      </div>

      <div className="mx-3 h-px bg-sidebar-border" />

      {/* Videos */}
      <div className="px-1.5 py-1.5">
        <div className="flex items-center justify-between px-2 h-7 mb-0.5">
          <span className="text-[11px] font-medium tracking-wide text-sidebar-foreground/50">Videos</span>
          <Link
            href={`${base}/videos`}
            className="flex items-center justify-center size-5 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            title="Nuevo vídeo"
          >
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="flex flex-col gap-0.5">
          {videos?.map((video) => (
            <VideoItem key={video.id} href={`${base}/video/${video.short_id}`} label={video.title} status={video.status ?? undefined} pathname={pathname} />
          ))}
          {videos && videos.length === 0 && (
            <li className="px-2 py-1 text-xs text-sidebar-foreground/40">Sin vídeos</li>
          )}
        </ul>
      </div>

      <div className="mx-3 h-px bg-sidebar-border" />

      {/* Recursos expandible — same style as project expand in dashboard */}
      <div className="px-1.5 py-1.5">
        <button
          type="button"
          onClick={() => setResourcesOpen(!resourcesOpen)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 h-8 text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
        >
          <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
            <Palette className={cn('h-4 w-4 text-sidebar-foreground/50 transition-opacity duration-150', resourcesOpen && 'opacity-0')} />
            <ChevronRight className={cn(
              'absolute inset-0 m-auto h-3.5 w-3.5 text-sidebar-foreground/50 transition-all duration-150 opacity-0',
              resourcesOpen && 'opacity-100 rotate-90',
            )} />
          </span>
          <span className="truncate flex-1 text-left">Recursos</span>
          <ChevronRight className={cn('h-3 w-3 text-sidebar-foreground/30 transition-transform duration-150', resourcesOpen && 'rotate-90')} />
        </button>
        {resourcesOpen && (
          <ul className="ml-4 border-l border-sidebar-border pl-3 py-0.5 flex flex-col gap-0.5 mt-0.5">
            <SubNavItem href={`${base}/resources/characters`} icon={Users} label="Personajes" pathname={pathname} />
            <SubNavItem href={`${base}/resources/backgrounds`} icon={Mountain} label="Fondos" pathname={pathname} />
            <SubNavItem href={`${base}/resources/styles`} icon={Paintbrush} label="Estilos" pathname={pathname} />
            <SubNavItem href={`${base}/resources/templates`} icon={FileText} label="Templates" pathname={pathname} />
          </ul>
        )}
      </div>

      <div className="mx-3 h-px bg-sidebar-border" />

      {/* Ajustes */}
      <div className="px-1.5 py-1.5">
        <div className="flex items-center px-2 h-7 mb-0.5">
          <span className="text-[11px] font-medium tracking-wide text-sidebar-foreground/50">Ajustes</span>
        </div>
        <ul className="flex flex-col gap-0.5">
          <NavItem href={`${base}/settings`} icon={Settings} label="General" pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/settings/ai`} icon={Bot} label="Director IA" pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/settings/sharing`} icon={UserPlus} label="Compartir" pathname={pathname} isCollapsed={false} />
        </ul>
      </div>
    </div>
  );
}
