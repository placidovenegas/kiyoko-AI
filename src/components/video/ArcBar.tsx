'use client';

import { cn } from '@/lib/utils/cn';
import type { NarrativeArc } from '@/types';

const PHASE_COLORS: Record<string, string> = {
  hook: 'bg-red-500',
  build: 'bg-amber-500',
  peak: 'bg-emerald-500',
  close: 'bg-blue-500',
};

const PHASE_LABELS: Record<string, string> = {
  hook: 'Gancho',
  build: 'Construcción',
  peak: 'Clímax',
  close: 'Cierre',
};

interface ArcBarProps {
  arcs: NarrativeArc[];
  totalDuration: number;
  className?: string;
}

export function ArcBar({ arcs, totalDuration, className }: ArcBarProps) {
  if (!arcs.length || !totalDuration) return null;

  return (
    <div className={cn('flex h-3 w-full overflow-hidden rounded-full bg-muted', className)}>
      {arcs.map((arc) => {
        const duration = (arc.end_second ?? 0) - (arc.start_second ?? 0);
        const width = (duration / totalDuration) * 100;
        return (
          <div
            key={arc.id}
            className={cn('relative h-full transition-all group', PHASE_COLORS[arc.phase] ?? 'bg-zinc-600')}
            style={{ width: `${width}%` }}
            title={`${arc.title} (${duration}s)`}
          >
            {/* Tooltip on hover */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[11px] text-white whitespace-nowrap shadow-lg z-10">
              <span className={cn('h-2 w-2 rounded-full', PHASE_COLORS[arc.phase])} />
              {PHASE_LABELS[arc.phase] ?? arc.phase} · {arc.title} · {duration}s
            </div>
          </div>
        );
      })}
    </div>
  );
}
