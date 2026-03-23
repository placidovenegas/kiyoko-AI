'use client';

import { forwardRef } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/* ── Variants ─────────────────────────────────────────────── */

export const chipVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        solid:   '',
        flat:    '',
        faded:   'border',
        bordered: 'border-2 bg-transparent',
        dot:     'pl-1.5',
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
        sm: 'h-5 px-1.5 text-[11px]',
        md: 'h-6 px-2 text-xs',
        lg: 'h-7 px-2.5 text-sm',
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
      /* solid */
      { variant: 'solid', color: 'default',   class: 'bg-default-400 text-white' },
      { variant: 'solid', color: 'primary',   class: 'bg-primary-500 text-white' },
      { variant: 'solid', color: 'secondary', class: 'bg-secondary-500 text-white' },
      { variant: 'solid', color: 'success',   class: 'bg-success-500 text-white' },
      { variant: 'solid', color: 'warning',   class: 'bg-warning-500 text-white' },
      { variant: 'solid', color: 'danger',    class: 'bg-danger-500 text-white' },

      /* flat */
      { variant: 'flat', color: 'default',   class: 'bg-default-100 text-default-700 dark:bg-default-800 dark:text-default-200' },
      { variant: 'flat', color: 'primary',   class: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' },
      { variant: 'flat', color: 'secondary', class: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300' },
      { variant: 'flat', color: 'success',   class: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-400' },
      { variant: 'flat', color: 'warning',   class: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-400' },
      { variant: 'flat', color: 'danger',    class: 'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400' },

      /* faded */
      { variant: 'faded', color: 'default',   class: 'bg-default-50 text-default-600 border-default-200 dark:bg-default-900 dark:text-default-300 dark:border-default-700' },
      { variant: 'faded', color: 'primary',   class: 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-700' },
      { variant: 'faded', color: 'secondary', class: 'bg-secondary-50 text-secondary-600 border-secondary-200 dark:bg-secondary-900 dark:text-secondary-300 dark:border-secondary-700' },
      { variant: 'faded', color: 'success',   class: 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900 dark:text-success-400 dark:border-success-700' },
      { variant: 'faded', color: 'warning',   class: 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900 dark:text-warning-400 dark:border-warning-700' },
      { variant: 'faded', color: 'danger',    class: 'bg-danger-50 text-danger-600 border-danger-200 dark:bg-danger-900 dark:text-danger-400 dark:border-danger-700' },

      /* bordered */
      { variant: 'bordered', color: 'default',   class: 'border-default-300 text-default-600 dark:border-default-600 dark:text-default-300' },
      { variant: 'bordered', color: 'primary',   class: 'border-primary-500 text-primary-500' },
      { variant: 'bordered', color: 'secondary', class: 'border-secondary-500 text-secondary-500' },
      { variant: 'bordered', color: 'success',   class: 'border-success-500 text-success-600 dark:text-success-400' },
      { variant: 'bordered', color: 'warning',   class: 'border-warning-500 text-warning-600 dark:text-warning-400' },
      { variant: 'bordered', color: 'danger',    class: 'border-danger-500 text-danger-500' },

      /* dot — same bg as flat */
      { variant: 'dot', color: 'default',   class: 'bg-default-100 text-default-700 dark:bg-default-800 dark:text-default-200' },
      { variant: 'dot', color: 'primary',   class: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' },
      { variant: 'dot', color: 'secondary', class: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300' },
      { variant: 'dot', color: 'success',   class: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-400' },
      { variant: 'dot', color: 'warning',   class: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-400' },
      { variant: 'dot', color: 'danger',    class: 'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400' },

      /* dot sizes override padding-left */
      { variant: 'dot', size: 'sm', class: 'pl-1' },
      { variant: 'dot', size: 'md', class: 'pl-1.5' },
      { variant: 'dot', size: 'lg', class: 'pl-2' },
    ],
    defaultVariants: {
      variant: 'flat',
      color:   'default',
      size:    'md',
      radius:  'full',
    },
  }
);

const DOT_COLOR: Record<string, string> = {
  default:   'bg-default-400',
  primary:   'bg-primary-500',
  secondary: 'bg-secondary-500',
  success:   'bg-success-500',
  warning:   'bg-warning-500',
  danger:    'bg-danger-500',
};

const CLOSE_COLOR: Record<string, string> = {
  default:   'hover:bg-default-200 dark:hover:bg-default-700',
  primary:   'hover:bg-primary-200 dark:hover:bg-primary-800',
  secondary: 'hover:bg-secondary-200 dark:hover:bg-secondary-800',
  success:   'hover:bg-success-200 dark:hover:bg-success-800',
  warning:   'hover:bg-warning-200 dark:hover:bg-warning-800',
  danger:    'hover:bg-danger-200 dark:hover:bg-danger-800',
};

/* ── Types ────────────────────────────────────────────────── */

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof chipVariants> {
  startContent?: React.ReactNode;
  endContent?:   React.ReactNode;
  onClose?:      () => void;
  isDisabled?:   boolean;
}

/* ── Component ───────────────────────────────────────────── */

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      className,
      variant = 'flat',
      color   = 'default',
      size    = 'md',
      radius  = 'full',
      startContent,
      endContent,
      onClose,
      isDisabled,
      children,
      ...props
    },
    ref
  ) => {
    const colorKey  = color ?? 'default';
    const showDot   = variant === 'dot';
    const iconSize  = size === 'sm' ? 'size-2.5' : size === 'lg' ? 'size-3.5' : 'size-3';

    return (
      <span
        ref={ref}
        data-slot="chip"
        data-disabled={isDisabled || undefined}
        className={cn(
          chipVariants({ variant, color, size, radius }),
          isDisabled && 'pointer-events-none opacity-50',
          className
        )}
        {...props}
      >
        {/* Dot indicator */}
        {showDot && (
          <span className={cn('shrink-0 rounded-full', iconSize, DOT_COLOR[colorKey])} />
        )}

        {/* Start content */}
        {!showDot && startContent && (
          <span className="shrink-0">{startContent}</span>
        )}

        {/* Label */}
        <span className="truncate">{children}</span>

        {/* End content */}
        {endContent && !onClose && (
          <span className="shrink-0">{endContent}</span>
        )}

        {/* Close button */}
        {onClose && (
          <button
            type="button"
            aria-label="Remove"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-full transition-colors',
              iconSize,
              CLOSE_COLOR[colorKey],
            )}
          >
            <X className="size-full" />
          </button>
        )}
      </span>
    );
  }
);
Chip.displayName = 'Chip';
