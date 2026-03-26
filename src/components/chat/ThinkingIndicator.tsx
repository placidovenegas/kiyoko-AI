'use client';

import { cn } from '@/lib/utils/cn';

/**
 * Fase THINK (V8): puntos pulsantes mientras la IA “prepara” respuesta — antes del stream visible.
 */
export function ThinkingIndicator({ label = 'Pensando…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 pl-1" role="status" aria-live="polite">
      <div className="flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'size-2 rounded-full bg-primary/70',
              'animate-pulse',
            )}
            style={{ animationDelay: `${i * 160}ms`, animationDuration: '1s' }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
