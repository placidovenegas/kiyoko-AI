'use client';

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Eye, EyeOff } from 'lucide-react';

export interface AuthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, type, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white/70 lg:text-muted-foreground"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition',
              'placeholder:text-white/30 lg:placeholder:text-muted-foreground',
              // Mobile/dark auth: glassmorphism inputs
              'border-white/10 bg-white/5 text-white',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              // Desktop: standard inputs
              'lg:border-border lg:bg-card lg:text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              isPassword && 'pr-10',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/70 lg:text-muted-foreground lg:hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  },
);
AuthInput.displayName = 'AuthInput';
