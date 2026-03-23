'use client';

import { forwardRef } from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ── Variants ─────────────────────────────────────────────── */

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-all outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        solid:   '',
        bordered: 'border-2 bg-transparent',
        light:   'bg-transparent',
        flat:    '',
        faded:   'border',
        ghost:   'bg-transparent border-transparent',
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
        xs: 'h-6 px-2 text-[11px] gap-1',
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-sm',
        lg: 'h-11 px-5 text-base',
      },
      radius: {
        none: 'rounded-none',
        sm:   'rounded-md',
        md:   'rounded-lg',
        lg:   'rounded-xl',
        full: 'rounded-full',
      },
      isIconOnly: {
        true:  'px-0',
        false: '',
      },
      fullWidth: {
        true:  'w-full',
        false: '',
      },
    },
    compoundVariants: [
      /* ── solid ── */
      { variant: 'solid', color: 'default',   class: 'bg-default-400 text-white hover:bg-default-500 focus-visible:ring-default-300' },
      { variant: 'solid', color: 'primary',   class: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-300' },
      { variant: 'solid', color: 'secondary', class: 'bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-300' },
      { variant: 'solid', color: 'success',   class: 'bg-success-500 text-white hover:bg-success-600 focus-visible:ring-success-300' },
      { variant: 'solid', color: 'warning',   class: 'bg-warning-500 text-white hover:bg-warning-600 focus-visible:ring-warning-300' },
      { variant: 'solid', color: 'danger',    class: 'bg-danger-500 text-white hover:bg-danger-600 focus-visible:ring-danger-300' },

      /* ── bordered ── */
      { variant: 'bordered', color: 'default',   class: 'border-default-300 text-default-700 hover:bg-default-100 focus-visible:ring-default-200 dark:border-default-600 dark:text-default-300 dark:hover:bg-default-800' },
      { variant: 'bordered', color: 'primary',   class: 'border-primary-500 text-primary-500 hover:bg-primary-50 focus-visible:ring-primary-300 dark:hover:bg-primary-900' },
      { variant: 'bordered', color: 'secondary', class: 'border-secondary-500 text-secondary-500 hover:bg-secondary-50 focus-visible:ring-secondary-300 dark:hover:bg-secondary-900' },
      { variant: 'bordered', color: 'success',   class: 'border-success-500 text-success-600 hover:bg-success-50 focus-visible:ring-success-300 dark:text-success-400 dark:hover:bg-success-900' },
      { variant: 'bordered', color: 'warning',   class: 'border-warning-500 text-warning-600 hover:bg-warning-50 focus-visible:ring-warning-300 dark:text-warning-400 dark:hover:bg-warning-900' },
      { variant: 'bordered', color: 'danger',    class: 'border-danger-500 text-danger-500 hover:bg-danger-50 focus-visible:ring-danger-300 dark:hover:bg-danger-900' },

      /* ── light ── */
      { variant: 'light', color: 'default',   class: 'text-default-700 hover:bg-default-100 focus-visible:ring-default-200 dark:text-default-300 dark:hover:bg-default-800' },
      { variant: 'light', color: 'primary',   class: 'text-primary-500 hover:bg-primary-100 focus-visible:ring-primary-200 dark:hover:bg-primary-900' },
      { variant: 'light', color: 'secondary', class: 'text-secondary-500 hover:bg-secondary-100 focus-visible:ring-secondary-200 dark:hover:bg-secondary-900' },
      { variant: 'light', color: 'success',   class: 'text-success-600 hover:bg-success-100 focus-visible:ring-success-200 dark:text-success-400 dark:hover:bg-success-900' },
      { variant: 'light', color: 'warning',   class: 'text-warning-600 hover:bg-warning-100 focus-visible:ring-warning-200 dark:text-warning-400 dark:hover:bg-warning-900' },
      { variant: 'light', color: 'danger',    class: 'text-danger-500 hover:bg-danger-100 focus-visible:ring-danger-200 dark:hover:bg-danger-900' },

      /* ── flat ── */
      { variant: 'flat', color: 'default',   class: 'bg-default-100 text-default-700 hover:bg-default-200 focus-visible:ring-default-200 dark:bg-default-800 dark:text-default-200 dark:hover:bg-default-700' },
      { variant: 'flat', color: 'primary',   class: 'bg-primary-100 text-primary-600 hover:bg-primary-200 focus-visible:ring-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800' },
      { variant: 'flat', color: 'secondary', class: 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200 focus-visible:ring-secondary-200 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800' },
      { variant: 'flat', color: 'success',   class: 'bg-success-100 text-success-700 hover:bg-success-200 focus-visible:ring-success-200 dark:bg-success-900 dark:text-success-400 dark:hover:bg-success-800' },
      { variant: 'flat', color: 'warning',   class: 'bg-warning-100 text-warning-700 hover:bg-warning-200 focus-visible:ring-warning-200 dark:bg-warning-900 dark:text-warning-400 dark:hover:bg-warning-800' },
      { variant: 'flat', color: 'danger',    class: 'bg-danger-100 text-danger-600 hover:bg-danger-200 focus-visible:ring-danger-200 dark:bg-danger-900 dark:text-danger-400 dark:hover:bg-danger-800' },

      /* ── faded ── */
      { variant: 'faded', color: 'default',   class: 'bg-default-100 text-default-700 border-default-200 hover:bg-default-200 dark:bg-default-800 dark:text-default-200 dark:border-default-700' },
      { variant: 'faded', color: 'primary',   class: 'bg-primary-50 text-primary-600 border-primary-200 hover:bg-primary-100 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-800' },
      { variant: 'faded', color: 'secondary', class: 'bg-secondary-50 text-secondary-600 border-secondary-200 hover:bg-secondary-100 dark:bg-secondary-900 dark:text-secondary-300 dark:border-secondary-800' },
      { variant: 'faded', color: 'success',   class: 'bg-success-50 text-success-700 border-success-200 hover:bg-success-100 dark:bg-success-900 dark:text-success-400 dark:border-success-800' },
      { variant: 'faded', color: 'warning',   class: 'bg-warning-50 text-warning-700 border-warning-200 hover:bg-warning-100 dark:bg-warning-900 dark:text-warning-400 dark:border-warning-800' },
      { variant: 'faded', color: 'danger',    class: 'bg-danger-50 text-danger-600 border-danger-200 hover:bg-danger-100 dark:bg-danger-900 dark:text-danger-400 dark:border-danger-800' },

      /* ── ghost ── */
      { variant: 'ghost', color: 'default',   class: 'text-default-700 hover:bg-default-400 hover:text-white dark:text-default-300 dark:hover:bg-default-600' },
      { variant: 'ghost', color: 'primary',   class: 'text-primary-500 hover:bg-primary-500 hover:text-white' },
      { variant: 'ghost', color: 'secondary', class: 'text-secondary-500 hover:bg-secondary-500 hover:text-white' },
      { variant: 'ghost', color: 'success',   class: 'text-success-600 hover:bg-success-500 hover:text-white dark:text-success-400' },
      { variant: 'ghost', color: 'warning',   class: 'text-warning-600 hover:bg-warning-500 hover:text-white dark:text-warning-400' },
      { variant: 'ghost', color: 'danger',    class: 'text-danger-500 hover:bg-danger-500 hover:text-white' },

      /* ── icon-only sizes ── */
      { size: 'xs', isIconOnly: true, class: 'size-6' },
      { size: 'sm', isIconOnly: true, class: 'size-7' },
      { size: 'md', isIconOnly: true, class: 'size-9' },
      { size: 'lg', isIconOnly: true, class: 'size-11' },
    ],
    defaultVariants: {
      variant:    'solid',
      color:      'default',
      size:       'md',
      radius:     'md',
      isIconOnly: false,
      fullWidth:  false,
    },
  }
);

/* ── Types ────────────────────────────────────────────────── */

export interface ButtonProps
  extends Omit<ButtonPrimitive.Props, 'color'>,
    VariantProps<typeof buttonVariants> {
  isLoading?:    boolean;
  startContent?: React.ReactNode;
  endContent?:   React.ReactNode;
}

/* ── Component ───────────────────────────────────────────── */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant    = 'solid',
      color      = 'default',
      size       = 'md',
      radius     = 'md',
      isIconOnly = false,
      fullWidth  = false,
      isLoading  = false,
      startContent,
      endContent,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants({ variant, color, size, radius, isIconOnly, fullWidth }),
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="size-[1em] animate-spin" />
        ) : (
          startContent && <span className="shrink-0">{startContent}</span>
        )}
        {children}
        {!isLoading && endContent && (
          <span className="shrink-0">{endContent}</span>
        )}
      </ButtonPrimitive>
    );
  }
);
Button.displayName = 'Button';
