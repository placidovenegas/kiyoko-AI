'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import { cn } from '@/lib/utils/cn';
import { Film, Users, Clock, Monitor } from 'lucide-react';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import { useFavorites } from '@/hooks/useFavorites';

export interface Project {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  style: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  target_platform: string | null;
  total_scenes: number;
  total_characters: number;
  total_backgrounds: number;
  estimated_duration_seconds: number | null;
  completion_percentage: number;
  cover_image_url: string | null;
  is_demo: boolean;
  updated_at: string;
}

const STATUS_LABELS: Record<Project['status'], string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  completed: 'Completado',
  archived: 'Archivado',
};

const STATUS_COLORS: Record<Project['status'], string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  in_progress: 'bg-brand-500/20 text-brand-500',
  completed: 'bg-green-500/20 text-green-400',
  archived: 'bg-gray-500/10 text-gray-500',
};

const PROGRESS_COLORS: Record<Project['status'], string> = {
  draft: 'bg-gray-500',
  in_progress: 'bg-brand-500',
  completed: 'bg-green-500',
  archived: 'bg-gray-400',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function ProjectCard({ project }: { project: Project }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const timeAgo = formatDistanceToNow(new Date(project.updated_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Link
      href={`/project/${project.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-surface-tertiary bg-surface',
        'transition-all duration-200',
        'hover:border-brand-500/30 hover:shadow-lg hover:shadow-black/10',
      )}
    >
      {/* Cover */}
      <div className="relative aspect-video w-full overflow-hidden">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-500/20 via-brand-500/10 to-transparent">
            <Film className="h-12 w-12 text-brand-500/30" />
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

        {/* Favorite */}
        <div className="absolute left-2 top-2 z-10">
          <FavoriteButton
            isFavorite={isFavorite(project.id)}
            onToggle={() => toggleFavorite(project.id)}
            size={18}
            className="drop-shadow-md"
          />
        </div>

        {/* Demo badge */}
        {project.is_demo && (
          <div className="absolute -right-8 top-3 rotate-45 bg-brand-500 px-8 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            DEMO
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Tags: style + platform */}
        <div className="flex flex-wrap gap-1.5">
          {project.style && (
            <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-[11px] font-medium text-foreground-secondary">
              {project.style}
            </span>
          )}
          {project.target_platform && (
            <span className="flex items-center gap-1 rounded-md bg-surface-tertiary px-2 py-0.5 text-[11px] font-medium text-foreground-secondary">
              <Monitor className="h-3 w-3" />
              {project.target_platform}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-foreground-secondary">
          <span className="flex items-center gap-1">
            <Film className="h-3.5 w-3.5 text-foreground-muted" />
            {project.total_scenes}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-foreground-muted" />
            {project.total_characters}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-foreground-muted" />
            {formatDuration(project.estimated_duration_seconds)}
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className={cn('h-full rounded-full transition-all duration-300', PROGRESS_COLORS[project.status])}
              style={{ width: `${project.completion_percentage}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-foreground-muted">
            {project.completion_percentage}%
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[project.status])}>
            {STATUS_LABELS[project.status]}
          </span>
          <span className="text-[11px] text-foreground-muted">{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}
