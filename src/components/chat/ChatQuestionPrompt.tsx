'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export type ChatQuestionOption = {
  id: string;
  label: string;
};

export type ChatQuestion = {
  /** Clave estable para animaciones / React (opcional). */
  id?: string;
  title?: string;
  prompt: string;
  options: ChatQuestionOption[];
  allowOther?: boolean;
  otherLabel?: string;
};

function letterForIndex(i: number): string {
  // A, B, C...
  return String.fromCharCode('A'.charCodeAt(0) + i);
}

export function ChatQuestionPrompt({
  question,
  onContinue,
  onSkip,
  disabled,
  placement = 'inline',
}: {
  question: ChatQuestion;
  onContinue: (answer: { id: string; label: string }) => void;
  onSkip?: () => void;
  disabled?: boolean;
  /** inline: normal card. overlay: looks like it "comes from the input" */
  placement?: 'inline' | 'overlay';
}) {
  const other = useMemo(
    () => ({
      id: '__other__',
      label: question.otherLabel ?? 'Other…',
    }),
    [question.otherLabel],
  );

  const options = useMemo(() => (
    question.allowOther ? [...question.options, other] : question.options
  ), [question.allowOther, question.options, other]);

  const [selectedId, setSelectedId] = useState<string>(options[0]?.id ?? '');
  const [otherText, setOtherText] = useState<string>('');
  const otherInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const isOtherSelected = selected?.id === '__other__';
  const selectedIndex = Math.max(0, options.findIndex((o) => o.id === selected?.id));
  const canContinue = !!selected?.id && !disabled && (!isOtherSelected || otherText.trim().length > 0);

  const doContinue = useCallback(() => {
    if (!selected) return;
    if (selected.id === '__other__') {
      const text = otherText.trim();
      if (!text) return;
      onContinue({ id: selected.id, label: text });
      return;
    }
    onContinue({ id: selected.id, label: selected.label });
  }, [onContinue, selected, otherText]);

  // Si cambian las opciones (o desaparece la seleccion), re-selecciona un valor valido.
  useEffect(() => {
    if (!options.length) return;
    const stillExists = options.some((o) => o.id === selectedId);
    if (!stillExists) setSelectedId(options[0].id);
  }, [options, selectedId]);

  useEffect(() => {
    if (!isOtherSelected) return;
    requestAnimationFrame(() => otherInputRef.current?.focus());
  }, [isOtherSelected]);

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as unknown;
      const isTypingTarget =
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || (target instanceof HTMLElement && target.isContentEditable);

      if (e.key === 'Enter') {
        // Si estamos escribiendo en "Other", Enter debe confirmar.
        if (isTypingTarget || isOtherSelected) {
          e.preventDefault();
          doContinue();
          return;
        }
      }
      if (e.key === 'Escape') {
        if (!onSkip) return;
        e.preventDefault();
        onSkip();
        return;
      }

      // Si el foco está en un input/textarea, no “robamos” flechas/letras.
      if (isTypingTarget) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(options.length - 1, selectedIndex + 1);
        const opt = options[next];
        if (opt) setSelectedId(opt.id);
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = Math.max(0, selectedIndex - 1);
        const opt = options[prev];
        if (opt) setSelectedId(opt.id);
        return;
      }
      const k = e.key.toUpperCase();
      if (k.length === 1 && k >= 'A' && k <= 'Z') {
        const idx = k.charCodeAt(0) - 'A'.charCodeAt(0);
        const opt = options[idx];
        if (opt) {
          e.preventDefault();
          setSelectedId(opt.id);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as never);
  }, [disabled, doContinue, onSkip, options, selectedIndex, isOtherSelected]);

  return (
    <div
      className={cn(
        placement === 'overlay'
          ? 'rounded-t-xl rounded-b-none border border-border border-b-0 bg-background overflow-hidden'
          : 'rounded-xl border border-border bg-card overflow-hidden',
      )}
    >
      <div className={cn(
        placement === 'overlay' ? 'px-3 py-2 border-b border-border bg-background' : 'px-4 py-3 border-b border-border bg-muted/40',
      )}>
        <p className="text-xs font-semibold text-foreground">
          {question.title ?? 'Elije'}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {question.prompt}
        </p>
      </div>

      <div className={cn(placement === 'overlay' ? 'p-2 space-y-1.5' : 'p-3 space-y-2')}>
        {options.map((opt, idx) => {
          const isSelected = opt.id === selectedId;
          return (
            <div key={opt.id} className="space-y-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setSelectedId(opt.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-colors text-left',
                  isSelected
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-border bg-background hover:bg-accent',
                  disabled && 'opacity-60 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'shrink-0 inline-flex items-center justify-center size-5.5 rounded-md border text-[10px] font-semibold',
                    isSelected
                      ? 'border-primary/40 bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {letterForIndex(idx)}
                </span>
                <span className="text-[13px] text-foreground">{opt.label}</span>
              </button>

              {opt.id === '__other__' && isSelected && (
                <input
                  ref={otherInputRef}
                  value={otherText}
                  disabled={disabled}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Escribe tu respuesta…"
                  className={cn(
                    'w-full h-9 rounded-lg border border-border bg-background px-3',
                    'text-sm text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-1 focus:ring-ring/50',
                    disabled && 'opacity-60 cursor-not-allowed',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className={cn(
        placement === 'overlay'
          ? 'px-3 py-2 border-t border-border flex items-center justify-end gap-1.5 bg-background'
          : 'px-4 py-3 border-t border-border flex items-center justify-end gap-2 bg-muted/20',
      )}>
        {onSkip && (
          <button
            type="button"
            disabled={disabled}
            onClick={onSkip}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-medium border border-border',
              'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
              disabled && 'opacity-60 cursor-not-allowed',
            )}
          >
            Saltar
          </button>
        )}
        <button
          type="button"
          disabled={!canContinue}
          onClick={doContinue}
          className={cn(
            'px-3 py-1 rounded-md text-[11px] font-semibold transition-colors',
            canContinue
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

