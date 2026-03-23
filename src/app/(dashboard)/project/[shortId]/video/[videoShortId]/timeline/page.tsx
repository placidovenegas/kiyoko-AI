'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, Film, Layers, ChevronRight } from 'lucide-react';
import type { NarrativeArc, Scene } from '@/types';

const ARC_PHASE_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  hook: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', label: 'Hook' },
  build: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', label: 'Build' },
  peak: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', label: 'Peak' },
  resolve: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', label: 'Resolve' },
  cta: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', label: 'CTA' },
  intro: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400', label: 'Intro' },
  outro: { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400', label: 'Outro' },
};

const DEFAULT_PHASE = { bg: 'bg-zinc-500/20', border: 'border-zinc-500/40', text: 'text-zinc-400', label: 'Otro' };

function formatSeconds(s: number | null): string {
  if (s == null || s <= 0) return '0s';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

export default function TimelinePage() {
  const { video, scenes, loading: videoLoading, scenesLoading } = useVideo();
  const { project } = useProject();
  const params = useParams();
  const shortId = params.shortId as string;
  const videoShortId = params.videoShortId as string;

  // Fetch narrative arcs
  const { data: arcs = [], isLoading: arcsLoading } = useQuery({
    queryKey: ['narrative-arcs', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('narrative_arcs')
        .select('*')
        .eq('video_id', video!.id)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as NarrativeArc[];
    },
    enabled: !!video?.id,
  });

  // Map scenes to arcs by time overlap
  const scenesWithArcs = useMemo(() => {
    let cumulativeStart = 0;
    return scenes.map((scene) => {
      const sceneDuration = scene.duration_seconds ?? 0;
      const sceneStart = cumulativeStart;
      const sceneEnd = sceneStart + sceneDuration;
      cumulativeStart = sceneEnd;

      // Find matching arc by arc_phase on scene or by time overlap
      const matchingArc = scene.arc_phase
        ? arcs.find((arc) => arc.phase === scene.arc_phase) ?? null
        : arcs.find((arc) => {
            const arcStart = arc.start_second ?? 0;
            const arcEnd = arc.end_second ?? Infinity;
            return sceneStart >= arcStart && sceneStart < arcEnd;
          }) ?? null;

      return {
        scene,
        arc: matchingArc,
        duration: sceneDuration,
        start: sceneStart,
        end: sceneEnd,
      };
    });
  }, [scenes, arcs]);

  // Total duration
  const totalDuration = useMemo(() => {
    if (scenesWithArcs.length === 0) return 0;
    return Math.max(...scenesWithArcs.map((s) => s.end), 0);
  }, [scenesWithArcs]);

  const loading = videoLoading || scenesLoading || arcsLoading;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
        <div className="h-16 animate-pulse rounded-xl bg-card" />
        <div className="h-32 animate-pulse rounded-xl bg-card" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scenes.length} escenas / {formatSeconds(totalDuration)} total
          </p>
        </div>
      </div>

      {/* ── Empty state ── */}
      {scenes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <Clock className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">Sin escenas</h3>
          <p className="mb-4 text-sm text-muted-foreground">Crea escenas para visualizar la linea de tiempo</p>
          <Link
            href={`/project/${shortId}/video/${videoShortId}/scenes`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Film className="h-4 w-4" /> Ir a escenas
          </Link>
        </div>
      )}

      {scenes.length > 0 && (
        <>
          {/* ── Arc phases legend ── */}
          {arcs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {arcs.map((arc) => {
                const phaseConfig = ARC_PHASE_COLORS[arc.phase] ?? DEFAULT_PHASE;
                return (
                  <div
                    key={arc.id}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${phaseConfig.bg} ${phaseConfig.border} ${phaseConfig.text}`}
                  >
                    <div className={`h-2 w-2 rounded-full ${phaseConfig.bg.replace('/20', '')}`} />
                    {arc.title}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Horizontal timeline bar ── */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              <span>Vista horizontal ({formatSeconds(totalDuration)})</span>
            </div>

            <div className="flex h-12 w-full gap-0.5 overflow-x-auto rounded-lg bg-background p-1">
              {scenesWithArcs.map(({ scene, arc, duration }) => {
                const widthPercent = totalDuration > 0 ? Math.max((duration / totalDuration) * 100, 2) : 100 / scenes.length;
                const phaseConfig = arc ? (ARC_PHASE_COLORS[arc.phase] ?? DEFAULT_PHASE) : DEFAULT_PHASE;

                return (
                  <Link
                    key={scene.id}
                    href={`/project/${shortId}/video/${videoShortId}/scene/${scene.short_id}`}
                    className={`group relative flex min-w-8 items-center justify-center rounded-md border transition hover:brightness-125 ${phaseConfig.bg} ${phaseConfig.border}`}
                    style={{ width: `${widthPercent}%` }}
                    title={`${scene.title ?? `Escena ${scene.scene_number}`} (${formatSeconds(duration)})`}
                  >
                    <span className="truncate px-1 text-[10px] font-medium text-foreground">
                      {scene.scene_number}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Time markers */}
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>0s</span>
              {totalDuration > 10 && <span>{formatSeconds(Math.round(totalDuration / 2))}</span>}
              <span>{formatSeconds(totalDuration)}</span>
            </div>
          </div>

          {/* ── Scene list ── */}
          <div className="space-y-2">
            {scenesWithArcs.map(({ scene, arc, duration, start }) => {
              const phaseConfig = arc ? (ARC_PHASE_COLORS[arc.phase] ?? DEFAULT_PHASE) : DEFAULT_PHASE;

              return (
                <Link
                  key={scene.id}
                  href={`/project/${shortId}/video/${videoShortId}/scene/${scene.short_id}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition hover:border-primary/30"
                >
                  {/* Scene number */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${phaseConfig.bg} ${phaseConfig.text}`}>
                    {scene.scene_number}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-foreground">
                      {scene.title ?? `Escena ${scene.scene_number}`}
                    </h4>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatSeconds(start)} - {formatSeconds(start + duration)}</span>
                      {arc && (
                        <>
                          <span className="text-border">|</span>
                          <span className={phaseConfig.text}>{arc.title}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Duration + arrow */}
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {formatSeconds(duration)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
