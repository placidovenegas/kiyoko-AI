'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TextField, TextArea, Label, Input, Select, ListBox, Description } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { ModalShell } from '../shared/ModalShell';
import type { ModalProps } from '../shared/types';
import type { VideoFormData } from './types';
import { PLATFORMS, DURATIONS, DEFAULT_VIDEO } from './types';
import { useCreateVideo } from './useCreateVideo';
import type { Key } from 'react';

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

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setForm({ ...DEFAULT_VIDEO });
    onOpenChange(isOpen);
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

  return (
    <ModalShell
      open={open}
      onOpenChange={handleClose}
      title="Nuevo video"
      description="Crea un video para este proyecto"
      footer={
        <>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="primary" onPress={handleSubmit} isDisabled={!form.title.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crear video
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField variant="secondary" value={form.title} onChange={(v) => updateField('title', v)} isRequired>
          <Label>Título del video</Label>
          <Input placeholder="Ej. Spot primavera 2025" autoFocus />
        </TextField>

        <div className="grid grid-cols-2 gap-4">
          <Select variant="secondary" aria-label="Plataforma" selectedKey={form.platform} onSelectionChange={(key: Key | null) => { if (key) handlePlatformChange(key as VideoFormData['platform']); }}>
            <Label>Plataforma</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{PLATFORMS.map((p) => <ListBox.Item key={p.value} id={p.value}>{p.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
          <Select variant="secondary" aria-label="Duración" selectedKey={String(form.target_duration_seconds)} onSelectionChange={(key: Key | null) => { if (key) updateField('target_duration_seconds', Number(key)); }}>
            <Label>Duración</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{DURATIONS.map((d) => <ListBox.Item key={String(d.value)} id={String(d.value)}>{d.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">Aspecto:</span>
          <span className="text-xs font-medium text-foreground">{form.aspect_ratio}</span>
        </div>

        <TextField variant="secondary" value={form.description} onChange={(v) => updateField('description', v)}>
          <Label>Descripción</Label>
          <TextArea placeholder="De qué trata este video..." rows={2} />
          <Description>Opcional. Ayuda a la IA a generar mejor contenido.</Description>
        </TextField>
      </div>
    </ModalShell>
  );
}
