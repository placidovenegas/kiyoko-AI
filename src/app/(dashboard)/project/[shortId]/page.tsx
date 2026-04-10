'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  ChevronRight,
  Film,
  FolderKanban,
  Image as ImageIcon,
  Layers3,
  Plus,
  Settings,
  Sparkles,
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
import { useUIStore } from '@/stores/useUIStore';
import type { Video } from '@/types';
import { PROJECT_STATUS_LABELS, VIDEO_STATUS_LABELS } from '@/lib/constants/status';
import { useState, useEffect } from 'react';
import { VideoCreateModal } from '@/components/modals';

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  youtube: VideoIcon,
  tiktok: VideoIcon,
  instagram: VideoIcon,
  reels: VideoIcon,
};

/* ── Helpers ─────────────────────────────────────────────── */

function formatDuration(seconds: number | null) {
  if (!seconds) return '--';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const r = seconds % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
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
    default:
      return 'border-border bg-background text-muted-foreground';
  }
}

/* ── Small components ────────────────────────────────────── */

function Stat({ icon: Icon, label, value, sub }: {
  icon: LucideIcon; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{label}{sub ? ` · ${sub}` : ''}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}

/* ── Video row ───────────────────────────────────────────── */

function VideoRow({
  projectId,
  projectShortId,
  video,
  counts,
}: {
  projectId: string;
  projectShortId: string;
  video: Video;
  counts: { total: number; withPrompts: number };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const PlatformIcon = PLATFORM_ICONS[video.platform?.toLowerCase() ?? ''] ?? VideoIcon;

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
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/20">
      <PlatformIcon className="size-4 shrink-0 text-muted-foreground" />

      <Link
        href={`/project/${projectShortId}/video/${video.short_id}`}
        className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-primary"
      >
        {video.title}
      </Link>

      <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', statusChipClass(video.status))}>
        {VIDEO_STATUS_LABELS[video.status] ?? video.status}
      </span>

      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {counts.withPrompts}/{counts.total} escenas
      </span>
      {counts.total > 0 && (
        <div className="hidden w-16 shrink-0 sm:block">
          <div className="h-1 rounded-full bg-muted">
            <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${Math.round((counts.withPrompts / counts.total) * 100)}%` }} />
          </div>
        </div>
      )}

      <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
        {formatDuration(video.target_duration_seconds)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-muted/60 hover:text-foreground group-hover:opacity-100">
            <ChevronRight className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => router.push(`/project/${projectShortId}/video/${video.short_id}`)}>Abrir video</DropdownMenuItem>
          <DropdownMenuSeparator />
          {(['draft', 'prompting', 'generating', 'review', 'approved', 'exported'] as const).map((s) => (
            <DropdownMenuItem key={s} onClick={() => updateStatus.mutate(s)}>
              {VIDEO_STATUS_LABELS[s]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => deleteVideo.mutate()}>Eliminar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */

export default function ProjectOverviewPage() {
  const { project, videos, characters, backgrounds, stylePresets, loading } = useProject();
  const openProjectSettingsModal = useUIStore((s) => s.openProjectSettingsModal);
  const [showCreateVideo, setShowCreateVideo] = useState(false);

  // Listen for navbar + button
  useEffect(() => {
    const handler = () => setShowCreateVideo(true);
    window.addEventListener('kiyoko:create-video', handler);
    return () => window.removeEventListener('kiyoko:create-video', handler);
  }, []);

  /* ── Queries ─────────────────────────────────────────── */

  const scenesQuery = useQuery({
    queryKey: project?.id ? [...queryKeys.projects.detail(project.short_id), 'scene-metrics'] : ['noop'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('scenes').select('id, video_id, status').eq('project_id', project!.id);
      if (error) throw error;

      // Also check which scenes have prompts
      const sceneIds = (data ?? []).map(s => s.id);
      let withPrompts = 0;
      if (sceneIds.length > 0) {
        const { data: prompts } = await supabase
          .from('scene_prompts')
          .select('scene_id')
          .in('scene_id', sceneIds)
          .eq('is_current', true)
          .eq('prompt_type', 'image');
        const promptSet = new Set((prompts ?? []).map(p => p.scene_id));
        withPrompts = promptSet.size;
      }

      const byVideo: Record<string, { total: number; withPrompts: number }> = {};
      let total = 0;
      for (const s of data ?? []) {
        total += 1;
        if (!byVideo[s.video_id]) byVideo[s.video_id] = { total: 0, withPrompts: 0 };
        byVideo[s.video_id].total += 1;
      }
      // Distribute prompt counts by video
      if (sceneIds.length > 0) {
        const { data: promptsByScene } = await supabase
          .from('scene_prompts')
          .select('scene_id')
          .in('scene_id', sceneIds)
          .eq('is_current', true)
          .eq('prompt_type', 'image');
        for (const p of promptsByScene ?? []) {
          const scene = (data ?? []).find(s => s.id === p.scene_id);
          if (scene && byVideo[scene.video_id]) byVideo[scene.video_id].withPrompts += 1;
        }
      }

      return { total, withPrompts, byVideo };
    },
    enabled: Boolean(project?.id),
    staleTime: 60_000,
  });

  const sceneMetrics = scenesQuery.data ?? { total: 0, withPrompts: 0, byVideo: {} as Record<string, { total: number; withPrompts: number }> };

  /* ── AI readiness ────────────────────────────────────── */

  const aiChecklist = useMemo(
    () => [
      { label: 'Briefing del proyecto', ready: Boolean(project?.ai_brief?.trim()) },
      { label: 'Reglas de prompts', ready: Boolean(project?.global_prompt_rules?.trim()) },
      { label: 'Presets de estilo', ready: stylePresets.length > 0 },
      { label: 'Personajes y fondos', ready: characters.length > 0 && backgrounds.length > 0 },
    ],
    [characters.length, backgrounds.length, project?.ai_brief, project?.global_prompt_rules, stylePresets.length],
  );

  const aiReadyCount = aiChecklist.filter((i) => i.ready).length;

  /* ── Loading / not found ─────────────────────────────── */

  if (loading) return <OverviewSkeleton />;

  if (!project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <FolderKanban className="size-12 text-muted-foreground/40" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Proyecto no encontrado</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">No se pudo resolver el proyecto o no tienes acceso.</p>
        <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const sid = project.short_id;

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="flex items-start gap-4">
        {project.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover_image_url}
            alt=""
            className="hidden size-14 shrink-0 rounded-xl border border-border object-cover sm:block"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{project.title}</h1>
            <span className={cn('shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium', statusChipClass(project.status))}>
              {PROJECT_STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
          {project.description?.trim() && (
            <p className="mt-1 max-w-2xl truncate text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <button type="button" onClick={() => openProjectSettingsModal('general')}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Ajustes del proyecto">
          <Settings className="size-4" />
        </button>
      </header>

      {/* ── Quick action buttons ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setShowCreateVideo(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors">
          <Plus className="size-3.5 text-primary" />Crear video
        </button>
        <Link href={`/project/${sid}/resources/characters`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors">
          <UserRound className="size-3.5 text-muted-foreground" />Personajes
        </Link>
        <Link href={`/project/${sid}/resources/backgrounds`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors">
          <ImageIcon className="size-3.5 text-muted-foreground" />Fondos
        </Link>
        <Link href={`/project/${sid}/publications`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors">
          <Sparkles className="size-3.5 text-muted-foreground" />Publicaciones
        </Link>
        <Link href={`/project/${sid}/resources`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors">
          <Film className="size-3.5 text-muted-foreground" />Recursos
        </Link>
      </div>

      {/* ── Stats row ───────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={VideoIcon} label="Videos" value={videos.length} />
        <Stat icon={Film} label="Escenas" value={sceneMetrics.total} sub={`${sceneMetrics.withPrompts} con prompts`} />
        <Stat icon={UserRound} label="Personajes" value={characters.length} />
        <Stat icon={ImageIcon} label="Fondos" value={backgrounds.length} />
      </section>

      {/* ── Production ──────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Produccion en curso</SectionLabel>
          <Link href={`/project/${sid}/videos`} className="text-xs font-medium text-primary hover:text-primary/80">
            Ver todos
          </Link>
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center">
            <VideoIcon className="size-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-foreground">Todavia no hay videos</p>
            <p className="mt-1 text-xs text-muted-foreground">Crea el primer video para organizar escenas y prompts.</p>
            <Link href={`/project/${sid}/videos`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Crear video
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.slice(0, 6).map((video) => (
              <VideoRow
                key={video.id}
                projectId={project.id}
                projectShortId={sid}
                video={video}
                counts={sceneMetrics.byVideo[video.id] ?? { total: 0, withPrompts: 0 }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── AI Readiness ──────────────────────────────────── */}
      <section className="space-y-3">
        <SectionLabel>Preparacion para IA</SectionLabel>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{aiReadyCount}/4 completado</p>
                <div className="flex-1 h-1.5 rounded-full bg-muted max-w-32">
                  <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${(aiReadyCount / 4) * 100}%` }} />
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {aiChecklist.map((item) => (
                  <span key={item.label} className={cn('text-[10px]', item.ready ? 'text-emerald-400' : 'text-muted-foreground/50')}>
                    {item.ready ? '✓' : '○'} {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video create modal */}
      {project && (
        <VideoCreateModal
          open={showCreateVideo}
          onOpenChange={setShowCreateVideo}
          projectId={project.id}
          projectShortId={project.short_id}
        />
      )}
    </div>
  );
}
