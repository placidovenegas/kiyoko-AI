'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { useProject } from '@/contexts/ProjectContext';
import { KButton } from '@/components/ui/kiyoko-button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import type { Character, Video } from '@/types';
import {
  Film, Users, Image, Video as VideoIcon,
  Plus, Settings, ChevronRight, Pencil, Layers,
  Clock, MoreHorizontal, FolderOpen, Trash2, Copy,
  Monitor, Smartphone, Tv,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  review: 'Revision',
  completed: 'Completado',
  archived: 'Archivado',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted0/20 text-muted-foreground',
  in_progress: 'bg-primary/20 text-primary',
  review: 'bg-purple-500/20 text-purple-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  archived: 'bg-muted0/10 text-muted-foreground',
};

const VIDEO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted0/20 text-muted-foreground',
  prompting: 'bg-blue-500/20 text-blue-400',
  generating: 'bg-amber-500/20 text-amber-400',
  review: 'bg-purple-500/20 text-purple-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  exported: 'bg-cyan-500/20 text-cyan-400',
};

const VIDEO_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompting: 'Creando prompts',
  generating: 'Generando',
  review: 'Revision',
  approved: 'Aprobado',
  exported: 'Exportado',
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  youtube: Tv,
  tiktok: Smartphone,
  instagram: Monitor,
  reels: Monitor,
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatTimeWorked(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-48 animate-pulse rounded-2xl bg-secondary" />
      <div className="space-y-2">
        <div className="h-6 w-1/3 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
      </div>
    </div>
  );
}

