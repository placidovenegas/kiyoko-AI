'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ChatFollowUpListProps {
  title?: string;
  items: string[];
  onSelect: (item: string, index: number) => void;
  /** Retraso entre ítems (ms), p. ej. sugerencias V8 */
  staggerMs?: number;
}

/**
 * Lista vertical de siguientes pasos / sugerencias — chevrón fino, texto apagado (referencia UI oscura).
 */
export function ChatFollowUpList({
  title = '¿Siguiente paso?',
  items,
  onSelect,
  staggerMs = 0,
}: ChatFollowUpListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2.5 pt-1">
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-tight">
        {title}
      </p>
      <ul className="space-y-0">
        {items.map((item, i) => (
          <li key={`${item}-${i}`}>
            <motion.button
              type="button"
              initial={staggerMs > 0 ? { opacity: 0, y: 4 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                staggerMs > 0
                  ? { delay: (i * staggerMs) / 1000, duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                  : undefined
              }
              onClick={() => onSelect(item, i)}
              className={cn(
                'group flex w-full items-center gap-2.5 rounded-md py-2 pl-0 pr-2 text-left',
                'text-[12px] leading-snug text-muted-foreground/85',
                'transition-colors hover:bg-muted/50 hover:text-foreground/90',
              )}
            >
              <ChevronRight
                size={11}
                strokeWidth={2}
                className="shrink-0 text-muted-foreground/45 group-hover:text-muted-foreground/70"
                aria-hidden
              />
              <span className="min-w-0">{item}</span>
            </motion.button>
          </li>
        ))}
      </ul>
    </div>
  );
}
