'use client';

import {
  Film,
  Users,
  Image,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Clapperboard,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ProjectSummaryData {
  title: string;
  style?: string;
  status?: string;
  video_count: number;
  scene_count: number;
  character_count: number;
  background_count: number;
  prompts_done: number;
  prompts_total: number;
  last_video?: string;
  last_video_time?: string;
  warnings?: string[];
  videos?: Array<{
    title: string;
    scene_count: number;
    prompts_done: number;
    prompts_total: number;
    status: string;
  }>;
}

interface ProjectSummaryCardProps {
  data: ProjectSummaryData;
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Icon size={14} className={cn('shrink-0', color || 'text-muted-foreground')} />
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-xs font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function ProjectSummaryCard({ data }: ProjectSummaryCardProps) {
  const promptPercent = data.prompts_total > 0
    ? Math.round((data.prompts_done / data.prompts_total) * 100)
    : 0;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Clapperboard size={14} className="text-teal-500 shrink-0" />
          <span className="font-semibold text-foreground">{data.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {data.style && (
            <span className="px-1.5 py-0.5 rounded bg-accent text-muted-foreground text-[10px]">
              {data.style}
            </span>
          )}
          {data.status && (
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-medium',
              data.status === 'production' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              data.status === 'draft' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
              'bg-accent text-muted-foreground',
            )}>
              {data.status}
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <StatItem icon={Film} label="Videos" value={data.video_count} color="text-blue-500" />
        <StatItem icon={Clapperboard} label="Escenas" value={data.scene_count} color="text-amber-500" />
        <StatItem icon={Users} label="Personajes" value={data.character_count} color="text-purple-500" />
        <StatItem icon={Image} label="Fondos" value={data.background_count} color="text-emerald-500" />
      </div>

      {/* Prompts progress */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Camera size={12} className="text-muted-foreground" />
            <span className="text-muted-foreground">Prompts</span>
          </div>
          <span className="font-semibold text-foreground">{data.prompts_done}/{data.prompts_total}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              promptPercent === 100 ? 'bg-emerald-500' :
              promptPercent > 50 ? 'bg-teal-500' :
              promptPercent > 0 ? 'bg-amber-500' :
              'bg-muted-foreground/20',
            )}
            style={{ width: `${promptPercent}%` }}
          />
        </div>
      </div>

      {/* Videos list */}
      {data.videos && data.videos.length > 0 && (
        <div className="divide-y divide-border">
          {data.videos.map((v, i) => {
            const vDone = v.prompts_done;
            const vTotal = v.prompts_total;
            const isComplete = vDone === vTotal && vTotal > 0;
            const hasIssues = vTotal > 0 && vDone < vTotal;
            return (
              <div key={i} className="flex items-center gap-2 px-4 py-2">
                {isComplete ? (
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                ) : hasIssues ? (
                  <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                ) : (
                  <Film size={12} className="text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 min-w-0 truncate text-foreground">{v.title}</span>
                <span className="text-muted-foreground shrink-0">
                  {v.scene_count} esc · {vDone}/{vTotal}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Last edited */}
      {data.last_video && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-t border-border">
          <Clock size={11} className="text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            Ultimo editado: <span className="text-foreground font-medium">{data.last_video}</span>
            {data.last_video_time && ` (${data.last_video_time})`}
          </span>
        </div>
      )}

      {/* Warnings */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800/30">
          {data.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 py-0.5">
              <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-700 dark:text-amber-400">{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
