'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, MoreHorizontal, Plus, FolderOpen, Film,
  Link2, Copy, Pencil, Star, Trash2, ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { useFavorites } from '@/hooks/useFavorites';
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

const STATUS_DOT_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500',
  in_progress: 'bg-blue-500',
  review: 'bg-purple-500',
  completed: 'bg-emerald-500',
  archived: 'bg-zinc-600',
};

interface Project {
  id: string;
  short_id: string;
  title: string;
  client_name: string | null;
  status: string;
}

interface Props {
  project: Project;
}

export function SidebarProjectItem({ project }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showCreateVideo, setShowCreateVideo] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const projectIsFavorite = isFavorite(project.id);
  const isActive = pathname.startsWith(`/project/${project.short_id}`);

  // Lazy load videos when expanded
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
  };

  return (
    <>
      <SidebarMenuItem className="group/project relative">
        <SidebarMenuButton
          onClick={() => setExpanded(!expanded)}
          tooltip={project.title}
          isActive={isActive}
        >
          {/* Dot de estado (visible por defecto) → se reemplaza por chevron en hover */}
          <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
            {/* Dot: visible cuando NO hover */}
            <span
              className={cn(
                'h-2 w-2 rounded-full transition-opacity group-hover/project:opacity-0',
                STATUS_DOT_COLORS[project.status] ?? 'bg-zinc-500'
              )}
            />
            {/* Chevron: visible cuando hover */}
            <ChevronRight
              className={cn(
                'absolute inset-0 m-auto h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover/project:opacity-100',
                expanded && 'rotate-90'
              )}
            />
          </span>

          {/* Icono carpeta (visible por defecto) → desaparece en hover */}
          <FolderOpen className="h-4 w-4 shrink-0 transition-opacity group-hover/project:opacity-0" />

          <span className="truncate">{project.title}</span>
        </SidebarMenuButton>

        {/* Hover actions: ··· y + */}
        <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0.5 opacity-0 group-hover/project:opacity-100 transition-opacity z-10">
          {/* Plus: crear nuevo vídeo */}
          <SidebarMenuAction
            showOnHover
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to videos page to create
              router.push(`/project/${project.short_id}/videos`);
            }}
            title="Nuevo vídeo"
          >
            <Plus className="h-4 w-4" />
          </SidebarMenuAction>

          {/* ··· Context menu */}
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
              <DropdownMenuItem onClick={() => toggleFavorite(project.id)}>
                <Star className={cn('mr-2 h-4 w-4', projectIsFavorite && 'fill-yellow-500 text-yellow-500')} />
                {projectIsFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400 focus:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>

      {/* Videos dentro del proyecto (expandidos) */}
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
              <SidebarMenuSubButton
                render={<Link href={`/project/${project.short_id}/video/${video.short_id}`} />}
                isActive={pathname.startsWith(`/project/${project.short_id}/video/${video.short_id}`)}
              >
                <Film className="h-3 w-3" />
                <span className="truncate">{video.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}

          {videos && videos.length === 0 && (
            <SidebarMenuSubItem>
              <div className="px-3 py-1 text-xs text-muted-foreground">Sin vídeos</div>
            </SidebarMenuSubItem>
          )}

          <SidebarMenuSubItem>
            <SidebarMenuSubButton
              className="text-muted-foreground hover:text-foreground"
              onClick={() => router.push(`/project/${project.short_id}/videos`)}
            >
              <Plus className="h-3 w-3" />
              <span>Nuevo vídeo</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      )}
    </>
  );
}
