'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button as HeroButton, Popover } from '@heroui/react';
import {
  ChevronsRight,
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
  Users,
  Image,
  ListTodo,
  Lightbulb,
  FolderOpen,
  MapPin,
  AlertCircle,
  Loader2,
  CircleDot,
  MoreHorizontal,
  Trash2,
  MessageSquarePlus,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAIStore } from '@/stores/ai-store';
import type { KiyokoPanelMode, KiyokoActiveAgent } from '@/stores/ai-store';

// ---- Agent config ----

const AGENT_CONFIG: Record<KiyokoActiveAgent, {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  dotColor: string;
  description: string;
}> = {
  router:      { label: 'Router',      Icon: GitMerge,     color: 'text-muted-foreground', dotColor: 'bg-muted-foreground', description: 'Agente general — clasifica y responde' },
  scenes:      { label: 'Escenas',     Icon: Clapperboard, color: 'text-amber-500 dark:text-amber-400', dotColor: 'bg-amber-500', description: 'Crea y planifica escenas con arco narrativo' },
  prompts:     { label: 'Prompts',     Icon: Camera,       color: 'text-blue-500 dark:text-blue-400', dotColor: 'bg-blue-500', description: 'Genera prompts de imagen y video' },
  editor:      { label: 'Editor',      Icon: Pencil,       color: 'text-purple-500 dark:text-purple-400', dotColor: 'bg-purple-500', description: 'Edita escenas, camara y detalles' },
  characters:  { label: 'Personajes',  Icon: Users,        color: 'text-pink-500 dark:text-pink-400', dotColor: 'bg-pink-500', description: 'Gestiona personajes del proyecto' },
  backgrounds: { label: 'Fondos',      Icon: Image,        color: 'text-emerald-500 dark:text-emerald-400', dotColor: 'bg-emerald-500', description: 'Gestiona fondos y locaciones' },
  tasks:       { label: 'Tareas',      Icon: ListTodo,     color: 'text-orange-500 dark:text-orange-400', dotColor: 'bg-orange-500', description: 'Gestiona tareas del proyecto' },
  ideation:    { label: 'Ideas',       Icon: Lightbulb,    color: 'text-yellow-500 dark:text-yellow-400', dotColor: 'bg-yellow-500', description: 'Genera ideas creativas' },
  project:     { label: 'Proyecto',    Icon: FolderOpen,   color: 'text-cyan-500 dark:text-cyan-400', dotColor: 'bg-cyan-500', description: 'Asistente a nivel proyecto' },
};

// ---- Chat status ----

type ChatStatus = 'idle' | 'streaming' | 'thinking' | 'error';

function getChatStatus(isStreaming: boolean, isThinking?: boolean, hasError?: boolean): ChatStatus {
  if (hasError) return 'error';
  if (isThinking) return 'thinking';
  if (isStreaming) return 'streaming';
  return 'idle';
}

const STATUS_CONFIG: Record<ChatStatus, { label: string; color: string; dotClass: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  idle:      { label: 'Disponible',     color: 'text-emerald-500', dotClass: 'bg-emerald-500', Icon: CircleDot },
  streaming: { label: 'Respondiendo…',  color: 'text-primary',     dotClass: 'bg-primary animate-pulse', Icon: Loader2 },
  thinking:  { label: 'Pensando…',      color: 'text-primary',     dotClass: 'bg-primary animate-pulse', Icon: Loader2 },
  error:     { label: 'Error',          color: 'text-red-500',     dotClass: 'bg-red-500', Icon: AlertCircle },
};

// ---- Mode options ----

const MODE_OPTIONS: Array<{
  value: KiyokoPanelMode;
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { value: 'sidebar',    label: 'Panel lateral',      description: 'Chat al lado del contenido',          Icon: PanelRight },
  { value: 'floating',   label: 'Flotante',           description: 'Ventana movible sobre el contenido',  Icon: Move },
  { value: 'fullscreen', label: 'Pantalla completa',   description: 'Chat ocupa todo el espacio',          Icon: Maximize2 },
];

// ---- Props ----

interface KiyokoHeaderProps {
  contextLabel: string;
  isStreaming: boolean;
  isThinking?: boolean;
  hasError?: boolean;
  lastError?: string | null;
  onNewChat: () => void;
  onHistoryToggle?: () => void;
  compact?: boolean;
  contextStrip?: ReactNode;
  activeProvider?: string | null;
}

