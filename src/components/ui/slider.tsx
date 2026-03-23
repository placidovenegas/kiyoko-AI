'use client';

import { forwardRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils/cn';

/* ── Color maps ───────────────────────────────────────────── */

const TRACK_BG: Record<string, string> = {
  default:   'bg-default-200 dark:bg-default-700',
  primary:   'bg-primary-100 dark:bg-primary-900',
  secondary: 'bg-secondary-100 dark:bg-secondary-900',
  success:   'bg-success-100 dark:bg-success-900',
  warning:   'bg-warning-100 dark:bg-warning-900',
  danger:    'bg-danger-100 dark:bg-danger-900',
};

const RANGE_BG: Record<string, string> = {
  default:   'bg-default-500',
  primary:   'bg-primary-500',
  secondary: 'bg-secondary-500',
  success:   'bg-success-500',
  warning:   'bg-warning-500',
  danger:    'bg-danger-500',
};

const THUMB_RING: Record<string, string> = {
  default:   'border-default-500 focus-visible:ring-default-300',
  primary:   'border-primary-500 focus-visible:ring-primary-300',
  secondary: 'border-secondary-500 focus-visible:ring-secondary-300',
  success:   'border-success-500 focus-visible:ring-success-300',
  warning:   'border-warning-500 focus-visible:ring-warning-300',
  danger:    'border-danger-500 focus-visible:ring-danger-300',
};

const SIZE_TRACK: Record<string, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

const SIZE_THUMB: Record<string, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
};

/* ── Types ────────────────────────────────────────────────── */

export interface SliderProps
  extends Omit<SliderPrimitive.SliderProps, 'color'> {
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?:  'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  formatValue?: (v: number) => string;
}

/* ── Component ───────────────────────────────────────────── */

export const Slider = forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({
  className,
  color  = 'primary',
  size   = 'md',
  showValue,
  label,
  formatValue = (v) => String(v),
  value,
  defaultValue,
  ...props
}, ref) => {
  const current = value ?? defaultValue ?? [0];

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-medium text-foreground">{label}</span>}
          {showValue && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {Array.isArray(current)
                ? current.map(formatValue).join(' – ')
                : formatValue(current as number)}
            </span>
          )}
        </div>
      )}

      <SliderPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        className="relative flex w-full touch-none select-none items-center"
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(
            'relative w-full grow overflow-hidden rounded-full',
            SIZE_TRACK[size],
            TRACK_BG[color],
          )}
        >
          <SliderPrimitive.Range
            className={cn('absolute h-full rounded-full', RANGE_BG[color])}
          />
        </SliderPrimitive.Track>

        {(Array.isArray(current) ? current : [current]).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className={cn(
              'block shrink-0 rounded-full border-2 bg-background',
              'shadow-sm transition-transform',
              'hover:scale-110 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              'disabled:pointer-events-none disabled:opacity-50',
              SIZE_THUMB[size],
              THUMB_RING[color],
            )}
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
});
Slider.displayName = 'Slider';
