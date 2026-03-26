'use client';

import type { ReactNode } from 'react';
import {
  BarChart3,
  Clapperboard,
  Film,
  Gauge,
  ImageIcon,
  LayoutGrid,
  Mountain,
  Sparkles,
  UserPlus,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
export type SandboxChatContext =
  | 'dashboard'
  | 'proyecto'
  | 'video'
  | 'escena'
  | 'recursos_proyecto';

type EmptyAction = { id: string; label: string; prompt: string };

const DEMO_PROJECT = 'Proyecto Alpha';
const DEMO_VIDEO = 'Summer Sale';
const DEMO_SCENE = 'Hook';

function DashboardHero({ onAction }: { onAction: (prompt: string) => void }) {
  const actions: { icon: ReactNode; label: string; prompt: string }[] = [
    {
      icon: <Video size={18} className="text-primary" />,
      label: 'Nuevo video',
      prompt: 'Quiero crear un nuevo video',
    },
    {
      icon: <UserPlus size={18} className="text-primary" />,
      label: 'Añadir personaje',
      prompt: 'Quiero añadir un personaje al proyecto',
    },
    {
      icon: <Mountain size={18} className="text-primary" />,
      label: 'Generar fondo',
      prompt: 'Quiero generar un fondo o locación',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[min(60vh,520px)] px-4 py-8 text-center max-w-[680px] mx-auto w-full">
      <div className="flex items-center justify-center size-[52px] rounded-2xl bg-muted/80 border border-border mb-5">
        <Clapperboard size={26} className="text-primary" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2">Kiyoko AI</h1>
      <p className="text-[12.5px] text-muted-foreground leading-relaxed max-w-md mb-8">
        Empieza un viaje cinematográfico. Genera escenas, personajes o arcos narrativos completos con IA
        pensada para producción.
      </p>
      <div className="flex flex-wrap justify-center gap-2.5 w-full">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => onAction(a.prompt)}
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl text-left min-w-[140px] flex-1 sm:flex-none sm:min-w-[160px]',
              'bg-card border border-border hover:border-primary/35 hover:bg-primary/4 transition-colors',
            )}
          >
            {a.icon}
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectGrid({ onAction }: { onAction: (prompt: string) => void }) {
  const cards: { cat: string; catClass: string; icon: React.ReactNode; text: string; prompt: string }[] = [
    {
      cat: 'Creative',
      catClass: 'text-purple-400',
      icon: <Sparkles size={16} className="text-foreground/90" />,
      text: 'Genera un storyboard a partir del último recurso',
      prompt: 'Genera un storyboard a partir del último recurso que subí',
    },
    {
      cat: 'Analysis',
      catClass: 'text-amber-500',
      icon: <BarChart3 size={16} className="text-foreground/90" />,
      text: 'Analiza el sentimiento del feedback de usuarios',
      prompt: 'Analiza el sentimiento del feedback de usuarios sobre el último corte',
    },
    {
      cat: 'Workflow',
      catClass: 'text-sky-400/90',
      icon: <Gauge size={16} className="text-foreground/90" />,
      text: 'Optimiza la línea de tiempo para exportación 4K',
      prompt: 'Optimiza la línea de tiempo para exportación en 4K',
    },
    {
      cat: 'Assets',
      catClass: 'text-primary',
      icon: <LayoutGrid size={16} className="text-foreground/90" />,
      text: 'Busca stock cinematográfico tipo B-roll',
      prompt: 'Busca ideas de stock cinematográfico tipo B-roll para esta escena',
    },
  ];

  return (
    <div className="flex flex-col justify-center min-h-[min(60vh,520px)] px-4 py-8 max-w-[680px] mx-auto w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground text-left mb-2 leading-snug">
        ¿En qué te ayudo a construir{' '}
        <span className="text-primary">{DEMO_PROJECT}</span>?
      </h2>
      <p className="text-[12.5px] text-muted-foreground text-left mb-8 max-w-xl leading-relaxed">
        Puedo analizar material, generar guiones u optimizar el timeline de producción. Elige una acción o escribe
        abajo.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {cards.map((c) => (
          <button
            key={c.cat}
            type="button"
            onClick={() => onAction(c.prompt)}
            className={cn(
              'flex flex-col items-start text-left p-3.5 rounded-xl border border-border bg-card',
              'hover:border-primary/30 hover:bg-primary/3 transition-colors',
            )}
          >
            <div className="flex items-center gap-2 mb-2 w-full">
              {c.icon}
              <span className={cn('text-[9px] font-bold uppercase tracking-[0.55px]', c.catClass)}>{c.cat}</span>
            </div>
            <span className="text-[12.5px] font-medium text-foreground leading-snug">{c.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function VideoContextPanel({ onAction }: { onAction: (prompt: string) => void }) {
  const items: EmptyAction[] = [
    { id: '1', label: 'Plan de escenas', prompt: 'Muéstrame el plan de escenas de este video' },
    { id: '2', label: 'Prompts imagen / video', prompt: 'Revisa el estado de los prompts de imagen y video' },
    { id: '3', label: 'Exportar o formato', prompt: 'Qué opciones tengo para exportar este video' },
    { id: '4', label: 'Narración', prompt: 'Ayúdame con la narración o voz en off del video' },
  ];

  return (
    <div className="flex flex-col justify-center min-h-[min(56vh,480px)] px-4 py-8 max-w-[680px] mx-auto w-full">
      <div className="flex items-center gap-2 mb-1">
        <Film size={18} className="text-primary shrink-0" />
        <h2 className="text-lg font-semibold text-foreground">
          Video · <span className="text-primary">{DEMO_VIDEO}</span>
        </h2>
      </div>
      <p className="text-[12.5px] text-muted-foreground mb-6 max-w-xl">
        Contexto de video (sandbox). Las acciones envían un mensaje de prueba al hilo.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onAction(it.prompt)}
            className="text-left px-3.5 py-2.5 rounded-lg border border-border bg-card text-[12px] font-medium text-foreground hover:bg-accent transition-colors"
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SceneContextPanel({ onAction }: { onAction: (prompt: string) => void }) {
  const items: EmptyAction[] = [
    { id: '1', label: 'Prompt de imagen', prompt: 'Refina el prompt de imagen de esta escena' },
    { id: '2', label: 'Prompt de video', prompt: 'Refina el prompt de video de esta escena' },
    { id: '3', label: 'Cámara y plano', prompt: 'Sugiere ángulo de cámara y movimiento para esta escena' },
    { id: '4', label: 'Duración y ritmo', prompt: 'Ajustemos la duración y el ritmo de esta escena' },
  ];

  return (
    <div className="flex flex-col justify-center min-h-[min(56vh,480px)] px-4 py-8 max-w-[680px] mx-auto w-full">
      <div className="flex items-center gap-2 mb-1">
        <Clapperboard size={18} className="text-amber-500 shrink-0" />
        <h2 className="text-lg font-semibold text-foreground">
          Escena · <span className="text-amber-500">{DEMO_SCENE}</span>
        </h2>
      </div>
      <p className="text-[12.5px] text-muted-foreground mb-6 max-w-xl">
        Vista escena: prompts, cámara y continuidad. Sin llamadas a la API.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onAction(it.prompt)}
            className="text-left px-3.5 py-2.5 rounded-lg border border-border bg-card text-[12px] font-medium text-foreground hover:bg-accent transition-colors"
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResourcesContextPanel({ onAction }: { onAction: (prompt: string) => void }) {
  const items: EmptyAction[] = [
    { id: '1', label: 'Personajes', prompt: 'Resume los personajes del proyecto' },
    { id: '2', label: 'Fondos', prompt: 'Lista los fondos y locaciones disponibles' },
    { id: '3', label: 'Estilos visuales', prompt: 'Qué estilos visuales tenemos definidos' },
    { id: '4', label: 'Coherencia', prompt: 'Ayúdame a mantener coherencia visual entre recursos' },
  ];

  return (
    <div className="flex flex-col justify-center min-h-[min(56vh,480px)] px-4 py-8 max-w-[680px] mx-auto w-full">
      <div className="flex items-center gap-2 mb-1">
        <ImageIcon size={18} className="text-emerald-500 shrink-0" />
        <h2 className="text-lg font-semibold text-foreground">Recursos del proyecto</h2>
      </div>
      <p className="text-[12.5px] text-muted-foreground mb-6 max-w-xl">
        Personajes, fondos y estilos en un solo lugar (vista previa de copy y sugerencias).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onAction(it.prompt)}
            className="text-left px-3.5 py-2.5 rounded-lg border border-border bg-card text-[12px] font-medium text-foreground hover:bg-accent transition-colors"
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface ChatSandboxEmptyStateProps {
  context: SandboxChatContext;
  onAction: (prompt: string) => void;
}

export function ChatSandboxEmptyState({ context, onAction }: ChatSandboxEmptyStateProps) {
  return (
    <div className="w-full transition-opacity duration-300">
      {context === 'dashboard' && <DashboardHero onAction={onAction} />}
      {context === 'proyecto' && <ProjectGrid onAction={onAction} />}
      {context === 'video' && <VideoContextPanel onAction={onAction} />}
      {context === 'escena' && <SceneContextPanel onAction={onAction} />}
      {context === 'recursos_proyecto' && <ResourcesContextPanel onAction={onAction} />}
    </div>
  );
}

export const SANDBOX_CONTEXT_OPTIONS: { value: SandboxChatContext; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'video', label: 'Video' },
  { value: 'escena', label: 'Escena' },
  { value: 'recursos_proyecto', label: 'Recursos' },
];

export function getSandboxChipsForContext(ctx: SandboxChatContext): string[] {
  switch (ctx) {
    case 'dashboard':
      return ['Nuevo proyecto', 'Ideas de proyecto', 'Resumen de tareas', 'Revisar proyectos'];
    case 'proyecto':
      return ['Plan del proyecto', 'Nuevo video', 'Personajes y fondos', 'Tareas pendientes'];
    case 'video':
      return ['Ideas para el vídeo', 'Plan de escenas', 'Estado de prompts', 'Exportar'];
    case 'escena':
      return ['Prompt imagen', 'Prompt video', 'Cámara', 'Duración'];
    case 'recursos_proyecto':
      return ['Listar personajes', 'Listar fondos', 'Estilos', 'Coherencia visual'];
    default:
      return [];
  }
}

export function getSandboxPlaceholder(ctx: SandboxChatContext): string {
  switch (ctx) {
    case 'dashboard':
      return 'Pregunta lo que quieras (sandbox, sin IA)…';
    case 'proyecto':
      return `Mensaje en ${DEMO_PROJECT}…`;
    case 'video':
      return `Mensaje sobre «${DEMO_VIDEO}»…`;
    case 'escena':
      return `Mensaje sobre la escena «${DEMO_SCENE}»…`;
    case 'recursos_proyecto':
      return 'Pregunta por recursos del proyecto…';
    default:
      return 'Escribe aquí (sandbox)…';
  }
}

export function getSandboxContextLabel(ctx: SandboxChatContext): string | undefined {
  switch (ctx) {
    case 'dashboard':
      return 'Dashboard';
    case 'proyecto':
      return DEMO_PROJECT;
    case 'video':
      return `Video · ${DEMO_VIDEO}`;
    case 'escena':
      return `Escena · ${DEMO_SCENE}`;
    case 'recursos_proyecto':
      return 'Recursos';
    default:
      return undefined;
  }
}
