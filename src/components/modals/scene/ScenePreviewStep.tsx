'use client';

import { Clock, Camera, Users, MapPin, Sparkles, Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import { TextField, TextArea, Label } from '@heroui/react';
import { cn } from '@/lib/utils/cn';
import type { SceneForm } from './scene-work-types';
import { PHASES, ANGLES, MOVEMENTS } from './scene-work-types';
import type { Character, Background } from '@/types';

interface PreviewProps {
  form: SceneForm;
  timelineText: string;
  onTimelineChange: (text: string) => void;
  onRegenerate: () => void;
  regenerating: boolean;
  characters: Character[];
  backgrounds: Background[];
}

export function ScenePreviewStep({
  form, timelineText, onTimelineChange, onRegenerate, regenerating,
  characters, backgrounds,
}: PreviewProps) {
  const phase = PHASES.find(p => p.value === form.arcPhase);
  const angle = ANGLES.find(a => a.value === form.cameraAngle);
  const movement = MOVEMENTS.find(m => m.value === form.cameraMovement);
  const chars = characters.filter(c => form.characterIds.includes(c.id));
  const bgs = backgrounds.filter(b => form.backgroundIds.includes(b.id));
  const isExtension = form.sceneKind === 'extension';

  return (
    <div className="space-y-4 max-w-lg">
      {/* Scene summary card */}
      <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{form.title || 'Sin titulo'}</h3>
          <div className="flex items-center gap-2 text-[11px]">
            {phase && (
              <span className={cn('rounded-md px-1.5 py-0.5 font-medium text-white', phase.color)}>
                {phase.label}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <Clock className="size-3" />{form.duration}s
            </span>
          </div>
        </div>

        {form.description && (
          <p className="text-xs text-muted-foreground">{form.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Camera className="size-3" />
            {angle?.label ?? 'Medio'} · {movement?.label ?? 'Estatica'}
          </span>
          {chars.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {chars.map(c => c.name).join(', ')}
            </span>
          )}
          {bgs.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {bgs.map(b => b.name).join(', ')}
            </span>
          )}
        </div>

        {isExtension && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-[10px] text-amber-400">
            Extension — solo se generara prompt de video
          </div>
        )}
      </div>

      {/* Timeline breakdown — editable */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Desglose temporal</p>
          </div>
          <button type="button" onClick={onRegenerate} disabled={regenerating}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors disabled:opacity-50">
            {regenerating ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            Regenerar con IA
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Edita lo que pasa en cada segundo. Esto sera la base para generar el prompt de video.
        </p>

        <TextField variant="secondary" value={timelineText} onChange={onTimelineChange}>
          <Label className="sr-only">Timeline</Label>
          <TextArea
            placeholder={`[00:00-00:02]: Accion inicial...\n[00:02-00:04]: Accion principal...\n[00:04-00:05]: Resolucion...`}
            rows={Math.max(5, Math.ceil(form.duration / 2))}
            className="font-mono text-xs leading-relaxed"
          />
        </TextField>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ChevronRight className="size-3" />
            {form.duration}s de duracion
          </span>
          <span>·</span>
          <span>~{Math.ceil(form.duration / 2.5)} acciones recomendadas</span>
          <span>·</span>
          <span>1 accion cada 2-3 segundos</span>
        </div>
      </div>

      {form.dialogue && (
        <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">Dialogo</p>
          <p className="text-xs italic text-foreground">&ldquo;{form.dialogue}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
