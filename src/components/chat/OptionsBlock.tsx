'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Check,
  Instagram, Youtube, Music2, Tv2, Linkedin, Twitter,
  Clapperboard, Palette, Sparkles, Clock, Zap, Minus,
  MonitorPlay, Globe,
  Film, Video, Scissors,
  User, UserPlus, Users,
  Image, ImagePlus,
  FileText, MessageSquare,
  Star, Heart, TrendingUp,
  Play, Pause, Volume2,
  Layers, Grid2x2, List,
  ArrowRight, RotateCcw,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Icon map — keyword → Lucide icon
// ---------------------------------------------------------------------------

const ICON_MAP: Array<{ keywords: string[]; icon: LucideIcon }> = [
  // Platforms
  { keywords: ['instagram'],              icon: Instagram },
  { keywords: ['youtube'],               icon: Youtube },
  { keywords: ['tiktok'],                icon: Music2 },
  { keywords: ['tv', 'streaming', 'televisión'], icon: Tv2 },
  { keywords: ['linkedin'],              icon: Linkedin },
  { keywords: ['twitter', '/ x', 'x'],  icon: Twitter },
  { keywords: ['web', 'website'],        icon: Globe },
  { keywords: ['podcast', 'audio'],      icon: Volume2 },

  // Visual styles
  { keywords: ['realista', 'realistic'], icon: Image },
  { keywords: ['animado', 'animated'],   icon: Sparkles },
  { keywords: ['estilizado', 'stylized'],icon: Palette },
  { keywords: ['retro', 'vintage'],      icon: RotateCcw },
  { keywords: ['futurista', 'futuristic'], icon: Zap },
  { keywords: ['minimalista', 'minimal'], icon: Minus },
  { keywords: ['cinemático', 'cinematic'], icon: Clapperboard },

  // Duration / time
  { keywords: ['segundo', 'segundos', 'second'], icon: Timer },
  { keywords: ['minuto', 'minutos', 'minute'],   icon: Clock },
  { keywords: ['hora', 'horas', 'hour'],         icon: Clock },

  // Actions
  { keywords: ['crear', 'crear proyecto', 'nuevo'], icon: ArrowRight },
  { keywords: ['editar', 'modificar'],   icon: Scissors },
  { keywords: ['video', 'vídeo'],        icon: Film },
  { keywords: ['escena', 'escenas'],     icon: Layers },
  { keywords: ['personaje', 'character'], icon: User },
  { keywords: ['personajes', 'characters'], icon: Users },
  { keywords: ['fondo', 'background'],   icon: ImagePlus },
  { keywords: ['guión', 'script'],       icon: FileText },
  { keywords: ['chat', 'mensaje'],       icon: MessageSquare },

  // Misc
  { keywords: ['grilla', 'cuadrícula', 'grid'], icon: Grid2x2 },
  { keywords: ['lista', 'list'],         icon: List },
  { keywords: ['destacado', 'featured'], icon: Star },
  { keywords: ['popular', 'viral'],      icon: TrendingUp },
  { keywords: ['invitar', 'agregar'],    icon: UserPlus },
  { keywords: ['reproducir', 'play'],    icon: Play },
  { keywords: ['publicación', 'post'],   icon: MonitorPlay },
  { keywords: ['colaborar'],             icon: Users },
  { keywords: ['favorito'],              icon: Heart },
  { keywords: ['pantalla', 'screen'],    icon: Video },
  { keywords: ['subir', 'upload'],       icon: ImagePlus },
];

/** Returns a Lucide icon component that best matches the option label, or null. */
function getOptionIcon(label: string): LucideIcon | null {
  const lower = label.toLowerCase();
  for (const { keywords, icon } of ICON_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptionsBlockProps {
  options: string[];
  onSelect: (option: string) => void;
  selected?: string;
}

// ---------------------------------------------------------------------------
// OptionsBlock
// ---------------------------------------------------------------------------

export function OptionsBlock({ options, onSelect, selected }: OptionsBlockProps) {
  const hasSelection = selected !== undefined && selected !== '';

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = option === selected;
        const isDisabled = hasSelection && !isSelected;
        const Icon = getOptionIcon(option);

        return (
          <button
            key={option}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(option)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
              'text-sm font-medium transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              !isSelected && !isDisabled && [
                'border-border text-muted-foreground bg-transparent',
                'hover:border-primary hover:bg-primary/10 hover:text-foreground',
                'cursor-pointer',
              ],
              isSelected && [
                'border-primary bg-primary text-primary-foreground',
                'cursor-default',
              ],
              isDisabled && [
                'border-border/40 text-muted-foreground/40 bg-transparent',
                'cursor-not-allowed opacity-40',
              ],
            )}
            aria-pressed={isSelected}
          >
            {Icon && <Icon size={13} className="shrink-0" aria-hidden="true" />}
            <span>{option}</span>
            {isSelected && (
              <Check size={12} className="shrink-0 text-primary-foreground" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
