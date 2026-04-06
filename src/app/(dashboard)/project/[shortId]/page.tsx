'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale/es';
import {
  Bot,
  Brain,
  CalendarClock,
  ChevronRight,
  Clock3,
  Film,
  FolderKanban,
  Image as ImageIcon,
  Layers3,
  MoreHorizontal,
  Sparkles,
  Tv,
  UserRound,
  Video as VideoIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import { cn } from '@/lib/utils/cn';
import { useAIStore } from '@/stores/ai-store';
import { useUIStore } from '@/stores/useUIStore';
import type { ActivityLog, Character, Video } from '@/types';

const PROJECT_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  review: 'En revision',
  completed: 'Completado',
  archived: 'Archivado',
};

const VIDEO_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompting: 'Prompts',
  generating: 'Generando',
  review: 'En revision',
  approved: 'Aprobado',
  exported: 'Exportado',
};

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  youtube: Tv,
  tiktok: Tv,
  instagram: Tv,
  reels: Tv,
};

function formatDuration(seconds: number | null) {
  if (!seconds) return 'Sin objetivo';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function formatWorkedMinutes(totalMinutes: number) {
  if (totalMinutes <= 0) return '0m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatRelative(date: string | null) {
  if (!date) return 'Sin fecha';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === 'completed') return false;
  return new Date(dueDate).getTime() < Date.now();
}

function statusChipClass(status: string) {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'exported':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
    case 'review':
      return 'border-sky-500/20 bg-sky-500/10 text-sky-300';
    case 'in_progress':
    case 'generating':
    case 'prompting':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    case 'archived':
      return 'border-border bg-background text-muted-foreground';
    default:
      return 'border-border bg-background text-muted-foreground';
  }
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="h-64 animate-pulse rounded-[28px] border border-border bg-card" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}

