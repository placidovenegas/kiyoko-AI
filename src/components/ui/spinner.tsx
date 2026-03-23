'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/* ── Variants ─────────────────────────────────────────────── */

const spinnerVariants = cva('relative flex shrink-0 items-center justify-center', {
  variants: {
    size: {
      xs: 'size-4',
      sm: 'size-5',
      md: 'size-7',
      lg: 'size-9',
      xl: 'size-12',
    },
  },
  defaultVariants: { size: 'md' },
});

const TRACK_COLOR: Record<string, string> = {
  default:   'stroke-default-200 dark:stroke-default-700',
  primary:   'stroke-primary-200 dark:stroke-primary-900',
  secondary: 'stroke-secondary-200 dark:stroke-secondary-900',
  success:   'stroke-success-200 dark:stroke-success-900',
  warning:   'stroke-warning-200 dark:stroke-warning-900',
  danger:    'stroke-danger-200 dark:stroke-danger-900',
  current:   'stroke-current opacity-25',
};

const FILL_COLOR: Record<string, string> = {
  default:   'stroke-default-500',
  primary:   'stroke-primary-500',
  secondary: 'stroke-secondary-500',
  success:   'stroke-success-500',
  warning:   'stroke-warning-500',
  danger:    'stroke-danger-500',
  current:   'stroke-current',
};

/* ── Types ────────────────────────────────────────────────── */

export type SpinnerColor =
  | 'default' | 'primary' | 'secondary'
  | 'success' | 'warning' | 'danger' | 'current';

export interface SpinnerProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {
  color?:  SpinnerColor;
  label?:  string;
}

/* ── Component ───────────────────────────────────────────── */

export function Spinner({
  className,
  size  = 'md',
  color = 'primary',
  label,
  ...props
}: SpinnerProps) {
  const r  = 20;
  const cx = 24;
  const cy = 24;
  const stroke = 3.5;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * 0.75;

  return (
    <span
      role="status"
      aria-label={label ?? 'Loading'}
      className={cn(spinnerVariants({ size }), 'flex-col gap-2', className)}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
        style={{ animationDuration: '0.75s', animationTimingFunction: 'linear' }}
        aria-hidden
        {...props}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          strokeWidth={stroke}
          className={TRACK_COLOR[color]}
        />
        {/* Arc */}
        <circle
          cx={cx} cy={cy} r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference * 0.25}
          className={FILL_COLOR[color]}
        />
      </svg>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </span>
  );
}
