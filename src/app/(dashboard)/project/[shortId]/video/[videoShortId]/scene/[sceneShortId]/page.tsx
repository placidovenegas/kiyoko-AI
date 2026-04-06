'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useVideo } from '@/contexts/VideoContext';
import { fetchSceneDetail } from '@/lib/queries/scenes';
import { queryKeys } from '@/lib/query/keys';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import {
  ArrowLeft, Film, Camera, Sparkles, Users, Image as ImageIcon,
  StickyNote, MessageSquare, MessageCircle, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, Copy, MapPin, Upload, Music, Mic, Volume2,
} from 'lucide-react';
import { useAIStore } from '@/stores/ai-store';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { CameraAngle, CameraMovement } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-muted-foreground border-zinc-500/30',
  prompt_ready: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  generating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  generated: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', prompt_ready: 'Prompt listo', generating: 'Generando',
  generated: 'Generado', approved: 'Aprobado', rejected: 'Rechazado',
};

const CAMERA_ANGLES: CameraAngle[] = [
  'wide', 'medium', 'close_up', 'extreme_close_up', 'pov',
  'low_angle', 'high_angle', 'birds_eye', 'dutch', 'over_shoulder',
];
const CAMERA_MOVEMENTS: CameraMovement[] = [
  'static', 'dolly_in', 'dolly_out', 'pan_left', 'pan_right',
  'tilt_up', 'tilt_down', 'tracking', 'crane', 'handheld', 'orbit',
];
const ANGLE_LABELS: Record<string, string> = {
  wide: 'Wide', medium: 'Medium', close_up: 'Close Up',
  extreme_close_up: 'Extreme Close Up', pov: 'POV',
  low_angle: 'Low Angle', high_angle: 'High Angle',
  birds_eye: "Bird's Eye", dutch: 'Dutch', over_shoulder: 'Over Shoulder',
};
const MOVEMENT_LABELS: Record<string, string> = {
  static: 'Static', dolly_in: 'Dolly In', dolly_out: 'Dolly Out',
  pan_left: 'Pan Left', pan_right: 'Pan Right',
  tilt_up: 'Tilt Up', tilt_down: 'Tilt Down',
  tracking: 'Tracking', crane: 'Crane', handheld: 'Handheld', orbit: 'Orbit',
};

// ---------------------------------------------------------------------------
// Editable components
// ---------------------------------------------------------------------------

function EditableText({
  value, onSave, className, placeholder, as = 'input',
}: {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  placeholder?: string;
  as?: 'input' | 'textarea';
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
  }, [draft, value, onSave]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'text-left w-full rounded-md px-2 py-1 -mx-2 -my-1',
          'hover:bg-accent transition-colors cursor-text',
          !value && 'text-muted-foreground italic',
          className,
        )}
      >
        {value || placeholder || 'Click para editar...'}
      </button>
    );
  }

  const sharedProps = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (as === 'input' && e.key === 'Enter') commit();
      if (e.key === 'Escape') { setDraft(value); setEditing(false); }
    },
    placeholder,
    className: cn(
      'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none',
      'focus:border-primary/30 focus:ring-1 focus:ring-primary/10',
      className,
    ),
  };

  if (as === 'textarea') {
    return <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={3} {...sharedProps} />;
  }
  return <input ref={ref as React.RefObject<HTMLInputElement>} type="text" {...sharedProps} />;
}

// ---------------------------------------------------------------------------
// Section helpers
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {children}
    </p>
  );
}

const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10';
const selectClass = cn(inputClass, 'appearance-none cursor-pointer');
const monoTextareaClass = cn(inputClass, 'font-mono text-xs leading-relaxed border-primary/20 min-h-[80px] resize-y');
const btnPrimary = 'rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90';
const btnGhost = 'rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground';

// ---------------------------------------------------------------------------
// Audio config type
// ---------------------------------------------------------------------------

interface AudioConfig {
  music: boolean;
  dialogue: boolean;
  sfx: boolean;
  voiceover: boolean;
  lip_sync: boolean;
}

