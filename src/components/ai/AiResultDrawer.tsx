'use client';

import { X, Sparkles } from 'lucide-react';
import { Button } from '@heroui/react';

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
  primaryActionLabel,
  onPrimaryAction,
  isPrimaryActionLoading,
  secondaryActionLabel,
  onSecondaryAction,
}: AiResultDrawerProps) {
  if (!open || !result) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{result.title}</p>
              <p className="text-xs text-muted-foreground">Resultado contextual</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" isIconOnly aria-label="Cerrar panel" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm leading-6 text-foreground">{result.summary}</p>
          </section>

          {result.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <div className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <div key={item} className="rounded-xl bg-secondary/60 px-3 py-2 text-sm text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {!!result.suggestions?.length && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Siguientes pasos</h3>
              <ol className="mt-3 space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <li key={suggestion} className="flex gap-3 rounded-xl bg-secondary/60 px-3 py-2 text-sm text-foreground">
                    <span className="font-semibold text-primary">{index + 1}.</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          {secondaryActionLabel && onSecondaryAction ? (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          {primaryActionLabel && onPrimaryAction ? (
            <Button variant="primary" size="sm" onClick={onPrimaryAction} isDisabled={isPrimaryActionLoading}>
              {isPrimaryActionLoading ? 'Aplicando...' : primaryActionLabel}
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}