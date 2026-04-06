'use client';

/**
 * Toast — thin wrapper around sonner with Kiyoko design system styling.
 * Import `toast` from here instead of 'sonner' to get consistent icons/styles.
 * The <KiyokoToaster /> replaces <Toaster /> in layout.tsx.
 */

import { Toaster } from 'sonner';
import { toast as sonnerToast } from 'sonner';
import {
  CheckCircle2, XCircle, AlertTriangle, Info, Loader2, Sparkles, Upload,
} from 'lucide-react';

/* ── Styled Toaster ───────────────────────────────────────── */

export function KiyokoToaster() {
  return (
    <Toaster
      position="bottom-center"
      expand={false}
      richColors={false}
      gap={8}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: [
            'group flex items-start gap-3 rounded-2xl border border-border',
            'bg-card/95 backdrop-blur-xl',
            'px-4 py-3.5 text-sm text-foreground',
            'shadow-xl shadow-black/15 dark:shadow-black/40',
            'min-w-80 max-w-md',
          ].join(' '),
          title:       'font-medium text-foreground leading-snug',
          description: 'text-xs text-muted-foreground mt-0.5 leading-relaxed',
          actionButton:'rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors',
          cancelButton:'rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors',
          closeButton: 'opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 text-muted-foreground hover:text-foreground',
          error:       'border-danger-200/60 dark:border-danger-800/60',
          success:     'border-success-200/60 dark:border-success-800/60',
          warning:     'border-warning-200/60 dark:border-warning-800/60',
          info:        'border-primary-200/60 dark:border-primary-800/60',
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

  ai: (message: string, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.loading(message, {
      icon: icon(<Sparkles className="size-4 shrink-0 animate-pulse text-primary" />),
      className: 'border-primary/30 bg-primary/5',
      ...opts,
    }),

  upload: (message: string, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.loading(message, {
      icon: icon(<Upload className="size-4 shrink-0 animate-spin text-primary" />),
      ...opts,
    }),

  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom:  sonnerToast,
};
