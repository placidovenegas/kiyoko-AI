'use client';

import { Check, Save, Pencil, X, Film, User, Clapperboard, FolderOpen, Image, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreviewCardProps {
  type: 'scene' | 'video' | 'project' | 'character' | 'background' | 'prompt' | string;
  data: Record<string, unknown>;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  isConfirmed?: boolean;
  isExecuting?: boolean;
  confirmLabel?: string;
}

// ---------------------------------------------------------------------------
// Type metadata
// ---------------------------------------------------------------------------

interface TypeMeta {
  label: string;
  icon: React.ReactNode;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
}

function getTypeMeta(type: string): TypeMeta {
  switch (type) {
    case 'video':
      return {
        label: 'Video',
        icon: <Film size={14} />,
        borderColor: 'border-l-blue-500',
        badgeBg: 'bg-blue-500/10',
        badgeText: 'text-blue-400',
      };
    case 'character':
      return {
        label: 'Personaje',
        icon: <User size={14} />,
        borderColor: 'border-l-purple-500',
        badgeBg: 'bg-purple-500/10',
        badgeText: 'text-purple-400',
      };
    case 'scene':
      return {
        label: 'Escena',
        icon: <Clapperboard size={14} />,
        borderColor: 'border-l-amber-500',
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-400',
      };
    case 'project':
      return {
        label: 'Proyecto',
        icon: <FolderOpen size={14} />,
        borderColor: 'border-l-emerald-500',
        badgeBg: 'bg-emerald-500/10',
        badgeText: 'text-emerald-400',
      };
    case 'background':
      return {
        label: 'Fondo',
        icon: <Image size={14} />,
        borderColor: 'border-l-teal-500',
        badgeBg: 'bg-teal-500/10',
        badgeText: 'text-teal-400',
      };
    case 'prompt':
      return {
        label: 'Prompt',
        icon: <Pencil size={14} />,
        borderColor: 'border-l-cyan-500',
        badgeBg: 'bg-cyan-500/10',
        badgeText: 'text-cyan-400',
      };
    default:
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        icon: <FolderOpen size={14} />,
        borderColor: 'border-l-zinc-500',
        badgeBg: 'bg-zinc-500/10',
        badgeText: 'text-zinc-400',
      };
  }
}

// ---------------------------------------------------------------------------
// Field renderers
// ---------------------------------------------------------------------------

const PLATFORM_LABELS: Record<string, string> = {
  instagram_reels: '📸 Instagram Reels',
  instagram: '📸 Instagram',
  youtube: '▶️ YouTube',
  youtube_shorts: '▶️ YouTube Shorts',
  tiktok: '🎵 TikTok',
  twitter: '🐦 Twitter/X',
  linkedin: '💼 LinkedIn',
  facebook: '📘 Facebook',
};

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  draft:       { label: 'Borrador',   classes: 'bg-zinc-500/10 text-zinc-400' },
  generating:  { label: 'Generando',  classes: 'bg-amber-500/10 text-amber-400 animate-pulse' },
  review:      { label: 'En revisión', classes: 'bg-blue-500/10 text-blue-400' },
  approved:    { label: 'Aprobado',   classes: 'bg-emerald-500/10 text-emerald-400' },
  published:   { label: 'Publicado',  classes: 'bg-teal-500/10 text-teal-400' },
  archived:    { label: 'Archivado',  classes: 'bg-zinc-500/10 text-zinc-500' },
};

const ROLE_LABELS: Record<string, string> = {
  protagonist: 'Protagonista',
  antagonist:  'Antagonista',
  supporting:  'Secundario',
  narrator:    'Narrador',
  extra:       'Extra',
};

const FIELD_LABELS: Record<string, string> = {
  title:                    'Título',
  name:                     'Nombre',
  description:              'Descripción',
  platform:                 'Plataforma',
  target_duration_seconds:  'Duración',
  status:                   'Estado',
  role:                     'Rol',
  prompt:                   'Prompt',
  style:                    'Estilo',
  notes:                    'Notas',
  sort_order:               'Orden',
  arc_phase:                'Fase',
};

function renderFieldValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') return null;

  if (key === 'platform' && typeof value === 'string') {
    return PLATFORM_LABELS[value] ?? value;
  }

  if (key === 'target_duration_seconds' && typeof value === 'number') {
    return `${value} segundos`;
  }

  if (key === 'status' && typeof value === 'string') {
    const meta = STATUS_LABELS[value];
    if (meta) {
      return (
        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium', meta.classes)}>
          {meta.label}
        </span>
      );
    }
    return value;
  }

  if (key === 'role' && typeof value === 'string') {
    return ROLE_LABELS[value] ?? value;
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ');
}

// Priority order for displaying fields
const FIELD_PRIORITY = ['title', 'name', 'description', 'platform', 'role', 'status', 'target_duration_seconds'];

const HIDDEN_FIELDS = new Set([
  'owner_id', 'id', 'user_id', 'org_id', 'project_id', 'video_id', 'scene_id',
  'created_at', 'updated_at', 'short_id', 'slug',
]);

function getSortedEntries(data: Record<string, unknown>): [string, unknown][] {
  const allEntries = Object.entries(data).filter(([k, v]) =>
    !HIDDEN_FIELDS.has(k) &&
    !(typeof v === 'string' && v.startsWith('__') && v.endsWith('__')) // hide __CURRENT_USER_ID__ etc.
  );
  const prioritized = FIELD_PRIORITY.filter((k) => allEntries.some(([ek]) => ek === k))
    .map((k) => allEntries.find(([ek]) => ek === k)!);
  const rest = allEntries.filter(([k]) => !FIELD_PRIORITY.includes(k));
  return [...prioritized, ...rest];
}

// ---------------------------------------------------------------------------
// PreviewCard
// ---------------------------------------------------------------------------

export function PreviewCard({
  type,
  data,
  onConfirm,
  onEdit,
  onCancel,
  isConfirmed = false,
  isExecuting = false,
  confirmLabel,
}: PreviewCardProps) {
  const meta = getTypeMeta(type);
  const sortedEntries = getSortedEntries(data);

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden border-l-4',
        meta.borderColor,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className={cn('flex items-center justify-center w-6 h-6 rounded-md', meta.badgeBg, meta.badgeText)}>
          {meta.icon}
        </span>
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {meta.label}
        </span>
        {isConfirmed && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} />
            Guardado
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {sortedEntries.map(([key, value]) => {
          const rendered = renderFieldValue(key, value);
          if (rendered === null) return null;
          return (
            <div key={key} className="flex gap-2 text-sm">
              <span className="shrink-0 w-28 text-xs text-muted-foreground capitalize leading-5">
                {getFieldLabel(key)}
              </span>
              <span className="flex-1 text-xs text-foreground leading-5 break-words">
                {rendered}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        {isConfirmed ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Check size={14} />
            <span className="font-medium">Guardado correctamente</span>
          </div>
        ) : isExecuting ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin text-primary" />
            <span>Guardando en Supabase...</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Save size={12} />
              {confirmLabel ?? 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil size={12} />
              Cambiar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <X size={12} />
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
