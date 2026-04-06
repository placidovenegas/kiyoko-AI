'use client';

/**
 * KButton — compatibility shim over Button.
 * Maps the old KButton API to the new unified Button component.
 */

import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';

export interface KButtonProps extends Omit<ButtonProps, 'variant' | 'color' | 'size'> {
  variant?:      'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'ai' | 'success';
  size?:         'xs' | 'sm' | 'md' | 'lg';
  loading?:      boolean;
  icon?:         React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const VARIANT_MAP: Record<string, { variant: ButtonProps['variant']; color: ButtonProps['color'] }> = {
  primary:   { variant: 'solid',   color: 'primary' },
  secondary: { variant: 'flat',    color: 'default' },
  ghost:     { variant: 'ghost',   color: 'default' },
  outline:   { variant: 'bordered', color: 'default' },
  danger:    { variant: 'flat',    color: 'danger' },
  ai:        { variant: 'flat',    color: 'primary' },
  success:   { variant: 'flat',    color: 'success' },
};

export const KButton = forwardRef<HTMLButtonElement, KButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      icon,
      iconPosition = 'left',
      children,
      ...props
    },
    ref
  ) => {
    const mapped = VARIANT_MAP[variant] ?? VARIANT_MAP.primary;

    const leftIcon = iconPosition === 'left' && icon ? <span className="mr-2">{icon}</span> : null;
    const rightIcon = iconPosition === 'right' && icon ? <span className="ml-2">{icon}</span> : null;

    return (
      <Button
        ref={ref}
        variant={mapped.variant}
        color={mapped.color}
        size={size}
        isLoading={loading}
        {...props}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </Button>
    );
  }
);
KButton.displayName = 'KButton';
