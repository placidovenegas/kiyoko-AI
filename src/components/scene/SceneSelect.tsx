'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className="h-8 text-xs"
          aria-label={ariaLabel ?? label}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  {opt.description && (
                    <span className="text-[10px] text-muted-foreground">{opt.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
