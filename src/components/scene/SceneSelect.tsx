'use client';

import { Select, ListBoxItem } from '@heroui/react';
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
      <Select
        label={label}
        selectedKeys={value ? [value] : []}
        onSelectionChange={(keys) => {
          const selected = [...keys][0];
          if (selected) onChange(String(selected));
        }}
        isDisabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel ?? label}
        size="sm"
        className="text-xs"
        labelPlacement="outside"
      >
        {options.map((opt) => (
          <ListBoxItem key={opt.value} textValue={opt.label}>
            <div className="flex flex-col">
              <span>{opt.label}</span>
              {opt.description && (
                <span className="text-[10px] text-muted-foreground">{opt.description}</span>
              )}
            </div>
          </ListBoxItem>
        ))}
      </Select>
    </div>
  );
}
