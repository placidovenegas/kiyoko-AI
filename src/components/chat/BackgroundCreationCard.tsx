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
import { createClient } from '@/lib/supabase/client';
import { useAiAssist } from '@/hooks/useAiAssist';
import { toast } from 'sonner';

const LOCATION_TYPES = ['interior', 'exterior', 'mixto'] as const;
const TIME_OPTIONS = ['amanecer', 'dia', 'atardecer', 'noche'] as const;

const ANALYSIS_PROMPT = `Analyze this background/location image for a video production project. Describe in English (max 50 words): setting type, lighting, colors, atmosphere, key elements. Format as a concise visual prompt for AI image generation.`;

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
  onCreated?: (msg: string) => void;
  onCancel: () => void;
}

export function BackgroundCreationCard({ prefill, projectId, onCreated, onCancel }: BackgroundCreationCardProps) {
  const [name, setName] = useState(prefill?.name ?? '');
  const [locationType, setLocationType] = useState(prefill?.location_type ?? 'exterior');
  const [timeOfDay, setTimeOfDay] = useState(prefill?.time_of_day ?? 'dia');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [imagePreview, setImagePreview] = useState<string | null>(prefill?.imagePreview ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { assist, loading: aiLoading } = useAiAssist();

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagen demasiado grande (max 10MB)'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const removeImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [imagePreview]);

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
    if (!name.trim() || !projectId) return;
    setSaving(true);

    try {
      const supabase = createClient();

      let referenceImageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'png';
        const path = `backgrounds/${projectId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('chat-attachments').upload(path, imageFile, { contentType: imageFile.type });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path);
          referenceImageUrl = urlData?.publicUrl || null;
        }
      }

      const code = name.toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '').slice(0, 20);

      const { data, error } = await supabase.from('backgrounds').insert({
        project_id: projectId,
        name: name.trim(),
        code,
        location_type: locationType as never,
        time_of_day: timeOfDay,
        description: description.trim() || null,
        prompt_snippet: description.trim() || null,
        reference_image_url: referenceImageUrl,
      } as never).select('id, name').single();

      if (error) throw error;

      setSaved(true);
      toast.success(`Fondo "${name}" creado`);
      onCreated?.(`Fondo "${(data as Record<string, unknown>)?.name}" creado correctamente.`);
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  }, [name, projectId, locationType, timeOfDay, description, imageFile, onCreated]);

  const isValid = name.trim().length > 0;

  if (saved) {
    return (
      <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
        <Check size={18} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Fondo "{name}" creado</p>
          <p className="text-xs text-muted-foreground capitalize">{locationType} · {timeOfDay}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
        <MapPin size={14} className="text-emerald-500 shrink-0" />
        <span className="text-sm font-semibold text-foreground">Nuevo fondo / locacion</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <div className="shrink-0">
            {imagePreview ? (
              <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                <button type="button" onClick={removeImage} className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center w-28 h-20 rounded-lg border-2 border-dashed border-border hover:border-teal-500/40 hover:bg-teal-500/5 text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-all">
                <Upload size={16} />
                <span className="text-[9px] mt-0.5">Imagen ref.</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del fondo"
              className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/50" autoFocus />
            <div className="flex gap-1.5">
              {LOCATION_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setLocationType(t)}
                  className={cn('flex-1 px-2 py-1 rounded-md text-[10px] font-medium capitalize border transition-colors',
                    t === locationType ? 'border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'border-border text-muted-foreground hover:bg-accent')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Hora del dia</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {TIME_OPTIONS.map((t) => (
              <button key={t} type="button" onClick={() => setTimeOfDay(t)}
                className={cn('px-2.5 py-1 rounded-md text-[10px] font-medium capitalize border transition-colors',
                  t === timeOfDay ? 'border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'border-border text-muted-foreground hover:bg-accent')}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              <ImageIcon size={10} /> Prompt visual (EN)
            </label>
            {name && (
              <button type="button" onClick={suggestDescription} disabled={!!aiLoading}
                className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-500 disabled:opacity-50">
                {aiLoading === 'description' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />} Generar
              </button>
            )}
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: tropical beach, golden morning light, calm ocean, palm trees" rows={2}
            className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground font-mono placeholder:text-muted-foreground placeholder:font-sans resize-none focus:outline-none focus:ring-1 focus:ring-teal-500/50" />

          {imagePreview && !description && (
            <div className="mt-1.5 rounded-md border border-border bg-muted/50 p-2">
              <div className="flex items-start gap-2">
                <Info size={11} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Copia este prompt para analizar la imagen en otra IA:</p>
                  <button type="button" onClick={copyAnalysisPrompt}
                    className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    {promptCopied ? <Check size={9} className="text-emerald-500" /> : <Copy size={9} />}
                    {promptCopied ? 'Copiado' : 'Copiar prompt'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-border bg-muted/30">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancelar</button>
        <button type="button" onClick={handleSave} disabled={!isValid || saving}
          className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors',
            isValid && !saving ? 'bg-teal-600 text-white hover:bg-teal-500' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
          {saving ? 'Creando...' : 'Crear fondo'}
        </button>
      </div>
    </div>
  );
}
