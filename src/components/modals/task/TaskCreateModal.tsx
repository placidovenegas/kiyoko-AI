'use client';

import { useState } from 'react';
import { Button, TextField, TextArea, Label, Input, Select, ListBox, Description } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { ModalShell } from '../shared/ModalShell';
import type { ModalProps } from '../shared/types';
import type { TaskFormData } from './types';
import { TASK_CATEGORIES, TASK_PRIORITIES, DEFAULT_TASK } from './types';
import { useCreateTask } from './useCreateTask';
import type { Key } from 'react';

export function TaskCreateModal({ open, onOpenChange, projectId, onSuccess }: ModalProps) {
  const [form, setForm] = useState<TaskFormData>({ ...DEFAULT_TASK });
  const mutation = useCreateTask(projectId);

  const updateField = <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setForm({ ...DEFAULT_TASK });
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    await mutation.mutateAsync(form);
    setForm({ ...DEFAULT_TASK });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={handleClose}
      title="Nueva tarea"
      description="Crea una tarea para el proyecto"
      footer={
        <>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="primary" onPress={handleSubmit} isDisabled={!form.title.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crear tarea
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField variant="secondary" value={form.title} onChange={(v) => updateField('title', v)} isRequired>
          <Label>Título</Label>
          <Input placeholder="Ej. Revisar prompts de escena 3" autoFocus />
        </TextField>

        <TextField variant="secondary" value={form.description} onChange={(v) => updateField('description', v)}>
          <Label>Descripción</Label>
          <TextArea placeholder="Detalles de la tarea..." rows={2} />
        </TextField>

        <div className="grid grid-cols-2 gap-4">
          <Select variant="secondary" aria-label="Categoría" selectedKey={form.category} onSelectionChange={(key: Key | null) => { if (key) updateField('category', key as TaskFormData['category']); }}>
            <Label>Categoría</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{TASK_CATEGORIES.map((c) => <ListBox.Item key={c.value} id={c.value}>{c.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
          <Select variant="secondary" aria-label="Prioridad" selectedKey={form.priority} onSelectionChange={(key: Key | null) => { if (key) updateField('priority', key as TaskFormData['priority']); }}>
            <Label>Prioridad</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{TASK_PRIORITIES.map((p) => <ListBox.Item key={p.value} id={p.value}>{p.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
        </div>

        <TextField variant="secondary" value={form.due_date} onChange={(v) => updateField('due_date', v)}>
          <Label>Fecha límite</Label>
          <Input type="date" />
          <Description>Opcional.</Description>
        </TextField>
      </div>
    </ModalShell>
  );
}
