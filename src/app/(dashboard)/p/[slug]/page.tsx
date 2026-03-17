'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import { cn } from '@/lib/utils/cn';
import type { Project } from '@/types/project';
import type { Scene } from '@/types/scene';
import {
  IconMovie,
  IconUsers,
  IconPhoto,
  IconClock,
  IconLayout,
  IconMessageChatbot,
  IconDownload,
  IconSettings,
  IconChevronRight,
  IconEdit,
} from '@tabler/icons-react';

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  completed: 'Completado',
  archived: 'Archivado',
};

const statusColors: Record<string, string> = {
  draft: '#6b7280',
  in_progress: 'var(--color-brand-500, #8b5cf6)',
  completed: '#22c55e',
  archived: '#9ca3af',
};

export default function ProjectOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [scenesCount, setScenesCount] = useState(0);
  const [charactersCount, setCharactersCount] = useState(0);
  const [backgroundsCount, setBackgroundsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);

      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single();

      if (proj) {
        setProject(proj as Project);

        const [
          { count: sCount },
          { count: cCount },
          { count: bCount },
          { data: recentScenes },
        ] = await Promise.all([
          supabase
            .from('scenes')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', proj.id),
          supabase
            .from('characters')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', proj.id),
          supabase
            .from('backgrounds')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', proj.id),
          supabase
            .from('scenes')
            .select('*')
            .eq('project_id', proj.id)
            .order('updated_at', { ascending: false })
            .limit(5),
        ]);

        setScenesCount(sCount ?? 0);
        setCharactersCount(cCount ?? 0);
        setBackgroundsCount(bCount ?? 0);
        setScenes((recentScenes as Scene[]) ?? []);
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div className="h-56 animate-pulse rounded-2xl bg-surface-secondary" />
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-surface-secondary p-6">
              <div className="h-8 w-12 animate-pulse rounded bg-surface-tertiary" />
              <div className="mt-2 h-4 w-20 animate-pulse rounded bg-surface-tertiary" />
            </div>
          ))}
        </div>
        {/* Quick actions skeleton */}
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 w-40 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
        {/* Info skeleton */}
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-secondary">
          <IconMovie size={32} className="text-foreground-muted" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Proyecto no encontrado
        </h3>
        <p className="mt-1 text-sm text-foreground-muted">
          No se encontro un proyecto con el slug &quot;{slug}&quot;
        </p>
        <Link
          href="/dashboard"
          className="mt-4 text-sm font-medium text-brand-500 transition-colors duration-150 hover:text-brand-600"
        >
          Volver al dashboard
        </Link>
      </div>
    );
  }

  function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return '--';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  const statsCards = [
    {
      icon: IconMovie,
      iconColor: 'text-brand-500',
      iconBg: 'bg-brand-500/10',
      label: 'Escenas',
      value: scenesCount.toString(),
      sub: `${project.completion_percentage ?? 0}% completado`,
    },
    {
      icon: IconUsers,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
      label: 'Personajes',
      value: charactersCount.toString(),
      sub: 'definidos',
    },
    {
      icon: IconPhoto,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      label: 'Fondos',
      value: backgroundsCount.toString(),
      sub: 'definidos',
    },
    {
      icon: IconClock,
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-500/10',
      label: 'Duracion',
      value: formatDuration(project.target_duration_seconds),
      sub: project.estimated_duration_seconds
        ? `~${formatDuration(project.estimated_duration_seconds)} estimado`
        : 'objetivo',
    },
  ];

  const quickActions = [
    {
      icon: IconLayout,
      label: 'Ir al Storyboard',
      href: `/p/${slug}/scenes`,
      primary: true,
    },
    {
      icon: IconMessageChatbot,
      label: 'Chat IA',
      href: `/p/${slug}/chat`,
      primary: false,
    },
    {
      icon: IconDownload,
      label: 'Exportar',
      href: `/p/${slug}/export`,
      primary: false,
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Hero section */}
      <div className="relative h-56 overflow-hidden rounded-2xl md:h-64">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-brand-500 via-brand-600 to-brand-700" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content overlaid */}
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
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: statusColors[project.status] }}
                >
                  {statusLabels[project.status] ?? project.status}
                </span>
                {project.style && (
                  <span className="text-xs text-white/60">{project.style}</span>
                )}
                {project.target_platform && (
                  <span className="text-xs text-white/60">{project.target_platform}</span>
                )}
              </div>
            </div>
            <Link
              href={`/p/${slug}/settings`}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm transition-all duration-150 hover:bg-white/20"
            >
              <IconSettings size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="flex items-start gap-3 rounded-xl bg-surface-secondary p-4 transition-colors duration-150 hover:bg-surface-tertiary"
          >
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', stat.iconBg)}>
              <stat.icon size={20} className={stat.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground-secondary">{stat.label}</p>
              <p className="mt-0.5 truncate text-xs text-foreground-muted">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              'flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium',
              'transition-all duration-150',
              action.primary
                ? 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-md'
                : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground',
            )}
          >
            <action.icon size={18} />
            {action.label}
          </Link>
        ))}
      </div>

      {/* Info + Recent activity grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Project info */}
        <div className="rounded-xl border border-surface-tertiary bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Informacion del proyecto
            </h3>
            <Link
              href={`/p/${slug}/settings`}
              className="flex items-center gap-1 text-xs font-medium text-brand-500 transition-colors duration-150 hover:text-brand-600"
            >
              <IconEdit size={14} />
              Editar
            </Link>
          </div>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Cliente', value: project.client_name },
              { label: 'Estilo', value: project.style },
              { label: 'Plataforma', value: project.target_platform },
              { label: 'Generador imagen', value: project.image_generator },
              { label: 'Estado', value: statusLabels[project.status] ?? project.status },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <dt className="text-foreground-secondary">{item.label}</dt>
                <dd className="font-medium text-foreground">{item.value || '--'}</dd>
              </div>
            ))}
          </dl>

          {/* Progress */}
          <div className="mt-5 border-t border-surface-tertiary pt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-foreground-secondary">Progreso general</span>
              <span className="font-semibold text-foreground">{project.completion_percentage ?? 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${project.completion_percentage ?? 0}%`,
                  backgroundColor: statusColors[project.status] ?? '#8b5cf6',
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-surface-tertiary bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground-muted">
              Actividad reciente
            </h3>
            <Link
              href={`/p/${slug}/scenes`}
              className="flex items-center gap-1 text-xs font-medium text-brand-500 transition-colors duration-150 hover:text-brand-600"
            >
              Ver todas
              <IconChevronRight size={14} />
            </Link>
          </div>

          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconMovie size={32} className="text-foreground-muted/40" />
              <p className="mt-2 text-sm text-foreground-muted">
                No hay escenas aun
              </p>
              <Link
                href={`/p/${slug}/scenes`}
                className="mt-3 text-xs font-medium text-brand-500 transition-colors duration-150 hover:text-brand-600"
              >
                Crear primera escena
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {scenes.map((scene) => (
                <Link
                  key={scene.id}
                  href={`/p/${slug}/scenes#scene-${scene.id}`}
                  className="group flex items-center gap-3 rounded-lg p-2 transition-all duration-150 hover:bg-surface-secondary"
                >
                  {/* Thumbnail */}
                  {scene.generated_image_thumbnail_url ? (
                    <img
                      src={scene.generated_image_thumbnail_url}
                      alt={scene.title}
                      className="h-10 w-14 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-surface-tertiary">
                      <span className="text-[10px] font-medium text-foreground-muted">
                        {scene.scene_number}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {scene.scene_number}. {scene.title}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {scene.updated_at
                        ? formatDistanceToNow(new Date(scene.updated_at), {
                            addSuffix: true,
                            locale: es,
                          })
                        : ''}
                    </p>
                  </div>

                  <IconChevronRight
                    size={16}
                    className="shrink-0 text-foreground-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
