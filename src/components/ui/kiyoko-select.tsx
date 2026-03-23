'use client';

import { useState, useRef, useId, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ── Variants ─────────────────────────────────────────────── */

const triggerVariants = cva(
  'relative flex w-full cursor-pointer items-center justify-between gap-2 text-left font-normal transition-all outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        flat:       'bg-default-100 border border-transparent hover:bg-default-200 dark:bg-default-800 dark:hover:bg-default-700',
        bordered:   'bg-transparent border border-default-300 hover:border-default-400 dark:border-default-600 dark:hover:border-default-500',
        underlined: 'rounded-none border-b border-default-300 bg-transparent px-0 hover:border-default-400 dark:border-default-600',
        faded:      'bg-default-100 border border-default-200 hover:bg-default-200 dark:bg-default-800 dark:border-default-700',
      },
      color: {
        default:   '',
        primary:   '',
        secondary: '',
        success:   '',
        warning:   '',
        danger:    '',
      },
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-3.5 text-base',
      },
      radius: {
        none: 'rounded-none',
        sm:   'rounded-md',
        md:   'rounded-lg',
        lg:   'rounded-xl',
        full: 'rounded-full',
      },
      isInvalid: {
        true:  'border-danger-500 dark:border-danger-500',
        false: '',
      },
      isOpen: {
        true:  '',
        false: '',
      },
    },
    compoundVariants: [
      /* focus-ring per color */
      { color: 'default',   class: 'focus-within:ring-default-300 focus-within:border-default-400' },
      { color: 'primary',   class: 'focus-within:ring-primary-300 focus-within:border-primary-500' },
      { color: 'secondary', class: 'focus-within:ring-secondary-300 focus-within:border-secondary-500' },
      { color: 'success',   class: 'focus-within:ring-success-300 focus-within:border-success-500' },
      { color: 'warning',   class: 'focus-within:ring-warning-300 focus-within:border-warning-500' },
      { color: 'danger',    class: 'focus-within:ring-danger-300 focus-within:border-danger-500' },
      /* open state border per color */
      { isOpen: true, variant: 'bordered', color: 'default',   class: 'border-default-500 ring-2 ring-default-200' },
      { isOpen: true, variant: 'bordered', color: 'primary',   class: 'border-primary-500 ring-2 ring-primary-200' },
      { isOpen: true, variant: 'bordered', color: 'secondary', class: 'border-secondary-500 ring-2 ring-secondary-200' },
      { isOpen: true, variant: 'bordered', color: 'success',   class: 'border-success-500 ring-2 ring-success-200' },
      { isOpen: true, variant: 'bordered', color: 'warning',   class: 'border-warning-500 ring-2 ring-warning-200' },
      { isOpen: true, variant: 'bordered', color: 'danger',    class: 'border-danger-500 ring-2 ring-danger-200' },
      /* underlined: skip radius */
      { variant: 'underlined', radius: 'sm',   class: 'rounded-none' },
      { variant: 'underlined', radius: 'md',   class: 'rounded-none' },
      { variant: 'underlined', radius: 'lg',   class: 'rounded-none' },
      { variant: 'underlined', radius: 'full', class: 'rounded-none' },
    ],
    defaultVariants: {
      variant:   'flat',
      color:     'default',
      size:      'md',
      radius:    'md',
      isInvalid: false,
      isOpen:    false,
    },
  }
);

const itemSelectedColors: Record<string, string> = {
  default:   'bg-default-100 text-default-700 dark:bg-default-700 dark:text-default-200',
  primary:   'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300',
  success:   'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-400',
  warning:   'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-400',
  danger:    'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400',
};

const checkColors: Record<string, string> = {
  default:   'text-default-600',
  primary:   'text-primary-500',
  secondary: 'text-secondary-500',
  success:   'text-success-500',
  warning:   'text-warning-500',
  danger:    'text-danger-500',
};

/* ── Types ────────────────────────────────────────────────── */

export interface KSelectOption {
  value:        string;
  label:        string;
  description?: string;
  icon?:        React.ReactNode;
  disabled?:    boolean;
}

type TriggerVariantProps = VariantProps<typeof triggerVariants>;

export interface KSelectProps extends Omit<TriggerVariantProps, 'isOpen' | 'isInvalid'> {
  options:       readonly KSelectOption[] | KSelectOption[];
  value:         string;
  onChange:      (value: string) => void;
  placeholder?:  string;
  label?:        string;
  description?:  string;
  errorMessage?: string;
  isInvalid?:    boolean;
  isDisabled?:   boolean;
  isRequired?:   boolean;
  startContent?: React.ReactNode;
  endContent?:   React.ReactNode;
  className?:    string;
  listClassName?: string;
}

/* ── Dropdown animation ───────────────────────────────────── */

const dropdownVariants = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 500, damping: 35 } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } },
};

/* ── Component ───────────────────────────────────────────── */

export function KSelect({
  options,
  value,
  onChange,
  placeholder   = 'Seleccionar...',
  label,
  description,
  errorMessage,
  isInvalid     = false,
  isDisabled    = false,
  isRequired    = false,
  startContent,
  endContent,
  variant       = 'flat',
  color         = 'default',
  size          = 'md',
  radius        = 'md',
  className,
  listClassName,
}: KSelectProps) {
  const [open, setOpen]       = useState(false);
  const containerRef           = useRef<HTMLDivElement>(null);
  const triggerRef             = useRef<HTMLButtonElement>(null);
  const id                     = useId();
  const labelId                = `${id}-label`;
  const listboxId              = `${id}-listbox`;
  const selected               = options.find((o) => o.value === value);
  const showError              = isInvalid && errorMessage;
  const colorKey               = color ?? 'default';

  /* close on outside click */
  const handleOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [open, handleOutside]);

  /* keyboard navigation */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); }
    if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); }
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-1', className)}>
      {/* Label */}
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className="text-xs font-medium text-foreground"
        >
          {label}
          {isRequired && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-labelledby={label ? labelId : undefined}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-invalid={isInvalid || undefined}
        disabled={isDisabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={triggerVariants({
          variant, color, size, radius,
          isInvalid,
          isOpen: open,
        })}
      >
        {startContent && (
          <span className="shrink-0 text-muted-foreground">{startContent}</span>
        )}

        <span className={cn('flex-1 truncate', !selected && 'text-muted-foreground')}>
          {selected?.label ?? placeholder}
        </span>

        {endContent && (
          <span className="shrink-0 text-muted-foreground">{endContent}</span>
        )}

        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.ul
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto',
              'rounded-xl border border-border bg-popover p-1 shadow-xl shadow-black/10',
              'dark:shadow-black/30',
              listClassName,
            )}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
                    'text-sm text-foreground',
                    isSelected
                      ? itemSelectedColors[colorKey]
                      : 'hover:bg-default-100 dark:hover:bg-default-800',
                    opt.disabled && 'pointer-events-none opacity-40',
                    size === 'sm' && 'text-xs py-1.5',
                    size === 'lg' && 'text-base py-2.5',
                  )}
                >
                  {opt.icon && (
                    <span className="shrink-0 text-muted-foreground">{opt.icon}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className={cn('size-3.5 shrink-0', checkColors[colorKey])} />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Helper text */}
      {(description || showError) && (
        <p className={cn('text-xs', showError ? 'text-danger-500' : 'text-muted-foreground')}>
          {showError ? errorMessage : description}
        </p>
      )}
    </div>
  );
}
