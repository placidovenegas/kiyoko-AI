'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, actions, className, compact }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-8' : 'py-16',
      className,
    )}>
      <div className={cn(
        'flex items-center justify-center rounded-2xl bg-muted/50',
        compact ? 'size-12 mb-3' : 'size-16 mb-4',
      )}>
        <Icon className={cn('text-muted-foreground', compact ? 'size-6' : 'size-7')} />
      </div>
      <h3 className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-base')}>{title}</h3>
      {description && (
        <p className={cn('mt-1 max-w-sm text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>{description}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                  action.variant === 'ghost'
                    ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              >
                {ActionIcon && <ActionIcon className="size-4" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
