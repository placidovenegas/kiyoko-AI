'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/* ── Types ────────────────────────────────────────────────── */

export type StatusValue =
  | 'draft'
  | 'prompt_ready'
  | 'generating'
  | 'generated'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'archived';

/* ── Config ───────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  StatusValue,
  { label: string; badge: string; dot: string; pulse?: boolean }
> = {
  draft: {
    label: 'Draft',
    badge: 'bg-default-100 text-default-600 dark:bg-default-800 dark:text-default-400',
    dot:   'bg-default-400',
  },
  prompt_ready: {
    label: 'Prompt Ready',
    badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
    dot:   'bg-primary-500',
  },
  generating: {
    label: 'Generating',
    badge: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-400',
    dot:   'bg-warning-500',
    pulse: true,
  },
  generated: {
    label: 'Generated',
    badge: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300',
    dot:   'bg-secondary-500',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-400',
    dot:   'bg-success-500',
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400',
    dot:   'bg-danger-500',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
    dot:   'bg-primary-500',
    pulse: true,
  },
  completed: {
    label: 'Completed',
    badge: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-400',
    dot:   'bg-success-500',
  },
  archived: {
    label: 'Archived',
    badge: 'bg-default-100 text-default-500 dark:bg-default-800 dark:text-default-500',
    dot:   'bg-default-400',
  },
};

/* ── Props ────────────────────────────────────────────────── */

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status:   StatusValue;
  showDot?: boolean;
}

/* ── Component ───────────────────────────────────────────── */

export function StatusBadge({ status, showDot = true, className, ...props }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        config.badge,
        className,
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            config.dot,
            config.pulse && 'animate-pulse',
          )}
        />
      )}
      {config.label}
    </span>
  );
}
