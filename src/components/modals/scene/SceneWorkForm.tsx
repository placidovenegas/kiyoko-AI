'use client';

import { useCallback } from 'react';
import { Select, ListBox, Label, TextField, Input, TextArea, Slider } from '@heroui/react';
import { Music, MessageSquare, Film, Copy, Check, Image, Video } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CharacterChips, BackgroundChips } from './SceneCharBgPicker';
import type { SceneForm, CameraAngle, CameraMovement } from './scene-work-types';
import { PHASES, ANGLES, MOVEMENTS } from './scene-work-types';
import type { Character, Background } from '@/types';
import type { Key } from 'react';
import { useState } from 'react';

/* ── Pill selector ─────────────────────────────────────── */

function PillSelect({ label, options, value, onChange }: {
  label: string;
  options: readonly { value: string; label: string; color?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
              value === o.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
            )}>
            {o.color && <span className={cn('size-2 rounded-full', o.color)} />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Toggle chip ───────────────────────────────────────── */

function ToggleChip({ label, icon: Icon, active, onClick }: {
  label: string; icon: typeof Music; active: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-primary/10 border border-primary/30 text-primary'
          : 'bg-card border border-border text-muted-foreground hover:border-primary/20',
      )}>
      <Icon className="size-3" />{label}
    </button>
  );
}

/* ── Prompt block ──────────────────────────────────────── */

function PromptBlock({ type, text }: { type: 'image' | 'video'; text: string }) {
  const [copied, setCopied] = useState(false);
  const Icon = type === 'image' ? Image : Video;
  const label = type === 'image' ? 'Prompt imagen' : 'Prompt video';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Icon className="size-3" />{label}
        </p>
        <button type="button" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
        </button>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground bg-background rounded-lg px-2.5 py-2 border border-border/50 max-h-20 overflow-y-auto leading-relaxed">
        {text}
      </p>
    </div>
  );
}

/* ── Main Form ─────────────────────────────────────────── */

interface FormProps {
  form: SceneForm;
  update: <K extends keyof SceneForm>(key: K, val: SceneForm[K]) => void;
  characters: Character[];
  backgrounds: Background[];
  allScenes: Array<{ id: string; title: string; scene_number: number }>;
  imagePrompt?: string | null;
  videoPrompt?: string | null;
  isEdit: boolean;
}

