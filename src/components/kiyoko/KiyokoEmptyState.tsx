'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Rocket,
  CheckCircle2,
  Film,
  Users,
  Image,
  Camera,
  Pencil,
  Volume2,
  BarChart3,
  Sparkles,
  ListTodo,
  ClipboardList,
  FolderOpen,
  Palette,
  Wand2,
  RefreshCw,
  Expand,
  MessageSquare,
  User,
} from 'lucide-react';
import { fetchDashboardContextStats } from '@/lib/chat/fetch-dashboard-context-stats';
import { KiyokoIcon } from '@/components/ui/logo';
import { cn } from '@/lib/utils/cn';
import type { ContextLevel } from '@/types/ai-context';
import {
  getQuickActions as getBaseQuickActions,
  type ChatLocation,
  type QuickAction,
} from '@/lib/ai/chat-context';

// ---- Animation variants ----

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// ---- Lucide icon map for quick action ids ----

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  start_scratch: Rocket,
  have_resources: CheckCircle2,
  create_scenes: Film,
  add_character: Users,
  add_background: Image,
  gen_prompts: Camera,
  edit_scene: Pencil,
  cameras: Camera,
  storyboard: BarChart3,
  narration: Volume2,
  improve: Sparkles,
  tasks_summary: ListTodo,
  project_ideas: Sparkles,
  video_ideas: Sparkles,
  new_task: ClipboardList,
  review_projects: FolderOpen,
  explore_styles: Palette,
  // Fallbacks for base quick actions
  new_project: Rocket,
  suggestions: Sparkles,
  new_video: Film,
  project_summary: BarChart3,
  generate_scenes: Film,
  generate_narration: Volume2,
  batch_prompts: Camera,
  analyze_video: BarChart3,
  generate_prompt: Sparkles,
  improve_prompt: Sparkles,
  analyze_image: Image,
  change_camera: Camera,
  analyze_character: Image,
  create_character: Users,
  create_background: Image,
  // Scene-level actions
  improve_prompts: Wand2,
  change_camera_scene: Camera,
  extend_scene: Expand,
  regenerate_all: RefreshCw,
  generate_prompts: Sparkles,
  describe_scene: MessageSquare,
  suggest_camera: Camera,
  assign_character: User,
};

/**
 * Smart quick actions for video level based on actual content state.
 */
function getVideoQuickActions(
  hasScenes: boolean,
  hasPrompts: boolean,
  hasCharacters: boolean,
  hasBackgrounds: boolean,
): QuickAction[] {
  const ideasVideo: QuickAction = {
    id: 'video_ideas',
    label: 'Ideas para el video',
    icon: '',
    prompt:
      'Dame ideas creativas para este video (gancho, tono, estructura, mensaje); usa el contexto del video abierto',
  };

  if (!hasScenes) {
    if (!hasCharacters && !hasBackgrounds) {
      return [
        ideasVideo,
        { id: 'start_scratch', label: 'Empezar desde cero', icon: '', prompt: 'Empezar desde cero' },
        { id: 'have_resources', label: 'Ya tengo recursos', icon: '', prompt: 'Ya tengo personajes y fondos' },
      ];
    }
    return [
      ideasVideo,
      { id: 'create_scenes', label: 'Crear escenas', icon: '', prompt: 'Crea las escenas para este video' },
      { id: 'add_character', label: 'Crear personaje', icon: '', prompt: 'Crear personaje' },
      { id: 'add_background', label: 'Crear fondo', icon: '', prompt: 'Crear fondo' },
    ];
  }

  if (!hasPrompts) {
    return [
      ideasVideo,
      { id: 'gen_prompts', label: 'Generar prompts', icon: '', prompt: 'Genera los prompts de imagen y video para todas las escenas' },
      { id: 'edit_scene', label: 'Editar escena', icon: '', prompt: 'Quiero editar una escena' },
      { id: 'cameras', label: 'Configurar camaras', icon: '', prompt: 'Configura las camaras de las escenas' },
    ];
  }

  return [
    ideasVideo,
    { id: 'storyboard', label: 'Revisar storyboard', icon: '', prompt: 'Muestrame el storyboard del video' },
    { id: 'narration', label: 'Crear narracion', icon: '', prompt: 'Genera la narracion del video' },
    { id: 'edit_scene', label: 'Editar escena', icon: '', prompt: 'Quiero editar una escena' },
    { id: 'improve', label: 'Mejorar prompts', icon: '', prompt: 'Revisa y mejora los prompts existentes' },
  ];
}

/**
 * Quick actions for scene level based on whether it has prompts or not.
 */
