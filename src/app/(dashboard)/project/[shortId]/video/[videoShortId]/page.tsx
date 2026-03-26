'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { KButton } from '@/components/ui/kiyoko-button';
import { ArcBar } from '@/components/video/ArcBar';
import { SceneCard } from '@/components/video/SceneCard';
import {
  Film, Clock, Monitor, ArrowRight, Mic, FileOutput,
  Video, Loader2, BarChart3, Share2, Plus, Sparkles,
  Layers, LayoutGrid, List, Table2, Timer,
} from 'lucide-react';
import type { NarrativeArc, Scene } from '@/types';

type ViewMode = 'storyboard' | 'list' | 'table' | 'timeline';

const VIEW_TABS: Array<{ key: ViewMode; label: string; icon: typeof LayoutGrid }> = [
  { key: 'storyboard', label: 'Storyboard', icon: LayoutGrid },
  { key: 'list', label: 'Lista', icon: List },
  { key: 'table', label: 'Tabla', icon: Table2 },
  { key: 'timeline', label: 'Timeline', icon: Timer },
];

const ALL_PHASES = ['hook', 'build', 'peak', 'close'] as const;
const ALL_STATUSES = ['draft', 'prompt_ready', 'generating', 'generated', 'approved', 'rejected'] as const;

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

const SCENE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompt_ready: 'Prompt listo',
  generating: 'Generando',
  generated: 'Generado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const SCENE_STATUS_DOT: Record<string, string> = {
  draft: 'bg-zinc-500',
  prompt_ready: 'bg-blue-500',
  generating: 'bg-amber-500',
  generated: 'bg-purple-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

const PHASE_DOT: Record<string, string> = {
  hook: 'bg-red-500',
  build: 'bg-amber-500',
  peak: 'bg-emerald-500',
  close: 'bg-blue-500',
};

const QUICK_LINKS = [
  { label: 'Escenas', href: '/scenes', icon: Film, desc: 'Board de escenas del video' },
  { label: 'Timeline', href: '/timeline', icon: Layers, desc: 'Linea de tiempo visual' },
  { label: 'Narracion', href: '/narration', icon: Mic, desc: 'Texto y audio TTS' },
  { label: 'Analisis', href: '/analysis', icon: BarChart3, desc: 'Analisis IA del video' },
  { label: 'Compartir', href: '/share', icon: Share2, desc: 'Compartir escenas con clientes' },
  { label: 'Exportar', href: '/export', icon: FileOutput, desc: 'PDF, HTML, JSON, MP4' },
] as const;

// ─── Scene Table Row ─────────────────────────────────────────
function SceneTableRow({ scene, basePath }: { scene: Scene; basePath: string }) {
  const sceneLink = scene.short_id
    ? `${basePath}/scene/${scene.short_id}`
    : `${basePath}/scenes`;

  return (
    <Link
      href={sceneLink}
      className="flex items-center h-10 border-b border-border text-sm hover:bg-secondary/50 transition-colors"
    >
      <div className="w-12 px-3 text-muted-foreground font-mono text-xs">{scene.scene_number}</div>
      <div className="flex-1 min-w-0 px-3 truncate font-medium text-foreground">{scene.title}</div>
      <div className="w-16 px-3 text-muted-foreground text-xs text-center">{scene.duration_seconds ?? 0}s</div>
      <div className="w-20 px-3">
        {scene.arc_phase && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('h-2 w-2 rounded-full', PHASE_DOT[scene.arc_phase] ?? 'bg-zinc-500')} />
            {scene.arc_phase}
          </span>
        )}
      </div>
      <div className="w-24 px-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full', SCENE_STATUS_DOT[scene.status ?? 'draft'])} />
          {SCENE_STATUS_LABELS[scene.status ?? 'draft']}
        </span>
      </div>
    </Link>
  );
}

