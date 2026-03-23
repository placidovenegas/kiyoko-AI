'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Video, Clock, Check } from 'lucide-react';
import type { Video as VideoType } from '@/types';

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '\u{1F4FA}',
  instagram_reels: '\u{1F4F1}',
  tiktok: '\u{1F3B5}',
  tv_commercial: '\u{1F4FA}',
  web: '\u{1F310}',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-zinc-400',
  prompting: 'bg-blue-500/20 text-blue-400',
  generating: 'bg-amber-500/20 text-amber-400',
  review: 'bg-purple-500/20 text-purple-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  exported: 'bg-cyan-500/20 text-cyan-400',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompting: 'Prompts',
  generating: 'Generando',
  review: 'Revisi\u00f3n',
  approved: 'Aprobado',
  exported: 'Exportado',
};

interface VideoCardProps {
  video: VideoType;
  projectShortId: string;
  scenesCount?: number;
}

export function VideoCard({ video, projectShortId, scenesCount }: VideoCardProps) {
  return (
    <Link
      href={`/project/${projectShortId}/video/${video.short_id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card',
        'transition hover:border-primary/30 hover:shadow-lg hover:shadow-black/20',
      )}
    >
      <div className="flex aspect-video items-center justify-center bg-background">
        <Video className="h-10 w-10 text-muted-foreground/60" />
      </div>
      {video.is_primary && (
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
          <Check className="h-3 w-3" /> Principal
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {video.title}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
              STATUS_COLORS[video.status] ?? 'bg-zinc-500/20 text-zinc-400',
            )}
          >
            {STATUS_LABELS[video.status] ?? video.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>
            {PLATFORM_ICONS[video.platform] ?? '\u{1F3AC}'} {video.platform}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {video.target_duration_seconds}s
          </span>
          {video.aspect_ratio && <span>{video.aspect_ratio}</span>}
        </div>
        {scenesCount !== undefined && (
          <p className="text-[11px] text-muted-foreground">{scenesCount} escenas</p>
        )}
      </div>
    </Link>
  );
}
