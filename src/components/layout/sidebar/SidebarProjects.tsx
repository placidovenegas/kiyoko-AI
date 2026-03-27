'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronRight, FolderClosed, Film } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { useSidebar } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils/cn';
import { SidebarProjectItem } from './SidebarProjectItem';

const MAX_VISIBLE = 5;

interface ProjectMini {
  id: string;
  short_id: string;
  title: string;
  client_name: string | null;
  status: string;
}

// Project row inside collapsed popover — CSS-based hover submenu (no flicker)
function CollapsedProjectRow({ project, pathname }: { project: ProjectMini; pathname: string }) {
  const supabase = createClient();
  const isActive = pathname.startsWith(`/project/${project.short_id}`);

  // Always fetch videos for collapsed popover items (they're few)
  const { data: videos } = useQuery({
    queryKey: queryKeys.videos.byProject(project.id),
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, short_id, title, platform, status')
        .eq('project_id', project.id)
        .order('sort_order');
      return data ?? [];
    },
  });

  const hasVideos = videos && videos.length > 0;

  return (
    <div className="group/cprow relative">
      <Link
        href={`/project/${project.short_id}`}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 h-8 text-[13px] transition-colors',
          isActive ? 'bg-accent font-medium text-foreground' : 'text-foreground/80 hover:bg-accent',
        )}
      >
        <FolderClosed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate flex-1">{project.title}</span>
        {hasVideos && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
      </Link>

      {/* CSS hover submenu — no state, no flicker */}
      {hasVideos && (
        <div className="invisible opacity-0 group-hover/cprow:visible group-hover/cprow:opacity-100 transition-opacity duration-100 absolute left-full top-0 ml-1 z-50">
          <div className="w-48 rounded-lg border border-border bg-popover p-1 shadow-lg">
            <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground">Vídeos</p>
            {videos.map((v) => (
              <Link
                key={v.id}
                href={`/project/${project.short_id}/video/${v.short_id}`}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors',
                  pathname.startsWith(`/project/${project.short_id}/video/${v.short_id}`)
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-foreground/80 hover:bg-accent',
                )}
              >
                <Film className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                <span className="truncate">{v.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarProjects() {
  const supabase = createClient();
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [showAll, setShowAll] = useState(false);

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, short_id, title, client_name, status')
        .order('updated_at', { ascending: false });
      return data ?? [];
    },
  });

  const visible = showAll ? projects : projects?.slice(0, MAX_VISIBLE);
  const hasMore = (projects?.length ?? 0) > MAX_VISIBLE;

  // ── Collapsed: folder icon → popover ──
  if (isCollapsed) {
    return (
      <div className="px-2 py-0.5">
        <Popover>
          <Tooltip>
            <Tooltip.Trigger>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                >
                  <FolderClosed className="h-4 w-4" />
                </button>
              </PopoverTrigger>
            </Tooltip.Trigger>
            <Tooltip.Content placement="right">Proyectos</Tooltip.Content>
          </Tooltip>
          <PopoverContent side="right" align="start" sideOffset={8} className="w-60 p-1 overflow-visible">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-[11px] font-medium text-muted-foreground">Proyectos</p>
              <Link
                href="/new"
                className="flex items-center justify-center size-5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            {projects?.map((p) => (
              <CollapsedProjectRow key={p.id} project={p} pathname={pathname} />
            ))}
            {(!projects || projects.length === 0) && (
              <p className="px-2 py-2 text-xs text-muted-foreground">Sin proyectos</p>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // ── Expanded: full list ──
  return (
    <div className="px-1.5 py-1">
      <div className="flex items-center justify-between px-2 h-7 mb-0.5">
        <span className="text-[11px] font-medium tracking-wide text-sidebar-foreground/50">Proyectos</span>
        <Link
          href="/new"
          className="flex items-center justify-center size-5 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
          title="Nuevo proyecto"
        >
          <Plus className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="flex flex-col gap-0.5">
        {visible?.map((project) => (
          <SidebarProjectItem key={project.id} project={project} />
        ))}
        {(!projects || projects.length === 0) && (
          <li className="px-2 py-2 text-xs text-sidebar-foreground/40">Sin proyectos</li>
        )}
        {hasMore && (
          <li>
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="flex w-full items-center gap-2 rounded-md px-2 h-7 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${showAll ? 'rotate-180' : ''}`} />
              <span>{showAll ? 'Ver menos' : `Ver ${(projects?.length ?? 0) - MAX_VISIBLE} más`}</span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
