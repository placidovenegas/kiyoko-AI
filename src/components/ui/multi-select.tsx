'use client';

import { useState, useRef, useId, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ── Types ────────────────────────────────────────────────── */

export interface MultiSelectOption {
  value:        string;
  label:        string;
  description?: string;
  icon?:        React.ReactNode;
  disabled?:    boolean;
}

export type MultiSelectVariant = 'flat' | 'bordered' | 'faded';
export type MultiSelectColor   = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type MultiSelectSize    = 'sm' | 'md' | 'lg';

export interface MultiSelectProps {
  options:        readonly MultiSelectOption[] | MultiSelectOption[];
  value:          string[];
  onChange:       (value: string[]) => void;
  placeholder?:   string;
  label?:         string;
  description?:   string;
  errorMessage?:  string;
  isInvalid?:     boolean;
  isDisabled?:    boolean;
  isRequired?:    boolean;
  searchable?:    boolean;
  maxDisplay?:    number;
  variant?:       MultiSelectVariant;
  color?:         MultiSelectColor;
  size?:          MultiSelectSize;
  radius?:        'none' | 'sm' | 'md' | 'lg' | 'full';
  className?:     string;
}

/* ── Color maps ───────────────────────────────────────────── */

const TRIGGER_VARIANT: Record<MultiSelectVariant, string> = {
  flat:    'bg-default-100 border border-transparent hover:bg-default-200 dark:bg-default-800 dark:hover:bg-default-700',
  bordered:'bg-transparent border border-default-300 hover:border-default-400 dark:border-default-600 dark:hover:border-default-500',
  faded:   'bg-default-100 border border-default-200 hover:bg-default-200 dark:bg-default-800 dark:border-default-700',
};

const FOCUS_RING: Record<MultiSelectColor, string> = {
  default:   'focus-within:border-default-500',
  primary:   'focus-within:border-primary-500',
  secondary: 'focus-within:border-secondary-500',
  success:   'focus-within:border-success-500',
  warning:   'focus-within:border-warning-500',
  danger:    'focus-within:border-danger-500',
};

const CHIP_COLOR: Record<MultiSelectColor, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  default: 'default', primary: 'primary', secondary: 'secondary',
  success: 'success', warning: 'warning', danger: 'danger',
};

const CHECK_COLOR: Record<MultiSelectColor, string> = {
  default:   'text-default-600',
  primary:   'text-primary-500',
  secondary: 'text-secondary-500',
  success:   'text-success-500',
  warning:   'text-warning-500',
  danger:    'text-danger-500',
};

const RADIUS_CLASS = { none: 'rounded-none', sm: 'rounded-md', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-2xl' };
const SIZE_CLASS   = { sm: 'min-h-8 text-xs', md: 'min-h-10 text-sm', lg: 'min-h-12 text-base' };

const dropdownVariants = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 500, damping: 35 } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } },
};

/* ── Component ───────────────────────────────────────────── */

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder  = 'Seleccionar...',
  label,
  description,
  errorMessage,
  isInvalid    = false,
  isDisabled   = false,
  isRequired   = false,
  searchable   = false,
  maxDisplay   = 3,
  variant      = 'flat',
  color        = 'default',
  size         = 'md',
  radius       = 'md',
  className,
}: MultiSelectProps) {
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState('');
  const containerRef              = useRef<HTMLDivElement>(null);
  const searchRef                 = useRef<HTMLInputElement>(null);
  const id                        = useId();
  const showError                 = isInvalid && errorMessage;

  const toggle = useCallback((v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }, [value, onChange]);

  const remove = useCallback((v: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((x) => x !== v));
  }, [value, onChange]);

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('');
      }
    };
    if (open) { document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }
  }, [open]);

  /* focus search when dropdown opens */
  useEffect(() => { if (open && searchable) setTimeout(() => searchRef.current?.focus(), 50); }, [open, searchable]);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const shown           = selectedOptions.slice(0, maxDisplay);
  const overflow        = selectedOptions.length - maxDisplay;

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}{isRequired && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        id={id}
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex w-full cursor-pointer items-center gap-1.5 px-2.5 py-1.5 text-left transition-all outline-none',
          'flex-wrap',
          TRIGGER_VARIANT[variant],
          FOCUS_RING[color],
          RADIUS_CLASS[radius],
          SIZE_CLASS[size],
          isInvalid && 'border-danger-500',
          isDisabled && 'pointer-events-none opacity-50',
          open && variant === 'bordered' && 'ring-2 ring-primary-200',
        )}
      >
        {/* Selected chips */}
        {shown.length > 0 ? (
          <>
            {shown.map((opt) => (
              <span
                key={opt.value}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  color === 'default'
                    ? 'bg-default-200 text-default-700 dark:bg-default-700 dark:text-default-200'
                    : `bg-${color}-100 text-${color}-700 dark:bg-${color}-900 dark:text-${color}-300`,
                )}
              >
                {opt.label}
                <span
                  role="button"
                  aria-label={`Remove ${opt.label}`}
                  onClick={(e) => remove(opt.value, e)}
                  className="ml-0.5 cursor-pointer rounded-full hover:opacity-70"
                >
                  <X className="size-2.5" />
                </span>
              </span>
            ))}
            {overflow > 0 && (
              <span className="rounded-full bg-default-200 px-2 py-0.5 text-[11px] font-medium text-default-600 dark:bg-default-700 dark:text-default-300">
                +{overflow}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}

        <ChevronDown className={cn('ml-auto size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden" animate="visible" exit="exit"
            className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-xl shadow-black/10 dark:shadow-black/30"
          >
            {/* Search */}
            {searchable && (
              <div className="border-b border-border px-2 py-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="size-3.5 shrink-0" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <ul role="listbox" aria-multiselectable className="max-h-56 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</li>
              ) : filtered.map((opt) => {
                const selected = value.includes(opt.value);
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={selected}
                    onClick={() => !opt.disabled && toggle(opt.value)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      selected
                        ? 'bg-default-100 text-foreground dark:bg-default-800'
                        : 'text-foreground hover:bg-default-100 dark:hover:bg-default-800',
                      opt.disabled && 'pointer-events-none opacity-40',
                    )}
                  >
                    {/* Checkbox */}
                    <span className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                      selected
                        ? `bg-${color}-500 border-${color}-500`
                        : 'border-default-300 dark:border-default-600',
                    )}>
                      {selected && <Check className="size-3 text-white" />}
                    </span>

                    {opt.icon && <span className="shrink-0 text-muted-foreground">{opt.icon}</span>}

                    <div className="min-w-0 flex-1">
                      <p className="truncate">{opt.label}</p>
                      {opt.description && (
                        <p className="truncate text-[11px] text-muted-foreground">{opt.description}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            {value.length > 0 && (
              <div className="border-t border-border px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[11px] text-muted-foreground transition hover:text-foreground"
                >
                  Limpiar selección ({value.length})
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {(description || showError) && (
        <p className={cn('text-xs', showError ? 'text-danger-500' : 'text-muted-foreground')}>
          {showError ? errorMessage : description}
        </p>
      )}
    </div>
  );
}