function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm lg:p-6', className)}>{children}</section>;
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, meta, href }: { icon: LucideIcon; label: string; value: string | number; meta?: string; href?: string }) {
  const content = (
    <div className="flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/20 hover:bg-accent-soft-hover">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function CharacterAvatar({ character }: { character: Character }) {
  const initials = (character.name ?? '??')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3">
      {character.reference_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={character.reference_image_url} alt={character.name} className="h-12 w-12 rounded-2xl object-cover" />
      ) : (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-xs font-semibold text-white"
          style={{ backgroundColor: character.color_accent ?? '#6B7280' }}
        >
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{character.name}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{character.role || 'Sin rol definido'}</p>
      </div>
    </div>
  );
}

function VideoListItem({
  projectId,
  projectShortId,
  video,
  counts,
}: {
  projectId: string;
  projectShortId: string;
  video: Video;
  counts: { total: number; approved: number };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const PlatformIcon = PLATFORM_ICONS[video.platform?.toLowerCase() ?? ''] ?? VideoIcon;
  const progress = counts.total > 0 ? Math.round((counts.approved / counts.total) * 100) : 0;

  const deleteVideo = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from('videos').delete().eq('id', video.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectShortId) });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('videos').update({ status: status as Video['status'] }).eq('id', video.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectShortId) });
    },
  });

  return (
    <div className="group rounded-2xl border border-border bg-background/70 p-4 transition-colors hover:border-primary/20 hover:bg-accent-soft-hover">
      <div className="flex items-start gap-3">
        <Link href={`/project/${projectShortId}/video/${video.short_id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PlatformIcon className="h-4 w-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium text-foreground">{video.title}</span>
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', statusChipClass(video.status))}>
              {VIDEO_STATUS_LABELS[video.status] ?? video.status}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{counts.total} escenas</span>
            <span>{counts.approved} aprobadas</span>
            <span>{video.platform || 'Plataforma libre'}</span>
            <span>{formatDuration(video.target_duration_seconds)}</span>
            <span>Actualizado {formatRelative(video.updated_at)}</span>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`/project/${projectShortId}/video/${video.short_id}`)}>Abrir video</DropdownMenuItem>
            <DropdownMenuSeparator />
            {['draft', 'prompting', 'generating', 'review', 'approved', 'exported'].map((status) => (
              <DropdownMenuItem key={status} onClick={() => updateStatus.mutate(status)}>
                {VIDEO_STATUS_LABELS[status] ?? status}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => deleteVideo.mutate()}>
              Eliminar video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ProjectOverviewPage() {
  const { project, videos, characters, backgrounds, stylePresets, loading } = useProject();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const openChat = useAIStore((state) => state.openChat);
  const setActiveAgent = useAIStore((state) => state.setActiveAgent);
  const openProjectSettingsModal = useUIStore((state) => state.openProjectSettingsModal);

  const scenesQuery = useQuery({
    queryKey: project?.id ? [...queryKeys.projects.detail(project.short_id), 'scene-metrics'] : ['projects', 'scene-metrics', 'empty'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('scenes').select('video_id, status').eq('project_id', project!.id);
      if (error) throw error;

      const byVideo: Record<string, { total: number; approved: number }> = {};
      let total = 0;
      let approved = 0;

      for (const scene of data ?? []) {
        total += 1;
        if (!byVideo[scene.video_id]) byVideo[scene.video_id] = { total: 0, approved: 0 };
        byVideo[scene.video_id].total += 1;
        if (scene.status === 'approved') {
          approved += 1;
          byVideo[scene.video_id].approved += 1;
        }
      }

      return { total, approved, byVideo };
    },
    enabled: Boolean(project?.id),
    staleTime: 60_000,
  });

  const workedMinutesQuery = useQuery({
    queryKey: project?.id ? queryKeys.timeEntries.byProject(project.id) : ['time-entries', 'project', 'empty'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('time_entries').select('duration_minutes').eq('project_id', project!.id);
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0);
    },
    enabled: Boolean(project?.id),
    staleTime: 60_000,
  });

  const activityQuery = useQuery({
    queryKey: project?.id ? ['activity', project.id, 'overview'] : ['activity', 'overview', 'empty'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('project_id', project!.id)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as ActivityLog[];
    },
    enabled: Boolean(project?.id),
    staleTime: 30_000,
  });

  const taskSummaryQuery = useQuery({
    queryKey: project?.id ? [...queryKeys.tasks.byProject(project.id), 'summary'] : ['tasks', 'project', 'summary', 'empty'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('tasks').select('status, priority, due_date').eq('project_id', project!.id);
      if (error) throw error;

      const tasks = data ?? [];
      const completed = tasks.filter((task) => task.status === 'completed').length;
      const active = tasks.length - completed;
      const overdue = tasks.filter((task) => isOverdue(task.due_date, task.status)).length;
      const urgent = tasks.filter((task) => task.priority === 'urgent' && task.status !== 'completed').length;

      return { total: tasks.length, active, completed, overdue, urgent };
    },
    enabled: Boolean(project?.id),
    staleTime: 30_000,
  });

  const sceneMetrics = scenesQuery.data ?? { total: 0, approved: 0, byVideo: {} as Record<string, { total: number; approved: number }> };
  const workedMinutes = workedMinutesQuery.data ?? 0;
  const activity = activityQuery.data ?? [];
  const taskSummary = taskSummaryQuery.data ?? { total: 0, active: 0, completed: 0, overdue: 0, urgent: 0 };

  const aiChecklist = useMemo(
    () => [
      { label: 'Briefing del proyecto', ready: Boolean(project?.ai_brief?.trim()), href: `/project/${project?.short_id ?? ''}/settings` },
      { label: 'Reglas globales de prompts', ready: Boolean(project?.global_prompt_rules?.trim()), href: `/project/${project?.short_id ?? ''}/settings` },
      { label: 'Presets de estilo', ready: stylePresets.length > 0, href: `/project/${project?.short_id ?? ''}/resources/styles` },
      { label: 'Biblioteca creativa base', ready: characters.length > 0 && backgrounds.length > 0, href: `/project/${project?.short_id ?? ''}/resources` },
    ],
    [backgrounds.length, characters.length, project?.ai_brief, project?.global_prompt_rules, project?.short_id, stylePresets.length],
  );

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground/40" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Proyecto no encontrado</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">No se pudo resolver el proyecto o no tienes acceso a este espacio.</p>
        <Link href="/dashboard" className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const description = project.description?.trim() ?? '';
  const descriptionNeedsClamp = description.length > 180;
  const aiReadyCount = aiChecklist.filter((item) => item.ready).length;
  const sceneApproval = sceneMetrics.total > 0 ? Math.round((sceneMetrics.approved / sceneMetrics.total) * 100) : 0;
  const latestVideos = videos.slice(0, 5);

  function handleOpenProjectChat() {
    setActiveAgent('project');
    openChat('sidebar');
  }

  function handleOpenProjectSettings(section: 'general' | 'ia' = 'general') {
    openProjectSettingsModal(section);
  }

  return (
    <div className="space-y-6 px-3 py-4 lg:space-y-8 lg:px-5 lg:py-5">
      <section className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div className="absolute inset-0">
          {project.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.cover_image_url} alt={project.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(245,165,36,0.18),transparent_36%),linear-gradient(135deg,rgba(0,111,238,0.16),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,8,0.18),rgba(7,7,8,0.78))]" />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                  <FolderKanban className="h-3.5 w-3.5" />
                  Proyecto
                </span>
                <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm', statusChipClass(project.status), 'bg-black/20 text-white border-white/10')}>
                  {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
                  <Clock3 className="h-3.5 w-3.5" />
                  Actualizado {formatRelative(project.updated_at)}
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white lg:text-4xl">{project.title}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
                <span>{project.client_name || 'Proyecto interno'}</span>
                <span>{project.style || 'Sin estilo definido'}</span>
                <span>{videos.length} videos</span>
                <span>{taskSummary.active} tareas activas</span>
              </div>

              {description ? (
                <div className="mt-4 max-w-2xl">
                  <p className={cn('text-sm leading-6 text-white/80 lg:text-base', !descriptionExpanded && descriptionNeedsClamp ? 'line-clamp-3' : '')}>
                    {description}
                  </p>
                  {descriptionNeedsClamp ? (
                    <button type="button" onClick={() => setDescriptionExpanded((current) => !current)} className="mt-2 text-sm font-medium text-white transition-opacity hover:opacity-80">
                      {descriptionExpanded ? 'Ver menos' : 'Ver mas'}
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">Define un briefing y reglas globales para convertir este proyecto en un espacio mucho mas asistido por IA.</p>
              )}

              {project.tags && project.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70 backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-120">
              <Link href={`/project/${project.short_id}/tasks`} className="group rounded-[24px] bg-primary p-4 text-primary-foreground transition-opacity hover:opacity-90">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Gestionar tareas</p>
                    <p className="mt-1 text-xs text-primary-foreground/80">Operacion, prioridades y seguimiento del proyecto.</p>
                  </div>
                  <Layers3 className="h-4 w-4 shrink-0 text-primary-foreground/85" />
                </div>
              </Link>
              <button type="button" onClick={handleOpenProjectChat} className="group rounded-[24px] border border-white/10 bg-black/24 p-4 text-left text-white/90 backdrop-blur-sm transition-colors hover:bg-black/34">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Asistente del proyecto</p>
                    <p className="mt-1 text-xs text-white/65">Ayuda contextual para planificar, revisar y destrabar.</p>
                  </div>
                  <Bot className="h-4 w-4 shrink-0 text-white/70" />
                </div>
              </button>
              <Link href={`/project/${project.short_id}/resources`} className="group rounded-[24px] border border-white/10 bg-black/24 p-4 text-left text-white/90 backdrop-blur-sm transition-colors hover:bg-black/34">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Recursos y personajes</p>
                    <p className="mt-1 text-xs text-white/65">Biblioteca visual, fondos, estilos y plantillas.</p>
                  </div>
                  <UserRound className="h-4 w-4 shrink-0 text-white/70" />
                </div>
              </Link>
              <button type="button" onClick={() => handleOpenProjectSettings('general')} className="group rounded-[24px] border border-white/10 bg-black/24 p-4 text-left text-white/90 backdrop-blur-sm transition-colors hover:bg-black/34">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Ajustes del proyecto</p>
                    <p className="mt-1 text-xs text-white/65">Identidad, briefing y reglas globales del espacio.</p>
                  </div>
                  <Sparkles className="h-4 w-4 shrink-0 text-white/70" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={VideoIcon} label="Videos" value={videos.length} meta={`${latestVideos.length > 0 ? latestVideos.length : 0} recientes en foco`} href={`/project/${project.short_id}/videos`} />
        <StatCard icon={Film} label="Escenas" value={sceneMetrics.total} meta={`${sceneApproval}% aprobadas`} href={`/project/${project.short_id}/videos`} />
        <StatCard icon={Layers3} label="Tareas activas" value={taskSummary.active} meta={`${taskSummary.overdue} vencidas · ${taskSummary.urgent} urgentes`} href={`/project/${project.short_id}/tasks`} />
        <StatCard icon={UserRound} label="Personajes" value={characters.length} meta={`${backgrounds.length} fondos vinculables`} href={`/project/${project.short_id}/resources`} />
        <StatCard icon={Clock3} label="Tiempo" value={formatWorkedMinutes(workedMinutes)} meta={`${activity.length} eventos recientes`} href={`/project/${project.short_id}/activity`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Surface>
          <SectionHeader
            title="Produccion en curso"
            description="Videos, avance de escenas y estado actual del material creativo."
            action={
              <Link href={`/project/${project.short_id}/videos`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
                Ver todos
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />

          {latestVideos.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/70 py-16 text-center">
              <VideoIcon className="h-10 w-10 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium text-foreground">Todavia no hay videos</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">Crea el primer video para empezar a organizar escenas, prompts y recursos del proyecto.</p>
              <Link href={`/project/${project.short_id}/videos`} className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                Crear primer video
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {latestVideos.map((video) => (
                <VideoListItem
                  key={video.id}
                  projectId={project.id}
                  projectShortId={project.short_id}
                  video={video}
                  counts={sceneMetrics.byVideo[video.id] ?? { total: 0, approved: 0 }}
                />
              ))}
            </div>
          )}
        </Surface>

        <div className="space-y-6">
          <Surface>
            <SectionHeader title="Preparacion para IA" description="Lo que ya tiene contexto suficiente para que la IA te ayude mejor." />
            <div className="mt-5 rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Cobertura actual</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{aiReadyCount}/4</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-primary">
                  <Brain className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {aiChecklist.map((item) => (
                  <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/20 hover:bg-accent-soft-hover">
                    <span className="text-foreground">{item.label}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]', item.ready ? 'bg-emerald-500/12 text-emerald-300' : 'bg-amber-500/12 text-amber-300')}>
                      {item.ready ? 'listo' : 'pendiente'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={handleOpenProjectChat} className="rounded-2xl border border-border bg-background/70 p-4 text-left transition-colors hover:border-primary/20 hover:bg-accent-soft-hover">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Bot className="h-4 w-4 text-primary" /> Chat operativo</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Pide a la IA que organice tareas, revise huecos de recursos y proponga siguientes pasos.</p>
              </button>
              <button type="button" onClick={() => handleOpenProjectSettings('ia')} className="rounded-2xl border border-border bg-background/70 p-4 text-left transition-colors hover:border-primary/20 hover:bg-accent-soft-hover">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Sparkles className="h-4 w-4 text-primary" /> Configuracion IA</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Ajusta proveedores, director creativo y tono del agente segun este proyecto.</p>
              </button>
            </div>
          </Surface>

          <Surface>
            <SectionHeader title="Pulso operativo" description="Resumen rapido del trabajo abierto y del movimiento reciente." />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Tareas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{taskSummary.total}</p>
                <p className="mt-1 text-sm text-muted-foreground">{taskSummary.completed} completadas · {taskSummary.active} abiertas</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Actividad reciente</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{activity.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Eventos en las ultimas acciones del proyecto</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Proximo foco recomendado</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {taskSummary.overdue > 0
                      ? `Hay ${taskSummary.overdue} tareas vencidas. Conviene resolverlas antes de seguir produciendo.`
                      : videos.length === 0
                        ? 'Empieza creando el primer video para activar escenas, tareas y recursos.'
                        : aiReadyCount < 4
                          ? 'Completa briefing, reglas o recursos base para que la IA tenga mejor contexto.'
                          : 'El proyecto tiene una base suficiente para delegar organizacion y generacion asistida.'}
                  </p>
                </div>
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Surface>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Surface>
          <SectionHeader
            title="Personajes clave"
            description="Los actores visuales principales disponibles para escenas y prompts."
            action={
              <Link href={`/project/${project.short_id}/resources/characters`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
                Ver seccion
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {characters.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/70 py-14 text-center">
              <UserRound className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium text-foreground">No hay personajes definidos</h3>
              <p className="mt-2 text-sm text-muted-foreground">Crea una biblioteca base para mantener consistencia en escenas, voces y prompts.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {characters.slice(0, 4).map((character) => (
                <CharacterAvatar key={character.id} character={character} />
              ))}
            </div>
          )}
        </Surface>

        <Surface>
          <SectionHeader
            title="Fondos y atmosfera"
            description="Locaciones listas para reutilizar y guiar la direccion visual."
            action={
              <Link href={`/project/${project.short_id}/resources/backgrounds`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
                Ver seccion
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {backgrounds.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/70 py-14 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium text-foreground">No hay fondos preparados</h3>
              <p className="mt-2 text-sm text-muted-foreground">Los fondos ayudan a la IA a mantener continuidad visual y decisiones de composicion.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {backgrounds.slice(0, 4).map((background) => (
                <Link key={background.id} href={`/project/${project.short_id}/resources/backgrounds/${background.id}`} className="group overflow-hidden rounded-2xl border border-border bg-background/70 transition-colors hover:border-primary/20 hover:bg-accent-soft-hover">
                  <div className="aspect-16/10 overflow-hidden border-b border-border bg-card">
                    {background.reference_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={background.reference_image_url} alt={background.name} className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="truncate text-sm font-medium text-foreground">{background.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{background.description || 'Sin descripcion todavia.'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Surface>
      </section>

      <Surface>
        <SectionHeader
          title="Actividad reciente"
          description="Cambios, generacion y movimiento operativo dentro del proyecto."
          action={
            <Link href={`/project/${project.short_id}/activity`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
              Ver historial
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />

        {activity.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-background/70 py-14 text-center">
            <Clock3 className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Sin actividad reciente</h3>
            <p className="mt-2 text-sm text-muted-foreground">Cuando empieces a mover videos, recursos o ajustes, el historial aparecera aqui.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{entry.description || `${entry.action} ${entry.entity_type}`}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="capitalize">{entry.entity_type}</span>
                    <span>{formatRelative(entry.created_at)}</span>
                    {entry.entity_id ? <span className="font-mono">{entry.entity_id.slice(0, 8)}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}
