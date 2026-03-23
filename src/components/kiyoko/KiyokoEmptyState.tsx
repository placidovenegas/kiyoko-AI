'use client';

import { useMemo } from 'react';
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
} from 'lucide-react';
import { KiyokoIcon } from '@/components/ui/logo';
import type { ContextLevel } from '@/types/ai-context';
import {
  getQuickActions as getBaseQuickActions,
  type ChatLocation,
  type QuickAction,
} from '@/lib/ai/chat-context';

// ---- Lucide icon map for quick action ids ----

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  start_scratch:   Rocket,
  have_resources:  CheckCircle2,
  create_scenes:   Film,
  add_character:   Users,
  add_background:  Image,
  gen_prompts:     Camera,
  edit_scene:      Pencil,
  cameras:         Camera,
  storyboard:      BarChart3,
  narration:       Volume2,
  improve:         Sparkles,
  // Fallbacks for base quick actions
  new_project:     Rocket,
  suggestions:     Sparkles,
  new_video:       Film,
  project_summary: BarChart3,
  generate_scenes: Film,
  generate_narration: Volume2,
  batch_prompts:   Camera,
  analyze_video:   BarChart3,
  generate_prompt: Sparkles,
  improve_prompt:  Sparkles,
  analyze_image:   Image,
  change_camera:   Camera,
  analyze_character: Image,
  create_character: Users,
  create_background: Image,
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
  if (!hasScenes) {
    if (!hasCharacters && !hasBackgrounds) {
      return [
        { id: 'start_scratch', label: 'Empezar desde cero', icon: '', prompt: 'Empezar desde cero' },
        { id: 'have_resources', label: 'Ya tengo recursos', icon: '', prompt: 'Ya tengo personajes y fondos' },
      ];
    }
    return [
      { id: 'create_scenes', label: 'Crear escenas', icon: '', prompt: 'Crea las escenas para este video' },
      { id: 'add_character', label: 'Crear personaje', icon: '', prompt: 'Crear personaje' },
      { id: 'add_background', label: 'Crear fondo', icon: '', prompt: 'Crear fondo' },
    ];
  }

  if (!hasPrompts) {
    return [
      { id: 'gen_prompts', label: 'Generar prompts', icon: '', prompt: 'Genera los prompts de imagen y video para todas las escenas' },
      { id: 'edit_scene', label: 'Editar escena', icon: '', prompt: 'Quiero editar una escena' },
      { id: 'cameras', label: 'Configurar camaras', icon: '', prompt: 'Configura las camaras de las escenas' },
    ];
  }

  return [
    { id: 'storyboard', label: 'Revisar storyboard', icon: '', prompt: 'Muestrame el storyboard del video' },
    { id: 'narration', label: 'Crear narracion', icon: '', prompt: 'Genera la narracion del video' },
    { id: 'edit_scene', label: 'Editar escena', icon: '', prompt: 'Quiero editar una escena' },
    { id: 'improve', label: 'Mejorar prompts', icon: '', prompt: 'Revisa y mejora los prompts existentes' },
  ];
}

function contextToLocation(contextLevel: ContextLevel): ChatLocation {
  switch (contextLevel) {
    case 'project': return { type: 'project', shortId: '' };
    case 'scene': return { type: 'scene', shortId: '', videoShortId: '', sceneShortId: '' };
    default: return { type: contextLevel as 'dashboard' };
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
}: KiyokoEmptyStateProps) {
  const quickActions = useMemo(() => {
    if (contextLevel === 'video') {
      return getVideoQuickActions(hasScenes, hasPrompts, hasCharacters, hasBackgrounds);
    }
    return getBaseQuickActions(contextToLocation(contextLevel));
  }, [contextLevel, hasScenes, hasPrompts, hasCharacters, hasBackgrounds]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      {/* Avatar */}
      <div className="flex items-center justify-center size-14 rounded-2xl bg-teal-600/10 mb-3 border border-teal-500/15">
        <KiyokoIcon size={28} className="text-teal-500" />
      </div>

      <p className="text-sm font-semibold text-foreground mb-0.5">Kiyoko AI</p>
      <p className="text-[11px] text-muted-foreground mb-1">Tu directora creativa</p>

      {contextLabel && (
        <p className="text-[11px] text-muted-foreground/70 mb-1">{contextLabel}</p>
      )}

      {statusSummary && (
        <p className="text-[11px] text-muted-foreground max-w-xs mb-3 leading-relaxed">
          {statusSummary}
        </p>
      )}

      {!statusSummary && <div className="mb-3" />}

      {/* Quick actions — Lucide icons */}
      <div className="grid grid-cols-2 gap-1.5 max-w-sm w-full">
        {quickActions.map((action) => {
          const Icon = ICON_MAP[action.id] || Sparkles;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onQuickAction(action.prompt)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium text-muted-foreground bg-card border border-border hover:border-teal-500/30 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/5 transition-all duration-150"
            >
              <Icon size={14} className="shrink-0" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
