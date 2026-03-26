'use client';

import { KiyokoIcon } from '@/components/ui/logo';
import { cn } from '@/lib/utils/cn';

export function CreationCancelledCard({
  subtitle = 'Puedes intentarlo de nuevo cuando quieras.',
  className,
}: {
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex size-4 shrink-0 items-center justify-center rounded bg-primary">
          <KiyokoIcon size={10} className="text-primary-foreground" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Kiyoko AI
        </span>
      </div>
      <div
        className={cn(
          'flex gap-3 rounded-xl border px-3.5 py-3',
          'border-fuchsia-500/35 bg-card/80',
          'dark:border-violet-500/40 dark:bg-muted/30',
        )}
      >
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background/80"
          aria-hidden
        >
          <span className="size-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.65)]" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[13px] font-semibold text-foreground">Creación cancelada</p>
          <p className="text-[12px] leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
