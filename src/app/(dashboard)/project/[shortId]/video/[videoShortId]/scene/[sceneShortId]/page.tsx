'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useVideo } from '@/contexts/VideoContext';
import { fetchSceneDetail } from '@/lib/queries/scenes';
import { queryKeys } from '@/lib/query/keys';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import {
  ArrowLeft, Film, Camera, Sparkles, Eye, RefreshCw,
  Users, Image as ImageIcon, StickyNote, MessageSquare,
  Clock, Loader2, Save, ChevronDown, ChevronRight, MapPin,
  ChevronLeft, Download, ZoomIn, Play, Copy, Pencil, Bot,
} from 'lucide-react';
import { KButton } from '@/components/ui/kiyoko-button';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { CameraAngle, CameraMovement } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  prompt_ready: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  generating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  generated: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompt_ready: 'Prompt listo',
  generating: 'Generando',
  generated: 'Generado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
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

const ANNOTATION_SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  client: { label: 'Cliente', className: 'bg-blue-500/20 text-blue-400' },
  ai_suggested: { label: 'IA', className: 'bg-purple-500/20 text-purple-400' },
};

// ---------------------------------------------------------------------------
// Inline editable components
// ---------------------------------------------------------------------------

function EditableText({
  value,
  onSave,
  className,
  placeholder,
  as = 'input',
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
          'hover:bg-secondary transition-colors cursor-text',
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
      'w-full bg-secondary border border-border rounded-md px-2 py-1',
      'text-foreground outline-none focus:border-primary transition-colors',
      className,
    ),
  };

  if (as === 'textarea') {
    return <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={3} {...sharedProps} />;
  }
  return <input ref={ref as React.RefObject<HTMLInputElement>} type="text" {...sharedProps} />;
}

function EditableSelect({
  value,
  options,
  labels,
  onSave,
  placeholder,
}: {
  value: string | null;
  options: readonly string[];
  labels?: Record<string, string>;
  onSave: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onSave(e.target.value)}
      className={cn(
        'w-full h-9 bg-secondary border border-border rounded-md px-2 py-1.5',
        'text-foreground text-sm outline-none focus:border-primary transition-colors',
        'appearance-none cursor-pointer',
      )}
    >
      <option value="">{placeholder ?? 'Seleccionar...'}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {labels?.[opt] ?? opt}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      {children}
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {icon}
      {children}
    </h3>
  );
}

