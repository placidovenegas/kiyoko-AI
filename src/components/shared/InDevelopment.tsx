'use client';

import { Construction } from 'lucide-react';

interface InDevelopmentProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function InDevelopment({
  title = 'En desarrollo',
  description = 'Esta seccion estara disponible proximamente.',
  compact = false,
}: InDevelopmentProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
        <Construction className="size-3.5 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-400">{title} — {description}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 py-16 px-6">
      <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 mb-4">
        <Construction className="size-6 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">{description}</p>
      <span className="mt-4 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[10px] font-medium text-amber-400 uppercase tracking-wider">
        Proximamente
      </span>
    </div>
  );
}
