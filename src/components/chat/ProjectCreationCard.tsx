'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TextField, Input, TextArea, Select, ListBox, Label } from '@heroui/react';
import type { Key } from 'react';
import { Check, FolderKanban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreationSaveProgress, type CreationSaveStep } from '@/components/chat/CreationSaveProgress';
import {
  CHAT_DOCK_FIELD_CLASS,
  CHAT_DOCK_FOOTER_BAR_CLASS,
  CHAT_DOCK_SECTION_HEADER_CLASS,
  CHAT_DOCK_TEXTAREA_CLASS,
} from '@/components/chat/chatDockOverlay';
import { queryKeys } from '@/lib/query/keys';
import { createClient } from '@/lib/supabase/client';
import { generateProjectSlug } from '@/lib/utils/slugify';
import { cn } from '@/lib/utils/cn';
import { useAIStore } from '@/stores/ai-store';
import { useUIStore } from '@/stores/useUIStore';
import type { CreationDoneCallback } from '@/types/chat-v8';

const STYLES: { value: string; label: string }[] = [
  { value: 'pixar', label: 'Pixar 3D' },
  { value: 'realistic', label: 'Realista' },
  { value: 'anime', label: 'Anime' },
  { value: 'watercolor', label: 'Acuarela' },
  { value: 'flat_2d', label: 'Flat 2D' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'custom', label: 'Personalizado' },
];

async function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function generateShortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export interface ProjectCreationData {
  title: string;
  description: string;
  client_name: string;
  style: string;
}

interface ProjectCreationCardProps {
  prefill?: Partial<ProjectCreationData>;
  onCreated?: CreationDoneCallback;
  onCancel: () => void;
  sandbox?: boolean;
  dock?: boolean;
}

export function ProjectCreationCard({
  prefill,
  onCreated,
  onCancel,
  sandbox = false,
  dock = false,
}: ProjectCreationCardProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [clientName, setClientName] = useState(prefill?.client_name ?? '');
  const [style, setStyle] = useState(prefill?.style ?? 'pixar');
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<CreationSaveStep>(0);
  const [saved, setSaved] = useState(false);

  const isValid = title.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Escribe un nombre para el proyecto');
      return;
    }

    setSaving(true);
    setSaveStep(0);
    useAIStore.getState().setCreating(true, `Creando proyecto "${title.trim()}"...`);

    try {
      await sleep(200);
      setSaveStep(1);

      if (sandbox) {
        await withTimeout(new Promise((resolve) => setTimeout(resolve, 900)), 30000, 'simulando guardado');
      } else {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Debes iniciar sesion');
        }

        const shortId = generateShortId();
        const slug = generateProjectSlug(title.trim());

        const insertRes = await withTimeout(
          supabase
            .from('projects')
            .insert({
              owner_id: user.id,
              short_id: shortId,
              slug,
              title: title.trim(),
              description: description.trim() || null,
              client_name: clientName.trim() || null,
              style: style as never,
              status: 'draft' as never,
            } as never)
            .select('id, title, short_id')
            .single(),
          30000,
          'guardando proyecto',
        );

        const { data, error } = insertRes;
        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });

        setSaveStep(2);
        await sleep(350);
        setSaveStep(3);
        await sleep(180);

        setSaved(true);
        toast.success(`Proyecto "${title.trim()}" creado`);
        onCreated?.(`Proyecto "${(data as { title: string }).title}" creado correctamente.`, {
          entityId: String((data as { id: string }).id),
          projectShortId: String((data as { short_id: string }).short_id),
        });
        return;
      }

      setSaveStep(2);
      await sleep(350);
      setSaveStep(3);
      await sleep(180);

      setSaved(true);
      toast.success(`Proyecto "${title.trim()}" creado`);
      onCreated?.(`Proyecto "${title.trim()}" creado correctamente (sandbox).`);
    } catch (error) {
      setSaveStep(0);
      toast.error(error instanceof Error ? error.message : 'Error al crear proyecto');
    } finally {
      setSaving(false);
      useAIStore.getState().setCreating(false);
    }
  }, [title, description, clientName, style, sandbox, onCreated, queryClient]);

  if (saved) {
    return (
      <div
        className={cn(
          'mt-2 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-50 p-4 dark:bg-emerald-950/20',
          dock ? 'mt-0 rounded-none border-0' : '',
        )}
      >
        <Check size={18} className="shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-semibold text-foreground">Proyecto &quot;{title}&quot; creado</p>
          <p className="text-xs text-muted-foreground">Abriendo el proyecto…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', dock ? 'p-3' : 'mt-2')}>
      <div className={CHAT_DOCK_SECTION_HEADER_CLASS}>
        <FolderKanban size={16} className="shrink-0 text-primary" />
        <span>Nuevo proyecto</span>
      </div>

      <TextField variant="secondary" value={title} onChange={setTitle} isDisabled={saving}>
        <Label>Titulo</Label>
        <Input placeholder="Nombre del proyecto" />
      </TextField>

      <TextField variant="secondary" value={clientName} onChange={setClientName} isDisabled={saving}>
        <Label>Cliente (opcional)</Label>
        <Input placeholder="Marca o cliente" />
      </TextField>

      <TextField variant="secondary" value={description} onChange={setDescription} isDisabled={saving}>
        <Label>Descripcion</Label>
        <TextArea placeholder="De que trata el proyecto, tono, entregables..." rows={3} />
      </TextField>

      <Select
        variant="secondary"
        aria-label="Estilo visual"
        selectedKey={style}
        onSelectionChange={(key: Key | null) => { if (key) setStyle(String(key)); }}
        isDisabled={saving}
      >
        <Label>Estilo visual</Label>
        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
        <Select.Popover><ListBox>
          {STYLES.map((item) => (
            <ListBox.Item key={item.value} id={item.value}>{item.label}</ListBox.Item>
          ))}
        </ListBox></Select.Popover>
      </Select>

      {saving && <CreationSaveProgress step={saveStep} entityName={title.trim() || 'Proyecto'} />}

      <div className={CHAT_DOCK_FOOTER_BAR_CLASS}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isValid || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Crear proyecto
        </button>
      </div>
    </div>
  );
}
