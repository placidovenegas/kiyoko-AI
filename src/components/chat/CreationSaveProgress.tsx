'use client';

import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Pasos de guardado en el dock (prototipo V7 / plan mejoras UI).
 * - 0: validando
 * - 1: guardando (Supabase / storage)
 * - 2: fila final "nombre creado" con spinner
 * - 3: todo verificado (breve; el padre pasa a `saved`)
 */
export type CreationSaveStep = 0 | 1 | 2 | 3;

const ROWS: { key: string; label: string }[] = [
  { key: 'validate', label: 'Validando datos' },
  { key: 'persist', label: 'Guardando en el proyecto' },
];

export function CreationSaveProgress({
  step,
  entityName,
}: {
  step: CreationSaveStep;
  entityName: string;
}) {
  const finalLine = `"${entityName}" creado`;

  return (
    <div className="px-4 py-3 space-y-2.5 min-h-[100px]">
      {ROWS.map((row, i) => {
        const rowIdx = i as 0 | 1;
        const done = step > rowIdx;
        const active = step === rowIdx;

        return (
          <div
            key={row.key}
            className={cn(
              'flex items-center gap-2 transition-opacity duration-300',
              step < rowIdx && 'opacity-25',
            )}
          >
            {done ? (
              <span className="text-emerald-500 flex shrink-0">
                <Check size={14} strokeWidth={2.5} />
              </span>
            ) : active ? (
              <Loader2 size={14} className="animate-spin text-primary shrink-0" />
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <span
              className={cn(
                'text-[11px]',
                done && 'text-emerald-600 dark:text-emerald-400',
                active && 'text-foreground',
                !done && !active && 'text-muted-foreground/40',
              )}
            >
              {row.label}
            </span>
          </div>
        );
      })}

      <div
        className={cn(
          'flex items-center gap-2 pt-0.5 transition-opacity duration-300',
          step < 2 && 'opacity-30',
        )}
      >
        {step >= 3 ? (
          <span className="text-emerald-500 flex shrink-0">
            <Check size={14} strokeWidth={2.5} />
          </span>
        ) : step === 2 ? (
          <Loader2 size={14} className="animate-spin text-primary shrink-0" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span
          className={cn(
            'text-[11px]',
            step >= 3 && 'text-emerald-600 dark:text-emerald-400',
            step === 2 && 'text-foreground',
            step < 2 && 'text-muted-foreground/50',
          )}
        >
          {finalLine}
        </span>
      </div>
    </div>
  );
}
