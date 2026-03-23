'use client';

import { useState, useCallback } from 'react';
import { Film, Sparkles, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useAiAssist } from '@/hooks/useAiAssist';
import { toast } from 'sonner';

const PLATFORMS = [
  { value: 'instagram_reels', label: 'Instagram Reels', aspect: '9:16' },
  { value: 'youtube', label: 'YouTube', aspect: '16:9' },
  { value: 'tiktok', label: 'TikTok', aspect: '9:16' },
  { value: 'tv_commercial', label: 'TV / Streaming', aspect: '16:9' },
  { value: 'web', label: 'Web / LinkedIn', aspect: '16:9' },
] as const;

const DURATIONS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
] as const;

export interface VideoCreationData {
  title: string;
  platform: string;
  target_duration_seconds: number;
  description: string;
}

interface VideoCreationCardProps {
  prefill?: Partial<VideoCreationData>;
  projectId?: string;
  /** Called after successful save — sends confirmation to chat */
  onCreated?: (msg: string) => void;
  onCancel: () => void;
}

function generateShortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function VideoCreationCard({ prefill, projectId, onCreated, onCancel }: VideoCreationCardProps) {
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [platform, setPlatform] = useState(prefill?.platform ?? 'instagram_reels');
  const [duration, setDuration] = useState(prefill?.target_duration_seconds ?? 30);
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { assist, loading: aiLoading } = useAiAssist();

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform) || PLATFORMS[0];
  const isValid = title.trim().length > 0;

  // ---- AI assist: suggest title ----
  const suggestTitle = useCallback(async () => {
    const result = await assist(
      `Sugiere UN titulo creativo y corto (maximo 5 palabras) para un video de ${selectedPlatform.label} de ${duration} segundos. ${description ? `Contexto: ${description}` : ''} Solo responde con el titulo, nada mas.`,
      'title',
    );
    if (result) setTitle(result.replace(/^["']|["']$/g, ''));
  }, [assist, selectedPlatform.label, duration, description]);

  // ---- AI assist: suggest description ----
  const suggestDescription = useCallback(async () => {
    const result = await assist(
      `Escribe una descripcion MUY breve (2 frases maximo) para un video titulado "${title}" para ${selectedPlatform.label} de ${duration}s. Solo la descripcion, nada mas.`,
      'description',
    );
    if (result) setDescription(result);
  }, [assist, title, selectedPlatform.label, duration]);

  // ---- Save directly to Supabase ----
  const handleSave = useCallback(async () => {
    if (!isValid || !projectId) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const shortId = generateShortId();
      const slug = title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50);

      const { data, error } = await supabase.from('videos').insert({
        project_id: projectId,
        title: title.trim(),
        short_id: shortId,
        slug: `${slug}-${shortId}`,
        platform: platform as never,
        target_duration_seconds: duration,
        description: description.trim() || null,
        status: 'draft',
        aspect_ratio: selectedPlatform.aspect,
      } as never).select('id, title, short_id').single();

      if (error) throw error;

      setSaved(true);
      toast.success(`Video "${title}" creado`);
      onCreated?.(`Video "${data?.title}" creado correctamente (ID: ${(data as Record<string, unknown>)?.short_id}). Ya puedes empezar a trabajar en el.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al crear video: ${msg}`);
    } finally {
      setSaving(false);
    }
  }, [isValid, projectId, title, platform, duration, description, selectedPlatform.aspect, onCreated]);

  if (saved) {
    return (
      <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
        <Check size={18} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Video "{title}" creado</p>
          <p className="text-xs text-muted-foreground">{selectedPlatform.label} · {duration}s · {selectedPlatform.aspect}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
        <Film size={14} className="text-blue-500 shrink-0" />
        <span className="text-sm font-semibold text-foreground">Nuevo video</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Title + AI suggest */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Titulo</label>
            <button
              type="button"
              onClick={suggestTitle}
              disabled={!!aiLoading}
              className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors disabled:opacity-50"
            >
              {aiLoading === 'title' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
              Sugerir
            </button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulo del video"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            autoFocus
          />
        </div>

        {/* Platform */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Plataforma</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors',
                  p.value === platform
                    ? 'border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                {p.label}
                <span className="ml-1 text-[9px] opacity-60">{p.aspect}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Duracion</label>
          <div className="flex gap-1.5 mt-1">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                className={cn(
                  'flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors text-center',
                  d.value === duration
                    ? 'border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description + AI suggest */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Descripcion</label>
            {title && (
              <button
                type="button"
                onClick={suggestDescription}
                disabled={!!aiLoading}
                className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors disabled:opacity-50"
              >
                {aiLoading === 'description' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                Generar
              </button>
            )}
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripcion breve del video (opcional)"
            rows={2}
            className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-teal-500/50"
          />
        </div>

        {/* Summary badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted text-[10px] text-muted-foreground">
          <Film size={10} className="shrink-0" />
          {selectedPlatform.label} · {selectedPlatform.aspect} · {duration}s
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-border bg-muted/30">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid || saving}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors',
            isValid && !saving
              ? 'bg-teal-600 text-white hover:bg-teal-500'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />}
          {saving ? 'Creando...' : 'Crear video'}
        </button>
      </div>
    </div>
  );
}
