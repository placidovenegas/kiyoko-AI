'use client';

import { Select, ListBox } from '@heroui/react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import type { Key } from 'react';

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-foreground">{children}</h2>;
}

export function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground mt-1 mb-6">{children}</p>;
}

export function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-muted-foreground mb-1.5">{children}</label>;
}

export function PrefGroup({ title }: { title: string }) {
  return (
    <div className="mb-1 mt-6 first:mt-0">
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <div className="h-px bg-border" />
    </div>
  );
}

export function SectionLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function SettingsSelect({ value, onChange, options, label }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <Select
      aria-label={label ?? 'Settings select'}
      variant="secondary"
      selectedKey={value}
      onSelectionChange={(key: Key | null) => { if (key !== null) onChange(String(key)); }}
      className="w-auto min-w-36"
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox >
          {options.map((o) => (
            <ListBox.Item  key={o.value} id={o.value}>
              {o.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
