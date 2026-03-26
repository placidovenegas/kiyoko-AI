'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ChatFollowUpList } from '@/components/chat/ChatFollowUpList';

export interface CreationSuccessData {
  name: string;
  entityLabel: string;
  /** p.ej. CHARACTER, VIDEO, BACKGROUND */
  badge: string;
  nextSteps: string[];
  onStep?: (label: string, index: number) => void;
}

/**
 * Post-creación (V8): tarjeta de éxito + “¿Siguiente paso?” — referencia visual unificada.
 */
export function CreationSuccessCard({ data }: { data: CreationSuccessData }) {
  const initial = data.name.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <motion.div
      className="space-y-4 mt-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={cn(
          'relative flex items-stretch gap-3 rounded-xl border px-3 py-3',
          'border-emerald-500/45 bg-emerald-950/25 dark:bg-emerald-950/35',
          'shadow-[0_0_0_1px_rgba(16,185,129,0.12)]',
        )}
      >
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-lg',
            'bg-emerald-600/30 text-lg font-bold text-emerald-200',
          )}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{data.name}</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {data.badge}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{data.entityLabel}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <Check size={14} strokeWidth={2.5} className="shrink-0" />
            Creado y guardado
          </div>
        </div>
        <Sparkles size={16} className="absolute right-3 top-3 text-emerald-400/80 shrink-0" aria-hidden />
      </div>

      {data.nextSteps.length > 0 && (
        <ChatFollowUpList
          title="¿Siguiente paso?"
          items={data.nextSteps}
          onSelect={(step, i) => data.onStep?.(step, i)}
        />
      )}
    </motion.div>
  );
}
