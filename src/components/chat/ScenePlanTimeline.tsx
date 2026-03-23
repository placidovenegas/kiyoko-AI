'use client';

import { useMemo } from 'react';
import { Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScenePlanItem {
  scene_number: number;
  title: string;
  duration: number; // seconds
  arc_phase: 'hook' | 'build' | 'peak' | 'close' | string;
  description: string;
}

export interface ScenePlanTimelineProps {
  scenes: ScenePlanItem[];
  totalDuration?: number;
}

// ---------------------------------------------------------------------------
// Arc phase config
// ---------------------------------------------------------------------------

interface PhaseConfig {
  label: string;
  circleBg: string;
  badgeBg: string;
  badgeText: string;
  barBg: string;
}

function getPhaseConfig(phase: string): PhaseConfig {
  switch (phase) {
    case 'hook':
      return {
        label: 'Gancho',
        circleBg: 'bg-blue-500',
        badgeBg: 'bg-blue-500/12 dark:bg-blue-500/15',
        badgeText: 'text-blue-700 dark:text-blue-300',
        barBg: 'bg-blue-500',
      };
    case 'build':
      return {
        label: 'Desarrollo',
        circleBg: 'bg-amber-500',
        badgeBg: 'bg-amber-500/12 dark:bg-amber-500/15',
        badgeText: 'text-amber-700 dark:text-amber-300',
        barBg: 'bg-amber-500',
      };
    case 'peak':
      return {
        label: 'Clímax',
        circleBg: 'bg-red-500',
        badgeBg: 'bg-red-500/12 dark:bg-red-500/15',
        badgeText: 'text-red-700 dark:text-red-300',
        barBg: 'bg-red-500',
      };
    case 'close':
      return {
        label: 'Cierre',
        circleBg: 'bg-green-500',
        badgeBg: 'bg-green-500/12 dark:bg-green-500/15',
        badgeText: 'text-green-700 dark:text-green-300',
        barBg: 'bg-green-500',
      };
    default:
      return {
        label: phase,
        circleBg: 'bg-gray-400 dark:bg-zinc-500',
        badgeBg: 'bg-gray-200 dark:bg-zinc-700/60',
        badgeText: 'text-muted-foreground',
        barBg: 'bg-gray-400 dark:bg-zinc-500',
      };
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

// ---------------------------------------------------------------------------
// DurationBar — proportional color segments
// ---------------------------------------------------------------------------

interface DurationBarProps {
  scenes: ScenePlanItem[];
  total: number;
}

function DurationBar({ scenes, total }: DurationBarProps) {
  if (total === 0) return null;

  return (
    <div className="flex w-full h-1.5 rounded-full overflow-hidden gap-px mt-3">
      {scenes.map((scene, i) => {
        const config = getPhaseConfig(scene.arc_phase);
        const pct = (scene.duration / total) * 100;
        return (
          <div
            key={i}
            className={cn('h-full transition-all', config.barBg)}
            style={{ width: `${pct}%` }}
            title={`${scene.title} — ${scene.duration}s`}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScenePlanTimeline
// ---------------------------------------------------------------------------

export function ScenePlanTimeline({ scenes, totalDuration }: ScenePlanTimelineProps) {
  const total = useMemo(
    () => totalDuration ?? scenes.reduce((sum, s) => sum + s.duration, 0),
    [scenes, totalDuration],
  );

  if (scenes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <p className="text-xs text-muted-foreground">Sin escenas en el plan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Clapperboard size={14} className="text-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            Plan de escenas
          </span>
          <span className="text-xs text-muted-foreground">
            ({scenes.length} escena{scenes.length !== 1 ? 's' : ''})
          </span>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 tabular-nums">
          {formatDuration(total)} total
        </span>
      </div>

      {/* Scene rows */}
      <div className="divide-y divide-border">
        {scenes.map((scene) => {
          const config = getPhaseConfig(scene.arc_phase);
          return (
            <div
              key={scene.scene_number}
              className="flex items-start gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors"
            >
              {/* Scene number circle */}
              <div
                className={cn(
                  'flex items-center justify-center size-6 rounded-full shrink-0 mt-0.5',
                  config.circleBg,
                )}
                aria-label={`Escena ${scene.scene_number}`}
              >
                <span className="text-[10px] font-bold text-white leading-none">
                  {scene.scene_number}
                </span>
              </div>

              {/* Title + description */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-snug truncate">
                  {scene.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  {truncate(scene.description, 80)}
                </p>
              </div>

              {/* Right: arc phase + duration */}
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <span
                  className={cn(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                    config.badgeBg,
                    config.badgeText,
                  )}
                >
                  {config.label}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums min-w-8 text-right">
                  {formatDuration(scene.duration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Duration bar */}
      <div className="px-4 pb-3 pt-1">
        <DurationBar scenes={scenes} total={total} />
      </div>
    </div>
  );
}
