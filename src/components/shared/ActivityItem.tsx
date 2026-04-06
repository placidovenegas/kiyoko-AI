'use client';

import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';

const ACTION_LABELS: Record<string, string> = {
  created: 'Creado',
  updated: 'Actualizado',
  deleted: 'Eliminado',
  generated: 'Generado',
  analyzed: 'Analizado',
  exported: 'Exportado',
  duplicated: 'Duplicado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  archived: 'Archivado',
  published: 'Publicado',
  scheduled: 'Programado',
};

const ENTITY_LABELS: Record<string, string> = {
  project: 'proyecto',
  video: 'video',
  scene: 'escena',
  character: 'personaje',
  background: 'fondo',
  task: 'tarea',
  narration: 'narración',
  publication: 'publicación',
  prompt: 'prompt',
  analysis: 'análisis',
};

interface ActivityItemProps {
  action: string;
  entityType: string;
  timestamp: string;
  className?: string;
}

export function ActivityItem({ action, entityType, timestamp, className }: ActivityItemProps) {
  const actionLabel = ACTION_LABELS[action] ?? action;
  const entityLabel = ENTITY_LABELS[entityType] ?? entityType;
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: es });

  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3', className)}>
      <div className="flex items-center justify-center size-9 shrink-0 rounded-full bg-primary/10">
        <Activity className="size-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium text-foreground">{actionLabel}</span>
          {' '}
          <span className="text-muted-foreground">{entityLabel}</span>
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo}</span>
    </div>
  );
}
