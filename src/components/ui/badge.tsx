'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/* ── Variants ─────────────────────────────────────────────── */

export const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium transition-colors',
  {
    variants: {
      variant: {
        solid:  '',
        flat:   '',
        faded:  'border',
        shadow: '',
      },
      color: {
        default:   '',
        primary:   '',
        secondary: '',
        success:   '',
        warning:   '',
        danger:    '',
      },
      size: {
        sm: 'h-4 px-1.5 text-[10px]',
        md: 'h-5 px-2 text-xs',
        lg: 'h-6 px-2.5 text-sm',
      },
      radius: {
        none: 'rounded-none',
        sm:   'rounded',
        md:   'rounded-md',
        lg:   'rounded-lg',
        full: 'rounded-full',
      },
    },
    compoundVariants: [
      /* ── solid ── */
      { variant: 'solid', color: 'default',   class: 'bg-default-400 text-white' },
      { variant: 'solid', color: 'primary',   class: 'bg-primary-500 text-white' },
      { variant: 'solid', color: 'secondary', class: 'bg-secondary-500 text-white' },
      { variant: 'solid', color: 'success',   class: 'bg-success-500 text-white' },
      { variant: 'solid', color: 'warning',   class: 'bg-warning-500 text-white' },
      { variant: 'solid', color: 'danger',    class: 'bg-danger-500 text-white' },

      /* ── flat ── */
      { variant: 'flat', color: 'default',   class: 'bg-default-100 text-default-700 dark:bg-default-800 dark:text-default-200' },
      { variant: 'flat', color: 'primary',   class: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' },
      { variant: 'flat', color: 'secondary', class: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300' },
      { variant: 'flat', color: 'success',   class: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-400' },
      { variant: 'flat', color: 'warning',   class: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-400' },
      { variant: 'flat', color: 'danger',    class: 'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400' },

      /* ── faded ── */
      { variant: 'faded', color: 'default',   class: 'bg-default-50 text-default-600 border-default-200 dark:bg-default-900 dark:text-default-300 dark:border-default-700' },
      { variant: 'faded', color: 'primary',   class: 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700' },
      { variant: 'faded', color: 'secondary', class: 'bg-secondary-50 text-secondary-600 border-secondary-200 dark:bg-secondary-900 dark:text-secondary-300 dark:border-secondary-700' },
      { variant: 'faded', color: 'success',   class: 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900 dark:text-success-400 dark:border-success-700' },
      { variant: 'faded', color: 'warning',   class: 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900 dark:text-warning-400 dark:border-warning-700' },
      { variant: 'faded', color: 'danger',    class: 'bg-danger-50 text-danger-600 border-danger-200 dark:bg-danger-900 dark:text-danger-400 dark:border-danger-700' },

      /* ── shadow ── */
      { variant: 'shadow', color: 'default',   class: 'bg-default-400 text-white shadow-md shadow-default-300/50' },
      { variant: 'shadow', color: 'primary',   class: 'bg-primary-500 text-white shadow-md shadow-primary-400/50' },
      { variant: 'shadow', color: 'secondary', class: 'bg-secondary-500 text-white shadow-md shadow-secondary-400/50' },
      { variant: 'shadow', color: 'success',   class: 'bg-success-500 text-white shadow-md shadow-success-400/50' },
      { variant: 'shadow', color: 'warning',   class: 'bg-warning-500 text-white shadow-md shadow-warning-400/50' },
      { variant: 'shadow', color: 'danger',    class: 'bg-danger-500 text-white shadow-md shadow-danger-400/50' },
    ],
    defaultVariants: {
      variant: 'flat',
      color:   'default',
      size:    'md',
      radius:  'full',
    },
  }
);

/* ── Types ────────────────────────────────────────────────── */

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof badgeVariants> {}

/* ── Component ───────────────────────────────────────────── */

export function Badge({ className, variant, color, size, radius, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, color, size, radius }), className)}
      {...props}
    />
  );
}
