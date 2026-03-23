'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import {
  Film, MoreHorizontal, Eye, Pencil, Camera, Clapperboard,
  Sparkles, Copy, Plus, ArrowUpDown, Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import type { Scene } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-500',
  prompt_ready: 'bg-blue-500',
  generating: 'bg-amber-500 animate-pulse',
  generated: 'bg-purple-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompt_ready: 'Prompt listo',
  generating: 'Generando',
  generated: 'Generado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const PHASE_STYLES: Record<string, string> = {
  hook: 'bg-red-500/80 text-white',
  build: 'bg-amber-500/80 text-white',
  peak: 'bg-emerald-500/80 text-white',
  close: 'bg-blue-500/80 text-white',
};

const ALL_STATUSES = ['draft', 'prompt_ready', 'generating', 'generated', 'approved', 'rejected'] as const;
const ALL_PHASES = ['hook', 'build', 'peak', 'close'] as const;

interface SceneCardProps {
  scene: Scene;
  basePath: string;
  characters?: Array<{ initials: string; color_accent: string | null; name: string }>;
  onAction?: (action: string, scene: Scene) => void;
}

export function SceneCard({ scene, basePath, characters = [], onAction }: SceneCardProps) {
  const sceneLink = scene.short_id
    ? `${basePath}/scene/${scene.short_id}`
    : `${basePath}/scenes`;

  // Extension count is not stored on the scene row; we show a placeholder indicator
  const extensionCount = 0;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card',
        'transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
      )}
    >
      {/* Thumbnail area */}
      <Link href={sceneLink} className="relative aspect-video w-full bg-background flex items-center justify-center">
        <Film className="h-8 w-8 text-muted-foreground/60" />
        {/* Scene number badge */}
        <div className="absolute top-2 left-2 flex h-6 items-center justify-center rounded-md bg-black/70 px-1.5 text-[10px] font-bold text-white backdrop-blur-sm">
          #{scene.scene_number}
        </div>
        {/* Phase badge */}
        {scene.arc_phase && (
          <div className={cn(
            'absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm',
            PHASE_STYLES[scene.arc_phase] ?? 'bg-zinc-500/80 text-white',
          )}>
            {scene.arc_phase}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={sceneLink}>
          <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
            {scene.title}
          </h4>
        </Link>

        {/* Client annotation */}
        {scene.client_annotation && (
          <p className="text-xs italic text-muted-foreground line-clamp-2">
            &ldquo;{scene.client_annotation}&rdquo;
          </p>
        )}

        {/* Duration + clip indicators */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{scene.duration_seconds ?? 5}s</span>
          <span className="text-muted-foreground/40">&middot;</span>
          <span className="inline-flex items-center gap-0.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-purple-500/40 border border-purple-500/50" title="Clip base" />
            {extensionCount > 0 && (
              <span className="text-blue-400 font-medium">+{extensionCount}</span>
            )}
          </span>
        </div>

        {/* Characters avatars */}
        {characters.length > 0 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            {characters.slice(0, 4).map((c, i) => (
              <div
                key={i}
                className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ backgroundColor: c.color_accent ?? '#6B7280' }}
                title={c.name}
              >
                {c.initials?.slice(0, 2)}
              </div>
            ))}
            {characters.length > 4 && (
              <span className="ml-1 text-[10px] text-muted-foreground">+{characters.length - 4}</span>
            )}
          </div>
        )}

        {/* Bottom row: status + dropdown */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <div
              className={cn('h-2 w-2 rounded-full', STATUS_COLORS[scene.status ?? 'draft'])}
            />
            <span className="text-[10px] text-muted-foreground">
              {STATUS_LABELS[scene.status ?? 'draft']}
            </span>
          </div>

          {/* Dropdown trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground',
                  'opacity-0 transition-opacity group-hover:opacity-100',
                  'hover:bg-secondary hover:text-foreground',
                )}
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => onAction?.('view', scene)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('edit', scene)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar inline
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onAction?.('regen-image', scene)}>
                <Camera className="mr-2 h-4 w-4" />
                Regenerar imagen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('regen-clips', scene)}>
                <Clapperboard className="mr-2 h-4 w-4" />
                Regenerar clips
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('improve-ai', scene)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Mejorar con IA
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onAction?.('duplicate', scene)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar escena
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('insert-before', scene)}>
                <Plus className="mr-2 h-4 w-4" />
                Insertar escena antes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('insert-after', scene)}>
                <Plus className="mr-2 h-4 w-4" />
                Insertar escena despues
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Cambiar estado
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {ALL_STATUSES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => onAction?.(`status:${s}`, scene)}
                    >
                      <div className={cn('mr-2 h-2 w-2 rounded-full', STATUS_COLORS[s])} />
                      {STATUS_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Cambiar fase
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {ALL_PHASES.map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => onAction?.(`phase:${p}`, scene)}
                    >
                      <div className={cn('mr-2 h-2 w-2 rounded-full', PHASE_STYLES[p].split(' ')[0])} />
                      {p}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-400 focus:text-red-400"
                onClick={() => onAction?.('delete', scene)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
