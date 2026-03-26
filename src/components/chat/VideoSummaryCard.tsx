'use client';

import {
  Film,
  Users,
  MapPin,
  Camera,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Volume2,
  Clapperboard,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

export interface VideoSummaryData {
  title: string;
  platform?: string;
  duration_seconds?: number;
  status?: string;
  aspect_ratio?: string;
  scene_count: number;
  character_names: string[];
  background_names: string[];
  prompts_image_done: number;
  prompts_video_done: number;
  prompts_total: number;
  has_narration: boolean;
  scenes?: Array<{
    scene_number: number;
    title: string;
    duration_seconds: number;
    arc_phase?: string;
    has_character: boolean;
    has_background: boolean;
    has_image_prompt: boolean;
    has_video_prompt: boolean;
  }>;
}

interface VideoSummaryCardProps {
  data: VideoSummaryData;
  onAction?: (action: string) => void;
}

function ProgressRow({
  icon: Icon,
  label,
  done,
  total,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  done: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon size={12} className={cn('shrink-0', color)} />
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{done}/{total}</span>
      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-primary' : 'bg-muted-foreground/20')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const PHASE_DOT: Record<string, string> = {
  hook: 'bg-blue-500', build: 'bg-amber-500', peak: 'bg-red-500', close: 'bg-emerald-500',
};

export function VideoSummaryCard({ data, onAction }: VideoSummaryCardProps) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Film size={14} className="text-blue-500 shrink-0" />
          <span className="font-semibold text-foreground">{data.title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {data.platform && <span className="px-1.5 py-0.5 rounded bg-accent text-[10px]">{data.platform}</span>}
          {data.duration_seconds && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <Clock size={9} /> {data.duration_seconds}s
            </span>
          )}
          {data.aspect_ratio && <span className="text-[10px]">{data.aspect_ratio}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 space-y-2 border-b border-border">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clapperboard size={11} className="text-amber-500" /> {data.scene_count} escenas
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users size={11} className="text-purple-500" /> {data.character_names.length > 0 ? data.character_names.join(', ') : 'sin personajes'}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Volume2 size={11} /> {data.has_narration ? 'Con narracion' : 'Sin narracion'}
          </span>
        </div>

        <ProgressRow icon={Camera} label="Prompts imagen" done={data.prompts_image_done} total={data.prompts_total} color="text-blue-500" />
        <ProgressRow icon={Film} label="Prompts video" done={data.prompts_video_done} total={data.prompts_total} color="text-purple-500" />
      </div>

      {/* Scene list */}
      {data.scenes && data.scenes.length > 0 && (
        <div className="divide-y divide-border">
          {data.scenes.map((s) => (
            <div key={s.scene_number} className="flex items-center gap-2 px-4 py-1.5 hover:bg-accent/30 transition-colors">
              <div className={cn('size-1.5 rounded-full shrink-0', PHASE_DOT[s.arc_phase ?? ''] ?? 'bg-muted-foreground')} />
              <span className="font-medium text-foreground w-4 text-right shrink-0">{s.scene_number}</span>
              <span className="flex-1 min-w-0 truncate text-foreground">{s.title}</span>
              <span className="text-muted-foreground tabular-nums shrink-0">{s.duration_seconds}s</span>
              <div className="flex items-center gap-1 shrink-0">
                {s.has_character ? <Users size={9} className="text-purple-400" /> : <Users size={9} className="text-muted-foreground/30" />}
                {s.has_background ? <MapPin size={9} className="text-emerald-400" /> : <MapPin size={9} className="text-muted-foreground/30" />}
                {s.has_image_prompt ? <Camera size={9} className="text-blue-400" /> : <Camera size={9} className="text-muted-foreground/30" />}
                {s.has_video_prompt ? <Film size={9} className="text-purple-400" /> : <Film size={9} className="text-muted-foreground/30" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {onAction && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 bg-muted/30 border-t border-border">
          {data.prompts_image_done < data.prompts_total && (
            <Button type="button" variant="bordered" color="primary" size="xs" radius="sm"
              onClick={() => onAction('Genera los prompts de imagen que faltan')}
              className="text-[10px]">
              <Sparkles size={10} /> Generar prompts
            </Button>
          )}
          <Button type="button" variant="bordered" color="default" size="xs" radius="sm"
            onClick={() => onAction('Editar una escena')}
            className="text-[10px]">
            <Clapperboard size={10} /> Editar escena
          </Button>
          {!data.has_narration && (
            <Button type="button" variant="bordered" color="default" size="xs" radius="sm"
              onClick={() => onAction('Crear narracion para el video')}
              className="text-[10px]">
              <Volume2 size={10} /> Crear narracion
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
