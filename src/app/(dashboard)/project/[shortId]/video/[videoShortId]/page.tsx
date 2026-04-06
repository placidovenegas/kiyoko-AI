'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import { ArcBar } from '@/components/video/ArcBar';
import { toast } from 'sonner';
import {
  Film, Clock, Monitor, Mic, FileOutput, Music, Image as ImageIcon,
  Video, Loader2, BarChart3, Layers, CheckCircle2, Target,
  Settings2, Copy, Sparkles, ExternalLink, MoreHorizontal,
  Eye, Pencil, Camera, Clapperboard, Plus, Trash2, ArrowRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { SceneCreateModal } from '@/components/modals';
import type { NarrativeArc, Scene, ScenePrompt, SceneMedia } from '@/types';

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
const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompting: 'Creando prompts',
  generating: 'Generando',
  review: 'Revision',
  approved: 'Aprobado',
  exported: 'Exportado',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-muted-foreground border-zinc-500/20',
  prompting: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  generating: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  review: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  exported: 'bg-primary/20 text-primary border-primary/20',
};

const SCENE_STATUS_DOT: Record<string, string> = {
  draft: 'bg-zinc-500',
  prompt_ready: 'bg-blue-500',
  generating: 'bg-amber-500',
  generated: 'bg-purple-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

const PHASE_STYLES: Record<string, string> = {
  hook: 'bg-red-500/80 text-white',
  build: 'bg-amber-500/80 text-white',
  peak: 'bg-emerald-500/80 text-white',
  close: 'bg-blue-500/80 text-white',
};

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
  onGeneratePrompts,
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
  onGeneratePrompts: () => void;
  isGenerating: boolean;
}) {
  const sceneLink = scene.short_id
    ? `${basePath}/scene/${scene.short_id}`
    : `${basePath}/scenes`;

  const audio: AudioConfig = { music: false, dialogue: false, sfx: false, voiceover: false, ...(scene.audio_config as Partial<AudioConfig> | null) };
  const audioTags: string[] = [];
  if (audio.music) audioTags.push('Musica');
  if (audio.sfx) audioTags.push('SFX');
  if (audio.voiceover) audioTags.push('Voz');
  if (audio.dialogue) audioTags.push('Dialogo');

  const thumbUrl = thumbnail?.thumbnail_url ?? thumbnail?.file_url;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 transition-colors hover:border-primary/20">
      {/* ── Top row: number, title, phase, duration, status ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
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
          <div className="flex-1 min-w-0">
            {imagePrompt ? (
              <p className="font-mono text-xs text-muted-foreground line-clamp-1 bg-background rounded-lg px-3 py-1.5">
                {imagePrompt.prompt_text}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/40 italic px-3 py-1.5">Sin prompt</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {imagePrompt && (
              <button
                type="button"
                onClick={() => copyToClipboard(imagePrompt.prompt_text, 'Prompt de imagen')}
                className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Copiar prompt de imagen"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              disabled={isGenerating}
              onClick={onGeneratePrompts}
              className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
              title="Generar con IA"
            >
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
          <div className="flex-1 min-w-0">
            {videoPrompt ? (
              <p className="font-mono text-xs text-muted-foreground line-clamp-1 bg-background rounded-lg px-3 py-1.5">
                {videoPrompt.prompt_text}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/40 italic px-3 py-1.5">Sin prompt</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {videoPrompt && (
              <button
                type="button"
                onClick={() => copyToClipboard(videoPrompt.prompt_text, 'Prompt de video')}
                className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Copiar prompt de video"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              disabled={isGenerating}
              onClick={onGeneratePrompts}
              className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
              title="Generar con IA"
            >
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

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
              <DropdownMenuItem onClick={() => toast.info('Edicion inline proximamente')}>
                <Pencil className="h-4 w-4" />
                Editar inline
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Regenerar imagen proximamente')}>
                <Camera className="h-4 w-4" />
                Regenerar imagen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Regenerar clips proximamente')}>
                <Clapperboard className="h-4 w-4" />
                Regenerar clips
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Mejorar con IA proximamente')}>
                <Sparkles className="h-4 w-4" />
                Mejorar con IA
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Duplicar proximamente')}>
                <Copy className="h-4 w-4" />
                Duplicar escena
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Insertar proximamente')}>
                <Plus className="h-4 w-4" />
                Insertar antes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" />
                Eliminar
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
    try {
      for (const scene of scenes) {
        await handleGeneratePrompts(scene.id);
      }
      toast.success('Todos los prompts generados');
    } finally {
      setGeneratingAll(false);
    }
  }

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
                STATUS_COLORS[video.status] ?? 'bg-zinc-500/20 text-muted-foreground border-zinc-500/20',
              )}
            >
              {STATUS_LABELS[video.status] ?? video.status}
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

            <Link
              href={`${basePath}/scenes`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </div>

        {/* Content */}
        {scenesLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12">
            <Film className="h-10 w-10 text-muted-foreground/60" />
            <h4 className="mt-3 text-sm font-medium text-foreground">Sin escenas todavia</h4>
            <p className="mt-1 text-xs text-muted-foreground">Crea escenas manualmente o genera con IA</p>
            <button
              type="button"
              onClick={() => setShowCreateScene(true)}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Crear primera escena
            </button>
          </div>
        ) : viewMode === 'storyboard' ? (
          /* ── Storyboard view ── */
          <div className="space-y-3">
            {scenes.map((scene) => {
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
                  onGeneratePrompts={() => handleGeneratePrompts(scene.id)}
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
                  href={scene.short_id ? `${basePath}/scene/${scene.short_id}` : `${basePath}/scenes`}
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
                  href={scene.short_id ? `${basePath}/scene/${scene.short_id}` : `${basePath}/scenes`}
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
              <button
                type="button"
                onClick={copyAllPrompts}
                className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-all hover:border-primary/30"
              >
                <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-foreground">Copiar todos los prompts</span>
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

      {/* ── Create scene modal ──────────────────────────────── */}
      <SceneCreateModal
        open={showCreateScene}
        onOpenChange={setShowCreateScene}
        videoId={video.id}
        projectId={project.id}
        nextSceneNumber={scenes.length + 1}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['scene-prompts', video.id] });
        }}
      />
    </div>
  );
}
