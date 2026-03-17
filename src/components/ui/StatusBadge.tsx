'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

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

const statusStyles: Record<StatusValue, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400',
  prompt_ready: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  generating: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 animate-pulse',
  generated: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  in_progress: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-500',
} as const;

const statusLabels: Record<StatusValue, string> = {
  draft: 'Draft',
  prompt_ready: 'Prompt Ready',
  generating: 'Generating',
  generated: 'Generated',
  approved: 'Approved',
  rejected: 'Rejected',
  in_progress: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusValue;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className,
      )}
      {...props}
    >
      {statusLabels[status]}
    </span>
  );
}
