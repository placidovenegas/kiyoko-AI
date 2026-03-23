'use client';

import { useState, useRef, useId, useCallback, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ── Types ────────────────────────────────────────────────── */

export type TagInputVariant = 'flat' | 'bordered' | 'underlined' | 'faded';
export type TagInputColor   = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type TagInputSize    = 'sm' | 'md' | 'lg';

export interface TagInputProps {
  value:         string[];
  onChange:      (tags: string[]) => void;
  placeholder?:  string;
  label?:        string;
  description?:  string;
  errorMessage?: string;
  isInvalid?:    boolean;
  isDisabled?:   boolean;
  isRequired?:   boolean;
  maxTags?:      number;
  allowDuplicates?: boolean;
  separator?:    string[];             /* keys that trigger add: default ['Enter', ','] */
  validate?:     (tag: string) => boolean;
  variant?:      TagInputVariant;
  color?:        TagInputColor;
  size?:         TagInputSize;
  radius?:       'none' | 'sm' | 'md' | 'lg' | 'full';
  className?:    string;
}

/* ── Color maps ───────────────────────────────────────────── */

const WRAPPER_VARIANT: Record<TagInputVariant, string> = {
  flat:       'bg-default-100 border border-transparent focus-within:bg-default-50 dark:bg-default-800 dark:focus-within:bg-default-900',
  bordered:   'bg-transparent border border-default-300 dark:border-default-600',
  underlined: 'rounded-none border-b border-default-300 bg-transparent dark:border-default-600',
  faded:      'bg-default-100 border border-default-200 dark:bg-default-800 dark:border-default-700',
};

const FOCUS_COLOR: Record<TagInputColor, string> = {
  default:   'focus-within:border-default-500',
  primary:   'focus-within:border-primary-500',
  secondary: 'focus-within:border-secondary-500',
  success:   'focus-within:border-success-500',
  warning:   'focus-within:border-warning-500',
  danger:    'focus-within:border-danger-500',
};

const TAG_COLORS: Record<TagInputColor, string> = {
  default:   'bg-default-200 text-default-700 dark:bg-default-700 dark:text-default-200',
  primary:   'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300',
  success:   'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-400',
  warning:   'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-400',
  danger:    'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400',
};

const RADIUS_CLASS = { none: 'rounded-none', sm: 'rounded-md', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-2xl' };

/* ── Component ───────────────────────────────────────────── */

export function TagInput({
  value,
  onChange,
  placeholder    = 'Escribe y pulsa Enter...',
  label,
  description,
  errorMessage,
  isInvalid      = false,
  isDisabled     = false,
  isRequired     = false,
  maxTags,
  allowDuplicates = false,
  separator      = ['Enter', ','],
  validate,
  variant        = 'bordered',
  color          = 'default',
  size           = 'md',
  radius         = 'md',
  className,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef          = useRef<HTMLInputElement>(null);
  const id                = useId();
  const showError         = isInvalid && errorMessage;

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().replace(/,+$/, '');
    if (!tag) return;
    if (maxTags && value.length >= maxTags) { setError(`Máximo ${maxTags} etiquetas`); return; }
    if (!allowDuplicates && value.includes(tag)) { setError('Etiqueta duplicada'); return; }
    if (validate && !validate(tag)) { setError('Etiqueta no válida'); return; }
    setError('');
    onChange([...value, tag]);
    setInput('');
  }, [value, onChange, maxTags, allowDuplicates, validate]);

  const removeTag = useCallback((idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    setError('');
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (separator.includes(e.key)) { e.preventDefault(); addTag(input); return; }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  }, [separator, input, value, addTag, removeTag]);

  const sizeInput  = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const sizePad    = size === 'sm' ? 'px-2 py-1' : size === 'lg' ? 'px-3.5 py-2.5' : 'px-3 py-2';
  const tagText    = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}{isRequired && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}

      {/* Wrapper — acts like an input */}
      <div
        role="group"
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex flex-wrap items-center gap-1.5 transition-all cursor-text',
          sizePad,
          WRAPPER_VARIANT[variant],
          FOCUS_COLOR[color],
          variant !== 'underlined' && RADIUS_CLASS[radius],
          (isInvalid || error) && 'border-danger-500',
          isDisabled && 'pointer-events-none opacity-50',
        )}
      >
        {/* Tags */}
        {value.map((tag, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-1 rounded-full font-medium',
              tagText,
              TAG_COLORS[color],
              size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-0.5',
            )}
          >
            {tag}
            {!isDisabled && (
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                className="ml-0.5 rounded-full opacity-60 transition hover:opacity-100"
              >
                <X className="size-2.5" />
              </button>
            )}
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          value={input}
          disabled={isDisabled}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={value.length === 0 ? placeholder : ''}
          className={cn(
            'min-w-[120px] flex-1 bg-transparent outline-none',
            'placeholder:text-muted-foreground',
            sizeInput,
          )}
          aria-invalid={isInvalid || undefined}
        />
      </div>

      {/* Helper */}
      {(description || showError || error) && (
        <p className={cn('text-xs', showError || error ? 'text-danger-500' : 'text-muted-foreground')}>
          {showError ? errorMessage : error || description}
        </p>
      )}
    </div>
  );
}