const DEFAULT_AUDIO: AudioConfig = { music: false, dialogue: false, sfx: false, voiceover: false, lip_sync: false };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SceneDetailPage() {
  const params = useParams();
  const sceneShortId = params.sceneShortId as string;
  const shortId = params.shortId as string;
  const videoShortId = params.videoShortId as string;

  const { project } = useProject();
  const { video } = useVideo();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [imageVersionIndex, setImageVersionIndex] = useState(0);
  const { openChat, setActiveAgent } = useAIStore();

  // ---- Generate prompts mutation ----

  const generatePrompts = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/generate-scene-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: data?.scene.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Error generating prompts');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Prompts generados');
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes.detail(sceneShortId) });
    },
    onError: (err: Error) => toast.error(err.message || 'Error al generar prompts'),
  });

  // ---- Data queries ----

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.scenes.detail(sceneShortId),
    queryFn: () => fetchSceneDetail(supabase, sceneShortId),
    enabled: !!sceneShortId,
  });

  const { data: allScenes } = useQuery({
    queryKey: [...queryKeys.scenes.byVideo(videoShortId), 'nav'],
    queryFn: async () => {
      const { data: s } = await supabase
        .from('scenes')
        .select('short_id, scene_number, title')
        .eq('video_id', video?.id ?? '')
        .order('scene_number');
      return s ?? [];
    },
    enabled: !!video?.id,
  });

  const { data: timelineEntry } = useQuery({
    queryKey: ['timeline-entry', data?.scene?.id],
    queryFn: async () => {
      const { data: entry } = await supabase
        .from('timeline_entries')
        .select('*')
        .eq('scene_id', data!.scene.id)
        .single();
      return entry;
    },
    enabled: !!data?.scene?.id,
  });

  // ---- Mutations ----

  const updateScene = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error: err } = await supabase.from('scenes').update(updates).eq('id', data!.scene.id);
      if (err) throw err;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.scenes.detail(sceneShortId) }),
  });

  const updateCamera = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (data?.camera) {
        const { error: err } = await supabase.from('scene_camera').update(updates).eq('id', data.camera.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('scene_camera').insert({ scene_id: data!.scene.id, ...updates });
        if (err) throw err;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.scenes.detail(sceneShortId) }),
  });

  // ---- Helpers ----

  const saveField = useCallback(
    (field: string) => (value: string) => updateScene.mutate({ [field]: value || null }),
    [updateScene],
  );
  const saveCameraField = useCallback(
    (field: string) => (value: string) => updateCamera.mutate({ [field]: value || null }),
    [updateCamera],
  );

  const copyPrompt = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Prompt copiado');
  }, []);

  // ---- Loading / error ----

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-red-400 text-sm">Error al cargar la escena</p>
        <button type="button" onClick={() => window.location.reload()} className={btnGhost}>Reintentar</button>
      </div>
    );
  }

  const { scene, camera, media, clips, prompts, characters, backgrounds } = data;

  // Prompts
  const currentPrompts = prompts.filter((p) => p.is_current);
  const imagePrompt = currentPrompts.find((p) => p.prompt_type === 'image');
  const videoPrompt = currentPrompts.find((p) => p.prompt_type === 'video');

  // Images
  const allImages = media.filter((m) => m.media_type === 'image' || m.file_url);
  const safeIdx = Math.min(imageVersionIndex, Math.max(0, allImages.length - 1));
  const currentImage = allImages.length > 0 ? allImages[safeIdx] : null;

  // Audio config
  const audio: AudioConfig = { ...DEFAULT_AUDIO, ...(scene.audio_config as Partial<AudioConfig> | null) };

  // Navigation
  const backUrl = `/project/${shortId}/video/${videoShortId}`;
  const sceneIdx = allScenes?.findIndex((s) => s.short_id === sceneShortId) ?? -1;
  const prevScene = sceneIdx > 0 ? allScenes?.[sceneIdx - 1] : null;
  const nextScene = sceneIdx >= 0 && allScenes && sceneIdx < allScenes.length - 1 ? allScenes[sceneIdx + 1] : null;

  const toggleAudio = (key: keyof AudioConfig) => {
    const next = { ...audio, [key]: !audio[key] };
    updateScene.mutate({ audio_config: next });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <Link href={backUrl} className={cn(btnGhost, 'flex items-center gap-1.5')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Escenas</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <span className="text-muted-foreground text-sm font-mono shrink-0">#{scene.scene_number}</span>
          <EditableText
            value={scene.title}
            onSave={saveField('title')}
            className="text-sm font-semibold truncate"
            placeholder="Titulo de la escena"
          />

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveAgent('scenes');
                openChat('sidebar');
                toast.success(`Analizando escena #${scene.scene_number}...`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat IA
            </button>

            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
              STATUS_COLORS[scene.status] ?? STATUS_COLORS.draft,
            )}>
              {STATUS_LABELS[scene.status] ?? scene.status}
            </span>

            {prevScene && (
              <Link href={`/project/${shortId}/video/${videoShortId}/scene/${prevScene.short_id}`} className={btnGhost} title="Escena anterior">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            {nextScene && (
              <Link href={`/project/${shortId}/video/${videoShortId}/scene/${nextScene.short_id}`} className={btnGhost} title="Escena siguiente">
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}

            {(updateScene.isPending || updateCamera.isPending) && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* =================== LEFT COLUMN (55%) =================== */}
          <div className="lg:col-span-7 space-y-4">

            {/* Descripcion */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Descripcion</SectionLabel>
              <EditableText
                value={scene.description ?? ''}
                onSave={saveField('description')}
                as="textarea"
                placeholder="Describe que pasa en esta escena..."
                className="text-sm"
              />
            </div>

            {/* Camara */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Camara</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Angulo</label>
                  <select
                    value={camera?.camera_angle ?? ''}
                    onChange={(e) => saveCameraField('camera_angle')(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Seleccionar...</option>
                    {CAMERA_ANGLES.map((a) => <option key={a} value={a}>{ANGLE_LABELS[a] ?? a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Movimiento</label>
                  <select
                    value={camera?.camera_movement ?? ''}
                    onChange={(e) => saveCameraField('camera_movement')(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Seleccionar...</option>
                    {CAMERA_MOVEMENTS.map((m) => <option key={m} value={m}>{MOVEMENT_LABELS[m] ?? m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Iluminacion</label>
                  <EditableText value={camera?.lighting ?? ''} onSave={saveCameraField('lighting')} placeholder="Natural, dramatica..." className="text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Mood</label>
                  <EditableText value={camera?.mood ?? ''} onSave={saveCameraField('mood')} placeholder="Tension, alegria..." className="text-sm" />
                </div>
              </div>
            </div>

            {/* Audio Config */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Audio</SectionLabel>
              <div className="flex flex-wrap gap-3">
                {([
                  ['music', 'Musica', Music],
                  ['dialogue', 'Dialogo', MessageSquare],
                  ['sfx', 'SFX', Volume2],
                  ['voiceover', 'Voiceover', Mic],
                  ['lip_sync', 'Lip sync', Mic],
                ] as const).map(([key, label, Icon]) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={audio[key]}
                      onChange={() => toggleAudio(key)}
                      className="rounded border-border accent-primary h-4 w-4"
                    />
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Personajes */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <SectionLabel>Personajes</SectionLabel>
                <button type="button" className={btnGhost}>+ Anadir</button>
              </div>
              {characters.length > 0 ? (
                <div className="space-y-2">
                  {characters.map((sc) => {
                    const char = sc.characters as { name: string; initials: string; color_accent: string | null; reference_image_url: string | null } | null;
                    if (!char) return null;
                    return (
                      <div key={sc.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                        {char.reference_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={char.reference_image_url} alt={char.name} className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ backgroundColor: `${char.color_accent ?? '#71717A'}20`, color: char.color_accent ?? '#71717A' }}
                          >
                            {char.initials}
                          </div>
                        )}
                        <span className="text-sm font-medium">{char.name}</span>
                        {sc.role_in_scene && <span className="text-[10px] text-muted-foreground ml-auto">({sc.role_in_scene})</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Sin personajes asignados</p>
              )}
            </div>

            {/* Fondos */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <SectionLabel>Fondos</SectionLabel>
                <button type="button" className={btnGhost}>+ Anadir</button>
              </div>
              {backgrounds.length > 0 ? (
                <div className="space-y-2">
                  {backgrounds.map((sb) => {
                    const bg = sb.backgrounds as { name: string; reference_image_url: string | null; code: string } | null;
                    if (!bg) return null;
                    return (
                      <div key={sb.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                        {bg.reference_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={bg.reference_image_url} alt={bg.name} className="h-6 w-6 rounded object-cover" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm">{bg.name}</span>
                        {sb.is_primary && <span className="text-[10px] text-primary ml-auto">Principal</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Sin fondos asignados</p>
              )}
            </div>

            {/* Notas del director */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Notas del director</SectionLabel>
              <EditableText
                value={scene.director_notes ?? ''}
                onSave={saveField('director_notes')}
                as="textarea"
                placeholder="Escribe notas para el director..."
                className="text-sm"
              />
            </div>
          </div>

          {/* =================== RIGHT COLUMN (45%) =================== */}
          <div className="lg:col-span-5 space-y-4">

            {/* Hint: no prompts yet */}
            {!imagePrompt?.prompt_text && !videoPrompt?.prompt_text && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Esta escena no tiene prompts</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pulsa &quot;Generar con IA&quot; para crear prompts de imagen y video automaticamente, o usa el Chat IA para describir lo que quieres.
                </p>
              </div>
            )}

            {/* Prompt Imagen */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Prompt imagen</SectionLabel>
              <textarea
                value={imagePrompt?.prompt_text ?? ''}
                onChange={(e) => {
                  // For now, prompt editing is display-only until prompt update mutation is built
                }}
                readOnly
                placeholder="Sin prompt de imagen generado"
                className={monoTextareaClass}
              />
              {imagePrompt && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-primary font-medium">v{imagePrompt.version ?? 1}</span>
                  {imagePrompt.generator && <span className="text-[10px] text-purple-400 ml-1">{imagePrompt.generator}</span>}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={generatePrompts.isPending}
                  onClick={() => generatePrompts.mutate()}
                >
                  <span className="flex items-center gap-1.5">
                    {generatePrompts.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Sparkles className="h-3.5 w-3.5" />}
                    Generar con IA
                  </span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  onClick={() => imagePrompt?.prompt_text && copyPrompt(imagePrompt.prompt_text)}
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </button>
              </div>
            </div>

            {/* Preview Imagen */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Preview imagen</SectionLabel>
              {currentImage?.file_url ? (
                <>
                  <div className="relative rounded-lg overflow-hidden bg-background border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentImage.file_url} alt={`Escena ${scene.scene_number}`} className="w-full h-auto object-contain max-h-72" />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <span className="bg-black/70 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded">v{currentImage.version ?? 1}</span>
                      {currentImage.generator && <span className="bg-black/70 text-[10px] text-purple-400 px-1.5 py-0.5 rounded">{currentImage.generator}</span>}
                    </div>
                  </div>
                  {allImages.length > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <button type="button" disabled={safeIdx <= 0} onClick={() => setImageVersionIndex((i) => Math.max(0, i - 1))} className={cn(btnGhost, 'disabled:opacity-30')}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs text-muted-foreground">v{safeIdx + 1}/{allImages.length}</span>
                      <button type="button" disabled={safeIdx >= allImages.length - 1} onClick={() => setImageVersionIndex((i) => Math.min(allImages.length - 1, i + 1))} className={cn(btnGhost, 'disabled:opacity-30')}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-44 rounded-lg border border-dashed border-border bg-background text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">Sin imagen generada</p>
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button type="button" className={btnGhost}><span className="flex items-center gap-1"><Upload className="h-3 w-3" />Subir imagen</span></button>
                <button type="button" className={btnGhost}><span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />Regenerar</span></button>
              </div>
            </div>

            {/* Prompt Video */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Prompt video</SectionLabel>
              <textarea
                value={videoPrompt?.prompt_text ?? ''}
                readOnly
                placeholder="Sin prompt de video generado"
                className={monoTextareaClass}
              />
              {videoPrompt && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-primary font-medium">v{videoPrompt.version ?? 1}</span>
                  {videoPrompt.generator && <span className="text-[10px] text-purple-400 ml-1">{videoPrompt.generator}</span>}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={generatePrompts.isPending}
                  onClick={() => generatePrompts.mutate()}
                >
                  <span className="flex items-center gap-1.5">
                    {generatePrompts.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Sparkles className="h-3.5 w-3.5" />}
                    Generar con IA
                  </span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  onClick={() => videoPrompt?.prompt_text && copyPrompt(videoPrompt.prompt_text)}
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </button>
              </div>
            </div>

            {/* Copiar ambos prompts */}
            {(imagePrompt?.prompt_text || videoPrompt?.prompt_text) && (
              <button
                type="button"
                onClick={() => {
                  const parts = [imagePrompt?.prompt_text, videoPrompt?.prompt_text].filter(Boolean);
                  navigator.clipboard.writeText(parts.join('\n\n---\n\n'));
                  toast.success('Ambos prompts copiados');
                }}
                className="w-full rounded-xl border border-primary/20 bg-primary/5 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Copiar ambos prompts
              </button>
            )}

            {/* Clips de Video */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Clips de video</SectionLabel>
              {clips.length > 0 ? (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {clips.map((clip) => {
                      const isBase = clip.clip_type === 'base';
                      return (
                        <span
                          key={clip.id}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium border',
                            isBase
                              ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                              : 'bg-blue-500/20 border-blue-500/30 text-blue-300',
                          )}
                        >
                          {isBase ? 'Base' : `Ext.${clip.extension_number ?? ''}`} {clip.duration_seconds}s
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className={btnGhost}><span className="flex items-center gap-1"><Upload className="h-3 w-3" />Subir clip</span></button>
                    <button type="button" className={btnGhost}><span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />Regenerar</span></button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-border bg-background text-muted-foreground">
                  <Film className="h-6 w-6 mb-1 opacity-40" />
                  <p className="text-xs">Sin clips generados</p>
                </div>
              )}
            </div>

            {/* Dialogo / Narracion */}
            <div className="rounded-xl border border-border bg-card p-4">
              <SectionLabel>Dialogo / Narracion</SectionLabel>
              <EditableText
                value={scene.dialogue ?? ''}
                onSave={saveField('dialogue')}
                as="textarea"
                placeholder="Texto de dialogo o narracion para voiceover..."
                className="text-sm"
              />
            </div>

            {/* ── Timeline breakdown ── */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desglose temporal</p>
                <button type="button" className="text-xs text-primary hover:text-primary/80">Generar con IA</button>
              </div>
              {timelineEntry ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{(timelineEntry as { description?: string }).description}</p>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic">Sin desglose temporal. Pulsa &quot;Generar con IA&quot; para crear uno.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
