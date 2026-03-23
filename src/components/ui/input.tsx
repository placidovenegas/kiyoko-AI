'use client';

import { forwardRef, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/* ── Variants ─────────────────────────────────────────────── */

const wrapperVariants = cva('group relative flex w-full flex-col gap-1');

const inputWrapperVariants = cva(
  'relative flex w-full items-center overflow-hidden transition-all',
  {
    variants: {
      variant: {
        flat:       'bg-muted/50 border border-transparent hover:bg-muted/80',
        bordered:   'bg-transparent border border-input hover:border-foreground/30',
        underlined: 'rounded-none bg-transparent border-b border-input px-0 hover:border-foreground/50',
        faded:      'bg-muted/30 border border-border hover:border-foreground/30',
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
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
      },
      radius: {
        none: 'rounded-none',
        sm:   'rounded-md',
        md:   'rounded-lg',
        lg:   'rounded-xl',
        full: 'rounded-full',
      },
      isInvalid: {
        true:  'border-red-500 dark:border-red-500',
        false: '',
      },
      isFocused: {
        true:  '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'flat',     color: 'primary',   class: 'focus-within:bg-primary/10 focus-within:border-primary/50' },
      { variant: 'flat',     color: 'success',   class: 'focus-within:bg-green-500/10 focus-within:border-green-500/50' },
      { variant: 'flat',     color: 'warning',   class: 'focus-within:bg-amber-500/10 focus-within:border-amber-500/50' },
      { variant: 'flat',     color: 'danger',    class: 'focus-within:bg-red-500/10 focus-within:border-red-500/50' },
      { variant: 'bordered', color: 'default',   class: 'focus-within:border-foreground/50' },
      { variant: 'bordered', color: 'primary',   class: 'focus-within:border-primary' },
      { variant: 'bordered', color: 'success',   class: 'focus-within:border-green-500' },
      { variant: 'bordered', color: 'warning',   class: 'focus-within:border-amber-500' },
      { variant: 'bordered', color: 'danger',    class: 'focus-within:border-red-500' },
      { variant: 'faded',    color: 'primary',   class: 'focus-within:border-primary/60' },
      { variant: 'underlined', radius: 'none',   class: '' },
      { variant: 'underlined', radius: 'sm',     class: 'rounded-none' },
      { variant: 'underlined', radius: 'md',     class: 'rounded-none' },
      { variant: 'underlined', radius: 'lg',     class: 'rounded-none' },
      { variant: 'underlined', radius: 'full',   class: 'rounded-none' },
    ],
    defaultVariants: {
      variant:   'flat',
      color:     'default',
      size:      'md',
      radius:    'md',
      isInvalid: false,
    },
  }
);

const inputBaseClass = cn(
  'h-full w-full min-w-0 bg-transparent px-3 text-sm text-foreground outline-none',
  'placeholder:text-muted-foreground',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground'
);

/* ── Types ────────────────────────────────────────────────── */

type InputWrapperVariantProps = VariantProps<typeof inputWrapperVariants>;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'>,
    Omit<InputWrapperVariantProps, 'isFocused'> {
  label?:        string;
  description?:  string;
  errorMessage?: string;
  isInvalid?:    boolean;
  startContent?: React.ReactNode;
  endContent?:   React.ReactNode;
}

/* ── Component ───────────────────────────────────────────── */

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant    = 'flat',
      color      = 'default',
      size       = 'md',
      radius     = 'md',
      label,
      description,
      errorMessage,
      isInvalid  = false,
      startContent,
      endContent,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const showError = isInvalid && errorMessage;

    return (
      <div className={cn(wrapperVariants(), className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div
          data-slot="input-wrapper"
          className={inputWrapperVariants({ variant, color, size, radius, isInvalid })}
        >
          {startContent && (
            <span className="ml-3 shrink-0 text-muted-foreground">
              {startContent}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            data-slot="input"
            aria-invalid={isInvalid || undefined}
            className={cn(
              inputBaseClass,
              startContent && 'pl-2',
              endContent && 'pr-2',
              variant === 'underlined' && 'px-0',
            )}
            {...props}
          />
          {endContent && (
            <span className="mr-3 shrink-0 text-muted-foreground">
              {endContent}
            </span>
          )}
        </div>

        {(description || showError) && (
          <p className={cn('text-xs', showError ? 'text-red-500' : 'text-muted-foreground')}>
            {showError ? errorMessage : description}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
