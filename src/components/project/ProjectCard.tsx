'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import { cn } from '@/lib/utils/cn';
import {
  IconMovie,
  IconUsers,
  IconClock,
} from '@tabler/icons-react';

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

const statusLabels: Record<Project['status'], string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  completed: 'Completado',
  archived: 'Archivado',
};

const statusColors: Record<Project['status'], string> = {
  draft: '#6b7280',
  in_progress: 'var(--color-brand-500, #8b5cf6)',
  completed: '#22c55e',
  archived: '#9ca3af',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function ProjectCard({ project }: { project: Project }) {
  const timeAgo = formatDistanceToNow(new Date(project.updated_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Link
      href={`/p/${project.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-surface-tertiary bg-surface',
        'transition-all duration-150 ease-in-out',
        'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/10 hover:border-brand-500/30',
        'sm:max-w-none',
      )}
    >
      {/* Cover image with overlay */}
      <div className="relative aspect-video w-full overflow-hidden">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-500/20 via-brand-500/10 to-transparent">
            <IconMovie size={48} className="text-brand-500/30" />
          </div>
        )}

        {/* Gradient overlay at bottom for text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

        {/* Title + client overlaid on cover */}
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

        {/* DEMO ribbon */}
        {project.is_demo && (
          <div className="absolute -right-8 top-3 rotate-45 bg-brand-500 px-8 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            DEMO
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-foreground-secondary">
          <span className="flex items-center gap-1">
            <IconMovie size={14} className="text-foreground-muted" />
            {project.total_scenes}
          </span>
          <span className="flex items-center gap-1">
            <IconUsers size={14} className="text-foreground-muted" />
            {project.total_characters}
          </span>
          <span className="flex items-center gap-1">
            <IconClock size={14} className="text-foreground-muted" />
            {formatDuration(project.estimated_duration_seconds)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${project.completion_percentage}%`,
                backgroundColor: statusColors[project.status],
              }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-foreground-muted">
            {project.completion_percentage}%
          </span>
        </div>

        {/* Footer: status badge + time */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
            style={{ backgroundColor: statusColors[project.status] }}
          >
            {statusLabels[project.status]}
          </span>
          <span className="text-[11px] text-foreground-muted">
            {timeAgo}
          </span>
        </div>
      </div>
    </Link>
  );
}
