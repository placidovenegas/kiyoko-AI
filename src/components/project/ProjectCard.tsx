'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { Film, FolderOpen, Pencil, Copy, Archive, Trash2, MoreHorizontal, FileOutput } from 'lucide-react';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import { useFavorites } from '@/hooks/useFavorites';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/types';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGE } from '@/lib/constants/status';

export type { Project };

function ConfirmDeleteModal({
  projectTitle,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  projectTitle: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  const isMatch = confirmText === projectTitle;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-400" />
          <h3 className="text-base font-semibold text-foreground">Eliminar proyecto</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Esta accion no se puede deshacer. Se eliminaran todos los videos, escenas, personajes y fondos.
        </p>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Escribe el nombre del proyecto para confirmar:
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={projectTitle}
          className={cn(
            'mb-4 h-10 w-full rounded-lg border bg-input px-3 text-sm text-foreground',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
            isMatch ? 'border-green-500' : 'border-border',
          )}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-secondary transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isMatch || loading}
            className={cn(
              'h-9 rounded-lg px-4 text-sm font-medium text-white transition',
              isMatch
                ? 'bg-red-600 hover:bg-red-700'
                : 'cursor-not-allowed bg-red-600 opacity-50',
            )}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showDelete, setShowDelete] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const timeAgo = project.updated_at
    ? formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: es })
    : '';

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowDelete(false);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: `${project.title} (copia)`,
          short_id: (await import('@/lib/utils/nanoid')).generateShortId(),
          slug: `${project.slug}-copy-${Date.now().toString(36)}`,
          description: project.description,
          client_name: project.client_name,
          style: project.style,
          tags: project.tags,
          color_palette: project.color_palette,
          status: 'draft' as const,
          owner_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('projects')
        .update({ status: 'archived' as const })
        .eq('id', project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card',
          'transition-all duration-200',
          'hover:border-primary/30 hover:shadow-lg hover:shadow-black/10',
        )}
      >
        {/* Cover - clickable to navigate */}
        <Link href={`/project/${project.short_id}`} className="relative aspect-video w-full overflow-hidden">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-[#8B5CF6]/10 to-transparent">
              <Film className="h-12 w-12 text-primary/30" />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="truncate text-base font-bold text-white drop-shadow-sm">
              {project.title}
            </h3>
            {project.client_name && (
              <p className="mt-0.5 truncate text-xs text-white/70">
                {project.client_name}
              </p>
            )}
          </div>

          {/* Demo badge */}
          {project.is_demo && (
            <div className="absolute -right-8 top-3 rotate-45 bg-primary px-8 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              DEMO
            </div>
          )}
        </Link>

        {/* Favorite - absolute on cover */}
        <div className="absolute left-2 top-2 z-10">
          <FavoriteButton
            isFavorite={isFavorite(project.id)}
            onToggle={() => toggleFavorite(project.id)}
            size={18}
            className="drop-shadow-md"
          />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {project.style && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {project.style}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto">
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', PROJECT_STATUS_BADGE[project.status] ?? 'bg-muted0/20 text-muted-foreground')}>
              {PROJECT_STATUS_LABELS[project.status] ?? project.status}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
              {/* Dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuItem onClick={() => router.push(`/project/${project.short_id}`)}>
                    <FolderOpen className="h-4 w-4" />
                    Abrir proyecto
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/project/${project.short_id}/settings`)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateMutation.mutate()}>
                    <Copy className="h-4 w-4" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => archiveMutation.mutate()}>
                    <Archive className="h-4 w-4" />
                    Archivar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowDelete(true)}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        projectTitle={project.title}
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
