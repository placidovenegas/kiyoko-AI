'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Users,
  Upload,
  X,
  Sparkles,
  ChevronDown,
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
  CHAT_DOCK_DROPDOWN_ITEM_CLASS,
  CHAT_DOCK_DROPDOWN_PANEL_CLASS,
  CHAT_DOCK_FIELD_CLASS,
  CHAT_DOCK_FIELD_COMPACT_CLASS,
  CHAT_DOCK_FOOTER_BAR_CLASS,
  CHAT_DOCK_SECTION_HEADER_CLASS,
  CHAT_DOCK_TEXTAREA_CLASS,
  CHAT_DOCK_TEXTAREA_MONO_CLASS,
} from '@/components/chat/chatDockOverlay';

const ROLES = ['protagonista', 'secundario', 'extra', 'narrador'] as const;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const ANALYSIS_PROMPT = `Analyze this character image for a video production project. Describe in English (max 50 words): age, gender, hair, clothing, expression, energy. Format as a concise visual prompt.`;

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

export interface CharacterCreationData {
  name: string;
  role: string;
  description: string;
  personality: string;
  visual_description: string;
  image?: File;
  imagePreview?: string;
}

interface CharacterCreationCardProps {
  prefill?: Partial<CharacterCreationData>;
  projectId?: string;
  onCreated?: CreationDoneCallback;
  onCancel: () => void;
  /** Sandbox UI: simula guardado sin Supabase */
  sandbox?: boolean;
  /** Anclado encima del input (mismo patrón que ChatQuestionPrompt overlay) */
  dock?: boolean;
}