function getSceneQuickActions(hasPrompts: boolean): QuickAction[] {
  if (hasPrompts) {
    return [
      { id: 'improve_prompts', label: 'Mejorar prompts', icon: '', prompt: 'Mejora los prompts de imagen y video de esta escena' },
      { id: 'change_camera_scene', label: 'Cambiar camara', icon: '', prompt: 'Sugiere un angulo y movimiento de camara diferente para esta escena' },
      { id: 'extend_scene', label: 'Extender escena', icon: '', prompt: 'Extiende esta escena con mas detalle y variaciones' },
      { id: 'regenerate_all', label: 'Regenerar todo', icon: '', prompt: 'Regenera completamente los prompts de esta escena desde cero' },
    ];
  }

  return [
    { id: 'generate_prompts', label: 'Generar prompts', icon: '', prompt: 'Genera los prompts de imagen y video para esta escena' },
    { id: 'describe_scene', label: 'Describir escena', icon: '', prompt: 'Ayudame a describir esta escena con mas detalle' },
    { id: 'suggest_camera', label: 'Sugerir camara', icon: '', prompt: 'Sugiere el mejor angulo y movimiento de camara para esta escena' },
    { id: 'assign_character', label: 'Asignar personaje', icon: '', prompt: 'Asigna un personaje a esta escena' },
  ];
}

function contextToLocation(contextLevel: ContextLevel): ChatLocation {
  switch (contextLevel) {
    case 'project':
      return { type: 'project', shortId: '' };
    case 'video':
      return { type: 'video', shortId: '', videoShortId: '' };
    case 'scene':
      return { type: 'scene', shortId: '', videoShortId: '', sceneShortId: '' };
    case 'dashboard':
    default:
      return { type: 'dashboard' };
  }
}

interface KiyokoEmptyStateProps {
  contextLevel: ContextLevel;
  contextLabel: string;
  statusSummary?: string;
  hasScenes?: boolean;
  hasPrompts?: boolean;
  hasCharacters?: boolean;
  hasBackgrounds?: boolean;
  onQuickAction: (prompt: string) => void;
  // Scene-level props
  sceneTitle?: string;
  sceneNumber?: number;
  sceneDuration?: number;
  scenePhase?: string;
  sceneCameraAngle?: string;
  sceneCameraMovement?: string;
  sceneImagePrompt?: string;
  sceneVideoPrompt?: string;
  sceneCharacters?: string[];
  sceneBackground?: string;
}

