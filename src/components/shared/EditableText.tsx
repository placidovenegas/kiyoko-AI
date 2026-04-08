'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

interface EditableTextProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  placeholder?: string;
  as?: 'input' | 'textarea';
  rows?: number;
}

export function EditableText({
  value, onSave, className, placeholder, as = 'input', rows = 3,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
  }, [draft, value, onSave]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'text-left w-full rounded-md px-2 py-1 -mx-2 -my-1',
          'hover:bg-accent transition-colors cursor-text',
          !value && 'text-muted-foreground italic',
          className,
        )}
      >
        {value || placeholder || 'Click para editar...'}
      </button>
    );
  }

  const sharedProps = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (as === 'input' && e.key === 'Enter') commit();
      if (e.key === 'Escape') { setDraft(value); setEditing(false); }
    },
    placeholder,
    className: cn(
      'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none',
      'focus:border-primary/30 focus:ring-1 focus:ring-primary/10',
      className,
    ),
  };

  if (as === 'textarea') {
    return <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={rows} {...sharedProps} />;
  }
  return <input ref={ref as React.RefObject<HTMLInputElement>} type="text" {...sharedProps} />;
}
