'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface KButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'ai' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<string, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500/50',
  secondary: 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-secondary border border-surface-tertiary',
  ghost: 'text-foreground-muted hover:bg-surface-secondary hover:text-foreground',
  outline: 'border border-surface-tertiary text-foreground-secondary hover:bg-surface-secondary',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
  ai: 'bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/20',
  success: 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20',
};

const sizeStyles: Record<string, string> = {
  xs: 'h-6 px-2 text-[11px] gap-1 rounded-md',
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  lg: 'h-10 px-4 text-sm gap-2 rounded-lg',
};

export const KButton = forwardRef<HTMLButtonElement, KButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, icon, iconPosition = 'left', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  },
);
KButton.displayName = 'KButton';
