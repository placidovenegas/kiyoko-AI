'use client';

/**
 * Button — Wrapper sobre HeroUI v3 Button.
 * Mantiene la misma API que el Button anterior (variant, color, size, radius,
 * isIconOnly, isLoading, startContent, endContent) para que los 50+ archivos
 * que lo importan sigan funcionando sin cambios.
 *
 * Internamente renderiza <HeroButton> de @heroui/react.
 */

import { forwardRef } from 'react';
import { Button as HeroButton } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ── Variant / color / size maps ──────────────────────────── */

type ButtonVariant =
  | 'solid'
  | 'bordered'
  | 'outline'
  | 'light'
  | 'flat'
  | 'ghost'
  | 'faded'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'dark'
  | 'danger'
  | 'danger-soft'
  | 'underlined';
type ButtonColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

// HeroUI v3 variant mapping — some of our variants don't exist in HeroUI,
// so we map them to the closest equivalent + extra classes.
const HERO_VARIANT_MAP: Record<ButtonVariant, string> = {
  solid: 'primary',
  bordered: 'outline',
  outline: 'outline',
  light: 'ghost',
  flat: 'secondary',
  ghost: 'ghost',
  faded: 'outline',
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'ghost',
  dark: 'primary',
  danger: 'primary',
  'danger-soft': 'outline',
  underlined: 'ghost',
};

const HERO_SIZE_MAP: Record<ButtonSize, 'sm' | 'md' | 'lg'> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

const RADIUS_CLASS: Record<ButtonRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

/* ── Color classes (applied on top of HeroUI base) ────────── */

const COLOR_SOLID: Record<ButtonColor, string> = {
  default: 'bg-default-400 text-white hover:bg-default-500',
  primary: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
  success: 'bg-success-500 text-white hover:bg-success-600',
  warning: 'bg-warning-500 text-white hover:bg-warning-600',
  danger: 'bg-danger-500 text-white hover:bg-danger-600',
};

const COLOR_FLAT: Record<ButtonColor, string> = {
  default: 'bg-default-100 text-default-700 hover:bg-default-200 dark:bg-default-800 dark:text-default-200',
  primary: 'bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200 dark:bg-secondary-900 dark:text-secondary-300',
  success: 'bg-success-100 text-success-700 hover:bg-success-200 dark:bg-success-900 dark:text-success-400',
  warning: 'bg-warning-100 text-warning-700 hover:bg-warning-200 dark:bg-warning-900 dark:text-warning-400',
  danger: 'bg-danger-100 text-danger-600 hover:bg-danger-200 dark:bg-danger-900 dark:text-danger-400',
};

const COLOR_GHOST: Record<ButtonColor, string> = {
  default: 'text-default-700 hover:bg-default-100 dark:text-default-300 dark:hover:bg-default-800',
  primary: 'text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900',
  secondary: 'text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-900',
  success: 'text-success-600 hover:bg-success-100 dark:text-success-400',
  warning: 'text-warning-600 hover:bg-warning-100 dark:text-warning-400',
  danger: 'text-danger-500 hover:bg-danger-100 dark:hover:bg-danger-900',
};

const COLOR_BORDERED: Record<ButtonColor, string> = {
  default: 'border-default-300 text-default-700 hover:bg-default-100 dark:border-default-600 dark:text-default-300',
  primary: 'border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900',
  secondary: 'border-secondary-500 text-secondary-500 hover:bg-secondary-50',
  success: 'border-success-500 text-success-600 hover:bg-success-50 dark:text-success-400',
  warning: 'border-warning-500 text-warning-600 hover:bg-warning-50 dark:text-warning-400',
  danger: 'border-danger-500 text-danger-500 hover:bg-danger-50',
};

function getColorClass(variant: ButtonVariant, color: ButtonColor): string {
  switch (variant) {
    case 'solid': return COLOR_SOLID[color];
    case 'primary': return COLOR_SOLID.primary;
    case 'secondary': return COLOR_FLAT.default;
    case 'tertiary': return COLOR_GHOST.default;
    case 'dark': return 'bg-foreground text-background hover:opacity-90';
    case 'danger': return COLOR_SOLID.danger;
    case 'danger-soft': return COLOR_FLAT.danger;
    case 'underlined': return 'text-foreground underline underline-offset-4 hover:opacity-80';
    case 'flat':
    case 'faded': return COLOR_FLAT[color];
    case 'ghost':
    case 'light': return COLOR_GHOST[color];
    case 'outline':
    case 'bordered': return COLOR_BORDERED[color];
    default: return '';
  }
}

/* ── Size classes ──────────────────────────────────────────── */

const SIZE_CLASS: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-[11px] gap-1',
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-base',
};

const ICON_SIZE_CLASS: Record<ButtonSize, string> = {
  xs: 'size-6',
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-11',
};

/* ── Types ────────────────────────────────────────────────── */

export interface ButtonProps {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  radius?: ButtonRadius;
  isIconOnly?: boolean;
  fullWidth?: boolean;
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'data-slot'?: string;
  id?: string;
  tabIndex?: number;
  style?: React.CSSProperties;
}

/* ── Exported buttonVariants for alert-dialog.tsx compatibility ── */

export function buttonVariants(opts: {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  radius?: ButtonRadius;
  fullWidth?: boolean;
}): string {
  const v = opts.variant ?? 'solid';
  const c = opts.color ?? 'default';
  const s = opts.size ?? 'md';
  const r = opts.radius ?? 'md';
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-all outline-none select-none cursor-pointer',
    SIZE_CLASS[s],
    RADIUS_CLASS[r],
    getColorClass(v, c),
  );
}

/* ── Component ───────────────────────────────────────────── */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'solid',
      color = 'default',
      size = 'md',
      radius = 'md',
      isIconOnly = false,
      fullWidth = false,
      isLoading = false,
      startContent,
      endContent,
      disabled,
      children,
      onClick,
      type,
      title,
      id,
      tabIndex,
      style,
      ...ariaProps
    },
    ref
  ) => {
    return (
      <HeroButton
        ref={ref}
        isIconOnly={isIconOnly}
        isDisabled={disabled || isLoading}
        fullWidth={fullWidth}
        variant={HERO_VARIANT_MAP[variant] as 'primary' | 'secondary' | 'ghost' | 'outline'}
        size={HERO_SIZE_MAP[size]}
        onPress={() => {
          if (onClick) {
            onClick({} as React.MouseEvent<HTMLButtonElement>);
          }
        }}
        type={type}
        aria-label={ariaProps['aria-label'] ?? title}
        id={id}
        style={style}
        className={cn(
          // Override HeroUI defaults with our color system
          getColorClass(variant, color),
          RADIUS_CLASS[radius],
          // Size: let HeroUI handle base, we add specifics
          isIconOnly ? ICON_SIZE_CLASS[size] : SIZE_CLASS[size],
          fullWidth && 'w-full',
          // SVG sizing
          '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
          className,
        )}
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
      </HeroButton>
    );
  }
);
Button.displayName = 'Button';
