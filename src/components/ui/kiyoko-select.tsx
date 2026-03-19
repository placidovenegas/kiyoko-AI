'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, Check } from 'lucide-react';

export interface KSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface KSelectProps {
  options: readonly KSelectOption[] | KSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function KSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  disabled,
  className,
  size = 'md',
}: KSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && (
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label || placeholder}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-surface-tertiary bg-surface-secondary text-left transition',
          'hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-7 px-2 text-xs' : size === 'lg' ? 'h-10.5 px-3 text-sm' : 'h-8 px-2.5 text-sm',
        )}
      >
        <span className={cn('truncate', !selected && 'text-foreground-muted')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-foreground-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-surface-tertiary bg-surface p-1 shadow-xl"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition',
                opt.value === value
                  ? 'bg-brand-500/10 text-brand-500'
                  : 'text-foreground-secondary hover:bg-surface-secondary',
                size === 'sm' ? 'text-xs' : 'text-sm',
              )}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <div className="min-w-0 flex-1">
                <span className="block truncate">{opt.label}</span>
                {opt.description && (
                  <span className="block truncate text-[10px] text-foreground-muted">{opt.description}</span>
                )}
              </div>
              {opt.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
