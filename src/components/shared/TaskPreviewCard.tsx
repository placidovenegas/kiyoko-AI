'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-danger-500/15 text-danger-500',
  high: 'bg-amber-500/15 text-amber-500',
  medium: 'bg-sky-500/15 text-sky-500',
  low: 'bg-muted text-muted-foreground',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

interface TaskPreviewCardProps {
  title: string;
  projectName?: string;
  priority?: string;
  dueDate?: string | null;
  href: string;
  className?: string;
}

export function TaskPreviewCard({ title, projectName, priority, dueDate, href, className }: TaskPreviewCardProps) {
  const priorityStyle = PRIORITY_STYLES[priority ?? 'low'] ?? PRIORITY_STYLES.low;
  const priorityLabel = PRIORITY_LABELS[priority ?? 'low'] ?? priority;

  return (
    <div className={cn('rounded-2xl border border-border bg-card px-3 py-3 transition-colors hover:border-primary/20', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        {priority && (
          <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase', priorityStyle)}>
            {priorityLabel}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {projectName && <span className="truncate max-w-32">{projectName}</span>}
          {dueDate && (
            <>
              <span className="text-border">·</span>
              <span>{new Date(dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            </>
          )}
        </div>
        <Link
          href={href}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Abrir
        </Link>
      </div>
    </div>
  );
}
