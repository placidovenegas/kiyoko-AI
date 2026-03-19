'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';

interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  arc_phase: string;
  phase_color: string;
  timeline_version: string;
  sort_order: number;
}

const VERSION_TABS = [
  { label: 'Completa', value: 'full' },
  { label: '30s', value: '30s' },
  { label: '15s', value: '15s' },
];

const PHASE_COLORS: Record<string, string> = {
  hook: '#E24B4A',
  build: '#BA7517',
  peak: '#1D9E75',
  close: '#185FA5',
};

export default function TimelinePage() {
  const { project, loading: projectLoading } = useProject();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState('full');
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  const fetchData = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);

    const { data: entriesData } = await supabase
      .from('timeline_entries')
      .select('*')
      .eq('project_id', project.id)
      .order('sort_order', { ascending: true });

    setEntries(entriesData ?? []);
    setLoading(false);
  }, [project?.id, supabase]);

  useEffect(() => {
    if (!projectLoading && project?.id) fetchData();
  }, [fetchData, projectLoading, project?.id]);

  const handleRegenerate = () => {
    alert('Proximamente');
  };

  const filteredEntries = entries.filter(
    (entry) => entry.timeline_version === activeVersion
  );

  const totalDuration = filteredEntries.reduce(
    (sum, entry) => sum + Number(entry.duration_seconds),
    0
  );

  if (loading || projectLoading) {
    return (

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-48 animate-pulse rounded bg-surface-secondary" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-surface-secondary" />
          </div>
          <div className="h-10 w-44 animate-pulse rounded-lg bg-surface-secondary" />
        </div>
        <div className="h-10 animate-pulse rounded-lg bg-surface-secondary" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Secuencia de Montaje
          </h2>
          <p className="text-sm text-foreground-muted">
            Organiza el orden y duracion de las escenas
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Regenerar timeline IA
        </button>
      </div>

      {/* Duration summary */}
      <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-4">
        <div>
          <p className="text-sm text-foreground-muted">Duracion total</p>
          <p className="text-xl font-bold text-foreground">
            {totalDuration > 0 ? `${Math.round(totalDuration)}s` : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-foreground-muted">Escenas</p>
          <p className="text-xl font-bold text-foreground">
            {filteredEntries.length}
          </p>
        </div>
        <div>
          <p className="text-sm text-foreground-muted">Version</p>
          <p className="text-xl font-bold text-foreground">
            {VERSION_TABS.find((t) => t.value === activeVersion)?.label}
          </p>
        </div>
      </div>

      {/* Version tabs */}
      <div className="flex gap-1 rounded-lg bg-surface-secondary p-1">
        {VERSION_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveVersion(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeVersion === tab.value
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline list */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const dotColor =
              PHASE_COLORS[entry.arc_phase] ||
              entry.phase_color ||
              '#6B7280';

            return (
              <div
                key={entry.id}
                className="flex items-start gap-4 rounded-xl bg-surface-secondary p-4"
              >
                {/* Time range */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {entry.start_time}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {entry.end_time}
                  </p>
                </div>

                {/* Phase dot */}
                <div className="mt-1.5 shrink-0">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {entry.title}
                  </p>
                  {entry.description && (
                    <p className="mt-1 text-sm text-foreground-secondary">
                      {entry.description}
                    </p>
                  )}
                </div>

                {/* Duration badge */}
                <span className="shrink-0 rounded-md bg-surface-tertiary px-2 py-0.5 text-xs text-foreground-muted">
                  {Number(entry.duration_seconds)}s
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-surface-secondary p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 text-4xl">🎞</div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">
              Timeline vacio
            </h3>
            <p className="mb-6 max-w-sm text-center text-sm text-foreground-muted">
              Genera la secuencia de montaje automaticamente a partir de las
              escenas del proyecto
            </p>
            <button
              onClick={handleRegenerate}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Regenerar timeline IA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