export function KiyokoEmptyState({
  contextLevel,
  contextLabel,
  statusSummary,
  hasScenes = false,
  hasPrompts = false,
  hasCharacters = false,
  hasBackgrounds = false,
  onQuickAction,
  sceneTitle,
  sceneNumber,
  sceneDuration,
  scenePhase,
  sceneCameraAngle,
  sceneCameraMovement,
  sceneImagePrompt,
  sceneVideoPrompt,
  sceneCharacters,
  sceneBackground,
}: KiyokoEmptyStateProps) {
  const sceneHasPrompts = !!(sceneImagePrompt || sceneVideoPrompt);

  const quickActions = useMemo(() => {
    if (contextLevel === 'scene') {
      return getSceneQuickActions(sceneHasPrompts);
    }
    if (contextLevel === 'video') {
      return getVideoQuickActions(hasScenes, hasPrompts, hasCharacters, hasBackgrounds);
    }
    return getBaseQuickActions(contextToLocation(contextLevel));
  }, [contextLevel, hasScenes, hasPrompts, hasCharacters, hasBackgrounds, sceneHasPrompts]);

  const { data: dashStats } = useQuery({
    queryKey: ['kiyoko-chat-empty-dashboard'],
    enabled: contextLevel === 'dashboard',
    queryFn: () => fetchDashboardContextStats(),
    staleTime: 60 * 1000,
  });

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6"
    >
      {/* Avatar with glow */}
      <motion.div variants={item} className="relative mb-3">
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-lg animate-pulse" />
        <div className="relative flex items-center justify-center size-14 rounded-2xl bg-primary/10 border border-primary/15">
          <KiyokoIcon size={28} className="text-primary" />
        </div>
      </motion.div>

      <motion.p variants={item} className="text-sm font-semibold text-foreground mb-0.5">
        Kiyoko AI
      </motion.p>

      {/* ---- Scene-level welcome ---- */}
      {contextLevel === 'scene' && (
        <>
          {/* Scene header */}
          <motion.div
            variants={item}
            className="rounded-xl border border-primary/20 bg-primary/5 p-3 w-full max-w-sm mt-3 text-left"
          >
            <p className="text-sm font-semibold text-foreground">
              Escena #{sceneNumber ?? '?'}
              {sceneTitle ? (
                <span className="text-muted-foreground font-normal"> &quot;{sceneTitle}&quot;</span>
              ) : null}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {sceneDuration ? `${sceneDuration}s` : '?s'}
              {scenePhase ? ` \u00b7 ${scenePhase}` : ''}
              {sceneCameraAngle ? ` \u00b7 ${sceneCameraAngle}` : ''}
              {sceneCameraMovement ? ` \u00b7 ${sceneCameraMovement}` : ''}
            </p>
          </motion.div>

          {/* Prompt previews */}
          {sceneImagePrompt && (
            <motion.div variants={item} className="w-full max-w-sm mt-2 text-left">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Prompt imagen
              </p>
              <p className="font-mono text-[11px] line-clamp-2 bg-background rounded-lg px-2.5 py-2 border border-border text-muted-foreground">
                {sceneImagePrompt}
              </p>
            </motion.div>
          )}

          {sceneVideoPrompt && (
            <motion.div variants={item} className="w-full max-w-sm mt-2 text-left">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Prompt video
              </p>
              <p className="font-mono text-[11px] line-clamp-2 bg-background rounded-lg px-2.5 py-2 border border-border text-muted-foreground">
                {sceneVideoPrompt}
              </p>
            </motion.div>
          )}

          {/* Characters & Background */}
          <motion.div variants={item} className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={12} className="shrink-0" />
              {sceneCharacters && sceneCharacters.length > 0
                ? sceneCharacters.join(', ')
                : 'Sin personajes'}
            </span>
            <span className="flex items-center gap-1">
              <Image size={12} className="shrink-0" />
              {sceneBackground || 'Sin fondo'}
            </span>
          </motion.div>

          <motion.p variants={item} className="text-[11px] text-muted-foreground mt-3 mb-3">
            {sceneHasPrompts
              ? '\u00bfQue quieres hacer con esta escena?'
              : 'Esta escena aun no tiene prompts. \u00bfPor donde empezamos?'}
          </motion.p>
        </>
      )}

      {/* ---- Video-level welcome ---- */}
      {contextLevel === 'video' && (
        <>
          {contextLabel && (
            <motion.p variants={item} className="text-[11px] text-muted-foreground/70 mt-1">
              {contextLabel}
            </motion.p>
          )}
          {statusSummary && (
            <motion.p
              variants={item}
              className="text-[11px] text-muted-foreground max-w-xs mb-3 mt-1 leading-relaxed"
            >
              {statusSummary}
            </motion.p>
          )}
          {!statusSummary && <div className="mb-3" />}
        </>
      )}

      {/* ---- Dashboard-level welcome ---- */}
      {contextLevel === 'dashboard' && (
        <>
          <motion.p variants={item} className="text-[11px] text-muted-foreground mb-1">
            Tu directora creativa
          </motion.p>

          {dashStats && (
            <motion.div
              variants={item}
              className="text-[11px] text-muted-foreground max-w-md mb-3 leading-relaxed text-left space-y-1.5"
            >
              <p className="text-foreground/90 font-medium">Tu espacio de trabajo</p>
              <p className="text-foreground/85">
                {dashStats.projectCount === 1 ? '1 proyecto' : `${dashStats.projectCount} proyectos`} ·{' '}
                {dashStats.videoCount === 1 ? '1 video' : `${dashStats.videoCount} videos`} ·{' '}
                {dashStats.sceneCount === 1 ? '1 escena' : `${dashStats.sceneCount} escenas`} ·{' '}
                {dashStats.openTaskCount === 1
                  ? '1 tarea abierta'
                  : `${dashStats.openTaskCount} tareas abiertas`}{' '}
                ({dashStats.totalTaskCount} tareas en total)
              </p>
              <p className="text-muted-foreground/90 text-[10px] pt-0.5">
                Personajes y fondos se ven al abrir un proyecto; aqui el foco es cuenta y prioridades.
              </p>
              <p className="text-muted-foreground pt-0.5">Elige una accion o escribe abajo.</p>
            </motion.div>
          )}

          {!dashStats && !statusSummary && <div className="mb-3" />}
        </>
      )}

      {/* ---- Project-level welcome ---- */}
      {contextLevel === 'project' && (
        <>
          <motion.p variants={item} className="text-[11px] text-muted-foreground mb-1">
            Tu directora creativa
          </motion.p>
          {contextLabel && (
            <motion.p variants={item} className="text-[11px] text-muted-foreground/70 mb-1">
              {contextLabel}
            </motion.p>
          )}
          {statusSummary && (
            <motion.p
              variants={item}
              className="text-[11px] text-muted-foreground max-w-xs mb-3 leading-relaxed"
            >
              {statusSummary}
            </motion.p>
          )}
          {!statusSummary && <div className="mb-3" />}
        </>
      )}

      {/* Quick actions */}
      <motion.div
        variants={item}
        className={cn(
          'grid gap-1.5 w-full',
          contextLevel === 'dashboard'
            ? 'grid-cols-2 sm:grid-cols-3 max-w-lg'
            : 'grid-cols-2 max-w-sm',
        )}
      >
        {quickActions.map((action, i) => {
          const Icon = ICON_MAP[action.id] || Sparkles;
          return (
            <motion.button
              key={action.id}
              variants={item}
              custom={i}
              type="button"
              onClick={() => onQuickAction(action.prompt)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium text-muted-foreground bg-card border border-border hover:border-primary/30 hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all duration-150"
            >
              <Icon size={14} className="shrink-0" />
              <span>{action.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
