'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, MoreHorizontal, Plus, FolderClosed,
  Link2, Copy, Pencil, Star, Trash2, ExternalLink, Share2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarVideoItem } from './SidebarVideoItem';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-400',
  in_progress: 'bg-blue-400',
  review: 'bg-amber-400',
  completed: 'bg-emerald-400',
  archived: 'bg-zinc-500',
};

interface Project {
  id: string;
  short_id: string;
  title: string;
  client_name: string | null;
  status: string;
}

export function SidebarProjectItem({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const projectIsFavorite = isFavorite(project.id);
  const isActive = pathname.startsWith(`/project/${project.short_id}`);

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
    enabled: expanded,
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/project/${project.short_id}`);
    toast.success('Link copiado');
  };

  return (
    <li>
      {/* Project row */}
      <div className="group/project relative">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center gap-1.5 rounded-md px-2 h-8 text-[13px] transition-colors',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          )}
        >
          {/* Folder icon (default) → Chevron (on hover/expanded) */}
          <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
            <FolderClosed
              className={cn(
                'h-4 w-4 text-sidebar-foreground/50 transition-opacity duration-150',
                'group-hover/project:opacity-0',
                expanded && 'opacity-0',
              )}
            />
            <ChevronRight
              className={cn(
                'absolute inset-0 m-auto h-3.5 w-3.5 text-sidebar-foreground/50 transition-all duration-150',
                'opacity-0 group-hover/project:opacity-100',
                expanded && 'opacity-100 rotate-90',
              )}
            />
          </span>
          {/* Title — extra right padding on hover so buttons don't overlap */}
          <span className="truncate flex-1 text-left group-hover/project:pr-14">{project.title}</span>
        </button>

        {/* Hover actions: + and ··· side by side */}
        <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0.5 opacity-0 group-hover/project:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); router.push(`/project/${project.short_id}/videos`); }}
            className="flex items-center justify-center size-6 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
            title="Nuevo vídeo"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center size-6 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/project/${project.short_id}`}>
                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> Abrir proyecto
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="mr-2 h-3.5 w-3.5" /> Copiar link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/project/${project.short_id}/settings/sharing`)}>
                <Share2 className="mr-2 h-3.5 w-3.5" /> Compartir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Renombrar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleFavorite(project.id)}>
                <Star className={cn('mr-2 h-3.5 w-3.5', projectIsFavorite && 'fill-yellow-500 text-yellow-500')} />
                {projectIsFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400 focus:text-red-400">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded videos */}
      {expanded && (
        <ul className="ml-4 border-l border-sidebar-border pl-3 py-0.5 flex flex-col gap-0.5">
          {loadingVideos && (
            <li className="px-2 py-1 text-xs text-sidebar-foreground/40 animate-pulse">Cargando…</li>
          )}
          {videos?.map((video) => (
            <SidebarVideoItem
              key={video.id}
              video={video}
              projectShortId={project.short_id}
            />
          ))}
          {videos && videos.length === 0 && (
            <li className="px-2 py-1 text-xs text-sidebar-foreground/40">Sin vídeos</li>
          )}
          <li>
            <button
              type="button"
              onClick={() => router.push(`/project/${project.short_id}/videos`)}
              className="flex w-full items-center gap-2 rounded-md px-2 h-7 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Nuevo vídeo</span>
            </button>
          </li>
        </ul>
      )}
    </li>
  );
}
