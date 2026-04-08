'use client';

import { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

export interface AiResultSection {
  title: string;
  items: string[];
}

export interface AiResultPayload {
  title: string;
  summary: string;
  sections: AiResultSection[];
  suggestions?: string[];
}

interface AiResultDrawerProps {
  open: boolean;
  result: AiResultPayload | null;
  onClose: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void | Promise<void>;
  isPrimaryActionLoading?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function AiResultDrawer({
  open,
  result,
  onClose,
}: AiResultDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">{result.title}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>

          {result.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{section.title}</h3>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <p key={item} className="text-sm text-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {!!result.suggestions?.length && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Siguientes pasos</h3>
              <ol className="space-y-1.5">
                {result.suggestions.map((suggestion, index) => (
                  <li key={suggestion} className="flex gap-2 text-sm text-foreground leading-relaxed">
                    <span className="shrink-0 text-primary font-semibold">{index + 1}.</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
