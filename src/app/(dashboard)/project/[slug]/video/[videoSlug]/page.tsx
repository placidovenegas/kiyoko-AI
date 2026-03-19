'use client';

import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import Link from 'next/link';
import { KButton } from '@/components/ui/kiyoko-button';
import {
  Film, Clock, Monitor, ArrowRight, Layers, ScrollText,
  Mic, FileOutput, Video, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', planning: 'Planificando', in_progress: 'En progreso',
  review: 'Revisión', approved: 'Aprobado', published: 'Publicado',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400', in_progress: 'bg-amber-500/20 text-amber-400',
  review: 'bg-purple-500/20 text-purple-400', approved: 'bg-green-500/20 text-green-400',
  published: 'bg-cyan-500/20 text-cyan-400',
};

const QUICK_LINKS = [
  { label: 'Storyboard', href: '/storyboard', icon: Film, desc: 'Gestiona las escenas del video' },
  { label: 'Guion', href: '/script', icon: ScrollText, desc: 'Narración y textos' },
  { label: 'Narración', href: '/narration', icon: Mic, desc: 'Genera audio con IA' },
  { label: 'Exportar', href: '/export', icon: FileOutput, desc: 'PDF, HTML, JSON, MP3' },
] as const;

export default function VideoOverviewPage() {
  const { project } = useProject();
  const { video, loading, scenes, scenesLoading } = useVideo();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (!video || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Video className="h-10 w-10 text-foreground-muted" />
        <h3 className="mt-4 text-lg font-semibold">Video no encontrado</h3>
        <Link href={`/project/${project?.slug}`} className="mt-3 text-sm text-brand-500 hover:text-brand-600">
          Volver al proyecto
        </Link>
      </div>
    );
  }

  const basePath = `/project/${project.slug}/video/${video.slug}`;
  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10">
              <Video className="h-6 w-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{video.name}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-foreground-muted">
                <span className="flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5" />
                  {video.platform}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {video.target_duration_seconds}s objetivo
                </span>
                {video.aspect_ratio && <span>{video.aspect_ratio}</span>}
              </div>
            </div>
          </div>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-medium', STATUS_COLORS[video.status] ?? 'bg-gray-500/20 text-gray-400')}>
          {STATUS_LABELS[video.status] ?? video.status}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-surface-tertiary bg-surface p-4">
          <p className="text-2xl font-bold text-foreground">{scenesLoading ? '...' : scenes.length}</p>
          <p className="text-xs text-foreground-muted">Escenas</p>
        </div>
        <div className="rounded-xl border border-surface-tertiary bg-surface p-4">
          <p className="text-2xl font-bold text-foreground">{video.target_duration_seconds}s</p>
          <p className="text-xs text-foreground-muted">Duración objetivo</p>
        </div>
        <div className="rounded-xl border border-surface-tertiary bg-surface p-4">
          <p className="text-2xl font-bold text-foreground">{scenesLoading ? '...' : `${totalDuration}s`}</p>
          <p className="text-xs text-foreground-muted">Duración actual</p>
        </div>
        <div className="rounded-xl border border-surface-tertiary bg-surface p-4">
          <p className="text-2xl font-bold text-foreground">{video.aspect_ratio ?? '--'}</p>
          <p className="text-xs text-foreground-muted">Aspect ratio</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={`${basePath}${link.href}`}
            className="group flex items-center gap-4 rounded-xl border border-surface-tertiary bg-surface p-5 transition hover:border-brand-500/30 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white">
              <link.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">{link.label}</h3>
              <p className="text-xs text-foreground-muted">{link.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-foreground-muted opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* Description */}
      {video.description && (
        <div className="rounded-xl border border-surface-tertiary bg-surface p-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground-muted">Descripción</h3>
          <p className="text-sm leading-relaxed text-foreground-secondary">{video.description}</p>
        </div>
      )}
    </div>
  );
}
