'use client';

import { ArrowRight } from 'lucide-react';

export interface DiffViewProps {
  field: string;
  before: string;
  after: string;
}

export function DiffView({ field, before, after }: DiffViewProps) {
  return (
    <div className="mt-2.5 rounded-lg border border-border overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border-b border-border">
        <ArrowRight size={10} className="text-muted-foreground shrink-0" />
        <span className="font-semibold text-foreground">{field}</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border">
        {/* Before */}
        <div className="p-3 bg-red-50 dark:bg-red-950/20">
          <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1.5">
            Antes
          </p>
          <p className="text-foreground/70 leading-relaxed whitespace-pre-wrap line-through decoration-red-400/40">
            {before}
          </p>
        </div>

        {/* After */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20">
          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1.5">
            Ahora
          </p>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap font-medium">
            {after}
          </p>
        </div>
      </div>
    </div>
  );
}