function CharacterAvatar({ character }: { character: Character }) {
  const initials = (character.name ?? '??')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const accentColor = character.color_accent ?? '#0EA5A0';

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: accentColor }}
      >
        {character.reference_image_url ? (
          <img
            src={character.reference_image_url}
            alt={character.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <span className="max-w-16 truncate text-center text-xs text-muted-foreground">
        {character.name}
      </span>
    </div>
  );
}

function VideoRow({
  video,
  projectShortId,
  sceneCounts,
}: {
  video: Video;
  projectShortId: string;
  sceneCounts: Record<string, { total: number; approved: number }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const PlatformIcon = PLATFORM_ICONS[video.platform?.toLowerCase() ?? ''] ?? VideoIcon;
  const counts = sceneCounts[video.id] ?? { total: 0, approved: 0 };
  const progress = counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from('videos').delete().eq('id', video.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('videos')
        .update({ status: newStatus as 'draft' | 'prompting' | 'generating' | 'review' | 'approved' | 'exported' })
        .eq('id', video.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return (
    <div className="group rounded-lg border border-border bg-card p-4 transition hover:bg-secondary">
      <div className="flex items-start gap-3">
        <Link
          href={`/project/${projectShortId}/video/${video.short_id}`}
          className="flex min-w-0 flex-1 flex-col gap-2"
        >
          {/* Row 1: Platform icon + title */}
          <div className="flex items-center gap-2">
            <PlatformIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium text-foreground">{video.title}</span>
          </div>

          {/* Row 2: Progress bar + scene count */}
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{progress}%</span>
            <span className="shrink-0 text-xs text-muted-foreground">{counts.total} escenas</span>
          </div>

          {/* Row 3: Platform details */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{video.platform}</span>
            {video.aspect_ratio && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span>{video.aspect_ratio}</span>
              </>
            )}
            {video.target_duration_seconds && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span>{formatDuration(video.target_duration_seconds)} objetivo</span>
              </>
            )}
          </div>

          {/* Row 4: Status + updated */}
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', VIDEO_STATUS_COLORS[video.status] ?? 'bg-muted0/20 text-muted-foreground')}>
              {VIDEO_STATUS_LABELS[video.status] ?? video.status}
            </span>
            {video.updated_at && (
              <>
                <span className="text-muted-foreground/40 text-xs">&middot;</span>
                <span className="text-xs text-muted-foreground">
                  Actualizado {formatDistanceToNow(new Date(video.updated_at), { addSuffix: false, locale: es })}
                </span>
              </>
            )}
          </div>
        </Link>

        {/* Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-card"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem onClick={() => router.push(`/project/${projectShortId}/video/${video.short_id}`)}>
              <FolderOpen className="h-4 w-4" />
              Abrir video
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/project/${projectShortId}/video/${video.short_id}`)}>
              <Pencil className="h-4 w-4" />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Pencil className="h-4 w-4" />
                Cambiar estado
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {['draft', 'prompting', 'generating', 'review', 'approved', 'exported'].map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => updateStatusMutation.mutate(s)}
                    className={cn(video.status === s && 'font-bold')}
                  >
                    {VIDEO_STATUS_LABELS[s] ?? s}
                    {video.status === s && ' \u2713'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-400"
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ProjectOverviewPage() {
  const { project, videos, characters, backgrounds, loading: projectLoading } = useProject();
  const [descExpanded, setDescExpanded] = useState(false);

  // Scenes count via a lightweight query
  const { data: scenesCount = 0 } = useQuery<number>({
    queryKey: ['scenes-count', project?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('scenes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project!.id);
      return count ?? 0;
    },
    enabled: !!project?.id,
  });

  // Scene counts per video (total + approved)
  const { data: videoSceneCounts = {} } = useQuery<Record<string, { total: number; approved: number }>>({
    queryKey: ['video-scene-counts', project?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('scenes')
        .select('video_id, status')
        .eq('project_id', project!.id);
      if (!data) return {};
      const counts: Record<string, { total: number; approved: number }> = {};
      for (const scene of data) {
        if (!counts[scene.video_id]) counts[scene.video_id] = { total: 0, approved: 0 };
        counts[scene.video_id].total++;
        if (scene.status === 'approved') counts[scene.video_id].approved++;
      }
      return counts;
    },
    enabled: !!project?.id,
  });

  // Time worked on project
  const { data: timeWorked = 0 } = useQuery<number>({
    queryKey: ['time-worked', project?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('time_entries')
        .select('duration_minutes')
        .eq('project_id', project!.id);
      if (!data) return 0;
      return data.reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0);
    },
    enabled: !!project?.id,
    staleTime: 60 * 1000,
  });

  // Recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['activity', project?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('activity_log')
        .select('id, action, entity_type, entity_id, created_at, metadata')
        .eq('project_id', project!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!project?.id,
    staleTime: 30 * 1000,
  });

  if (projectLoading) {
    return <OverviewSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Film className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Proyecto no encontrado</h3>
        <Link href="/dashboard" className="mt-3 text-sm text-primary hover:text-primary/80">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const sid = project.short_id;

  const stats = [
    { icon: VideoIcon, accent: 'bg-pink-500/10 text-pink-400', label: 'Videos', value: videos.length, href: `/project/${sid}/videos` },
    { icon: Film, accent: 'bg-primary/10 text-primary', label: 'Escenas', value: scenesCount, href: `/project/${sid}/videos` },
    { icon: Users, accent: 'bg-emerald-500/10 text-emerald-400', label: 'Personajes', value: characters.length, href: `/project/${sid}/resources` },
    { icon: Image, accent: 'bg-amber-500/10 text-amber-400', label: 'Fondos', value: backgrounds.length, href: `/project/${sid}/resources` },
    { icon: Clock, accent: 'bg-purple-500/10 text-purple-400', label: 'Trabajado', value: formatTimeWorked(timeWorked), href: undefined },
  ];

  const descriptionTruncated = project.description && project.description.length > 150;

  return (
    <div className="h-full overflow-y-auto bg-background p-6 space-y-6">
      {/* Hero / Cover */}
      <div className="relative h-48 overflow-hidden rounded-xl md:h-56">
        {project.cover_image_url ? (
          <img src={project.cover_image_url} alt={project.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-primary via-emerald-500/40 to-primary/10" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Info Block */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">{project.title}</h1>
          <Link href={`/project/${sid}/settings`}>
            <KButton variant="ghost" size="sm" icon={<Settings className="h-4 w-4" />}>
              Ajustes
            </KButton>
          </Link>
        </div>

        {/* Client + Status + Style + Tags */}
        <div className="flex flex-wrap items-center gap-3">
          {project.client_name && (
            <span className="text-sm text-muted-foreground">
              Cliente: {project.client_name}
            </span>
          )}
          {project.client_name && <span className="text-muted-foreground/40">&middot;</span>}
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[project.status])}>
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {project.style && (
            <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {project.style}
            </span>
          )}
          {project.tags && project.tags.length > 0 && project.tags.map((tag) => (
            <span key={tag} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Description truncated */}
        {project.description && (
          <div>
            <p className={cn('text-sm leading-relaxed text-muted-foreground', !descExpanded && 'line-clamp-2')}>
              {project.description}
            </p>
            {descriptionTruncated && (
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 text-xs font-medium text-primary hover:text-primary/80"
              >
                {descExpanded ? 'Ver menos' : 'Ver mas'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats — 5 cols */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => {
          const content = (
            <div
              key={s.label}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition',
                s.href && 'cursor-pointer hover:bg-secondary',
              )}
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', s.accent)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
          if (s.href) {
            return <Link key={s.label} href={s.href}>{content}</Link>;
          }
          return <div key={s.label}>{content}</div>;
        })}
      </div>

      {/* Videos Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Videos ({videos.length})
          </h3>
          <Link href={`/project/${sid}/videos`}>
            <KButton size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
              Nuevo video
            </KButton>
          </Link>
        </div>
        {videos.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <VideoIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No hay videos</p>
            <Link href={`/project/${sid}/videos`} className="mt-2 text-xs text-primary">
              Crear primer video
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((v) => (
              <VideoRow
                key={v.id}
                video={v}
                projectShortId={sid}
                sceneCounts={videoSceneCounts}
              />
            ))}
          </div>
        )}
      </div>

      {/* Characters + Backgrounds previews */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Characters preview */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personajes</h3>
            <Link
              href={`/project/${sid}/resources`}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {characters.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">No hay personajes</p>
              <Link href={`/project/${sid}/resources`} className="mt-2 text-xs text-primary">Crear personaje</Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {characters.slice(0, 4).map((char) => (
                <CharacterAvatar key={char.id} character={char} />
              ))}
              {characters.length > 4 && (
                <Link
                  href={`/project/${sid}/resources`}
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  +{characters.length - 4}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Backgrounds preview */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fondos</h3>
            <Link
              href={`/project/${sid}/resources`}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {backgrounds.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Image className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">No hay fondos</p>
              <Link href={`/project/${sid}/resources`} className="mt-2 text-xs text-primary">Crear fondo</Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {backgrounds.slice(0, 3).map((bg) => (
                <div key={bg.id} className="flex flex-col items-center gap-1.5">
                  <div className="h-16 w-24 overflow-hidden rounded-lg border border-border bg-secondary">
                    {bg.reference_image_url ? (
                      <img src={bg.reference_image_url} alt={bg.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Image className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <span className="max-w-24 truncate text-xs text-muted-foreground">{bg.name}</span>
                </div>
              ))}
              {backgrounds.length > 3 && (
                <Link
                  href={`/project/${sid}/resources`}
                  className="flex h-16 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  +{backgrounds.length - 3}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Actividad reciente</h3>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No hay actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg border-b border-border p-2 last:border-0 transition hover:bg-secondary">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    <span className="font-medium">{entry.action}</span>
                    {' '}
                    <span className="text-muted-foreground">{entry.entity_type}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {entry.created_at
                    ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: es })
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
