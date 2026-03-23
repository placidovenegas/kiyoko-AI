'use client';

import { useState, useMemo } from 'react';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import { SceneCard } from '@/components/video/SceneCard';
import { KButton } from '@/components/ui/kiyoko-button';
import { cn } from '@/lib/utils/cn';
import {
  Plus,
  Sparkles,
  LayoutGrid,
  List,
  Clock,
  Loader2,
  Film,
} from 'lucide-react';
import Link from 'next/link';
import type { Scene } from '@/types';

type ViewMode = 'grid' | 'list' | 'timeline';

const VIEW_TABS: Array<{ key: ViewMode; label: string; icon: typeof LayoutGrid }> = [
  { key: 'grid', label: 'Cuadricula', icon: LayoutGrid },
  { key: 'list', label: 'Lista', icon: List },
  { key: 'timeline', label: 'Linea de tiempo', icon: Clock },
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompt_ready: 'Prompt listo',
  generating: 'Generando',
  generated: 'Generado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-zinc-500',
  prompt_ready: 'bg-blue-500',
  generating: 'bg-amber-500 animate-pulse',
  generated: 'bg-purple-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

const ARC_PHASE_COLORS: Record<string, string> = {
  hook: 'bg-red-500/80',
  build: 'bg-amber-500/80',
  peak: 'bg-emerald-500/80',
  resolve: 'bg-blue-500/80',
};

const ARC_PHASE_TEXT: Record<string, string> = {
  hook: 'text-red-400',
  build: 'text-amber-400',
  peak: 'text-emerald-400',
  resolve: 'text-blue-400',
};

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border bg-card"
        >
          <div className="aspect-video w-full bg-background" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 rounded bg-secondary" />
            <div className="h-3 w-1/2 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ basePath }: { basePath: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
      <Film className="mb-4 h-12 w-12 text-muted-foreground/60" />
      <h3 className="mb-1 text-lg font-semibold text-foreground">
        Sin escenas
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Crea tu primera escena para empezar a construir el video
      </p>
      <KButton
        icon={<Plus className="h-4 w-4" />}
        onClick={() => {
          /* TODO: open create scene modal */
        }}
      >
        Nueva escena
      </KButton>
    </div>
  );
}

function ListView({
  scenes,
  basePath,
}: {
  scenes: Scene[];
  basePath: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">Titulo</th>
            <th className="px-3 py-2 hidden md:table-cell">Descripcion</th>
            <th className="px-3 py-2 w-20 text-center">Duracion</th>
            <th className="px-3 py-2 w-24 text-center">Estado</th>
            <th className="px-3 py-2 w-20 text-center hidden sm:table-cell">Fase</th>
          </tr>
        </thead>
        <tbody>
          {scenes.map((scene) => {
            const sceneLink = scene.short_id
              ? `${basePath}/scene/${scene.short_id}`
              : `${basePath}/scenes`;

            return (
              <tr
                key={scene.id}
                className="border-b border-border/50 transition hover:bg-card"
              >
                <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">
                  {scene.scene_number}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={sceneLink}
                    className="font-medium text-foreground hover:text-primary transition"
                  >
                    {scene.title}
                  </Link>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell">
                  <span className="line-clamp-1 text-muted-foreground text-xs">
                    {scene.description ?? '—'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">
                  {scene.duration_seconds ?? 5}s
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        STATUS_DOT[scene.status ?? 'draft'],
                      )}
                    />
                    <span className="text-xs text-muted-foreground">
                      {STATUS_LABELS[scene.status ?? 'draft']}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                  {scene.arc_phase ? (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        ARC_PHASE_TEXT[scene.arc_phase],
                      )}
                    >
                      {scene.arc_phase}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TimelineView({
  scenes,
  basePath,
}: {
  scenes: Scene[];
  basePath: string;
}) {
  const totalDuration = useMemo(
    () => scenes.reduce((acc, s) => acc + (s.duration_seconds ?? 5), 0),
    [scenes],
  );

  if (totalDuration === 0) return null;

  return (
    <div className="space-y-4">
      {/* Duration summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Duracion total: <strong className="text-foreground">{totalDuration}s</strong></span>
        <div className="flex items-center gap-3">
          {Object.entries(ARC_PHASE_COLORS).map(([phase, color]) => (
            <span key={phase} className="flex items-center gap-1">
              <span className={cn('h-2.5 w-2.5 rounded-sm', color)} />
              {phase}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="flex h-20 gap-0.5 rounded-lg overflow-hidden border border-border">
        {scenes.map((scene) => {
          const pct = ((scene.duration_seconds ?? 5) / totalDuration) * 100;
          const phase = scene.arc_phase ?? 'build';
          const sceneLink = scene.short_id
            ? `${basePath}/scene/${scene.short_id}`
            : `${basePath}/scenes`;

          return (
            <Link
              key={scene.id}
              href={sceneLink}
              className={cn(
                'group relative flex flex-col items-center justify-center transition-opacity hover:opacity-90',
                ARC_PHASE_COLORS[phase] ?? 'bg-zinc-600/80',
              )}
              style={{ width: `${Math.max(pct, 2)}%` }}
              title={`E${scene.scene_number}: ${scene.title} (${scene.duration_seconds ?? 5}s)`}
            >
              <span className="text-xs font-bold text-white drop-shadow">
                {scene.scene_number}
              </span>
              <span className="text-[9px] text-white/70 line-clamp-1 px-1 text-center hidden sm:block">
                {scene.title}
              </span>
              <span className="text-[9px] text-white/50">
                {scene.duration_seconds ?? 5}s
              </span>
            </Link>
          );
        })}
      </div>

      {/* Scene list below timeline */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {scenes.map((scene) => {
          const phase = scene.arc_phase ?? 'build';
          const sceneLink = scene.short_id
            ? `${basePath}/scene/${scene.short_id}`
            : `${basePath}/scenes`;

          return (
            <Link
              key={scene.id}
              href={sceneLink}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition hover:border-primary/30"
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white',
                  ARC_PHASE_COLORS[phase] ?? 'bg-zinc-600',
                )}
              >
                {scene.scene_number}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {scene.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {scene.duration_seconds ?? 5}s
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function ScenesPage() {
  const { video, scenes, scenesLoading } = useVideo();
  const { project } = useProject();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  if (!video || !project) return null;
  const basePath = `/project/${project.short_id}/video/${video.short_id}`;

  const sortedScenes = useMemo(
    () => [...scenes].sort((a, b) => a.scene_number - b.scene_number),
    [scenes],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Escenas</h2>
            {!scenesLoading && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {scenes.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <KButton
              variant="ai"
              size="sm"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => {
                /* TODO: AI generate scenes */
              }}
            >
              IA
            </KButton>
            <KButton
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                /* TODO: open create scene modal */
              }}
            >
              Nueva escena
            </KButton>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="mt-3 flex items-center gap-1 rounded-lg border border-border p-0.5 w-fit">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
                  viewMode === tab.key
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {scenesLoading ? (
          <SkeletonGrid />
        ) : sortedScenes.length === 0 ? (
          <EmptyState basePath={basePath} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sortedScenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                basePath={basePath}
              />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <ListView scenes={sortedScenes} basePath={basePath} />
        ) : (
          <TimelineView scenes={sortedScenes} basePath={basePath} />
        )}
      </div>
    </div>
  );
}
