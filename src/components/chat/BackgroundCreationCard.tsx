'use client';

import { useState, useRef, useCallback } from 'react';
import {
  MapPin,
  Upload,
  X,
  Sparkles,
  Image as ImageIcon,
  Copy,
  Check,
  Info,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button, Input, TextArea } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { useAiAssist } from '@/hooks/useAiAssist';
import { useAIStore } from '@/stores/ai-store';
import { toast } from 'sonner';
import { CreationSaveProgress, type CreationSaveStep } from '@/components/chat/CreationSaveProgress';
import type { CreationDoneCallback } from '@/types/chat-v8';
import {
  CHAT_DOCK_FIELD_CLASS,
  CHAT_DOCK_FOOTER_BAR_CLASS,
  CHAT_DOCK_SECTION_HEADER_CLASS,
  CHAT_DOCK_TEXTAREA_MONO_CLASS,
} from '@/components/chat/chatDockOverlay';

const LOCATION_TYPES = ['interior', 'exterior', 'mixto'] as const;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
const TIME_OPTIONS = ['amanecer', 'dia', 'atardecer', 'noche'] as const;

const ANALYSIS_PROMPT = `Analyze this background/location image for a video production project. Describe in English (max 50 words): setting type, lighting, colors, atmosphere, key elements. Format as a concise visual prompt for AI image generation.`;

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

export interface BackgroundCreationData {
  name: string;
  location_type: string;
  time_of_day: string;
  description: string;
  image?: File;
  imagePreview?: string;
}

interface BackgroundCreationCardProps {
  prefill?: Partial<BackgroundCreationData>;
  projectId?: string;
  onCreated?: CreationDoneCallback;
  onCancel: () => void;
  /** Sandbox UI: simula guardado sin Supabase */
  sandbox?: boolean;
  /** Anclado encima del input (mismo patrón que ChatQuestionPrompt overlay) */
  dock?: boolean;
}