// ─── Scene List Item ─────────────────────────────────────────
function SceneListItem({ scene, basePath }: { scene: Scene; basePath: string }) {
  const sceneLink = scene.short_id
    ? `${basePath}/scene/${scene.short_id}`
    : `${basePath}/scenes`;

  return (
    <Link
      href={sceneLink}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-black/20"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-sm font-bold text-muted-foreground">
        #{scene.scene_number}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">{scene.title}</h4>
        {scene.client_annotation && (
          <p className="text-xs italic text-muted-foreground truncate mt-0.5">
            &ldquo;{scene.client_annotation}&rdquo;
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
        <span>{scene.duration_seconds ?? 0}s</span>
        {scene.arc_phase && (
          <span className="flex items-center gap-1">
            <span className={cn('h-2 w-2 rounded-full', PHASE_DOT[scene.arc_phase] ?? 'bg-zinc-500')} />
            {scene.arc_phase}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className={cn('h-2 w-2 rounded-full', SCENE_STATUS_DOT[scene.status ?? 'draft'])} />
        </span>
      </div>
    </Link>
  );
}

// ─── Timeline Block ──────────────────────────────────────────
function TimelineBlock({ scene, basePath, maxDuration }: { scene: Scene; basePath: string; maxDuration: number }) {
  const sceneLink = scene.short_id
    ? `${basePath}/scene/${scene.short_id}`
    : `${basePath}/scenes`;
  const dur = scene.duration_seconds ?? 5;
  const widthPercent = maxDuration > 0 ? Math.max((dur / maxDuration) * 100, 5) : 10;
  const phaseColor = scene.arc_phase
    ? { hook: 'bg-red-500/20 border-red-500/40', build: 'bg-amber-500/20 border-amber-500/40', peak: 'bg-emerald-500/20 border-emerald-500/40', close: 'bg-blue-500/20 border-blue-500/40' }[scene.arc_phase] ?? 'bg-zinc-500/20 border-zinc-500/40'
    : 'bg-zinc-500/20 border-zinc-500/40';

  return (
    <Link
      href={sceneLink}
      className={cn(
        'inline-flex flex-col items-center justify-center rounded-md border px-2 py-1.5 text-[10px] transition-all hover:opacity-80',
        phaseColor,
      )}
      style={{ width: `${widthPercent}%`, minWidth: '40px' }}
      title={`${scene.title} (${dur}s)`}
    >
      <span className="font-bold text-foreground">{scene.scene_number}</span>
      <span className="text-muted-foreground">{dur}s</span>
    </Link>
  );
}

export default function VideoOverviewPage() {
  const { project } = useProject();
  const { video, loading, scenes, scenesLoading } = useVideo();

  const [viewMode, setViewMode] = useState<ViewMode>('storyboard');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch narrative arcs for ArcBar
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  // Apply filters
  const filteredScenes = scenes.filter((s) => {
    if (phaseFilter !== 'all' && s.arc_phase !== phaseFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const maxSceneDuration = Math.max(...scenes.map((s) => s.duration_seconds ?? 0), 1);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{video.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5" />
                {video.platform}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {video.target_duration_seconds}s objetivo
              </span>
              {video.aspect_ratio && (
                <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                  {video.aspect_ratio}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={cn(
          'shrink-0 rounded-full border px-3 py-1 text-xs font-medium',
          STATUS_COLORS[video.status] ?? 'bg-zinc-500/20 text-muted-foreground border-zinc-500/20',
        )}>
          {STATUS_LABELS[video.status] ?? video.status}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: scenesLoading ? '...' : scenes.length, label: 'Escenas' },
          { value: scenesLoading ? '...' : approvedScenes, label: 'Aprobadas' },
          { value: `${video.target_duration_seconds}s`, label: 'Duracion objetivo' },
          { value: scenesLoading ? '...' : `${totalDuration}s`, label: 'Duracion actual' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Narrative Arc Bar */}
      {arcs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arco narrativo</h3>
          <ArcBar arcs={arcs} totalDuration={totalDuration || video.target_duration_seconds || 60} className="h-3" />
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {arcs.map((arc) => {
              const duration = (arc.end_second ?? 0) - (arc.start_second ?? 0);
              return (
                <span key={arc.id} className="flex items-center gap-1">
                  <span className={cn(
                    'h-2 w-2 rounded-full',
                    arc.phase === 'hook' ? 'bg-red-500' :
                    arc.phase === 'build' ? 'bg-amber-500' :
                    arc.phase === 'peak' ? 'bg-emerald-500' :
                    arc.phase === 'close' ? 'bg-blue-500' : 'bg-zinc-500',
                  )} />
                  {arc.title} ({duration}s)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Scene Grid with Toolbar */}
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <LayoutGrid className="h-4 w-4 text-primary" />
              Escenas
              {!scenesLoading && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
                  {filteredScenes.length}
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode tabs */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setViewMode(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    viewMode === tab.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-secondary/50 px-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="all">Todas las fases</option>
              {ALL_PHASES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-secondary/50 px-2 text-xs text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="all">Todos los estados</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{SCENE_STATUS_LABELS[s]}</option>
              ))}
            </select>

            <Link href={`${basePath}/scenes`}>
              <KButton variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />} iconPosition="right">
                Ver todas
              </KButton>
            </Link>
          </div>
        </div>

        {/* Scene content by view mode */}
        {scenesLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredScenes.length === 0 && scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12">
            <Film className="h-10 w-10 text-muted-foreground/60" />
            <h4 className="mt-3 text-sm font-medium text-foreground">Sin escenas todavia</h4>
            <p className="mt-1 text-xs text-muted-foreground">Crea escenas manualmente o genera con IA</p>
            <div className="mt-4 flex gap-2">
              <Link href={`${basePath}/scenes`}>
                <KButton variant="outline" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                  Crear manual
                </KButton>
              </Link>
              <Link href={`${basePath}/scenes`}>
                <KButton variant="primary" size="sm" icon={<Sparkles className="h-3.5 w-3.5" />}>
                  Generar con IA
                </KButton>
              </Link>
            </div>
          </div>
        ) : filteredScenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-8">
            <p className="text-sm text-muted-foreground">No hay escenas con los filtros seleccionados</p>
          </div>
        ) : viewMode === 'storyboard' ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredScenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} basePath={basePath} />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredScenes.map((scene) => (
              <SceneListItem key={scene.id} scene={scene} basePath={basePath} />
            ))}
          </div>
        ) : viewMode === 'table' ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Table header */}
            <div className="flex items-center h-9 border-b border-border bg-secondary/50 text-xs font-medium text-muted-foreground uppercase">
              <div className="w-12 px-3">#</div>
              <div className="flex-1 px-3">Titulo</div>
              <div className="w-16 px-3 text-center">Dur.</div>
              <div className="w-20 px-3">Fase</div>
              <div className="w-24 px-3">Estado</div>
            </div>
            {/* Table rows */}
            {filteredScenes.map((scene) => (
              <SceneTableRow key={scene.id} scene={scene} basePath={basePath} />
            ))}
            {/* Footer */}
            <div className="flex items-center h-9 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
              <div className="w-12 px-3" />
              <div className="flex-1 px-3 font-medium">Total: {filteredScenes.length} escenas</div>
              <div className="w-16 px-3 text-center font-medium">{filteredScenes.reduce((s, sc) => s + (sc.duration_seconds ?? 0), 0)}s</div>
              <div className="w-20 px-3" />
              <div className="w-24 px-3" />
            </div>
          </div>
        ) : (
          /* Timeline view */
          <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
            {/* Time ruler */}
            <div className="flex items-center gap-0 mb-3 text-[10px] text-muted-foreground">
              {Array.from({ length: Math.ceil(totalDuration / 15) + 1 }, (_, i) => (
                <span key={i} className="flex-1 text-center border-l border-border/40 first:border-l-0">
                  {i * 15}s
                </span>
              ))}
            </div>
            {/* Group by phase */}
            {ALL_PHASES.map((phase) => {
              const phaseScenes = filteredScenes.filter((s) => s.arc_phase === phase);
              if (phaseScenes.length === 0) return null;
              return (
                <div key={phase} className="mb-3">
                  <div className="text-[10px] font-medium uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', PHASE_DOT[phase])} />
                    {phase}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {phaseScenes.map((scene) => (
                      <TimelineBlock key={scene.id} scene={scene} basePath={basePath} maxDuration={maxSceneDuration} />
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Scenes without a phase */}
            {filteredScenes.filter((s) => !s.arc_phase).length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] font-medium uppercase text-muted-foreground mb-1.5">Sin fase</div>
                <div className="flex gap-1 flex-wrap">
                  {filteredScenes.filter((s) => !s.arc_phase).map((scene) => (
                    <TimelineBlock key={scene.id} scene={scene} basePath={basePath} maxDuration={maxSceneDuration} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones rapidas</h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={`${basePath}${link.href}`}
              className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-black/20"
            >
              <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-foreground text-sm">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Description */}
      {video.description && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripcion</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{video.description}</p>
        </div>
      )}
    </div>
  );
}
