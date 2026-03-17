'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface NarrativeArc {
  id: string;
  phase: string;
  phase_number: number;
  title: string;
  description: string;
  start_second: number;
  end_second: number;
  scene_numbers: string[];
  color: string;
  sort_order: number;
}

const PHASE_COLORS: Record<string, string> = {
  hook: '#E24B4A',
  build: '#BA7517',
  peak: '#1D9E75',
  close: '#185FA5',
};

const PHASE_BG: Record<string, string> = {
  hook: 'bg-[#E24B4A]',
  build: 'bg-[#BA7517]',
  peak: 'bg-[#1D9E75]',
  close: 'bg-[#185FA5]',
};

export default function ArcPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [arcs, setArcs] = useState<NarrativeArc[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!project) {
      setLoading(false);
      return;
    }

    const { data: arcsData } = await supabase
      .from('narrative_arcs')
      .select('*')
      .eq('project_id', project.id)
      .order('sort_order', { ascending: true });

    setArcs(arcsData ?? []);
    setLoading(false);
  }, [slug, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate total duration for proportional bar
  const totalDuration =
    arcs.length > 0
      ? Math.max(...arcs.map((a) => Number(a.end_second)))
      : 60;

  const formatTime = (seconds: number) => `${Math.round(seconds)}s`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-6 w-40 animate-pulse rounded bg-surface-secondary" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-surface-secondary" />
        </div>
        <div className="h-20 animate-pulse rounded-xl bg-surface-secondary" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Arco Narrativo</h2>
        <p className="text-sm text-foreground-muted">
          Estructura dramatica del guion dividida en fases
        </p>
      </div>

      {/* Time bar */}
      {arcs.length > 0 ? (
        <div className="rounded-xl bg-surface-secondary p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Barra de tiempo
          </p>
          <div className="flex h-12 overflow-hidden rounded-lg">
            {arcs.map((arc) => {
              const duration = Number(arc.end_second) - Number(arc.start_second);
              const widthPercent = (duration / totalDuration) * 100;
              const bgColor = PHASE_COLORS[arc.phase] || arc.color || '#6B7280';

              return (
                <div
                  key={arc.id}
                  className="flex items-center justify-center"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: bgColor,
                  }}
                >
                  <span className="text-xs font-semibold text-white">
                    {arc.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-foreground-muted">
            <span>0s</span>
            {arcs.map((arc) => (
              <span key={arc.id}>{formatTime(Number(arc.end_second))}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-secondary p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Barra de tiempo
          </p>
          <div className="flex h-12 overflow-hidden rounded-lg">
            {(['hook', 'build', 'peak', 'close'] as const).map((phase) => (
              <div
                key={phase}
                className={`${PHASE_BG[phase]} flex flex-1 items-center justify-center`}
              >
                <span className="text-xs font-semibold text-white">
                  {phase === 'hook'
                    ? 'Gancho'
                    : phase === 'build'
                      ? 'Desarrollo'
                      : phase === 'peak'
                        ? 'Climax'
                        : 'Cierre'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-foreground-muted">
            <span>0s</span>
            <span>15s</span>
            <span>30s</span>
            <span>45s</span>
            <span>60s</span>
          </div>
        </div>
      )}

      {/* Phase cards */}
      {arcs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {arcs.map((arc) => {
            const bgColor = PHASE_COLORS[arc.phase] || arc.color || '#6B7280';

            return (
              <div
                key={arc.id}
                className="rounded-xl bg-surface-secondary p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: bgColor }}>
                    {arc.phase_number}
                  </span>
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: bgColor }}
                  />
                  <h3 className="text-lg font-semibold text-foreground">
                    {arc.title}
                  </h3>
                  <span className="ml-auto rounded-md bg-surface-tertiary px-2 py-0.5 text-xs text-foreground-muted">
                    {formatTime(Number(arc.start_second))} -{' '}
                    {formatTime(Number(arc.end_second))}
                  </span>
                </div>
                <p className="mb-3 text-sm text-foreground-secondary">
                  {arc.description}
                </p>
                {arc.scene_numbers && arc.scene_numbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {arc.scene_numbers.map((sceneNum) => (
                      <span
                        key={sceneNum}
                        className="cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium text-white transition hover:opacity-80"
                        style={{ backgroundColor: bgColor }}
                      >
                        E{sceneNum}
                      </span>
                    ))}
                  </div>
                )}
                {(!arc.scene_numbers || arc.scene_numbers.length === 0) && (
                  <div className="rounded-lg border border-dashed border-surface-tertiary p-3">
                    <p className="text-center text-xs text-foreground-muted">
                      Arrastra escenas aqui o asignalas desde la pestana Escenas
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-tertiary py-16">
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            No hay fases definidas
          </h3>
          <p className="mb-4 text-sm text-foreground-muted">
            Genera el arco narrativo con IA desde la pestana de Diagnostico
          </p>
        </div>
      )}
    </div>
  );
}
