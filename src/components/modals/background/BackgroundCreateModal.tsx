'use client';

import { useState } from 'react';
import { Button, TextField, TextArea, Label, Input, Select, ListBox, Description } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { ModalShell } from '../shared/ModalShell';
import type { ModalProps } from '../shared/types';
import type { BackgroundFormData } from './types';
import { LOCATION_TYPES, TIME_OF_DAY, DEFAULT_BACKGROUND } from './types';
import { useCreateBackground } from './useCreateBackground';
import type { Key } from 'react';

export function BackgroundCreateModal({ open, onOpenChange, projectId, onSuccess }: ModalProps) {
  const [form, setForm] = useState<BackgroundFormData>({ ...DEFAULT_BACKGROUND });
  const mutation = useCreateBackground(projectId);

  const updateField = <K extends keyof BackgroundFormData>(key: K, value: BackgroundFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setForm({ ...DEFAULT_BACKGROUND });
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await mutation.mutateAsync(form);
    setForm({ ...DEFAULT_BACKGROUND });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={handleClose}
      title="Nuevo fondo"
      description="Añade una localización al proyecto"
      footer={
        <>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="primary" onPress={handleSubmit} isDisabled={!form.name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crear fondo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField variant="secondary" value={form.name} onChange={(v) => updateField('name', v)} isRequired>
          <Label>Nombre</Label>
          <Input placeholder="Ej. Oficina moderna, Parque central" autoFocus />
        </TextField>

        <div className="grid grid-cols-2 gap-4">
          <Select variant="secondary" aria-label="Tipo" selectedKey={form.location_type} onSelectionChange={(key: Key | null) => { if (key) updateField('location_type', key as BackgroundFormData['location_type']); }}>
            <Label>Tipo</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{LOCATION_TYPES.map((t) => <ListBox.Item key={t.value} id={t.value}>{t.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
          <Select variant="secondary" aria-label="Hora del día" selectedKey={form.time_of_day} onSelectionChange={(key: Key | null) => { if (key) updateField('time_of_day', key as BackgroundFormData['time_of_day']); }}>
            <Label>Hora del día</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{TIME_OF_DAY.map((t) => <ListBox.Item key={t.value} id={t.value}>{t.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
        </div>

        <TextField variant="secondary" value={form.description} onChange={(v) => updateField('description', v)}>
          <Label>Descripción del entorno</Label>
          <TextArea placeholder="Materiales, colores, objetos, ambiente..." rows={4} />
          <Description>La IA usará esta descripción para generar imágenes consistentes.</Description>
        </TextField>
      </div>
    </ModalShell>
  );
}
