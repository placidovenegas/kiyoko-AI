'use client';

import { useState, useMemo } from 'react';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import { SceneCard } from '@/components/video/SceneCard';
import { SceneCreateModal } from '@/components/modals';
import { cn } from '@/lib/utils/cn';
import {
  Plus, Sparkles, LayoutGrid, List, Clock, Film,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { Scene } from '@/types';

type ViewMode = 'grid' | 'list' | 'timeline';

const VIEW_TABS: Array<{ key: ViewMode; label: string; icon: typeof LayoutGrid }> = [
  { key: 'grid', label: 'Cuadrícula', icon: LayoutGrid },
  { key: 'list', label: 'Lista', icon: List },
  { key: 'timeline', label: 'Timeline', icon: Clock },
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', prompt_ready: 'Prompt listo', generating: 'Generando',
  generated: 'Generado', approved: 'Aprobado', rejected: 'Rechazado',
};
const STATUS_DOT: Record<string, string> = {
  draft: 'bg-zinc-400', prompt_ready: 'bg-blue-400', generating: 'bg-amber-400 animate-pulse',
  generated: 'bg-purple-400', approved: 'bg-emerald-400', rejected: 'bg-red-400',
};
const ARC_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  hook: { bg: 'bg-blue-500/80', text: 'text-blue-400', label: 'Hook' },
  build: { bg: 'bg-amber-500/80', text: 'text-amber-400', label: 'Build' },
  peak: { bg: 'bg-red-500/80', text: 'text-red-400', label: 'Peak' },
  close: { bg: 'bg-emerald-500/80', text: 'text-emerald-400', label: 'Close' },
};

export default function ScenesPage() {
  const { video, scenes, loading: videoLoading } = useVideo();
  const { project } = useProject();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const basePath = `/project/${project?.short_id}/video/${video?.short_id}`;
  const sortedScenes = useMemo(
    () => [...(scenes ?? [])].sort((a, b) => (a.scene_number ?? 0) - (b.scene_number ?? 0)),
    [scenes],
  );
  const totalDuration = sortedScenes.reduce((s, sc) => s + (sc.duration_seconds ?? 0), 0);
  const nextSceneNumber = sortedScenes.length > 0 ? Math.max(...sortedScenes.map((s) => s.scene_number ?? 0)) + 1 : 1;

  if (videoLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <div className="p-3 space-y-2"><div className="h-4 w-3/4 bg-muted rounded animate-pulse" /><div className="h-3 w-1/2 bg-muted rounded animate-pulse" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Escenas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sortedScenes.length} escenas · {totalDuration}s total
            {video?.target_duration_seconds ? ` / ${video.target_duration_seconds}s target` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-8 text-xs font-medium transition-colors cursor-pointer',
                  viewMode === tab.key ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva escena
          </button>
        </div>
      </div>

      {/* Empty state */}
      {sortedScenes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <Film className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">Sin escenas</h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-xs text-center">
            Crea tu primera escena o deja que la IA planifique el video completo
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nueva escena
            </button>
            <button
              onClick={() => { /* TODO: AI generate */ }}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Auto-planificar
            </button>
          </div>
        </div>
      )}

      {/* Grid view */}
      {sortedScenes.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedScenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} basePath={basePath} />
          ))}
        </div>
      )}

      {/* List view */}
      {sortedScenes.length > 0 && viewMode === 'list' && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2.5 w-10">#</th>
                <th className="px-3 py-2.5">Título</th>
                <th className="px-3 py-2.5 hidden md:table-cell">Descripción</th>
                <th className="px-3 py-2.5 w-20 text-center">Duración</th>
                <th className="px-3 py-2.5 w-20 text-center">Fase</th>
                <th className="px-3 py-2.5 w-24 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedScenes.map((scene) => {
                const arc = ARC_COLORS[scene.arc_phase ?? 'build'];
                return (
                  <tr key={scene.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{scene.scene_number}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`${basePath}/scene/${scene.short_id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {scene.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground text-xs line-clamp-1 max-w-xs">{scene.description}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground tabular-nums">{scene.duration_seconds}s</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn('text-[10px] font-bold uppercase', arc?.text)}>{arc?.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[scene.status])} />
                        <span className="text-xs text-muted-foreground">{STATUS_LABELS[scene.status]}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline view */}
      {sortedScenes.length > 0 && viewMode === 'timeline' && (
        <div className="space-y-4">
          {/* Timeline bar */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex h-10 rounded-md overflow-hidden">
              {sortedScenes.map((scene) => {
                const pct = totalDuration > 0 ? ((scene.duration_seconds ?? 0) / totalDuration) * 100 : 0;
                const arc = ARC_COLORS[scene.arc_phase ?? 'build'];
                return (
                  <Link
                    key={scene.id}
                    href={`${basePath}/scene/${scene.short_id}`}
                    className={cn('flex items-center justify-center text-[10px] font-bold text-white hover:opacity-80 transition-opacity', arc?.bg)}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                    title={`${scene.title} (${scene.duration_seconds}s)`}
                  >
                    {pct > 5 && scene.scene_number}
                  </Link>
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
              <span>0s</span>
              <span>{totalDuration}s</span>
            </div>
          </div>

          {/* Scene cards below */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortedScenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} basePath={basePath} />
            ))}
          </div>
        </div>
      )}

      {/* Create Scene Modal */}
      {video && project && (
        <SceneCreateModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          videoId={video.id}
          projectId={project.id}
          nextSceneNumber={nextSceneNumber}
        />
      )}
    </div>
  );
}
