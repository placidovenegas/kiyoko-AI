'use client';

import { forwardRef, createContext, useContext } from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { buttonVariants } from '@/components/ui/button';

/* ── Open state context ───────────────────────────────────── */

const OpenCtx = createContext(false);

/* ── Root (tracks open state for AnimatePresence) ─────────── */

function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: AlertDialogPrimitive.AlertDialogProps) {
  const isOpen = open ?? defaultOpen ?? false;

  return (
    <OpenCtx.Provider value={isOpen}>
      <AlertDialogPrimitive.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        {children}
      </AlertDialogPrimitive.Root>
    </OpenCtx.Provider>
  );
}

const AlertDialogTrigger  = AlertDialogPrimitive.Trigger;
const AlertDialogPortal   = AlertDialogPrimitive.Portal;

/* ── Overlay ──────────────────────────────────────────────── */

const AlertDialogOverlay = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=open]:duration-200 data-[state=closed]:duration-150',
      className
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

/* ── Content ──────────────────────────────────────────────── */

const AlertDialogContent = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
        'rounded-2xl bg-background p-6 shadow-2xl shadow-black/20 dark:shadow-black/50',
        'outline-none',
        /* entry */
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        'data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-[2%]',
        'data-[state=open]:duration-200',
        /* exit */
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        'data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-[2%]',
        'data-[state=closed]:duration-150',
        className
      )}
      {...props}
    >
      {children}
    </AlertDialogPrimitive.Content>
  </AlertDialogPortal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

/* ── Icon slot ────────────────────────────────────────────── */

function AlertDialogIcon({
  className,
  color = 'danger',
  children,
}: {
  className?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  const iconBg: Record<string, string> = {
    default:   'bg-default-100 text-default-600 dark:bg-default-800',
    primary:   'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900 dark:text-secondary-400',
    success:   'bg-success-100 text-success-600 dark:bg-success-900 dark:text-success-400',
    warning:   'bg-warning-100 text-warning-600 dark:bg-warning-900 dark:text-warning-400',
    danger:    'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400',
  };
  return (
    <div className={cn(
      'mx-auto mb-4 flex size-12 items-center justify-center rounded-full',
      iconBg[color],
      className,
    )}>
      {children}
    </div>
  );
}

/* ── Header ───────────────────────────────────────────────── */

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mb-4 flex flex-col gap-1.5 text-center', className)}
    {...props}
  />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

/* ── Footer ───────────────────────────────────────────────── */

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...props}
  />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

/* ── Title ────────────────────────────────────────────────── */

const AlertDialogTitle = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('text-base font-semibold text-foreground', className)}
    {...props}
  />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

/* ── Description ──────────────────────────────────────────── */

const AlertDialogDescription = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

/* ── Action ───────────────────────────────────────────────── */

const AlertDialogAction = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      buttonVariants({ variant: 'solid', color: 'danger', size: 'md', fullWidth: true }),
      'sm:w-auto',
      className,
    )}
    {...props}
  />
));
AlertDialogAction.displayName = 'AlertDialogAction';

/* ── Cancel ───────────────────────────────────────────────── */

const AlertDialogCancel = forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: 'flat', color: 'default', size: 'md', fullWidth: true }),
      'sm:w-auto',
      className,
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogIcon,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
