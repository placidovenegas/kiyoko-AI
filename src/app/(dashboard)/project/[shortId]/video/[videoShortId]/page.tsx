'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import { ArcBar } from '@/components/video/ArcBar';
import { SceneCard } from '@/components/video/SceneCard';
import {
  Film, Clock, Monitor, Mic, FileOutput,
  Video, Loader2, BarChart3, LayoutGrid, List,
  Settings2, Layers, CheckCircle2, Target,
} from 'lucide-react';
import type { NarrativeArc, Scene } from '@/types';

/* ------------------------------------------------------------------ */
/*  Stat                                                               */
/* ------------------------------------------------------------------ */
function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-lg bg-muted/60',
          tone || 'text-muted-foreground',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge helpers                                               */
/* ------------------------------------------------------------------ */
const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompting: 'Creando prompts',
  generating: 'Generando',
  review: 'Revision',
  approved: 'Aprobado',
  exported: 'Exportado',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-muted-foreground border-zinc-500/20',
  prompting: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  generating: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  review: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  exported: 'bg-primary/20 text-primary border-primary/20',
};

const SCENE_STATUS_DOT: Record<string, string> = {
  draft: 'bg-zinc-500',
  prompt_ready: 'bg-blue-500',
  generating: 'bg-amber-500',
  generated: 'bg-purple-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

/* ------------------------------------------------------------------ */
/*  Scene list-item (for list view)                                    */
/* ------------------------------------------------------------------ */
function SceneListItem({ scene, basePath }: { scene: Scene; basePath: string }) {
  const sceneLink = scene.short_id
    ? `${basePath}/scene/${scene.short_id}`
    : `${basePath}/scenes`;

  return (
    <Link
      href={sceneLink}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-black/20"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-sm font-bold text-muted-foreground">
        #{scene.scene_number}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">{scene.title}</h4>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
        <span>{scene.duration_seconds ?? 0}s</span>
        <span className={cn('h-2 w-2 rounded-full', SCENE_STATUS_DOT[scene.status ?? 'draft'])} />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick links                                                        */
/* ------------------------------------------------------------------ */
const QUICK_LINKS = [
  { label: 'Timeline', href: '/timeline', icon: Layers },
  { label: 'Narracion', href: '/narration', icon: Mic },
  { label: 'Analisis', href: '/analysis', icon: BarChart3 },
  { label: 'Exportar', href: '/export', icon: FileOutput },
] as const;

/* ------------------------------------------------------------------ */
/*  View mode                                                          */
/* ------------------------------------------------------------------ */
type ViewMode = 'grid' | 'list';

const VIEW_TABS: Array<{ key: ViewMode; label: string; icon: typeof LayoutGrid }> = [
  { key: 'grid', label: 'Grid', icon: LayoutGrid },
  { key: 'list', label: 'Lista', icon: List },
];

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */
export default function VideoOverviewPage() {
  const { project } = useProject();
  const { video, loading, scenes, scenesLoading } = useVideo();
  const openVideoSettingsModal = useUIStore((s) => s.openVideoSettingsModal);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Fetch narrative arcs
  const { data: arcs = [] } = useQuery({
    queryKey: ['narrative-arcs', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('narrative_arcs')
        .select('*')
        .eq('video_id', video!.id)
        .order('sort_order');
      return (data ?? []) as NarrativeArc[];
    },
    enabled: !!video?.id,
  });

  /* Loading */
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* Not found */
  if (!video || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Video className="h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Video no encontrado</h3>
        <Link href={`/project/${project?.short_id ?? ''}`} className="mt-3 text-sm text-primary hover:underline">
          Volver al proyecto
        </Link>
      </div>
    );
  }

  const basePath = `/project/${project.short_id}/video/${video.short_id}`;
  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const approvedScenes = scenes.filter((s) => s.status === 'approved').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{video.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{video.platform}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {video.target_duration_seconds}s
            </span>
            {video.aspect_ratio && (
              <span className="flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5" />
                {video.aspect_ratio}
              </span>
            )}
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                STATUS_COLORS[video.status] ?? 'bg-zinc-500/20 text-muted-foreground border-zinc-500/20',
              )}
            >
              {STATUS_LABELS[video.status] ?? video.status}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openVideoSettingsModal('general')}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          Ajustes
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Film} label="Escenas" value={scenesLoading ? '...' : scenes.length} />
        <Stat icon={CheckCircle2} label="Aprobadas" value={scenesLoading ? '...' : approvedScenes} tone="text-emerald-500" />
        <Stat icon={Target} label="Duracion objetivo" value={`${video.target_duration_seconds}s`} />
        <Stat icon={Clock} label="Duracion actual" value={scenesLoading ? '...' : `${totalDuration}s`} />
      </div>

      {/* ── Narrative arc bar ───────────────────────────────── */}
      {arcs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arco narrativo</p>
          <ArcBar arcs={arcs} totalDuration={totalDuration || video.target_duration_seconds || 60} className="h-3" />
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {arcs.map((arc) => {
              const duration = (arc.end_second ?? 0) - (arc.start_second ?? 0);
              return (
                <span key={arc.id} className="flex items-center gap-1">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      arc.phase === 'hook' ? 'bg-red-500' :
                      arc.phase === 'build' ? 'bg-amber-500' :
                      arc.phase === 'peak' ? 'bg-emerald-500' :
                      arc.phase === 'close' ? 'bg-blue-500' : 'bg-zinc-500',
                    )}
                  />
                  {arc.title} ({duration}s)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Scenes section ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Escenas
          </p>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border p-0.5">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setViewMode(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    viewMode === tab.key
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <Link
              href={`${basePath}/scenes`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </div>

        {/* Content */}
        {scenesLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12">
            <Film className="h-10 w-10 text-muted-foreground/60" />
            <h4 className="mt-3 text-sm font-medium text-foreground">Sin escenas todavia</h4>
            <p className="mt-1 text-xs text-muted-foreground">Crea escenas manualmente o genera con IA</p>
            <Link
              href={`${basePath}/scenes`}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Ir a escenas
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {scenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} basePath={basePath} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {scenes.map((scene) => (
              <SceneListItem key={scene.id} scene={scene} basePath={basePath} />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick links ─────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones rapidas</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={`${basePath}${link.href}`}
              className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-all hover:border-primary/30"
            >
              <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-foreground">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────── */}
      {video.description && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripcion</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{video.description}</p>
        </div>
      )}
    </div>
  );
}
