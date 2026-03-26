'use client';

import { useState } from 'react';
import {
  X,
  Plus,
  History,
  PanelRight,
  Maximize2,
  Move,
  GitMerge,
  Clapperboard,
  Camera,
  Pencil,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { KiyokoIcon } from '@/components/ui/logo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAIStore } from '@/stores/ai-store';
import type { KiyokoPanelMode, KiyokoActiveAgent } from '@/stores/ai-store';

// ---- Agent config ----

const AGENT_CONFIG: Record<KiyokoActiveAgent, {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}> = {
  router:  { label: 'Router',  Icon: GitMerge,     color: 'text-muted-foreground' },
  scenes:  { label: 'Escenas', Icon: Clapperboard, color: 'text-amber-500 dark:text-amber-400' },
  prompts: { label: 'Prompts', Icon: Camera,       color: 'text-blue-500 dark:text-blue-400' },
  editor:  { label: 'Editor',  Icon: Pencil,       color: 'text-purple-500 dark:text-purple-400' },
};

// ---- Mode options for popover ----

const MODE_OPTIONS: Array<{
  value: KiyokoPanelMode;
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { value: 'sidebar',    label: 'Panel lateral',     description: 'Chat al lado del contenido',     Icon: PanelRight },
  { value: 'floating',   label: 'Flotante',          description: 'Ventana movible sobre el contenido', Icon: Move },
  { value: 'fullscreen', label: 'Pantalla completa',  description: 'Chat ocupa todo el espacio',      Icon: Maximize2 },
];

interface KiyokoHeaderProps {
  contextLabel: string;
  isStreaming: boolean;
  onNewChat: () => void;
  onHistoryToggle?: () => void;
  compact?: boolean;
}

export function KiyokoHeader({
  contextLabel,
  isStreaming,
  onNewChat,
  onHistoryToggle,
  compact,
}: KiyokoHeaderProps) {
  const { mode, setMode, closeChat, activeAgent } = useAIStore();
  const [modeOpen, setModeOpen] = useState(false);
  const agent = AGENT_CONFIG[activeAgent];
  const currentModeOption = MODE_OPTIONS.find((o) => o.value === mode) || MODE_OPTIONS[0];

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 shrink-0 border-b border-border bg-card/90 backdrop-blur-sm',
        // Alineación vertical del navbar del chat: 47px (h-11.75).
        'h-11.75 px-2.5',
      )}
    >
      {/* Avatar */}
      <div className="flex items-center justify-center size-6 rounded-lg bg-primary shrink-0">
        <KiyokoIcon size={12} className="text-white" />
      </div>

      {/* Title + context */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
        <span className="text-xs font-semibold text-foreground shrink-0">Kiyoko</span>
        <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
          · {contextLabel}
        </span>
      </div>

      {/* Agent badge */}
      <div className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0',
        'bg-accent/50',
        agent.color,
      )}>
        <agent.Icon size={10} />
        <span className="hidden sm:inline">{agent.label}</span>
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
      )}

      {/* Divider */}
      <div className="w-px h-4 bg-border shrink-0" />

      {/* Action buttons */}
      {onHistoryToggle && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          isIconOnly
          onClick={onHistoryToggle}
          className="size-7"
          title="Historial"
        >
          <History size={14} />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        isIconOnly
        onClick={onNewChat}
        className="size-7"
        title="Nuevo chat"
      >
        <Plus size={14} />
      </Button>

      {/* Mode switcher popover */}
      <Popover open={modeOpen} onOpenChange={setModeOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            isIconOnly
            className={cn(
              'size-7',
              modeOpen && 'text-primary bg-primary/10',
            )}
            title="Cambiar vista"
          >
            <currentModeOption.Icon size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={6}
          className="w-56 p-1 bg-popover border-border shadow-xl rounded-lg"
        >
          {MODE_OPTIONS.map((option) => {
            const isActive = option.value === mode;
            return (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => { setMode(option.value); setModeOpen(false); }}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left h-auto',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <option.Icon size={14} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{option.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{option.description}</p>
                </div>
                {isActive && <Check size={12} className="text-primary shrink-0" />}
              </Button>
            );
          })}
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="xs"
        isIconOnly
        onClick={closeChat}
        className="size-7"
        title="Cerrar"
      >
        <X size={14} />
      </Button>
    </div>
  );
}
