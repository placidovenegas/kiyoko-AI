'use client';

import { Select, ListBox, Label } from '@heroui/react';
import type { Key } from 'react';
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
    <Select
      variant="secondary"
      aria-label={ariaLabel ?? label}
      selectedKey={value || null}
      onSelectionChange={(key: Key | null) => {
        if (key) onChange(String(key));
      }}
      isDisabled={disabled}
      className={cn('flex flex-col gap-1', className)}
      placeholder={placeholder}
    >
      <Label>{label}</Label>
      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
      <Select.Popover><ListBox>
        {options.map((opt) => (
          <ListBox.Item key={opt.value} id={opt.value}>{opt.label}</ListBox.Item>
        ))}
      </ListBox></Select.Popover>
    </Select>
  );
}