export function CharacterCreationCard({ prefill, projectId, onCreated, onCancel, sandbox = false, dock = false }: CharacterCreationCardProps) {
  const [name, setName] = useState(prefill?.name ?? '');
  const [role, setRole] = useState(prefill?.role ?? 'protagonista');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [personality, setPersonality] = useState(prefill?.personality ?? '');
  const [visualDesc, setVisualDesc] = useState(prefill?.visual_description ?? '');
  const [imagePreview, setImagePreview] = useState<string | null>(prefill?.imagePreview ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<CreationSaveStep>(0);
  const [saved, setSaved] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const { assist, loading: aiLoading } = useAiAssist();

  useEffect(() => {
    if (!roleOpen) return;
    const handle = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [roleOpen]);

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

  // ---- AI assists ----
  const suggestPersonality = useCallback(async () => {
    const result = await assist(
      `Sugiere 3-4 rasgos de personalidad (separados por coma) para un personaje llamado "${name}" con rol ${role}. ${description ? `Contexto: ${description}` : ''} Solo los rasgos, nada mas.`,
      'personality',
    );
    if (result) setPersonality(result);
  }, [assist, name, role, description]);

  const suggestVisual = useCallback(async () => {
    const result = await assist(
      `Escribe un prompt visual en INGLES (max 50 palabras) para un personaje llamado "${name}": ${description || 'sin contexto'}. Personalidad: ${personality || 'sin definir'}. Solo el prompt, nada mas.`,
      'visual',
    );
    if (result) setVisualDesc(result);
  }, [assist, name, description, personality]);

  const copyAnalysisPrompt = useCallback(() => {
    navigator.clipboard.writeText(ANALYSIS_PROMPT).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  }, []);

  // ---- Save to Supabase ----
  const handleSave = useCallback(async () => {
    if (!name.trim()) { toast.error('Escribe un nombre para el personaje'); return; }
    if (!sandbox && !projectId) { toast.error('No se pudo detectar el proyecto. Recarga la pagina.'); return; }
    setSaving(true);
    setSaveStep(0);
    useAIStore.getState().setCreating(true, `Creando personaje "${name.trim()}"...`);

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
          referenceImagePath = `characters/${projectId}/${crypto.randomUUID()}.${ext}`;
          const uploadRes = await withTimeout(
            supabase.storage.from('project-assets').upload(referenceImagePath, imageFile, { contentType: imageFile.type }),
            30000,
            'subiendo imagen del personaje',
          );
          const { error: upErr } = uploadRes;
          if (upErr) {
            toast.error(`Error al subir imagen: ${upErr.message}`);
          } else {
            const { data: urlData } = supabase.storage.from('project-assets').getPublicUrl(referenceImagePath);
            referenceImageUrl = urlData?.publicUrl || null;
          }
        }

        const words = name.trim().split(/\s+/);
        const initials = words.map((w) => w[0]?.toUpperCase()).join('').slice(0, 3);

        const insertRes = await withTimeout(
          supabase.from('characters').insert({
            project_id: projectId,
            name: name.trim(),
            initials,
            role: role as never,
            description: description.trim() || null,
            personality: personality.trim() || null,
            visual_description: visualDesc.trim() || null,
            prompt_snippet: visualDesc.trim() || null,
            reference_image_url: referenceImageUrl,
            reference_image_path: referenceImagePath,
          } as never).select('id, name').single(),
          30000,
          'guardando personaje',
        );

        const { data, error } = insertRes;
        if (error) throw error;

        setSaveStep(2);
        await sleep(350);
        setSaveStep(3);
        await sleep(180);

        setSaved(true);
        toast.success(`Personaje "${name}" creado`);
        onCreated?.(`Personaje "${(data as Record<string, unknown>)?.name}" creado correctamente.`, {
          entityId: String((data as { id: string }).id),
        });
        return;
      }

      setSaveStep(2);
      await sleep(350);
      setSaveStep(3);
      await sleep(180);

      setSaved(true);
      toast.success(`Personaje "${name}" creado`);
      onCreated?.(`Personaje "${name.trim()}" creado correctamente.`);
    } catch (err) {
      setSaveStep(0);
      toast.error(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
      useAIStore.getState().setCreating(false);
    }
  }, [name, sandbox, projectId, role, description, personality, visualDesc, imageFile, onCreated]);

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
          <p className="text-sm font-semibold text-foreground">Personaje "{name}" creado</p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
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
        <Users size={14} className="text-purple-500 shrink-0" />
        <span className="text-sm font-semibold text-foreground">Nuevo personaje</span>
      </div>

      {!saving ? (
        <div className="p-4 space-y-3">
        {/* Image + Name + Role */}
        <div className="flex gap-3">
          <div className="shrink-0">
            {imagePreview ? (
              <div className="relative size-20 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                <Button
                  type="button"
                  onPress={removeImage}
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  isDisabled={saving}
                  className="absolute top-0.5 right-0.5 size-5 bg-black/60 text-white hover:bg-black/80"
                >
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
                  'flex flex-col items-center justify-center size-20 rounded-lg border-2 border-dashed transition-all',
                  dock
                    ? 'border-border/70 bg-background/40 hover:bg-background/55 hover:border-primary/45 text-muted-foreground hover:text-primary dark:hover:text-primary'
                    : 'border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary dark:hover:text-primary',
                )}
              >
                <Upload size={16} />
                <span className="text-[9px] mt-0.5">Imagen</span>
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <Input
              type="text"
              value={name}
              disabled={saving}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del personaje"
              className={cn(dock ? CHAT_DOCK_FIELD_CLASS : 'w-full px-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/50')}
              autoFocus
            />
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => {
                  if (saving) return;
                  setRoleOpen(!roleOpen);
                }}
                disabled={saving}
                className={cn(
                  dock
                    ? cn(CHAT_DOCK_FIELD_CLASS, 'flex w-full items-center justify-between gap-2 text-left min-h-10')
                    : 'flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground',
                )}
              >
                <span className="capitalize">{role}</span>
                <ChevronDown size={14} className={cn('shrink-0 text-muted-foreground transition-transform', roleOpen && 'rotate-180')} />
              </button>
              {roleOpen && (
                <div
                  className={
                    dock
                      ? CHAT_DOCK_DROPDOWN_PANEL_CLASS
                      : 'absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border/80 bg-popover/95 py-1 shadow-lg ring-1 ring-black/6 dark:ring-white/8'
                  }
                >
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        if (saving) return;
                        setRole(r);
                        setRoleOpen(false);
                      }}
                      disabled={saving}
                      className={cn(
                        dock ? CHAT_DOCK_DROPDOWN_ITEM_CLASS : 'w-full justify-start px-3 py-1.5 text-xs capitalize hover:bg-accent text-left',
                        r === role ? 'text-primary dark:text-primary font-medium' : 'text-foreground',
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Que hace en la historia</label>
          <TextArea
            value={description}
            disabled={saving}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Chica aventurera que descubre ofertas de verano..."
            rows={2}
            className={cn('w-full mt-1', dock ? CHAT_DOCK_TEXTAREA_CLASS : 'px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring/50')}
          />
        </div>

        {/* Personality + AI assist */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Personalidad</label>
            {name && (
              <Button type="button" onPress={suggestPersonality} isDisabled={!!aiLoading || saving}
                variant="ghost" size="sm"
                className="flex items-center gap-1 text-[10px]">
                {aiLoading === 'personality' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />} Sugerir
              </Button>
            )}
          </div>
          <Input
            type="text"
            value={personality}
            disabled={saving}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="Ej: Alegre, aventurera, espontanea"
            className={cn(dock ? CHAT_DOCK_FIELD_COMPACT_CLASS : 'w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/50')}
          />
        </div>

        {/* Visual description + AI assist */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              <ImageIcon size={10} /> Prompt visual (EN)
            </label>
            {name && (
              <Button type="button" onPress={suggestVisual} isDisabled={!!aiLoading || saving}
                variant="ghost" size="sm"
                className="flex items-center gap-1 text-[10px]">
                {aiLoading === 'visual' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />} Generar
              </Button>
            )}
          </div>
          <TextArea
            value={visualDesc}
            disabled={saving}
            onChange={(e) => setVisualDesc(e.target.value)}
            placeholder="Ej: young woman 22-27, wavy blonde hair, bright smile, beach outfit"
            rows={2}
            className={cn(dock ? CHAT_DOCK_TEXTAREA_MONO_CLASS : 'w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground font-mono placeholder:text-muted-foreground placeholder:font-sans resize-none focus:outline-none focus:ring-1 focus:ring-ring/50')}
          />

          {/* Image analysis helper */}
          {imagePreview && !visualDesc && (
            <div className={cn('mt-1.5 rounded-lg border p-2', dock ? 'border-border/60 bg-background/35' : 'border-border bg-muted/50')}>
              <div className="flex items-start gap-2">
                <Info size={11} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Si la IA no puede analizar la imagen, copia este prompt y usalo en ChatGPT/Claude con la imagen:
                  </p>
                  <Button type="button" onPress={copyAnalysisPrompt} isDisabled={saving}
                    variant="outline" size="sm"
                    className="mt-1 flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    {promptCopied ? <Check size={9} className="text-emerald-500" /> : <Copy size={9} />}
                    {promptCopied ? 'Copiado' : 'Copiar prompt de analisis'}
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

      {/* Actions */}
      {!saving && (
      <div
        className={cn(
          dock
            ? CHAT_DOCK_FOOTER_BAR_CLASS
            : 'flex items-center justify-end gap-2 px-4 py-2.5 border-t border-border bg-muted/30',
        )}
      >
        <Button type="button" onPress={() => { if (saving) return; onCancel(); }} isDisabled={saving} variant="ghost" size="sm"
          className="px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
          Cancelar
        </Button>
        <Button type="button" onPress={handleSave} isDisabled={!isValid || saving}
          variant="primary" size="sm"
          className={cn('flex items-center gap-1.5 px-4 text-xs font-semibold',
            !(isValid && !saving) && 'bg-muted text-muted-foreground cursor-not-allowed')}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
          {saving ? 'Creando...' : 'Crear personaje'}
        </Button>
      </div>
      )}
    </div>
  );
}
