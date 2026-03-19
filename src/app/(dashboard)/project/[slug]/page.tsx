'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import { cn } from '@/lib/utils/cn';
import { useProject } from '@/contexts/ProjectContext';
import { KButton } from '@/components/ui/kiyoko-button';
import type { Scene } from '@/types/scene';
import {
  Film, Users, Image, Clock, Layout, Sparkles,
  Download, Settings, ChevronRight, Pencil, Video,
  Plus,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  completed: 'Completado',
  archived: 'Archivado',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  in_progress: 'bg-brand-500/20 text-brand-500',
  completed: 'bg-green-500/20 text-green-400',
  archived: 'bg-gray-500/10 text-gray-500',
};

const PROGRESS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  in_progress: 'bg-brand-500',
  completed: 'bg-green-500',
  archived: 'bg-gray-400',
};

interface VideoRow {
  id: string;
  name: string;
  platform: string | null;
  target_duration_seconds: number | null;
  status: string;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '--';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function ProjectOverviewPage() {
  const { project, loading: projectLoading } = useProject();

  const [scenesCount, setScenesCount] = useState(0);
  const [charactersCount, setCharactersCount] = useState(0);
  const [backgroundsCount, setBackgroundsCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [recentScenes, setRecentScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project) return;
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);
      const [
        { count: sCount },
        { count: cCount },
        { count: bCount },
        { count: vCount },
        { data: vData },
        { data: sceneData },
      ] = await Promise.all([
        supabase.from('scenes').select('*', { count: 'exact', head: true }).eq('project_id', project!.id),
        supabase.from('characters').select('*', { count: 'exact', head: true }).eq('project_id', project!.id),
        supabase.from('backgrounds').select('*', { count: 'exact', head: true }).eq('project_id', project!.id),
        supabase.from('video_cuts').select('*', { count: 'exact', head: true }).eq('project_id', project!.id),
        supabase.from('video_cuts').select('id, name, platform, target_duration_seconds, status').eq('project_id', project!.id).order('sort_order'),
        supabase.from('scenes').select('*').eq('project_id', project!.id).order('updated_at', { ascending: false }).limit(5),
      ]);

      setScenesCount(sCount ?? 0);
      setCharactersCount(cCount ?? 0);
      setBackgroundsCount(bCount ?? 0);
      setVideosCount(vCount ?? 0);
      setVideos((vData as VideoRow[]) ?? []);
      setRecentScenes((sceneData as Scene[]) ?? []);
      setLoading(false);
    }