function Separator() {
  return <div className="border-t border-border my-4" />;
}

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

  const [promptHistoryOpen, setPromptHistoryOpen] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState<'image' | 'video'>('image');
  const [imageVersionIndex, setImageVersionIndex] = useState(0);
  const [imageHovered, setImageHovered] = useState(false);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.scenes.detail(sceneShortId),
    queryFn: () => fetchSceneDetail(supabase, sceneShortId),
    enabled: !!sceneShortId,
  });

  // ---- Mutations ----

  const updateScene = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error: err } = await supabase
        .from('scenes')
        .update(updates)
        .eq('id', data!.scene.id);
      if (err) throw err;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes.detail(sceneShortId) });
    },
  });

  const updateCamera = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (data?.camera) {
        const { error: err } = await supabase
          .from('scene_camera')
          .update(updates)
          .eq('id', data.camera.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('scene_camera')
          .insert({ scene_id: data!.scene.id, ...updates });
        if (err) throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes.detail(sceneShortId) });
    },
  });

  // ---- Helpers ----

  const saveSceneField = useCallback(
    (field: string) => (value: string) => {
      updateScene.mutate({ [field]: value || null });
    },
    [updateScene],
  );

  const saveCameraField = useCallback(
    (field: string) => (value: string) => {
      updateCamera.mutate({ [field]: value || null });
    },
    [updateCamera],
  );

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback ignored
    }
  }, []);

  // ---- Loading / error states ----

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
        <KButton variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reintentar
        </KButton>
      </div>
    );
  }

  const { scene, camera, media, clips, prompts, characters, backgrounds } = data;

  // Image version navigation
  const allImages = media.filter((m) => m.media_type === 'image' || m.file_url);
  const totalImageVersions = allImages.length;
  const safeImageIndex = Math.min(imageVersionIndex, totalImageVersions - 1);
  const currentImage = totalImageVersions > 0 ? allImages[Math.max(0, safeImageIndex)] : null;

  const currentPrompts = prompts.filter((p) => p.is_current);
  const imagePrompt = currentPrompts.find((p) => p.prompt_type === 'image');
  const videoPrompt = currentPrompts.find((p) => p.prompt_type === 'video');
  const activePrompt = activePromptTab === 'image' ? imagePrompt : videoPrompt;
  const historicalPrompts = prompts.filter((p) => !p.is_current);

  const backUrl = `/project/${shortId}/video/${videoShortId}`;

  const totalClipDuration = clips.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0);

  // ---- Render ----

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            href={backUrl}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Escenas</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-muted-foreground text-sm font-mono shrink-0">
              #{scene.scene_number}
            </span>
            {/* Inline editable title in top bar */}
            <EditableText
              value={scene.title}
              onSave={saveSceneField('title')}
              className="text-sm font-semibold truncate"
              placeholder="Titulo de la escena"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                STATUS_COLORS[scene.status] ?? STATUS_COLORS.draft,
              )}
            >
              {STATUS_LABELS[scene.status] ?? scene.status}
            </span>

            {(updateScene.isPending || updateCamera.isPending) && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ===================== LEFT COLUMN (60%) ===================== */}
          <div className="lg:col-span-3 space-y-4">
            {/* Scene Info */}
            <Card>
              <SectionLabel icon={<Film className="h-3.5 w-3.5" />}>Escena</SectionLabel>

              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Titulo</label>
                  <EditableText
                    value={scene.title}
                    onSave={saveSceneField('title')}
                    className="text-base font-semibold"
                    placeholder="Titulo de la escena"
                  />
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{scene.duration_seconds ?? '\u2014'}s</span>
                  <span className="text-border">|</span>
                  <span className="capitalize">{scene.scene_type}</span>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Descripcion</label>
                  <EditableText
                    value={scene.description ?? ''}
                    onSave={saveSceneField('description')}
                    as="textarea"
                    placeholder="Describe la escena..."
                    className="text-sm"
                  />
                </div>

                {/* Client annotation */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-[11px] text-muted-foreground">Anotacion del cliente</label>
                    {scene.annotation_source && ANNOTATION_SOURCE_BADGES[scene.annotation_source] && (
                      <span
                        className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                          ANNOTATION_SOURCE_BADGES[scene.annotation_source].className,
                        )}
                      >
                        {ANNOTATION_SOURCE_BADGES[scene.annotation_source].label}
                      </span>
                    )}
                  </div>
                  <EditableText
                    value={scene.client_annotation ?? ''}
                    onSave={saveSceneField('client_annotation')}
                    as="textarea"
                    placeholder="Sin anotacion..."
                    className="text-sm italic"
                  />
                </div>

                {/* Dialogue */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" />
                    Dialogo
                  </label>
                  <EditableText
                    value={scene.dialogue ?? ''}
                    onSave={saveSceneField('dialogue')}
                    as="textarea"
                    placeholder="Sin dialogo..."
                    className="text-sm"
                  />
                </div>

                {/* Director notes */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1.5">
                    <StickyNote className="h-3 w-3" />
                    Notas del director
                  </label>
                  <EditableText
                    value={scene.director_notes ?? ''}
                    onSave={saveSceneField('director_notes')}
                    as="textarea"
                    placeholder="Escribe notas para el director..."
                    className="text-sm"
                  />
                </div>
              </div>
            </Card>

            {/* Image Preview */}
            <Card>
              <SectionLabel icon={<ImageIcon className="h-3.5 w-3.5" />}>Imagen generada</SectionLabel>

              {currentImage?.file_url ? (
                <>
                  <div
                    className="relative rounded-lg overflow-hidden bg-background border border-border"
                    onMouseEnter={() => setImageHovered(true)}
                    onMouseLeave={() => setImageHovered(false)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentImage.file_url}
                      alt={`Escena ${scene.scene_number}`}
                      className="w-full h-auto object-contain max-h-80"
                    />
                    {/* Version + generator badges */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <span className="bg-black/70 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded">
                        v{currentImage.version ?? 1}
                      </span>
                      {currentImage.generator && (
                        <span className="bg-black/70 text-[10px] text-purple-400 px-1.5 py-0.5 rounded">
                          {currentImage.generator}
                        </span>
                      )}
                    </div>

                    {/* Hover overlay with action buttons */}
                    {imageHovered && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-opacity">
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                          title="Ver en grande"
                        >
                          <ZoomIn className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                          title="Descargar"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                          title="Regenerar"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Version navigation */}
                  {totalImageVersions > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <button
                        type="button"
                        disabled={safeImageIndex <= 0}
                        onClick={() => setImageVersionIndex((i) => Math.max(0, i - 1))}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        v{safeImageIndex}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        v{safeImageIndex + 1} de {totalImageVersions}
                      </span>
                      <button
                        type="button"
                        disabled={safeImageIndex >= totalImageVersions - 1}
                        onClick={() => setImageVersionIndex((i) => Math.min(totalImageVersions - 1, i + 1))}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        v{safeImageIndex + 2}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-dashed border-border bg-background text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">Sin imagen generada</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4">
                <KButton
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Regenerar imagen
                </KButton>
              </div>
            </Card>

            {/* Clips de video */}
            <Card>
              <SectionLabel icon={<Film className="h-3.5 w-3.5" />}>Clips de video</SectionLabel>

              {clips.length > 0 ? (
                <>
                  {/* Clip player placeholder */}
                  <div className="aspect-video rounded-lg bg-black flex items-center justify-center mb-3 border border-border">
                    <Play className="h-10 w-10 text-white/40" />
                  </div>

                  {/* Clip blocks */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="text-[11px] text-muted-foreground mr-1">Clips:</span>
                    {clips.map((clip) => {
                      const isBase = clip.clip_type === 'base';
                      const isPlaying = playingClipId === clip.id;
                      return (
                        <button
                          key={clip.id}
                          type="button"
                          onClick={() => setPlayingClipId(isPlaying ? null : clip.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium border transition-colors',
                            isBase
                              ? 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                              : 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30',
                          )}
                        >
                          <span className="font-bold">{isBase ? '\u25A0 Base' : `\u25A0 Ext${clip.extension_number ?? ''}`}</span>
                          <span>{clip.duration_seconds}s</span>
                          {isPlaying && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total: {totalClipDuration}s</span>
                    <div className="flex items-center gap-2">
                      <KButton variant="outline" size="sm" icon={<Play className="h-3.5 w-3.5" />}>
                        Reproducir todo
                      </KButton>
                      <KButton variant="outline" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />}>
                        Regenerar clips
                      </KButton>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 rounded-lg border border-dashed border-border bg-background text-muted-foreground">
                  <Film className="h-6 w-6 mb-2 opacity-40" />
                  <p className="text-xs">Sin clips generados</p>
                </div>
              )}
            </Card>
          </div>

          {/* ===================== RIGHT COLUMN (40%) ===================== */}
          <div className="lg:col-span-2 space-y-4">
            {/* Camera config */}
            <Card>
              <SectionLabel icon={<Camera className="h-3.5 w-3.5" />}>Camara</SectionLabel>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Angulo</label>
                  <EditableSelect
                    value={camera?.camera_angle ?? null}
                    options={CAMERA_ANGLES}
                    labels={ANGLE_LABELS}
                    onSave={saveCameraField('camera_angle')}
                    placeholder="Angulo..."
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Movimiento</label>
                  <EditableSelect
                    value={camera?.camera_movement ?? null}
                    options={CAMERA_MOVEMENTS}
                    labels={MOVEMENT_LABELS}
                    onSave={saveCameraField('camera_movement')}
                    placeholder="Movimiento..."
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Notas de camara</label>
                  <EditableText
                    value={camera?.camera_notes ?? ''}
                    onSave={saveCameraField('camera_notes')}
                    placeholder="Notas adicionales..."
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Iluminacion</label>
                  <EditableText
                    value={camera?.lighting ?? ''}
                    onSave={saveCameraField('lighting')}
                    placeholder="Natural, dramatica..."
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Mood</label>
                  <EditableText
                    value={camera?.mood ?? ''}
                    onSave={saveCameraField('mood')}
                    placeholder="Tension, alegria..."
                    className="text-sm"
                  />
                </div>
              </div>

              {/* AI reasoning */}
              {camera?.ai_reasoning && (
                <>
                  <Separator />
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      IA reasoning
                    </label>
                    <p className="text-xs italic text-muted-foreground leading-relaxed">
                      {camera.ai_reasoning}
                    </p>
                  </div>
                </>
              )}
            </Card>

            {/* Prompts with tabs */}
            <Card>
              <SectionLabel icon={<Sparkles className="h-3.5 w-3.5" />}>Prompts</SectionLabel>

              {/* Tab switcher */}
              <div className="flex items-center gap-4 mb-4 border-b border-border">
                <button
                  type="button"
                  onClick={() => setActivePromptTab('image')}
                  className={cn(
                    'pb-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activePromptTab === 'image'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Imagen
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePromptTab('video')}
                  className={cn(
                    'pb-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activePromptTab === 'video'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5" />
                    Video
                  </span>
                </button>
              </div>

              {/* Active prompt display */}
              {activePrompt ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-primary font-medium">v{activePrompt.version ?? 1}</span>
                    {activePrompt.generator && (
                      <span className="text-[10px] text-purple-400">{activePrompt.generator}</span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground bg-secondary border border-border rounded-lg p-3 max-h-40 overflow-y-auto leading-relaxed">
                    {activePrompt.prompt_text}
                  </div>

                  {/* Action buttons under prompt */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Bot className="h-3 w-3" />
                      IA
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activePrompt.prompt_text ?? '')}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      Copiar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Sin prompt de {activePromptTab === 'image' ? 'imagen' : 'video'} generado
                </p>
              )}

              {/* Prompt history */}
              {historicalPrompts.length > 0 && (
                <>
                  <Separator />
                  <button
                    type="button"
                    onClick={() => setPromptHistoryOpen(!promptHistoryOpen)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {promptHistoryOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    Historial de prompts ({historicalPrompts.length})
                  </button>

                  {promptHistoryOpen && (
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {historicalPrompts.map((p) => (
                        <div
                          key={p.id}
                          className="text-xs bg-background rounded-md p-2 border border-border"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-muted-foreground capitalize">{p.prompt_type}</span>
                            <span className="text-muted-foreground">v{p.version ?? 1}</span>
                            {p.generator && (
                              <span className="text-purple-400">{p.generator}</span>
                            )}
                            {p.created_at && (
                              <span className="text-[#52525B] ml-auto">
                                {new Date(p.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground line-clamp-3 leading-relaxed font-mono">
                            {p.prompt_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Characters */}
            <Card>
              <SectionLabel icon={<Users className="h-3.5 w-3.5" />}>
                Personajes
              </SectionLabel>

              {characters.length > 0 ? (
                <div className="space-y-2">
                  {characters.map((sc) => {
                    const char = sc.characters as { name: string; initials: string; color_accent: string | null; reference_image_url: string | null } | null;
                    if (!char) return null;
                    return (
                      <div
                        key={sc.id}
                        className="flex items-center gap-2.5 bg-background border border-border rounded-lg px-3 py-2"
                      >
                        {char.reference_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={char.reference_image_url}
                            alt={char.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{
                              backgroundColor: `${char.color_accent ?? '#71717A'}20`,
                              color: char.color_accent ?? '#71717A',
                            }}
                          >
                            {char.initials}
                          </div>
                        )}
                        <span className="text-sm font-medium">{char.name}</span>
                        {sc.role_in_scene && (
                          <span className="text-[10px] text-muted-foreground ml-auto">({sc.role_in_scene})</span>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                  >
                    <Users className="h-3 w-3" />
                    + Anadir personaje
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground italic mb-2">Sin personajes asignados</p>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Users className="h-3 w-3" />
                    + Anadir personaje
                  </button>
                </div>
              )}
            </Card>

            {/* Backgrounds */}
            <Card>
              <SectionLabel icon={<MapPin className="h-3.5 w-3.5" />}>
                Fondos
              </SectionLabel>

              {backgrounds.length > 0 ? (
                <div className="space-y-2">
                  {backgrounds.map((sb) => {
                    const bg = sb.backgrounds as { name: string; reference_image_url: string | null; code: string } | null;
                    if (!bg) return null;
                    return (
                      <div
                        key={sb.id}
                        className="flex items-center gap-2.5 bg-background border border-border rounded-lg px-3 py-2"
                      >
                        {bg.reference_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={bg.reference_image_url}
                            alt={bg.name}
                            className="h-6 w-6 rounded object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm">{bg.name}</span>
                        {sb.is_primary && (
                          <span className="text-[10px] text-primary ml-auto">Principal</span>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                  >
                    <MapPin className="h-3 w-3" />
                    + Anadir fondo
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground italic mb-2">Sin fondos asignados</p>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MapPin className="h-3 w-3" />
                    + Anadir fondo
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
