'use client';

/**
 * Slider — Wrapper sobre HeroUI v3 Slider.
 * Mantiene la API: value, onValueChange, min, max, step.
 */

import { forwardRef } from 'react';
import { Slider as HeroSlider } from '@heroui/react';
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
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, disabled, label, ...props }, ref) => (
    <HeroSlider
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onChange={onValueChange as (value: number | number[]) => void}
      minValue={min}
      maxValue={max}
      step={step}
      disabled={disabled}
      label={label}
      className={cn(className)}
      aria-label={props['aria-label']}
    />
  )
);
Slider.displayName = 'Slider';

export { Slider };
