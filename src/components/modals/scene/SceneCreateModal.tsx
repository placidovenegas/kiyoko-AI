'use client';

import { useState } from 'react';
import { Button, TextField, TextArea, Label, Input, Select, ListBox, Slider, Description } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { ModalShell } from '../shared/ModalShell';
import type { SceneFormData } from './types';
import { ARC_PHASES, SCENE_TYPES, DEFAULT_SCENE } from './types';
import { useCreateScene } from './useCreateScene';
import type { Key } from 'react';

interface SceneCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  projectId: string;
  nextSceneNumber: number;
  onSuccess?: () => void;
}

export function SceneCreateModal({ open, onOpenChange, videoId, projectId, nextSceneNumber, onSuccess }: SceneCreateModalProps) {
  const [form, setForm] = useState<SceneFormData>({ ...DEFAULT_SCENE });
  const mutation = useCreateScene(videoId, projectId);

  const updateField = <K extends keyof SceneFormData>(key: K, value: SceneFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setForm({ ...DEFAULT_SCENE });
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    await mutation.mutateAsync({ ...form, sceneNumber: nextSceneNumber });
    setForm({ ...DEFAULT_SCENE });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={handleClose}
      title={`Nueva escena #${nextSceneNumber}`}
      description="Añade una escena al video"
      footer={
        <>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="primary" onPress={handleSubmit} isDisabled={!form.title.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crear escena
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField variant="secondary" value={form.title} onChange={(v) => updateField('title', v)} isRequired>
          <Label>Título</Label>
          <Input placeholder="Ej. Ana entra en la oficina" autoFocus />
        </TextField>

        <div className="grid grid-cols-2 gap-4">
          <Select variant="secondary" aria-label="Fase" selectedKey={form.arc_phase} onSelectionChange={(key: Key | null) => { if (key) updateField('arc_phase', key as SceneFormData['arc_phase']); }}>
            <Label>Fase narrativa</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{ARC_PHASES.map((p) => <ListBox.Item key={p.value} id={p.value}>{p.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
          <Select variant="secondary" aria-label="Tipo" selectedKey={form.scene_type} onSelectionChange={(key: Key | null) => { if (key) updateField('scene_type', key as SceneFormData['scene_type']); }}>
            <Label>Tipo</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{SCENE_TYPES.map((t) => <ListBox.Item key={t.value} id={t.value}>{t.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Duración: {form.duration_seconds}s</p>
          <Slider
            aria-label="Duración"
            defaultValue={form.duration_seconds}
            minValue={1}
            maxValue={30}
            step={1}
            onChange={(v) => updateField('duration_seconds', v as number)}
          >
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
        </div>

        <TextField variant="secondary" value={form.description} onChange={(v) => updateField('description', v)}>
          <Label>Descripción visual</Label>
          <TextArea placeholder="Qué se ve: acciones, ambiente, detalles..." rows={3} />
          <Description>La IA usará esto para generar el prompt de imagen.</Description>
        </TextField>

        <TextField variant="secondary" value={form.dialogue} onChange={(v) => updateField('dialogue', v)}>
          <Label>Diálogo / Narración</Label>
          <TextArea placeholder="Qué se dice o narra en esta escena..." rows={2} />
        </TextField>
      </div>
    </ModalShell>
  );
}
