'use client';

import { cn } from '@/lib/utils/cn';

export interface SceneSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SceneSelectProps {
  label: string;
  options: readonly SceneSelectOption[] | SceneSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function SceneSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className,
  disabled,
  'aria-label': ariaLabel,
}: SceneSelectProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {!value && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
