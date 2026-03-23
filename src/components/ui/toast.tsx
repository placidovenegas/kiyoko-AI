'use client';

/**
 * Toast — thin wrapper around sonner with Kiyoko design system styling.
 * Import `toast` from here instead of 'sonner' to get consistent icons/styles.
 * The <KiyokoToaster /> replaces <Toaster /> in layout.tsx.
 */

import { Toaster } from 'sonner';
import { toast as sonnerToast } from 'sonner';
import {
  CheckCircle2, XCircle, AlertTriangle, Info, Loader2,
} from 'lucide-react';

/* ── Styled Toaster ───────────────────────────────────────── */

export function KiyokoToaster() {
  return (
    <Toaster
      position="bottom-right"
      expand={false}
      richColors={false}
      gap={8}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: [
            'flex items-start gap-3 rounded-xl border border-border',
            'bg-background px-4 py-3 text-sm text-foreground shadow-lg shadow-black/10',
            'dark:shadow-black/30',
          ].join(' '),
          title:       'font-medium text-foreground leading-snug',
          description: 'text-xs text-muted-foreground mt-0.5',
          actionButton:'rounded-lg bg-primary-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-600 transition-colors',
          cancelButton:'rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors',
          closeButton: 'absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors',
          error:   'border-danger-200  dark:border-danger-800',
          success: 'border-success-200 dark:border-success-800',
          warning: 'border-warning-200 dark:border-warning-800',
          info:    'border-primary-200 dark:border-primary-800',
        },
      }}
    />
  );
}

/* ── Icon helpers ─────────────────────────────────────────── */

function icon(node: React.ReactNode) { return node; }

/* ── Toast API ────────────────────────────────────────────── */

export const toast = {
  success: (message: string, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.success(message, {
      icon: icon(<CheckCircle2 className="size-4 shrink-0 text-success-500" />),
      ...opts,
    }),

  error: (message: string, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.error(message, {
      icon: icon(<XCircle className="size-4 shrink-0 text-danger-500" />),
      ...opts,
    }),

  warning: (message: string, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.warning(message, {
      icon: icon(<AlertTriangle className="size-4 shrink-0 text-warning-500" />),
      ...opts,
    }),

  info: (message: string, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.info(message, {
      icon: icon(<Info className="size-4 shrink-0 text-primary-500" />),
      ...opts,
    }),

  loading: (message: string, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.loading(message, {
      icon: icon(<Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />),
      ...opts,
    }),

  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom:  sonnerToast,
};
