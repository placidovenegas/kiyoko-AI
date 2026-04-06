'use client';

import { Slider } from '@heroui/react';
import { cn } from '@/lib/utils/cn';

interface DurationInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function DurationInput({
  value,
  onChange,
  min = 1,
  max = 15,
  step = 1,
  disabled,
  className,
}: DurationInputProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Duracion
        </span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold tabular-nums text-foreground">
          {value}s
        </span>
      </div>
      <Slider
        value={[value]}
        onChange={(nextValue) => {
          const resolvedValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;
          onChange(resolvedValue);
        }}
        minValue={min}
        maxValue={max}
        step={step}
        isDisabled={disabled}
        aria-label={`Duracion de la escena: ${value} segundos`}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}s</span>
        <span>{max}s</span>
      </div>
    </div>
  );
}