export function BackgroundCreationCard({ prefill, projectId, onCreated, onCancel, sandbox = false, dock = false }: BackgroundCreationCardProps) {
  const [name, setName] = useState(prefill?.name ?? '');
  const [locationType, setLocationType] = useState(prefill?.location_type ?? 'exterior');
  const [timeOfDay, setTimeOfDay] = useState(prefill?.time_of_day ?? 'dia');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [imagePreview, setImagePreview] = useState<string | null>(prefill?.imagePreview ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<CreationSaveStep>(0);
  const [saved, setSaved] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { assist, loading: aiLoading } = useAiAssist();

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (saving) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagen demasiado grande (max 10MB)'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, [saving]);

  const removeImage = useCallback(() => {
    if (saving) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [imagePreview, saving]);

  const suggestDescription = useCallback(async () => {
    const result = await assist(
      `Escribe un prompt visual en INGLES (max 50 palabras) para un fondo llamado "${name}". Tipo: ${locationType}, hora: ${timeOfDay}. Solo el prompt, nada mas.`,
      'description',
    );
    if (result) setDescription(result);
  }, [assist, name, locationType, timeOfDay]);

  const copyAnalysisPrompt = useCallback(() => {
    navigator.clipboard.writeText(ANALYSIS_PROMPT).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) { toast.error('Escribe un nombre para el fondo'); return; }
    if (!sandbox && !projectId) { toast.error('No se pudo detectar el proyecto. Recarga la pagina.'); return; }
    setSaving(true);
    setSaveStep(0);
    useAIStore.getState().setCreating(true, `Creando fondo "${name.trim()}"...`);

    try {
      await sleep(200);
      setSaveStep(1);

      if (sandbox) {
        await withTimeout(new Promise((r) => setTimeout(r, 900)), 30000, 'simulando guardado');
      } else {
        const supabase = createClient();

        let referenceImageUrl: string | null = null;
        let referenceImagePath: string | null = null;
        if (imageFile) {
          const ext = imageFile.name.split('.').pop() || 'png';
          referenceImagePath = `backgrounds/${projectId}/${crypto.randomUUID()}.${ext}`;
          const uploadRes = await withTimeout(
            supabase.storage.from('project-assets').upload(referenceImagePath, imageFile, { contentType: imageFile.type }),
            30000,
            'subiendo imagen del fondo',
          );
          const { error: upErr } = uploadRes;
          if (upErr) {
            toast.error(`Error al subir imagen: ${upErr.message}`);
          } else {
            const { data: urlData } = supabase.storage.from('project-assets').getPublicUrl(referenceImagePath);
            referenceImageUrl = urlData?.publicUrl || null;
          }
        }

        const code = name.toUpperCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 20);

        const insertRes = await withTimeout(
          supabase.from('backgrounds').insert({
            project_id: projectId,
            name: name.trim(),
            code,
            location_type: locationType as never,
            time_of_day: timeOfDay,
            description: description.trim() || null,
            prompt_snippet: description.trim() || null,
            reference_image_url: referenceImageUrl,
            reference_image_path: referenceImagePath,
          } as never).select('id, name').single(),
          30000,
          'guardando fondo',
        );

        const { data, error } = insertRes;
        if (error) throw error;

        setSaveStep(2);
        await sleep(350);
        setSaveStep(3);
        await sleep(180);

        setSaved(true);
        toast.success(`Fondo "${name}" creado`);
        onCreated?.(`Fondo "${(data as Record<string, unknown>)?.name}" creado correctamente.`, {
          entityId: String((data as { id: string }).id),
        });
        return;
      }

      setSaveStep(2);
      await sleep(350);
      setSaveStep(3);
      await sleep(180);

      setSaved(true);
      toast.success(`Fondo "${name}" creado`);
      onCreated?.(`Fondo "${name.trim()}" creado correctamente.`);
    } catch (err) {
      setSaveStep(0);
      toast.error(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
      useAIStore.getState().setCreating(false);
    }
  }, [name, sandbox, projectId, locationType, timeOfDay, description, imageFile, onCreated]);

  const isValid = name.trim().length > 0;

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
          <p className="text-sm font-semibold text-foreground">Fondo "{name}" creado</p>
          <p className="text-xs text-muted-foreground capitalize">{locationType} · {timeOfDay}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border border-border bg-card overflow-hidden',
        dock ? 'mt-0 rounded-none border-0 bg-transparent' : 'mt-2 rounded-lg',
      )}
    >
      <div
        className={cn(
          dock
            ? CHAT_DOCK_SECTION_HEADER_CLASS
            : 'flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border',
        )}
      >
        <MapPin size={14} className="text-emerald-500 shrink-0" />
        <span className="text-sm font-semibold text-foreground">Nuevo fondo / locacion</span>
      </div>

      {!saving ? (
        <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <div className="shrink-0">
            {imagePreview ? (
              <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                <Button type="button" onPress={removeImage} isIconOnly size="sm" isDisabled={saving} className="absolute top-0.5 right-0.5 size-5 bg-black/60 text-white hover:bg-black/80">
                  <X size={10} />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onPress={() => {
                  if (saving) return;
                  fileRef.current?.click();
                }}
                isDisabled={saving}
                variant="ghost"
                className={cn(
                  'flex flex-col items-center justify-center w-28 h-20 border-2 border-dashed transition-all',
                  dock
                    ? 'border-border/70 bg-background/40 hover:bg-background/55 hover:border-primary/45 text-muted-foreground hover:text-primary dark:hover:text-primary'
                    : 'border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary dark:hover:text-primary',
                )}
              >
                <Upload size={16} />
                <span className="text-[9px] mt-0.5">Imagen ref.</span>
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <Input
              type="text"
              value={name}
              isDisabled={saving}
              onValueChange={setName}
              placeholder="Nombre del fondo"
              className={cn(dock ? CHAT_DOCK_FIELD_CLASS : 'w-full px-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/50')}
              autoFocus
            />
            <div className="flex gap-1.5">
              {LOCATION_TYPES.map((t) => (
                <Button
                  key={t}
                  type="button"
                  onPress={() => {
                    if (!saving) setLocationType(t);
                  }}
                  isDisabled={saving}
                  variant={t === locationType ? 'secondary' : 'outline'}
                  color={t === locationType ? 'primary' : undefined}
                  size="sm"
                  className={cn(
                    'flex-1 capitalize rounded-lg',
                    dock && t === locationType && 'border-primary/50 bg-primary/15 text-primary shadow-sm dark:text-primary',
                    dock && t !== locationType && 'border-border/60 bg-background/40 hover:bg-accent/90',
                    !dock && t === locationType && 'border-primary/40 bg-primary/10 text-primary dark:text-primary',
                    !dock && t !== locationType && 'border-border text-muted-foreground hover:bg-accent',
                  )}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Hora del dia</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {TIME_OPTIONS.map((t) => (
              <Button
                key={t}
                type="button"
                onPress={() => {
                  if (!saving) setTimeOfDay(t);
                }}
                isDisabled={saving}
                variant={t === timeOfDay ? 'secondary' : 'outline'}
                color={t === timeOfDay ? 'primary' : undefined}
                size="sm"
                className={cn(
                  'capitalize rounded-lg',
                  dock && t === timeOfDay && 'border-primary/50 bg-primary/15 text-primary shadow-sm dark:text-primary',
                  dock && t !== timeOfDay && 'border-border/60 bg-background/40 hover:bg-accent/90',
                  !dock && t === timeOfDay && 'border-primary/40 bg-primary/10 text-primary dark:text-primary',
                  !dock && t !== timeOfDay && 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              <ImageIcon size={10} /> Prompt visual (EN)
            </label>
            {name && (
              <Button type="button" onPress={suggestDescription} isDisabled={!!aiLoading || saving} variant="ghost" color="primary" size="sm"
                className="text-[10px] text-primary dark:text-primary hover:text-primary disabled:opacity-50">
                {aiLoading === 'description' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />} Generar
              </Button>
            )}
          </div>
          <TextArea
            value={description}
            isDisabled={saving}
            onValueChange={setDescription}
            placeholder="Ej: tropical beach, golden morning light, calm ocean, palm trees"
            minRows={2}
            className={cn(dock ? CHAT_DOCK_TEXTAREA_MONO_CLASS : 'w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground font-mono placeholder:text-muted-foreground placeholder:font-sans resize-none focus:outline-none focus:ring-1 focus:ring-ring/50')}
          />

          {imagePreview && !description && (
            <div className={cn('mt-1.5 rounded-lg border p-2', dock ? 'border-border/60 bg-background/35' : 'border-border bg-muted/50')}>
              <div className="flex items-start gap-2">
                <Info size={11} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Copia este prompt para analizar la imagen en otra IA:</p>
                  <Button type="button" onPress={copyAnalysisPrompt} variant="outline" size="sm"
                    isDisabled={saving}
                    className="mt-1 border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent">
                    {promptCopied ? <Check size={9} className="text-emerald-500" /> : <Copy size={9} />}
                    {promptCopied ? 'Copiado' : 'Copiar prompt'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        <CreationSaveProgress step={saveStep} entityName={name.trim()} />
      )}

      {!saving && (
      <div
        className={cn(
          dock
            ? CHAT_DOCK_FOOTER_BAR_CLASS
            : 'flex items-center justify-end gap-2 px-4 py-2.5 border-t border-border bg-muted/30',
        )}
      >
        <Button type="button" onPress={() => { if (!saving) onCancel(); }} isDisabled={saving} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">Cancelar</Button>
        <Button type="button" onPress={handleSave} isDisabled={!isValid || saving} variant="primary" color="primary" size="sm"
          className={cn('font-semibold',
            isValid && !saving ? '' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
          {saving ? 'Creando...' : 'Crear fondo'}
        </Button>
      </div>
      )}
    </div>
  );
}