export function SceneWorkForm({ form, update, characters, backgrounds, allScenes, imagePrompt, videoPrompt, isEdit }: FormProps) {
  const updateChar = useCallback((ids: string[]) => update('characterIds', ids), [update]);
  const updateBg = useCallback((ids: string[]) => update('backgroundIds', ids), [update]);

  const isExtension = form.sceneKind === 'extension';
  const isInsert = form.sceneKind === 'insert';

  return (
    <div className="space-y-4 max-w-lg">
      {/* Scene kind selector */}
      {!isEdit && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">Tipo de escena</p>
          <div className="flex gap-1.5">
            {([
              { value: 'original', label: 'Original', desc: 'Escena completa con imagen + video' },
              { value: 'extension', label: 'Extension', desc: 'Continua el clip anterior (solo video)' },
              { value: 'insert', label: 'Insert', desc: 'Plano detalle intercalado (corto)' },
            ] as const).map(k => (
              <button key={k.value} type="button" onClick={() => { update('sceneKind', k.value); if (k.value !== 'original') update('duration', k.value === 'insert' ? 2 : 5); }}
                className={cn('flex-1 rounded-lg border px-3 py-2 text-left transition-all',
                  form.sceneKind === k.value ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20')}>
                <p className={cn('text-xs font-medium', form.sceneKind === k.value ? 'text-primary' : 'text-foreground')}>{k.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{k.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parent scene selector (for extensions and inserts) */}
      {!isEdit && (isExtension || isInsert) && allScenes.length > 0 && (
        <Select variant="secondary" aria-label="Escena padre"
          selectedKey={form.parentSceneId ?? ''} onSelectionChange={(key: Key | null) => update('parentSceneId', key ? String(key) : null)}>
          <Label>{isExtension ? 'Extension de' : 'Insert en'}</Label>
          <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover><ListBox>
            {allScenes.map(s => <ListBox.Item key={s.id} id={s.id}>#{s.scene_number} {s.title}</ListBox.Item>)}
          </ListBox></Select.Popover>
        </Select>
      )}

      {/* Extension info banner */}
      {isExtension && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-400">
          Solo se genera prompt de video. El clip continua desde el ultimo frame de la escena padre.
        </div>
      )}

      {/* Title */}
      <TextField variant="secondary" value={form.title} onChange={v => update('title', v)} autoFocus isRequired>
        <Label>Titulo</Label>
        <Input placeholder={isExtension ? 'Ej. Camara rota alrededor' : isInsert ? 'Ej. Detalle espadas chocando' : 'Ej. Ana entra en la oficina'} />
      </TextField>

      {/* Description */}
      <TextField variant="secondary" value={form.description} onChange={v => update('description', v)}>
        <Label>Descripcion visual</Label>
        <TextArea placeholder="Describe que se ve en la escena..." rows={2} />
      </TextField>

      {/* Phase + Duration inline */}
      <div className="grid grid-cols-2 gap-4">
        <PillSelect label="Fase narrativa" options={PHASES} value={form.arcPhase} onChange={v => update('arcPhase', v)} />
        <div className="space-y-1.5">
          <Slider aria-label="Duracion" minValue={1} maxValue={30} step={1} value={form.duration}
            onChange={v => update('duration', typeof v === 'number' ? v : v[0])}>
            <div className="flex items-center justify-between">
              <Label>Duracion</Label>
              <Slider.Output className="text-sm font-semibold text-primary tabular-nums">{() => `${form.duration}s`}</Slider.Output>
            </div>
            <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
          </Slider>
        </div>
      </div>

      {/* Camera — HeroUI Selects */}
      <div className="grid grid-cols-2 gap-3">
        <Select variant="secondary" aria-label="Angulo" selectedKey={form.cameraAngle}
          onSelectionChange={(key: Key | null) => { if (key) update('cameraAngle', key as CameraAngle); }}>
          <Label>Angulo</Label>
          <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover><ListBox>{ANGLES.map(a => <ListBox.Item key={a.value} id={a.value}>{a.label}</ListBox.Item>)}</ListBox></Select.Popover>
        </Select>
        <Select variant="secondary" aria-label="Movimiento" selectedKey={form.cameraMovement}
          onSelectionChange={(key: Key | null) => { if (key) update('cameraMovement', key as CameraMovement); }}>
          <Label>Movimiento</Label>
          <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover><ListBox>{MOVEMENTS.map(m => <ListBox.Item key={m.value} id={m.value}>{m.label}</ListBox.Item>)}</ListBox></Select.Popover>
        </Select>
      </div>

      {/* Audio toggles */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">Audio</p>
        <div className="flex flex-wrap gap-1.5">
          <ToggleChip label="Musica" icon={Music} active={form.music} onClick={() => update('music', !form.music)} />
          <ToggleChip label="Dialogo" icon={MessageSquare} active={form.dialogue_audio} onClick={() => update('dialogue_audio', !form.dialogue_audio)} />
          <ToggleChip label="SFX" icon={Film} active={form.sfx} onClick={() => update('sfx', !form.sfx)} />
          <ToggleChip label="Voiceover" icon={Music} active={form.voiceover} onClick={() => update('voiceover', !form.voiceover)} />
        </div>
      </div>

      {/* Dialogue */}
      <TextField variant="secondary" value={form.dialogue} onChange={v => update('dialogue', v)}>
        <Label>Dialogo / Narracion</Label>
        <TextArea placeholder="Que se dice o narra en esta escena..." rows={2} />
      </TextField>

      {/* Characters (not for extensions — they inherit from parent) */}
      {!isExtension && characters.length > 0 && (
        <CharacterChips selected={form.characterIds} all={characters} onChange={updateChar} />
      )}

      {/* Backgrounds (not for extensions) */}
      {!isExtension && backgrounds.length > 0 && (
        <BackgroundChips selected={form.backgroundIds} all={backgrounds} onChange={updateBg} />
      )}

      {/* Prompts */}
      {(imagePrompt || videoPrompt) && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prompts</p>
          {imagePrompt && <PromptBlock type="image" text={imagePrompt} />}
          {videoPrompt && <PromptBlock type="video" text={videoPrompt} />}
        </div>
      )}

      {!isEdit && !imagePrompt && !videoPrompt && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 text-[10px] text-muted-foreground">
          <Image className="size-3 text-primary shrink-0" />
          Los prompts se generaran automaticamente al crear la escena
        </div>
      )}
    </div>
  );
}
