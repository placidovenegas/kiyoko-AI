'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Input, TextArea, Label } from '@heroui/react';
import { Loader2, X, Monitor, Smartphone } from 'lucide-react';
import type { ModalProps } from '../shared/types';
import type { VideoFormData } from './types';
import { PLATFORMS, DURATIONS, DEFAULT_VIDEO } from './types';
import { useCreateVideo } from './useCreateVideo';
import { cn } from '@/lib/utils/cn';

export function VideoCreateModal({ open, onOpenChange, projectId, projectShortId, onSuccess }: ModalProps) {
  const [form, setForm] = useState<VideoFormData>({ ...DEFAULT_VIDEO });
  const mutation = useCreateVideo(projectId);
  const router = useRouter();

  const updateField = <K extends keyof VideoFormData>(key: K, value: VideoFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handlePlatformChange = (platform: VideoFormData['platform']) => {
    const p = PLATFORMS.find((pl) => pl.value === platform);
    setForm((f) => ({ ...f, platform, aspect_ratio: (p?.ratio ?? '16:9') as VideoFormData['aspect_ratio'] }));
  };

  const handleClose = () => {
    setForm({ ...DEFAULT_VIDEO });
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    const video = await mutation.mutateAsync(form);
    setForm({ ...DEFAULT_VIDEO });
    onOpenChange(false);
    onSuccess?.();
    if (video?.short_id && projectShortId) {
      router.push(`/project/${projectShortId}/video/${video.short_id}`);
    }
  };

  if (!open) return null;

  const isVertical = form.aspect_ratio === '9:16';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-semibold text-foreground">Nuevo video</p>
          <button type="button" onClick={handleClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <TextField variant="secondary" value={form.title} onChange={(v) => updateField('title', v)} isRequired autoFocus>
            <Label>Titulo *</Label>
            <Input placeholder="Ej. Spot primavera 2025" />
          </TextField>

          {/* Platform selector */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">Plataforma</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PLATFORMS.map(p => (
                <button key={p.value} type="button" onClick={() => handlePlatformChange(p.value)}
                  className={cn('rounded-lg border px-3 py-2 text-left transition-all',
                    form.platform === p.value ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20')}>
                  <div className="flex items-center gap-1.5">
                    {p.ratio === '9:16' ? <Smartphone className="size-3 text-muted-foreground" /> : <Monitor className="size-3 text-muted-foreground" />}
                    <p className={cn('text-xs font-medium', form.platform === p.value ? 'text-primary' : 'text-foreground')}>{p.label}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.ratio}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration selector */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">Duracion</p>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map(d => (
                <button key={d.value} type="button" onClick={() => updateField('target_duration_seconds', d.value)}
                  className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                    form.target_duration_seconds === d.value
                      ? 'border-primary/40 bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground')}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio preview */}
          <div className="flex items-center gap-3">
            <div className={cn('rounded-md border border-border bg-background flex items-center justify-center',
              isVertical ? 'w-8 h-14' : 'w-14 h-8')}>
              <span className="text-[8px] text-muted-foreground/50">{form.aspect_ratio}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">{form.aspect_ratio}</span> · {isVertical ? 'Vertical' : 'Horizontal'}</p>
              <p className="text-[10px]">Basado en {PLATFORMS.find(p => p.value === form.platform)?.label}</p>
            </div>
          </div>

          <TextField variant="secondary" value={form.description} onChange={(v) => updateField('description', v)}>
            <Label>Descripcion</Label>
            <TextArea placeholder="De que trata este video... (ayuda a la IA)" rows={2} />
          </TextField>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border px-5 py-3">
          <button type="button" onClick={handleClose}
            className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={!form.title.trim() || mutation.isPending}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Crear video
          </button>
        </div>
      </div>
    </div>
  );
}
