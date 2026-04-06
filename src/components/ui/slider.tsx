'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SliderProps {
  className?: string;
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  'aria-label'?: string;
  color?: string;
  size?: string;
  showValue?: boolean;
}

const Slider = forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, disabled, label, showValue, ...props }, ref) => {
    const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;

    return (
      <div ref={ref} className={cn('flex flex-col gap-1', className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
            {showValue && <span className="text-xs text-muted-foreground">{currentValue}</span>}
          </div>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          aria-label={props['aria-label'] ?? label}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          className="w-full accent-primary"
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