export function KiyokoHeader({
  contextLabel,
  isStreaming,
  isThinking,
  hasError,
  lastError,
  onNewChat,
  onHistoryToggle,
  compact,
  contextStrip,
  activeProvider,
}: KiyokoHeaderProps) {
  const { mode, setMode, closeChat, activeAgent } = useAIStore();
  const [agentOpen, setAgentOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const agent = AGENT_CONFIG[activeAgent];
  const currentModeOption = MODE_OPTIONS.find((o) => o.value === mode) || MODE_OPTIONS[0];
  const chatStatus = getChatStatus(isStreaming, isThinking, hasError);
  const status = STATUS_CONFIG[chatStatus];

  return (
    <div
      className={cn(
        'flex items-center gap-1 shrink-0 border-b border-border bg-card/90 backdrop-blur-sm',
        'h-[47px] px-1.5',
      )}
    >
      {/* Close button — left — HeroUI Button */}
      <HeroButton
        isIconOnly
        variant="ghost"
        size="sm"
        onPress={closeChat}
        aria-label="Cerrar panel"
        className="ml-1.5 rounded-md text-muted-foreground"
      >
        <ChevronsRight size={16} />
      </HeroButton>

      {/* Agent badge + status popover — left aligned after close */}
      <Popover isOpen={agentOpen} onOpenChange={setAgentOpen}>
        <Popover.Trigger>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all min-w-0',
              'hover:bg-accent/60',
              agentOpen ? 'bg-accent/80 shadow-sm' : 'bg-transparent',
            )}
            title={`${agent.label} — ${status.label}`}
          >
            <span className={cn('size-1.5 rounded-full shrink-0', status.dotClass)} />
            <agent.Icon size={12} className={cn('shrink-0', agent.color)} />
            <span className={cn('text-[11px] font-medium hidden sm:inline', agent.color)}>
              {agent.label}
            </span>
            {contextLabel && contextLabel !== 'Dashboard' && (
              <span className="text-[11px] text-muted-foreground/70 truncate max-w-[120px] hidden sm:inline">
                · {contextLabel}
              </span>
            )}
          </button>
        </Popover.Trigger>

        <Popover.Content className="w-80 p-0 bg-popover border-border shadow-xl rounded-xl overflow-hidden">
          {/* ── Status ── */}
          <div className="px-3 py-2.5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className={cn('size-2 rounded-full shrink-0', status.dotClass)} />
              <span className={cn('text-xs font-medium', status.color)}>
                {status.label}
              </span>
              {activeProvider && (
                <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono uppercase">
                  via {activeProvider}
                </span>
              )}
            </div>
            {hasError && lastError && (
              <p className="mt-1.5 text-[11px] text-red-400 leading-snug line-clamp-2">
                {lastError}
              </p>
            )}
          </div>

          {/* ── Agent info ── */}
          <div className="px-3 py-2 border-b border-border/50 flex items-start gap-2.5">
            <div className={cn(
              'flex items-center justify-center size-7 rounded-lg shrink-0 mt-0.5',
              'bg-accent/60',
            )}>
              <agent.Icon size={14} className={agent.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-semibold', agent.color)}>{agent.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                {agent.description}
              </p>
            </div>
          </div>

          {/* ── Context strip ── */}
          {contextStrip}
        </Popover.Content>
      </Popover>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* History toggle — HeroUI Button */}
      {onHistoryToggle && (
        <HeroButton
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={onHistoryToggle}
          aria-label="Historial"
          className="rounded-md"
        >
          <History size={14} />
        </HeroButton>
      )}

      {/* New chat — HeroUI Button */}
      <HeroButton
        isIconOnly
        variant="ghost"
        size="sm"
        onPress={onNewChat}
        aria-label="Nuevo chat"
        className=" rounded-md"
      >
        <Plus size={14} />
      </HeroButton>

      {/* ⋯ More menu */}
      <Popover isOpen={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger>
          <HeroButton
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Opciones"
            className={cn('rounded-md', menuOpen && 'text-primary bg-primary/10')}
          >
            <MoreHorizontal size={14} />
          </HeroButton>
        </Popover.Trigger>
        <Popover.Content className="w-52 p-1 bg-popover border-border shadow-xl rounded-xl">
          {/* Context */}
          <MenuButton
            icon={<MapPin size={14} />}
            label="Contexto de la IA"
            sublabel={contextLabel}
            onClick={() => { setMenuOpen(false); setAgentOpen(true); }}
          />

          {/* Separator */}
          <div className="h-px bg-border/50 mx-1.5 my-1" />

          {/* New chat */}
          <MenuButton
            icon={<MessageSquarePlus size={14} />}
            label="Nuevo chat"
            onClick={() => { setMenuOpen(false); onNewChat(); }}
          />

          {/* Clear chat */}
          <MenuButton
            icon={<Trash2 size={14} />}
            label="Limpiar chat"
            onClick={() => { setMenuOpen(false); onNewChat(); }}
            destructive
          />

          {/* Separator */}
          <div className="h-px bg-border/50 mx-1.5 my-1" />

          {/* Mode options */}
          <p className="px-2.5 pt-1 pb-0.5 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
            Vista
          </p>
          {MODE_OPTIONS.map((option) => {
            const isActive = option.value === mode;
            return (
              <MenuButton
                key={option.value}
                icon={<option.Icon size={14} />}
                label={option.label}
                onClick={() => { setMode(option.value); setMenuOpen(false); }}
                active={isActive}
              />
            );
          })}
        </Popover.Content>
      </Popover>
    </div>
  );
}

// ---- Menu button sub-component ----

function MenuButton({
  icon,
  label,
  sublabel,
  onClick,
  destructive,
  active,
}: {
  icon: ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  destructive?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-left transition-colors',
        'hover:bg-accent/60',
        destructive && 'text-red-500 hover:text-red-400 hover:bg-red-500/10',
        active && 'bg-accent/60',
        !destructive && !active && 'text-foreground/80',
      )}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>
        )}
      </div>
      {active && <Check size={12} className="text-primary shrink-0" />}
    </button>
  );
}
