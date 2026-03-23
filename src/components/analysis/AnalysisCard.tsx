'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AnalysisCardProps {
  type: 'strength' | 'weakness' | 'suggestion';
  title: string;
  detail: string;
  affectedScenes?: number[];
  severity?: string;
  suggestionType?: string;
  priority?: string;
  autoApplicable?: boolean;
  onApply?: () => void;
  onSceneClick?: (sceneNumber: number) => void;
}

const TYPE_CONFIG = {
  strength: { icon: '\u2705', accent: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
  weakness: { icon: '\u26A0\uFE0F', accent: 'border-amber-500/30', bg: 'bg-amber-500/5' },
  suggestion: { icon: '\uD83D\uDCA1', accent: 'border-blue-500/30', bg: 'bg-blue-500/5' },
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-yellow-500/10 text-yellow-400',
  medium: 'bg-orange-500/10 text-orange-400',
  high: 'bg-red-500/10 text-red-400',
};

export function AnalysisCard({
  type,
  title,
  detail,
  affectedScenes,
  severity,
  autoApplicable,
  onApply,
  onSceneClick,
}: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[type];

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden transition', config.accent, config.bg)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-lg">{config.icon}</span>
        <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
        {severity && (
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', SEVERITY_COLORS[severity])}>
            {severity}
          </span>
        )}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
          {affectedScenes && affectedScenes.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Escenas:</span>
              {affectedScenes.map((n) => (
                <button
                  key={n}
                  onClick={() => onSceneClick?.(n)}
                  className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-[11px] font-medium text-foreground transition hover:bg-primary hover:text-white"
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {type === 'suggestion' && autoApplicable && onApply && (
            <button
              onClick={onApply}
              className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary/80"
            >
              Aplicar automaticamente
            </button>
          )}
        </div>
      )}
    </div>
  );
}
