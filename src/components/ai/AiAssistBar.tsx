'use client';

import type { ElementType } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils/cn';

export interface AiAssistAction {
  id: string;
  label: string;
  description: string;
  icon: ElementType;
}

interface AiAssistBarProps {
  title: string;
  description: string;
  actions: AiAssistAction[];
  activeActionId?: string | null;
  onAction: (action: AiAssistAction) => void;
}

export function AiAssistBar({
  title,
  description,
  actions,
  activeActionId,
  onAction,
}: AiAssistBarProps) {
  return (
    <section className="rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = activeActionId === action.id;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action)}
              className={cn(
                'flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition',
                isActive
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-background hover:border-primary/20 hover:bg-secondary/60'
              )}
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
        <p className="text-xs text-muted-foreground">La asistencia usa el contexto real de esta página para proponer acciones concretas.</p>
        <Button variant="secondary" size="sm">IA contextual</Button>
      </div>
    </section>
  );
}