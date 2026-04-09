'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import { generateShortId } from '@/lib/utils/nanoid';

import { ArcBar } from '@/components/video/ArcBar';
import { SceneGeneratorModal } from '@/components/modals/scene/SceneGeneratorModal';
// SceneWorkModal replaces both SceneCreateModal and SceneEditorModal
import { toast } from '@/components/ui/toast';
import {
  Film, Clock, Monitor, Mic, FileOutput, Music, Image as ImageIcon,
  Video, Loader2, BarChart3, Layers, CheckCircle2, Target,
  Settings2, Copy, Sparkles, ExternalLink, MoreHorizontal,
  Eye, Pencil, Camera, Plus, Trash2, ArrowRight, Clock3, GripVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { VIDEO_STATUS_LABELS, VIDEO_STATUS_BADGE, SCENE_STATUS_DOT, PHASE_STYLES } from '@/lib/constants/status';

/* ── Expandable prompt text ────────────────────────────── */
import { ExpandablePrompt } from '@/components/shared/ExpandablePrompt';
import { useState } from 'react';
import { SceneWorkModal } from '@/components/modals';
import type { NarrativeArc, Scene, ScenePrompt, SceneMedia, Character, Background } from '@/types';

/* ------------------------------------------------------------------ */
/*  Stat                                                               */
/* ------------------------------------------------------------------ */
function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-lg bg-muted/60',
          tone || 'text-muted-foreground',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status / Phase helpers                                             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Audio config type                                                  */
/* ------------------------------------------------------------------ */
interface AudioConfig {
  music: boolean;
  dialogue: boolean;
  sfx: boolean;
  voiceover: boolean;
}

/* ------------------------------------------------------------------ */
/*  Scene character / background / clip types                          */
/* ------------------------------------------------------------------ */
interface SceneCharacterWithChar {
  scene_id: string;
  character_id: string;
  role_in_scene: string | null;
  character: {
    id: string;
    name: string;
    initials: string | null;
    color_accent: string | null;
    reference_image_url: string | null;
  };
}

interface SceneBackgroundWithBg {
  scene_id: string;
  background_id: string;
  is_primary: boolean | null;
  background: {
    id: string;
    name: string;
    reference_image_url: string | null;
    location_type: string | null;
  };
}

interface SceneClipRow {
  scene_id: string;
  clip_type: string | null;
  duration_seconds: number | null;
}

interface TimelineEntryRow {
  scene_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  duration_seconds: number | null;
}

/* ------------------------------------------------------------------ */
/*  View mode                                                          */
/* ------------------------------------------------------------------ */
type ViewMode = 'storyboard' | 'compact' | 'timeline';

/* ------------------------------------------------------------------ */
/*  Quick links                                                        */
/* ------------------------------------------------------------------ */
const QUICK_LINKS = [
  { label: 'Timeline', href: '/timeline', icon: Layers },
  { label: 'Narracion', href: '/narration', icon: Mic },
  { label: 'Analisis', href: '/analysis', icon: BarChart3 },
  { label: 'Exportar', href: '/export', icon: FileOutput },
] as const;

/* ------------------------------------------------------------------ */
/*  Clipboard helper                                                   */
/* ------------------------------------------------------------------ */
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copiado`);
}

/* ------------------------------------------------------------------ */
/*  SceneCamera type (from scene_camera table)                         */
/* ------------------------------------------------------------------ */
interface SceneCamera {
  scene_id: string;
  camera_angle: string | null;
  camera_movement: string | null;
}

/* ------------------------------------------------------------------ */
/*  Storyboard scene card                                              */
/* ------------------------------------------------------------------ */
function StoryboardCard({
  scene,
  basePath,
  imagePrompt,
  videoPrompt,
  thumbnail,
  camera,
  chars,
  bgs,
  clips,
  timelineEntry,
  onGeneratePrompts,
  onEditScene,
  onReorderScene,
  onDuplicate,
  onDelete,
  onInsertBefore,
  isGenerating,
}: {
  scene: Scene;
  basePath: string;
  imagePrompt: ScenePrompt | undefined;
  videoPrompt: ScenePrompt | undefined;
  thumbnail: SceneMedia | undefined;
  camera: SceneCamera | undefined;
  chars: SceneCharacterWithChar[];
  bgs: SceneBackgroundWithBg[];
  clips: SceneClipRow[];
  timelineEntry: TimelineEntryRow | undefined;
  onGeneratePrompts: () => void;
  onEditScene: () => void;
  onReorderScene: (draggedId: string, targetId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInsertBefore: () => void;
  isGenerating: boolean;
}) {
  const sceneLink = scene.short_id
    ? `${basePath}/scene/${scene.short_id}`
    : `${basePath}`;

  const audio: AudioConfig = { music: false, dialogue: false, sfx: false, voiceover: false, ...(scene.audio_config as Partial<AudioConfig> | null) };
  const audioTags: string[] = [];
  if (audio.music) audioTags.push('Musica');
  if (audio.sfx) audioTags.push('SFX');
  if (audio.voiceover) audioTags.push('Voz');
  if (audio.dialogue) audioTags.push('Dialogo');

  const thumbUrl = thumbnail?.thumbnail_url ?? thumbnail?.file_url;

  return (
    <div
      className="group rounded-xl border border-border bg-card p-4 space-y-3 transition-colors hover:border-primary/20 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('sceneId', scene.id)}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
      onDragLeave={(e) => e.currentTarget.classList.remove('border-primary')}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary');
        const draggedId = e.dataTransfer.getData('sceneId');
        if (draggedId && draggedId !== scene.id) {
          onReorderScene(draggedId, scene.id);
        }
      }}
    >
      {/* ── Top row: number, title, phase, duration, status ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab shrink-0" />
          <span className="shrink-0 text-sm font-bold text-muted-foreground">#{scene.scene_number}</span>
          <h4 className="text-sm font-medium text-foreground truncate">{scene.title}</h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {scene.arc_phase && (
            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', PHASE_STYLES[scene.arc_phase] ?? 'bg-zinc-500/80 text-white')}>
              {scene.arc_phase}
            </span>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">{scene.duration_seconds ?? 5}s</span>
          <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', SCENE_STATUS_DOT[scene.status ?? 'draft'])} />
        </div>
      </div>

      {/* ── Middle: thumbnail + metadata ── */}
      <div className="flex gap-4">
        {/* Thumbnail */}
        <Link href={sceneLink} className="shrink-0">
          <div className="relative h-[75px] w-[100px] rounded-lg bg-background border border-border overflow-hidden flex items-center justify-center">
            {thumbUrl ? (
              <Image src={thumbUrl} alt={scene.title} fill className="object-cover" sizes="100px" />
            ) : (
              <Film className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>
        </Link>

        {/* Metadata */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Description */}
          {scene.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{scene.description}</p>
          )}

          {/* Camera */}
          {camera && (camera.camera_angle || camera.camera_movement) && (
            <p className="text-xs text-muted-foreground">
              <Camera className="inline h-3 w-3 mr-1 opacity-60" />
              {[camera.camera_angle, camera.camera_movement].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Audio */}
          {audioTags.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <Music className="inline h-3 w-3 mr-1 opacity-60" />
              {audioTags.join(' · ')}
            </p>
          )}

          {/* Director notes */}
          {scene.director_notes && (
            <p className="text-xs text-muted-foreground/70 line-clamp-1 italic">{scene.director_notes}</p>
          )}

          {/* Characters */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground mr-1">Personajes:</span>
            {chars.length === 0 ? (
              <span className="text-[10px] text-muted-foreground/50">&mdash;</span>
            ) : (
              chars.map((c) => {
                const char = c.character;
                return char.reference_image_url ? (
                  <img
                    key={c.character_id}
                    src={char.reference_image_url}
                    alt={char.name}
                    title={char.name}
                    className="size-5 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div
                    key={c.character_id}
                    title={char.name}
                    className="flex size-5 items-center justify-center rounded-full text-[7px] font-bold text-white"
                    style={{ backgroundColor: char.color_accent ?? '#6B7280' }}
                  >
                    {(char.initials || char.name?.slice(0, 2) || '?').toUpperCase()}
                  </div>
                );
              })
            )}
          </div>

          {/* Background */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Fondo:</span>
            {bgs.length === 0 ? (
              <span className="text-[10px] text-muted-foreground/50">&mdash;</span>
            ) : (
              bgs.map((b) => {
                const bg = b.background;
                return (
                  <div key={b.background_id} className="flex items-center gap-1">
                    {bg.reference_image_url && (
                      <img
                        src={bg.reference_image_url}
                        alt={bg.name}
                        className="h-5 w-8 rounded object-cover border border-border"
                      />
                    )}
                    <span className="text-[10px] text-muted-foreground">{bg.name}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Clips count */}
          {clips.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Film className="size-3" />
              {clips.filter((c) => c.clip_type === 'base').length} base
              {clips.filter((c) => c.clip_type === 'extension').length > 0 && (
                <span className="text-purple-400">
                  + {clips.filter((c) => c.clip_type === 'extension').length} ext
                </span>
              )}
            </div>
          )}

          {/* Continuation indicator */}
          {scene.continuation_of_scene_id && (
            <div className="flex items-center gap-1.5 text-[10px] text-sky-400">
              <ArrowRight className="size-3" />
              <span>Continua escena anterior</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Prompts ── */}
      <div className="space-y-1.5">
        {/* Image prompt */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <ImageIcon className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-[10px] font-medium text-muted-foreground w-10">Imagen</span>
          </div>
          <ExpandablePrompt text={imagePrompt?.prompt_text} fallback="Sin prompt" />
          <div className="flex items-center gap-1 shrink-0">
            {imagePrompt && (
              <button type="button" onClick={() => copyToClipboard(imagePrompt.prompt_text, 'Prompt de imagen')} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Copiar">
                <Copy className="h-3 w-3" />
              </button>
            )}
            <button type="button" disabled={isGenerating} onClick={onGeneratePrompts} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50" title="Generar con IA">
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Video prompt */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Video className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-[10px] font-medium text-muted-foreground w-10">Video</span>
          </div>
          <ExpandablePrompt text={videoPrompt?.prompt_text} fallback="Sin prompt" />
          <div className="flex items-center gap-1 shrink-0">
            {videoPrompt && (
              <button type="button" onClick={() => copyToClipboard(videoPrompt.prompt_text, 'Prompt de video')} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Copiar">
                <Copy className="h-3 w-3" />
              </button>
            )}
            <button type="button" disabled={isGenerating} onClick={onGeneratePrompts} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50" title="Generar con IA"
            >
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Timeline entry (second-by-second) ── */}
      {timelineEntry?.description && (
        <div className="rounded-lg bg-background/50 border border-border/30 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock3 className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-[10px] font-medium text-muted-foreground">Desglose temporal</span>
            <span className="text-[10px] text-muted-foreground/50">{timelineEntry.start_time} – {timelineEntry.end_time}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{timelineEntry.description}</p>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
        <Link
          href={sceneLink}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <ExternalLink className="h-3 w-3" />
          Abrir
        </Link>

        <button
          type="button"
          disabled={isGenerating}
          onClick={onGeneratePrompts}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Generar prompts
        </button>

        {(imagePrompt || videoPrompt) && (
          <button
            type="button"
            onClick={() => {
              const parts: string[] = [];
              if (imagePrompt) parts.push(imagePrompt.prompt_text);
              if (videoPrompt) parts.push(videoPrompt.prompt_text);
              copyToClipboard(parts.join('\n\n'), 'Prompts');
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Copy className="h-3 w-3" />
            Copiar todo
          </button>
        )}

        <button
          type="button"
          onClick={onEditScene}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
          title="Editar con IA"
        >
          <Sparkles className="h-3 w-3" />
          Editar con IA
        </button>

        {/* Dropdown menu */}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={sceneLink}>
                  <Eye className="h-4 w-4" />
                  Ver detalle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEditScene}>
                <Pencil className="h-4 w-4" />
                Editar escena
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onGeneratePrompts} disabled={isGenerating}>
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'Generando...' : 'Regenerar prompts'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
                Duplicar escena
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onInsertBefore}>
                <Plus className="h-4 w-4" />
                Insertar antes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" />
                Eliminar escena
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */
export default function VideoOverviewPage() {
  const { project } = useProject();
  const { video, loading, scenes, scenesLoading } = useVideo();
  const openVideoSettingsModal = useUIStore((s) => s.openVideoSettingsModal);
  const queryClient = useQueryClient();

  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('storyboard');
  const [showCreateScene, setShowCreateScene] = useState(false);
  const [showSceneGenerator, setShowSceneGenerator] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [aiDescription, setAiDescription] = useState('');
  const [sceneFilter, setSceneFilter] = useState<'all' | string>('all');

  async function handleGeneratePrompts(sceneId: string) {
    setGeneratingSceneId(sceneId);
    try {
      const res = await fetch('/api/ai/generate-scene-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Prompts generados');
      queryClient.invalidateQueries({ queryKey: ['scene-prompts', video?.id] });
    } catch {
      toast.error('Error al generar prompts');
    } finally {
      setGeneratingSceneId(null);
    }
  }

  async function handleGenerateAll() {
    setGeneratingAll(true);
    toast.ai(`Generando prompts con IA (${scenes.length} escenas)...`, { id: 'gen-all' });
    try {
      // Generate in batches of 3 for balance between speed and rate limits
      const batchSize = 3;
      let completed = 0;
      for (let i = 0; i < scenes.length; i += batchSize) {
        const batch = scenes.slice(i, i + batchSize);
        await Promise.all(batch.map(async (scene) => {
          try {
            const res = await fetch('/api/ai/generate-scene-prompts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sceneId: scene.id }),
            });
            if (res.ok) completed++;
          } catch { /* skip failed scene */ }
        }));
      }
      queryClient.invalidateQueries({ queryKey: ['scene-prompts', video?.id] });
      toast.success(`${completed}/${scenes.length} prompts generados`, { id: 'gen-all' });
    } catch {
      toast.error('Error al generar prompts', { id: 'gen-all' });
    } finally {
      setGeneratingAll(false);
    }
  }

  async function handleReorderScene(draggedId: string, targetId: string) {
    const dragIdx = scenes.findIndex((s) => s.id === draggedId);
    const targetIdx = scenes.findIndex((s) => s.id === targetId);
    if (dragIdx === -1 || targetIdx === -1) return;

    const reordered = [...scenes];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    const supabase = createClient();
    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from('scenes')
        .update({ sort_order: i, scene_number: i + 1 })
        .eq('id', reordered[i].id);
    }

    toast.success('Escenas reordenadas');
    queryClient.invalidateQueries({ queryKey: ['video'] });
  }

  /* ── Scene actions: duplicate, delete, insert before ──── */

  async function handleDuplicateScene(sceneId: string) {
    const original = scenes.find(s => s.id === sceneId);
    if (!original) return;
    const supabase = createClient();
    const num = (original.scene_number ?? scenes.length) + 1;
    const { error } = await supabase.from('scenes').insert({
      video_id: video!.id, project_id: project!.id,
      title: `${original.title} (copia)`,
      description: original.description,
      duration_seconds: original.duration_seconds,
      arc_phase: original.arc_phase,
      scene_number: num, sort_order: num,
      short_id: generateShortId(),
      status: 'draft', scene_type: 'original',
      dialogue: original.dialogue,
      director_notes: original.director_notes,
    });
    if (error) { toast.error('Error al duplicar'); return; }
    toast.success('Escena duplicada');
    queryClient.invalidateQueries({ queryKey: ['video'] });
  }

  async function handleDeleteScene(sceneId: string) {
    const sceneToDelete = scenes.find(s => s.id === sceneId);
    if (!sceneToDelete) return;
    if (!confirm(`¿Eliminar "${sceneToDelete.title}"? Esta accion no se puede deshacer.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('scenes').delete().eq('id', sceneId);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Escena eliminada');
    queryClient.invalidateQueries({ queryKey: ['video'] });
    queryClient.invalidateQueries({ queryKey: ['scenes'] });
  }

  function handleInsertBefore(sceneIndex: number) {
    setInsertAtPosition(sceneIndex > 0 ? sceneIndex - 1 : 0);
    setShowCreateScene(true);
  }

  const [insertAtPosition, setInsertAtPosition] = useState<number | null>(null);

  // Fetch narrative arcs
  const { data: arcs = [] } = useQuery({
    queryKey: ['narrative-arcs', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('narrative_arcs')
        .select('*')
        .eq('video_id', video!.id)
        .order('sort_order');
      return (data ?? []) as NarrativeArc[];
    },
    enabled: !!video?.id,
  });

  // Fetch scene prompts (current versions)
  const { data: scenePrompts = [] } = useQuery({
    queryKey: ['scene-prompts', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const sceneIds = scenes.map((s) => s.id);
      if (sceneIds.length === 0) return [];
      const { data } = await supabase
        .from('scene_prompts')
        .select('*')
        .in('scene_id', sceneIds)
        .eq('is_current', true);
      return (data ?? []) as ScenePrompt[];
    },
    enabled: !!video?.id && scenes.length > 0,
  });

  // Fetch scene media (most recent first)
  const { data: sceneMedia = [] } = useQuery({
    queryKey: ['scene-media', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const sceneIds = scenes.map((s) => s.id);
      if (sceneIds.length === 0) return [];
      const { data } = await supabase
        .from('scene_media')
        .select('*')
        .in('scene_id', sceneIds)
        .order('created_at', { ascending: false });
      return (data ?? []) as SceneMedia[];
    },
    enabled: !!video?.id && scenes.length > 0,
  });

  // Fetch scene cameras
  const { data: sceneCameras = [] } = useQuery({
    queryKey: ['scene-cameras', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const sceneIds = scenes.map((s) => s.id);
      if (sceneIds.length === 0) return [];
      const { data } = await supabase
        .from('scene_camera')
        .select('scene_id, camera_angle, camera_movement')
        .in('scene_id', sceneIds);
      return (data ?? []) as SceneCamera[];
    },
    enabled: !!video?.id && scenes.length > 0,
  });

  // Fetch scene characters with character data
  const { data: sceneCharacters = [] } = useQuery({
    queryKey: ['scene-characters', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const sceneIds = scenes.map((s) => s.id);
      if (!sceneIds.length) return [];
      const { data } = await supabase
        .from('scene_characters')
        .select('scene_id, character_id, role_in_scene, character:characters!character_id(id, name, initials, color_accent, reference_image_url)')
        .in('scene_id', sceneIds);
      return (data ?? []) as unknown as SceneCharacterWithChar[];
    },
    enabled: !!video?.id && scenes.length > 0,
  });

  // Fetch scene backgrounds with background data
  const { data: sceneBackgrounds = [] } = useQuery({
    queryKey: ['scene-backgrounds', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const sceneIds = scenes.map((s) => s.id);
      if (!sceneIds.length) return [];
      const { data } = await supabase
        .from('scene_backgrounds')
        .select('scene_id, background_id, is_primary, background:backgrounds!background_id(id, name, reference_image_url, location_type)')
        .in('scene_id', sceneIds);
      return (data ?? []) as unknown as SceneBackgroundWithBg[];
    },
    enabled: !!video?.id && scenes.length > 0,
  });

  // Fetch scene video clips
  const { data: sceneClips = [] } = useQuery({
    queryKey: ['scene-clips', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const sceneIds = scenes.map((s) => s.id);
      if (!sceneIds.length) return [];
      const { data } = await supabase
        .from('scene_video_clips')
        .select('scene_id, clip_type, duration_seconds')
        .in('scene_id', sceneIds);
      return (data ?? []) as SceneClipRow[];
    },
    enabled: !!video?.id && scenes.length > 0,
  });

  // Timeline entries (second-by-second breakdown)
  const { data: timelineEntries = [] } = useQuery({
    queryKey: ['timeline-entries', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('timeline_entries')
        .select('scene_id, title, description, start_time, end_time, duration_seconds')
        .eq('video_id', video!.id)
        .order('sort_order');
      return (data ?? []) as TimelineEntryRow[];
    },
    enabled: !!video?.id,
  });

  // Project-level characters and backgrounds (for SceneWorkModal pickers)
  const { data: projectCharacters = [] } = useQuery({
    queryKey: ['characters', project?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('characters').select('*').eq('project_id', project!.id).order('sort_order');
      return (data ?? []) as Character[];
    },
    enabled: !!project?.id,
  });

  const { data: projectBackgrounds = [] } = useQuery({
    queryKey: ['backgrounds', project?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('backgrounds').select('*').eq('project_id', project!.id).order('sort_order');
      return (data ?? []) as Background[];
    },
    enabled: !!project?.id,
  });

  function handleEditSceneWithAI(scene: Scene) {
    setEditingScene(scene);
  }

  /* Copy all prompts in order */
  function copyAllPrompts() {
    const imageLines: string[] = [];
    const videoLines: string[] = [];

    scenes.forEach((scene) => {
      const ip = scenePrompts.find((p) => p.scene_id === scene.id && p.prompt_type === 'image');
      const vp = scenePrompts.find((p) => p.scene_id === scene.id && p.prompt_type === 'video');
      imageLines.push(`#${scene.scene_number}: ${ip?.prompt_text ?? '(sin prompt)'}`);
      videoLines.push(`#${scene.scene_number}: ${vp?.prompt_text ?? '(sin prompt)'}`);
    });

    const text = `=== PROMPTS DE IMAGEN ===\n${imageLines.join('\n')}\n\n=== PROMPTS DE VIDEO ===\n${videoLines.join('\n')}`;
    copyToClipboard(text, 'Todos los prompts');
  }

  /** Copy all prompts formatted for Grok Imagine (ready to paste) */
  function copyForGrok() {
    const blocks: string[] = [];

    scenes.forEach((scene) => {
      const ip = scenePrompts.find((p) => p.scene_id === scene.id && p.prompt_type === 'image');
      const vp = scenePrompts.find((p) => p.scene_id === scene.id && p.prompt_type === 'video');
      if (!ip && !vp) return;

      blocks.push(`━━━ ESCENA #${scene.scene_number}: ${scene.title} (${scene.duration_seconds ?? 5}s) ━━━`);
      if (ip?.prompt_text) {
        blocks.push(`\n📸 IMAGEN:\n${ip.prompt_text}`);
      }
      if (vp?.prompt_text) {
        blocks.push(`\n🎬 VIDEO:\n${vp.prompt_text}`);
      }
      blocks.push('');
    });

    if (blocks.length === 0) { toast.info('No hay prompts para copiar'); return; }
    const text = `🎬 ${video!.title} — Prompts para Grok Imagine\n${scenes.length} escenas · ${video!.platform ?? 'video'}\n\n${blocks.join('\n')}`;
    copyToClipboard(text, 'Prompts formateados para Grok');
  }

  const filteredScenes = sceneFilter === 'all' ? scenes : scenes.filter(s => s.status === sceneFilter);

  /* Loading */
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* Not found */
  if (!video || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Video className="h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Video no encontrado</h3>
        <Link href={`/project/${project?.short_id ?? ''}`} className="mt-3 text-sm text-primary hover:underline">
          Volver al proyecto
        </Link>
      </div>
    );
  }

  const basePath = `/project/${project.short_id}/video/${video.short_id}`;
  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const approvedScenes = scenes.filter((s) => s.status === 'approved').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{video.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{video.platform}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {video.target_duration_seconds}s
            </span>
            {video.aspect_ratio && (
              <span className="flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5" />
                {video.aspect_ratio}
              </span>
            )}
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                VIDEO_STATUS_BADGE[video.status] ?? 'bg-zinc-500/20 text-muted-foreground border-zinc-500/20',
              )}
            >
              {VIDEO_STATUS_LABELS[video.status] ?? video.status}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openVideoSettingsModal('general')}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          Ajustes
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Film} label="Escenas" value={scenesLoading ? '...' : scenes.length} />
        <Stat icon={CheckCircle2} label="Aprobadas" value={scenesLoading ? '...' : approvedScenes} tone="text-emerald-500" />
        <Stat icon={Target} label="Duracion objetivo" value={`${video.target_duration_seconds}s`} />
        <Stat icon={Clock} label="Duracion actual" value={scenesLoading ? '...' : `${totalDuration}s`} />
      </div>

      {/* ── Narrative arc bar ───────────────────────────────── */}
      {arcs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arco narrativo</p>
          <ArcBar arcs={arcs} totalDuration={totalDuration || video.target_duration_seconds || 60} className="h-3" />
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {arcs.map((arc) => {
              const duration = (arc.end_second ?? 0) - (arc.start_second ?? 0);
              return (
                <span key={arc.id} className="flex items-center gap-1">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      arc.phase === 'hook' ? 'bg-red-500' :
                      arc.phase === 'build' ? 'bg-amber-500' :
                      arc.phase === 'peak' ? 'bg-emerald-500' :
                      arc.phase === 'close' ? 'bg-blue-500' : 'bg-zinc-500',
                    )}
                  />
                  {arc.title} ({duration}s)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Scenes section ────────────────────────────────── */}
      <div className="space-y-3">
        {/* Header row: title + tabs + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Escenas
          </p>

          {/* View mode tabs */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              {(['storyboard', 'compact', 'timeline'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    viewMode === mode
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {mode === 'storyboard' ? 'Storyboard' : mode === 'compact' ? 'Compacto' : 'Timeline'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCreateScene(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-3.5" />
              Nueva escena
            </button>

          </div>
        </div>

        {/* Scene filters */}
        {scenes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'draft', 'prompt_ready', 'generated', 'approved'] as const).map(f => {
              const count = f === 'all' ? scenes.length : scenes.filter(s => s.status === f).length;
              if (f !== 'all' && count === 0) return null;
              const labels: Record<string, string> = { all: 'Todas', draft: 'Borrador', prompt_ready: 'Con prompt', generated: 'Generadas', approved: 'Aprobadas' };
              return (
                <button key={f} type="button" onClick={() => setSceneFilter(f)}
                  className={cn('rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
                    sceneFilter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
                  {labels[f]} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {scenesLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : scenes.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <h4 className="text-lg font-semibold text-foreground">Vamos a crear tu storyboard!</h4>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Describe que quieres en tu video y Kiyoko generara las escenas automaticamente con arco narrativo, camara, y prompts listos para copiar.
              </p>
            </div>

            <textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Describe tu video: ej. Anuncio de 60s para peluqueria mostrando los 4 profesionales, con gancho inicial, servicios destacados y call-to-action final..."
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10 resize-y placeholder:text-muted-foreground/50"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSceneGenerator(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Generar escenas con IA
              </button>
              <button
                type="button"
                onClick={() => setShowCreateScene(true)}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                Crear manualmente
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">O elige una opcion rapida:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Anuncio 30s', text: 'Crea un anuncio de 30 segundos con gancho inicial, presentacion del producto, y call-to-action final.' },
                  { label: 'Reel 15s', text: 'Crea un reel vertical de 15 segundos con transiciones rapidas y texto overlay.' },
                  { label: 'Presentacion 60s', text: 'Crea una presentacion de 60 segundos mostrando el equipo, servicios, y resultados.' },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setAiDescription(option.text)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                      aiDescription === option.text
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'storyboard' ? (
          /* ── Storyboard view ── */
          <div className="space-y-3">
            {filteredScenes.map((scene, sceneIndex) => {
              const imagePrompt = scenePrompts.find((p) => p.scene_id === scene.id && p.prompt_type === 'image');
              const videoPrompt = scenePrompts.find((p) => p.scene_id === scene.id && p.prompt_type === 'video');
              const thumbnail = sceneMedia.find((m) => m.scene_id === scene.id);
              const camera = sceneCameras.find((c) => c.scene_id === scene.id);
              const chars = sceneCharacters.filter((c) => c.scene_id === scene.id);
              const bgList = sceneBackgrounds.filter((b) => b.scene_id === scene.id);
              const clipList = sceneClips.filter((c) => c.scene_id === scene.id);

              return (
                <StoryboardCard
                  key={scene.id}
                  scene={scene}
                  basePath={basePath}
                  imagePrompt={imagePrompt}
                  videoPrompt={videoPrompt}
                  thumbnail={thumbnail}
                  camera={camera}
                  chars={chars}
                  bgs={bgList}
                  clips={clipList}
                  timelineEntry={timelineEntries.find((t) => t.scene_id === scene.id)}
                  onGeneratePrompts={() => handleGeneratePrompts(scene.id)}
                  onEditScene={() => handleEditSceneWithAI(scene)}
                  onReorderScene={handleReorderScene}
                  onDuplicate={() => handleDuplicateScene(scene.id)}
                  onDelete={() => handleDeleteScene(scene.id)}
                  onInsertBefore={() => handleInsertBefore(sceneIndex)}
                  isGenerating={generatingSceneId === scene.id}
                />
              );
            })}
          </div>
        ) : viewMode === 'compact' ? (
          /* ── Compact view ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {scenes.map((scene) => {
              const thumb = sceneMedia.find((m) => m.scene_id === scene.id);
              const thumbUrl = thumb?.thumbnail_url ?? thumb?.file_url;
              return (
                <Link
                  key={scene.id}
                  href={scene.short_id ? `${basePath}/scene/${scene.short_id}` : `${basePath}`}
                  className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all"
                >
                  <div className="aspect-video bg-background flex items-center justify-center relative">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={scene.title} className="size-full object-cover" />
                    ) : (
                      <Film className="size-6 text-muted-foreground/40" />
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                      #{scene.scene_number}
                    </span>
                    {scene.arc_phase && (
                      <span
                        className={cn(
                          'absolute bottom-1.5 left-1.5 text-[9px] px-1 rounded',
                          PHASE_STYLES[scene.arc_phase] ?? 'bg-zinc-500/80 text-white',
                        )}
                      >
                        {scene.arc_phase}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{scene.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{scene.duration_seconds ?? 5}s</span>
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          SCENE_STATUS_DOT[scene.status ?? 'draft'],
                        )}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* ── Timeline view ── */
          <div className="space-y-3">
            {/* Arc bar */}
            {arcs.length > 0 && (
              <ArcBar
                arcs={arcs}
                totalDuration={totalDuration || video.target_duration_seconds || 60}
                className="h-4"
              />
            )}
            {/* Scene list */}
            <div className="space-y-1">
              {scenes.map((scene) => (
                <Link
                  key={scene.id}
                  href={scene.short_id ? `${basePath}/scene/${scene.short_id}` : `${basePath}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                >
                  <span className="text-xs font-bold text-muted-foreground w-6 text-right tabular-nums">
                    #{scene.scene_number}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{scene.title}</span>
                  {scene.arc_phase && (
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-medium',
                        PHASE_STYLES[scene.arc_phase] ?? 'bg-zinc-500/80 text-white',
                      )}
                    >
                      {scene.arc_phase}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums">{scene.duration_seconds ?? 5}s</span>
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      SCENE_STATUS_DOT[scene.status ?? 'draft'],
                    )}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick actions ───────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones rapidas</p>
        <div className="flex flex-wrap gap-2">
          {scenes.length > 0 && (
            <>
              <button
                type="button"
                disabled={generatingAll || generatingSceneId !== null}
                onClick={handleGenerateAll}
                className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-all hover:border-primary/30 disabled:opacity-50"
              >
                {generatingAll
                  ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  : <Sparkles className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                <span className="text-foreground">Generar todos los prompts</span>
              </button>
              <button type="button" onClick={copyAllPrompts}
                className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-all hover:border-primary/30">
                <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-foreground">Copiar todos los prompts</span>
              </button>
              <button type="button" onClick={copyForGrok}
                className="group flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm transition-all hover:border-primary/40 hover:bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Copiar para Grok</span>
              </button>
            </>
          )}
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={`${basePath}${link.href}`}
              className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-all hover:border-primary/30"
            >
              <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-foreground">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────── */}
      {video.description && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripcion</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{video.description}</p>
        </div>
      )}

      {/* ── Create/Edit scene modal ──────────────────────────── */}
      <SceneWorkModal
        open={showCreateScene || !!editingScene}
        onOpenChange={(open) => {
          if (!open) { setShowCreateScene(false); setEditingScene(null); }
        }}
        videoId={video.id}
        projectId={project.id}
        nextSceneNumber={scenes.length + 1}
        scene={editingScene}
        allScenes={scenes}
        characters={projectCharacters}
        backgrounds={projectBackgrounds}
        sceneCharacters={sceneCharacters}
        sceneBackgrounds={sceneBackgrounds}
        sceneCameras={sceneCameras}
        imagePrompt={editingScene ? scenePrompts.find(p => p.scene_id === editingScene.id && p.prompt_type === 'image')?.prompt_text : undefined}
        videoPrompt={editingScene ? scenePrompts.find(p => p.scene_id === editingScene.id && p.prompt_type === 'video')?.prompt_text : undefined}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['scene-prompts', video.id] });
          queryClient.invalidateQueries({ queryKey: ['video'] });
        }}
      />

      <SceneGeneratorModal
        open={showSceneGenerator}
        onOpenChange={setShowSceneGenerator}
        videoId={video.id}
        projectId={project.id}
        videoTitle={video.title}
        videoPlatform={video.platform ?? 'youtube'}
        videoDuration={video.target_duration_seconds ?? 60}
        projectStyle={project.style ?? 'pixar'}
        existingSceneCount={scenes.length}
      />
    </div>
  );
}