    fetchData();
  }, [project]);

  if (projectLoading || loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-48 animate-pulse rounded-2xl bg-surface-secondary" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-surface-secondary" />
          <div className="h-64 animate-pulse rounded-xl bg-surface-secondary" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Film className="h-10 w-10 text-foreground-muted" />
        <h3 className="mt-4 text-lg font-semibold">Proyecto no encontrado</h3>
        <Link href="/dashboard" className="mt-3 text-sm text-brand-500 hover:text-brand-600">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const slug = project.slug;

  const stats = [
    { icon: Video, color: 'bg-pink-500/10 text-pink-500', label: 'Videos', value: videosCount },
    { icon: Film, color: 'bg-brand-500/10 text-brand-500', label: 'Escenas', value: scenesCount },
    { icon: Users, color: 'bg-emerald-500/10 text-emerald-500', label: 'Personajes', value: charactersCount },
    { icon: Image, color: 'bg-amber-500/10 text-amber-500', label: 'Fondos', value: backgroundsCount },
    { icon: Clock, color: 'bg-sky-500/10 text-sky-500', label: 'Duración', value: formatDuration(project.target_duration_seconds) },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Hero */}
      <div className="relative h-48 overflow-hidden rounded-2xl md:h-56">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt={project.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-brand-500 via-[#8B5CF6] to-[#EC4899]" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              {project.client_name && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/60">
                  {project.client_name}
                </p>
              )}
              <h1 className="text-2xl font-bold text-white drop-shadow-sm md:text-3xl">
                {project.title}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[project.status])}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
                {project.style && (
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70 backdrop-blur-sm">
                    {project.style}
                  </span>
                )}
                {project.target_platform && (
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70 backdrop-blur-sm">
                    {project.target_platform}
                  </span>
                )}
              </div>
            </div>
            <Link href={`/project/${slug}/settings`}>
              <KButton variant="ghost" size="sm" icon={<Settings className="h-4 w-4" />} className="text-white/80 hover:text-white hover:bg-white/10" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-surface-tertiary bg-surface p-4">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-foreground-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/project/${slug}/storyboard`}>
          <KButton icon={<Layout className="h-4 w-4" />}>Storyboard</KButton>
        </Link>
        <Link href={`/project/${slug}/videos`}>
          <KButton variant="secondary" icon={<Video className="h-4 w-4" />}>Videos</KButton>
        </Link>
        <Link href={`/project/${slug}/resources`}>
          <KButton variant="secondary" icon={<Users className="h-4 w-4" />}>Recursos</KButton>
        </Link>
        <Link href={`/project/${slug}/exports`}>
          <KButton variant="secondary" icon={<Download className="h-4 w-4" />}>Exportar</KButton>
        </Link>
      </div>

      {/* Videos + Recent scenes grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Videos del proyecto */}
        <div className="rounded-xl border border-surface-tertiary bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Videos
            </h3>
            <Link href={`/project/${slug}/videos`} className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600">
              <Plus className="h-3 w-3" />
              Nuevo
            </Link>
          </div>
          {videos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Video className="h-8 w-8 text-foreground-muted/40" />
              <p className="mt-2 text-sm text-foreground-muted">No hay videos</p>
              <Link href={`/project/${slug}/videos`} className="mt-2 text-xs text-brand-500 hover:text-brand-600">
                Crear primer video
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-surface-secondary">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10">
                    <Video className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{v.name}</p>
                    <p className="text-xs text-foreground-muted">
                      {v.platform ?? ''} {v.target_duration_seconds ? `· ${formatDuration(v.target_duration_seconds)}` : ''}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[v.status] ?? 'bg-gray-500/20 text-gray-400')}>
                    {STATUS_LABELS[v.status] ?? v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="rounded-xl border border-surface-tertiary bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Escenas recientes
            </h3>
            <Link href={`/project/${slug}/storyboard`} className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600">
              Ver todas
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentScenes.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Film className="h-8 w-8 text-foreground-muted/40" />
              <p className="mt-2 text-sm text-foreground-muted">No hay escenas aún</p>
              <Link href={`/project/${slug}/storyboard`} className="mt-2 text-xs text-brand-500 hover:text-brand-600">
                Crear primera escena
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScenes.map((scene) => (
                <Link
                  key={scene.id}
                  href={`/project/${slug}/storyboard#scene-${scene.id}`}
                  className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-surface-secondary"
                >
                  {scene.generated_image_thumbnail_url ? (
                    <img src={scene.generated_image_thumbnail_url} alt={scene.title} className="h-10 w-14 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-surface-tertiary text-[10px] font-medium text-foreground-muted">
                      {scene.scene_number}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {scene.scene_number}. {scene.title}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {scene.updated_at
                        ? formatDistanceToNow(new Date(scene.updated_at), { addSuffix: true, locale: es })
                        : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted opacity-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project info */}
      <div className="rounded-xl border border-surface-tertiary bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
            Información del proyecto
          </h3>
          <Link href={`/project/${slug}/settings`} className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600">
            <Pencil className="h-3 w-3" />
            Editar
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Cliente', value: project.client_name },
              { label: 'Estilo', value: project.style },
              { label: 'Plataforma', value: project.target_platform },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <dt className="text-foreground-secondary">{item.label}</dt>
                <dd className="font-medium text-foreground">{item.value || '--'}</dd>
              </div>
            ))}
          </dl>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-foreground-secondary">Progreso general</span>
              <span className="font-semibold text-foreground">{project.completion_percentage ?? 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
              <div
                className={cn('h-full rounded-full transition-all duration-300', PROGRESS_COLORS[project.status] ?? 'bg-brand-500')}
                style={{ width: `${project.completion_percentage ?? 0}%` }}
              />
            </div>
            {project.description && (
              <p className="mt-4 text-sm leading-relaxed text-foreground-secondary">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
