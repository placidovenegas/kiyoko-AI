'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ColorPickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showHex?: boolean;
}

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, label, showHex = true, value, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="h-10 w-10 rounded-lg border border-muted-foreground/30 shadow-sm"
              style={{ backgroundColor: (value as string) || '#000000' }}
            />
            <input
              ref={ref}
              id={inputId}
              type="color"
              value={value}
              className="absolute inset-0 cursor-pointer opacity-0"
              {...props}
            />
          </div>
          {showHex && (
            <span className="font-mono text-sm text-muted-foreground">
              {(value as string)?.toUpperCase() || '#000000'}
            </span>
          )}
        </div>
      </div>
    );
  },
);

ColorPicker.displayName = 'ColorPicker';
