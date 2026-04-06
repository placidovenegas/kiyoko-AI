'use client';

import { useState } from 'react';
import { Button, TextField, TextArea, Label, Input, Select, ListBox, Description } from '@heroui/react';
import { Loader2, Sparkles, Volume2 } from 'lucide-react';
import { ModalShell } from '../shared/ModalShell';
import type { ModalProps } from '../shared/types';
import type { CharacterFormData } from './types';
import { CHARACTER_ROLES, DEFAULT_CHARACTER } from './types';
import { useCreateCharacter } from './useCreateCharacter';
import type { Key } from 'react';
import { useCharacterAi } from '@/hooks/useCharacterAi';
import { toast } from 'sonner';

export function CharacterCreateModal({ open, onOpenChange, projectId, onSuccess }: ModalProps) {
  const [form, setForm] = useState<CharacterFormData>({ ...DEFAULT_CHARACTER });
  const [aiPrompt, setAiPrompt] = useState('');
  const [voiceSummary, setVoiceSummary] = useState<string | null>(null);
  const mutation = useCreateCharacter(projectId);
  const { draftMutation } = useCharacterAi();

  const updateField = <K extends keyof CharacterFormData>(key: K, value: CharacterFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setForm({ ...DEFAULT_CHARACTER });
      setAiPrompt('');
      setVoiceSummary(null);
    }
    onOpenChange(isOpen);
  };

  const handleGenerateWithAi = async () => {
    const prompt = aiPrompt.trim() || form.description.trim() || form.visual_description.trim();
    if (!projectId) {
      toast.error('No se detectó el proyecto para generar la ficha con IA');
      return;
    }
    if (!prompt) {
      toast.error('Describe el personaje para que la IA pueda proponer una ficha');
      return;
    }

    const response = await draftMutation.mutateAsync({
      projectId,
      prompt,
      seed: {
        role: form.role,
        description: form.description,
        visual_description: form.visual_description,
        personality: form.personality,
      },
    });

    setForm({
      name: response.draft.name,
      role: response.draft.role,
      description: response.draft.description,
      visual_description: response.draft.visual_description,
      personality: response.draft.personality,
      hair_description: response.draft.hair_description,
      signature_clothing: response.draft.signature_clothing,
      accessories: response.draft.accessories.join(', '),
      color_accent: response.draft.color_accent,
      prompt_snippet: response.draft.prompt_snippet,
      ai_prompt_description: response.draft.prompt_snippet,
    });

    setVoiceSummary(`${response.voiceDirection.archetype}. ${response.voiceDirection.voiceBrief}`);
    toast.success('La IA preparó una ficha inicial del personaje');
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await mutation.mutateAsync(form);
    setForm({ ...DEFAULT_CHARACTER });
    setAiPrompt('');
    setVoiceSummary(null);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={handleClose}
      title="Nuevo personaje"
      description="Añade un personaje al proyecto"
      footer={
        <>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="primary" onPress={handleSubmit} isDisabled={!form.name.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crear personaje
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">IA contextual para personajes</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Describe el personaje y la IA te propone campos listos para producción, prompt visual y dirección de voz.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <TextField variant="secondary" value={aiPrompt} onChange={setAiPrompt}>
              <Label>Describe tu personaje</Label>
              <TextArea placeholder="Ej. Una hacker de 27 años, precisa, silenciosa, con abrigo técnico negro y mirada analítica" rows={3} />
              <Description>Úsalo para generar una ficha completa con IA sin pasar por el chat.</Description>
            </TextField>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onPress={handleGenerateWithAi} isDisabled={draftMutation.isPending || !projectId}>
                {draftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generar con IA
              </Button>
            </div>

            {voiceSummary ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-start gap-2">
                  <Volume2 className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Direccion de voz sugerida</p>
                    <p className="mt-1 text-sm text-foreground">{voiceSummary}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <TextField variant="secondary" value={form.name} onChange={(v) => updateField('name', v)} isRequired>
            <Label>Nombre</Label>
            <Input placeholder="Ej. Ana García" autoFocus />
          </TextField>
          <Select variant="secondary" aria-label="Rol" selectedKey={form.role} onSelectionChange={(key: Key | null) => { if (key) updateField('role', key as CharacterFormData['role']); }}>
            <Label>Rol</Label>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{CHARACTER_ROLES.map((r) => <ListBox.Item key={r.value} id={r.value}>{r.label}</ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
        </div>

        <TextField variant="secondary" value={form.description} onChange={(v) => updateField('description', v)}>
          <Label>Descripción general</Label>
          <TextArea placeholder="Quién es este personaje, su historia..." rows={2} />
        </TextField>

        <TextField variant="secondary" value={form.visual_description} onChange={(v) => updateField('visual_description', v)}>
          <Label>Descripción visual</Label>
          <TextArea placeholder="Aspecto físico: edad, complexión, rasgos..." rows={3} />
          <Description>Usado por la IA para generar imágenes consistentes.</Description>
        </TextField>

        <TextField variant="secondary" value={form.personality} onChange={(v) => updateField('personality', v)}>
          <Label>Personalidad</Label>
          <TextArea placeholder="Rasgos de personalidad, forma de hablar..." rows={2} />
        </TextField>

        <div className="grid grid-cols-2 gap-4">
          <TextField variant="secondary" value={form.hair_description} onChange={(v) => updateField('hair_description', v)}>
            <Label>Pelo</Label>
            <Input placeholder="Ej. Castaño largo ondulado" />
          </TextField>
          <TextField variant="secondary" value={form.signature_clothing} onChange={(v) => updateField('signature_clothing', v)}>
            <Label>Ropa característica</Label>
            <Input placeholder="Ej. Chaqueta de cuero" />
          </TextField>
        </div>

        <TextField variant="secondary" value={form.accessories} onChange={(v) => updateField('accessories', v)}>
          <Label>Accesorios</Label>
          <Input placeholder="Gafas, reloj, mochila (separados por coma)" />
        </TextField>

        <TextField variant="secondary" value={form.prompt_snippet} onChange={(v) => updateField('prompt_snippet', v)}>
          <Label>Prompt snippet</Label>
          <TextArea placeholder="English reusable prompt for image/video generation" rows={3} />
          <Description>Fragmento reutilizable que la app insertará en prompts de escenas.</Description>
        </TextField>
      </div>
    </ModalShell>
  );
}
