'use client';

import {
  Clapperboard,
  Users,
  MapPin,
  Camera,
  Image as ImageIcon,
  Film,
  Clock,
  RefreshCw,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---- Types ----

export interface SceneDetailData {
  scene_number: number;
  title: string;
  description?: string;
  duration_seconds?: number;
  arc_phase?: string;
  status?: string;
  // Characters
  characters?: Array<{
    name: string;
    role?: string;
    image_url?: string;
  }>;
  // Background
  background?: {
    name: string;
    image_url?: string;
    time_of_day?: string;
    angle?: string;
  };
  // Camera
  camera?: {
    camera_angle?: string;
    camera_movement?: string;
    lighting?: string;
    mood?: string;
  };
  // Prompts
  prompt_image?: string;
  prompt_video?: string;
  // Director notes
  director_notes?: string;
}

interface SceneDetailCardProps {
  data: SceneDetailData;
  onAction?: (action: string) => void;
}

// ---- Phase config ----

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  hook:  { label: 'Hook',  color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/10' },
  build: { label: 'Build', color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-500/10' },
  peak:  { label: 'Peak',  color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-500/10' },
  close: { label: 'Close', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
};

function StatusDot({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
    : <AlertTriangle size={11} className="text-amber-500 shrink-0" />;
}

export function SceneDetailCard({ data, onAction }: SceneDetailCardProps) {
  const phase = data.arc_phase ? PHASE_CONFIG[data.arc_phase] : null;
  const hasImage = !!data.prompt_image;
  const hasVideo = !!data.prompt_video;
  const hasCamera = !!data.camera?.camera_angle;
  const hasChars = data.characters && data.characters.length > 0;
  const hasBg = !!data.background;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-6 rounded-full bg-primary text-white text-[10px] font-bold shrink-0">
            {data.scene_number}
          </div>
          <span className="font-semibold text-foreground">{data.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {phase && (
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', phase.bg, phase.color)}>
              {phase.label}
            </span>
          )}
          {data.duration_seconds && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <Clock size={10} />
              {data.duration_seconds}s
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="px-4 py-2 border-b border-border">
          <p className="text-foreground/80 leading-relaxed">{data.description}</p>
        </div>
      )}

      {/* Characters + Background row */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        {/* Characters */}
        <div className="p-3">
          <div className="flex items-center gap-1 mb-2">
            <Users size={11} className="text-purple-500" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Personajes</span>
          </div>
          {hasChars ? (
            <div className="space-y-1.5">
              {data.characters!.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="size-7 rounded-md object-cover border border-border" />
                  ) : (
                    <div className="size-7 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500 text-[9px] font-bold">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground leading-tight">{c.name}</p>
                    {c.role && <p className="text-[10px] text-muted-foreground capitalize">{c.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic flex items-center gap-1">
              <AlertTriangle size={10} className="text-amber-500" /> Sin personajes
            </p>
          )}
        </div>

        {/* Background */}
        <div className="p-3">
          <div className="flex items-center gap-1 mb-2">
            <MapPin size={11} className="text-emerald-500" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Fondo</span>
          </div>
          {hasBg ? (
            <div className="flex items-center gap-2">
              {data.background!.image_url ? (
                <img src={data.background!.image_url} alt={data.background!.name} className="w-12 h-8 rounded-md object-cover border border-border" />
              ) : (
                <div className="w-12 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <MapPin size={12} className="text-emerald-500" />
                </div>
              )}
              <div>
                <p className="font-medium text-foreground leading-tight">{data.background!.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {[data.background!.time_of_day, data.background!.angle].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground italic flex items-center gap-1">
              <AlertTriangle size={10} className="text-amber-500" /> Sin fondo
            </p>
          )}
        </div>
      </div>

      {/* Camera */}
      {hasCamera && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-3">
          <Camera size={11} className="text-blue-500 shrink-0" />
          <span className="text-muted-foreground">
            {[data.camera!.camera_angle, data.camera!.camera_movement, data.camera!.lighting, data.camera!.mood]
              .filter(Boolean).join(' · ')}
          </span>
        </div>
      )}

      {/* Prompts */}
      <div className="divide-y divide-border border-b border-border">
        {/* Image prompt */}
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <StatusDot ok={hasImage} />
              <ImageIcon size={11} className="text-blue-500" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Prompt imagen</span>
            </div>
          </div>
          {hasImage ? (
            <p className="text-foreground/80 font-mono text-[10px] leading-relaxed line-clamp-3">
              {data.prompt_image}
            </p>
          ) : (
            <p className="text-muted-foreground italic">Sin prompt de imagen</p>
          )}
        </div>

        {/* Video prompt */}
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <StatusDot ok={hasVideo} />
              <Film size={11} className="text-purple-500" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Prompt video</span>
            </div>
          </div>
          {hasVideo ? (
            <p className="text-foreground/80 font-mono text-[10px] leading-relaxed line-clamp-3">
              {data.prompt_video}
            </p>
          ) : (
            <p className="text-muted-foreground italic">Sin prompt de video</p>
          )}
        </div>
      </div>

      {/* Director notes */}
      {data.director_notes && (
        <div className="px-4 py-2 border-b border-border bg-amber-50/50 dark:bg-amber-950/10">
          <p className="text-[10px] text-amber-700 dark:text-amber-400">
            <span className="font-semibold">Notas: </span>{data.director_notes}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {onAction && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 bg-muted/30">
          <button
            type="button"
            onClick={() => onAction('Editar esta escena')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Pencil size={10} /> Editar
          </button>
          {!hasImage && (
            <button
              type="button"
              onClick={() => onAction(`Genera el prompt de imagen para la escena ${data.scene_number}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border border-primary/30 text-primary dark:text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Sparkles size={10} /> Generar prompt imagen
            </button>
          )}
          {hasImage && (
            <button
              type="button"
              onClick={() => onAction(`Regenera los prompts de la escena ${data.scene_number}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <RefreshCw size={10} /> Regenerar prompts
            </button>
          )}
          {!hasChars && (
            <button
              type="button"
              onClick={() => onAction(`Asigna un personaje a la escena ${data.scene_number}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Users size={10} /> Asignar personaje
            </button>
          )}
          {!hasBg && (
            <button
              type="button"
              onClick={() => onAction(`Asigna un fondo a la escena ${data.scene_number}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <MapPin size={10} /> Asignar fondo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
