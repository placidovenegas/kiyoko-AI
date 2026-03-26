'use client';

import { useState, useCallback } from 'react';
import { FolderKanban, Sparkles, Loader2, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useAiAssist } from '@/hooks/useAiAssist';
import { useAIStore } from '@/stores/ai-store';
import { useOrgStore } from '@/stores/useOrgStore';
import { toast } from 'sonner';
import { generateProjectSlug } from '@/lib/utils/slugify';
import { queryKeys } from '@/lib/query/keys';
import { CreationSaveProgress, type CreationSaveStep } from '@/components/chat/CreationSaveProgress';
import type { CreationDoneCallback } from '@/types/chat-v8';
import {
  CHAT_DOCK_FIELD_CLASS,
  CHAT_DOCK_FOOTER_BAR_CLASS,
  CHAT_DOCK_SECTION_HEADER_CLASS,
  CHAT_DOCK_TEXTAREA_CLASS,
} from '@/components/chat/chatDockOverlay';

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
  return new Promise<void>((r) => setTimeout(r, ms));
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
  const currentOrgId = useOrgStore((s) => s.currentOrgId);
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [clientName, setClientName] = useState(prefill?.client_name ?? '');
  const [style, setStyle] = useState(prefill?.style ?? 'pixar');
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<CreationSaveStep>(0);
  const [saved, setSaved] = useState(false);

  const { assist, loading: aiLoading } = useAiAssist();

  const isValid = title.trim().length > 0;

  const suggestTitle = useCallback(async () => {
    const result = await assist(
      `Sugiere UN titulo corto y profesional (maximo 6 palabras) para un proyecto audiovisual.${description ? ` Contexto: ${description}` : ''} Solo el titulo, nada mas.`,
      'title',
    );
    if (result) setTitle(result.replace(/^["']|["']$/g, ''));
  }, [assist, description]);

  const suggestDescription = useCallback(async () => {
    const result = await assist(
      `Escribe una descripcion breve (2-3 frases) para un proyecto titulado "${title || 'sin titulo'}". Solo la descripcion.`,
      'description',
    );
    if (result) setDescription(result);
  }, [assist, title]);

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
        await withTimeout(new Promise((r) => setTimeout(r, 900)), 30000, 'simulando guardado');
      } else {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Debes iniciar sesion');

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
              organization_id: currentOrgId || null,
            } as never)
            .select('id, title, short_id')
            .single(),
          30000,
          'guardando proyecto',
        );

        const { data, error } = insertRes;
        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
        if (currentOrgId) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.projects.byOrg(currentOrgId) });
        }

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
    } catch (err) {
      setSaveStep(0);
      toast.error(err instanceof Error ? err.message : 'Error al crear proyecto');
    } finally {
      setSaving(false);
      useAIStore.getState().setCreating(false);
    }
  }, [title, description, clientName, style, sandbox, currentOrgId, onCreated, queryClient]);

  if (saved) {
    return (
      <div
        className={cn(
          'rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3',
          dock ? 'mt-0 rounded-none border-0' : 'mt-2',
        )}
      >
        <Check size={18} className="text-emerald-500 shrink-0" />
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
        <FolderKanban size={16} className="text-primary shrink-0" />
        <span>Nuevo proyecto</span>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium text-muted-foreground">Titulo</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre del proyecto"
            disabled={saving}
            className={CHAT_DOCK_FIELD_CLASS}
          />
          <button
            type="button"
            onClick={() => void suggestTitle()}
            disabled={saving || Boolean(aiLoading)}
            className="shrink-0 rounded-lg border border-border px-2 py-2 text-muted-foreground hover:bg-muted/60 disabled:opacity-50"
            title="Sugerir titulo con IA"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium text-muted-foreground">Cliente (opcional)</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Marca o cliente"
          disabled={saving}
          className={CHAT_DOCK_FIELD_CLASS}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-medium text-muted-foreground">Descripcion</label>
          <button
            type="button"
            onClick={() => void suggestDescription()}
            disabled={saving || Boolean(aiLoading)}
            className="text-[10px] text-primary hover:underline disabled:opacity-50"
          >
            Sugerir con IA
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="De que trata el proyecto, tono, entregables..."
          disabled={saving}
          rows={3}
          className={cn(CHAT_DOCK_TEXTAREA_CLASS, 'min-h-[72px]')}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium text-muted-foreground">Estilo visual</label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          disabled={saving}
          className={CHAT_DOCK_FIELD_CLASS}
        >
          {STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

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
