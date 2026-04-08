'use client';

import { useCallback } from 'react';
import { Select, ListBox, Label } from '@heroui/react';
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
  imagePrompt?: string | null;
  videoPrompt?: string | null;
  isEdit: boolean;
}

export function SceneWorkForm({ form, update, characters, backgrounds, imagePrompt, videoPrompt, isEdit }: FormProps) {
  const updateChar = useCallback((ids: string[]) => update('characterIds', ids), [update]);
  const updateBg = useCallback((ids: string[]) => update('backgroundIds', ids), [update]);

  return (
    <div className="space-y-4 max-w-lg">
      {/* Title */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">Titulo <span className="text-danger-500">*</span></p>
        <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
          placeholder="Ej. Ana entra en la oficina" autoFocus
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/10" />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">Descripcion visual</p>
        <textarea value={form.description} onChange={e => update('description', e.target.value)}
          placeholder="Describe que se ve en la escena..." rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none resize-y placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/10" />
      </div>

      {/* Phase + Duration inline */}
      <div className="grid grid-cols-2 gap-4">
        <PillSelect label="Fase narrativa" options={PHASES} value={form.arcPhase} onChange={v => update('arcPhase', v)} />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground">Duracion</p>
            <span className="text-sm font-semibold text-primary tabular-nums">{form.duration}s</span>
          </div>
          <input type="range" min={1} max={30} step={1} value={form.duration}
            onChange={e => update('duration', parseInt(e.target.value, 10))}
            className="w-full accent-primary h-1.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground/50">
            <span>1s</span><span>15s</span><span>30s</span>
          </div>
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
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">Dialogo / Narracion</p>
        <textarea value={form.dialogue} onChange={e => update('dialogue', e.target.value)}
          placeholder="Que se dice o narra en esta escena..." rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none resize-y placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/10" />
      </div>

      {/* Characters */}
      {characters.length > 0 && (
        <CharacterChips selected={form.characterIds} all={characters} onChange={updateChar} />
      )}

      {/* Backgrounds */}
      {backgrounds.length > 0 && (
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
