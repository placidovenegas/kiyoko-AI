'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export interface ConfirmDialogAction {
  label: string;
  variant?: 'default' | 'danger' | 'ghost';
  onClick: () => void;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  actions: ConfirmDialogAction[];
  /** Renders inside parent modal (absolute). Default: fixed overlay */
  inline?: boolean;
}

const ACTION_STYLES: Record<NonNullable<ConfirmDialogAction['variant']>, string> = {
  default: 'bg-foreground text-background hover:opacity-90',
  danger:  'bg-red-500/90 text-white hover:bg-red-500',
  ghost:   'text-muted-foreground hover:text-foreground hover:bg-muted',
};

export function ConfirmDialog({ open, title, description, actions, inline = false }: ConfirmDialogProps) {
  const positionClass = inline ? 'absolute inset-0 z-20' : 'fixed inset-0 z-[70]';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(positionClass, 'flex items-center justify-center rounded-[inherit] bg-black/50')}
        >
          <motion.div
            key="confirm-box"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 520, damping: 34 } }}
            exit={{ opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.12 } }}
            className="mx-6 w-full max-w-65 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            {/* Text */}
            <div className="px-5 pt-5 pb-4 text-center">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              {description && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Actions — no divider */}
            <div className="flex flex-col gap-1.5 px-4 pb-4">
              {actions.map((action, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={action.onClick}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full rounded-md py-2 text-xs font-medium transition-colors',
                    ACTION_STYLES[action.variant ?? 'ghost'],
                  )}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
