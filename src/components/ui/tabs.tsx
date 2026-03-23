'use client';

import { createContext, useContext, useId, useState, forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

/* ── Types ────────────────────────────────────────────────── */

export type TabVariant = 'solid' | 'light' | 'underlined' | 'bordered';
export type TabColor   = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
export type TabSize    = 'sm' | 'md' | 'lg';

interface TabsCtxValue {
  activeValue: string;
  indicatorId: string;
  variant:     TabVariant;
  color:       TabColor;
  size:        TabSize;
}

const TabsCtx = createContext<TabsCtxValue>({
  activeValue: '',
  indicatorId: '',
  variant:     'solid',
  color:       'default',
  size:        'md',
});

/* ── Color maps ───────────────────────────────────────────── */

const PILL_BG: Record<TabColor, string> = {
  default:   'bg-background shadow-sm dark:bg-default-700',
  primary:   'bg-primary-500',
  secondary: 'bg-secondary-500',
  success:   'bg-success-500',
  warning:   'bg-warning-500',
  danger:    'bg-danger-500',
};

const LINE_BG: Record<TabColor, string> = {
  default:   'bg-default-700 dark:bg-default-300',
  primary:   'bg-primary-500',
  secondary: 'bg-secondary-500',
  success:   'bg-success-500',
  warning:   'bg-warning-500',
  danger:    'bg-danger-500',
};

const ACTIVE_TEXT: Record<TabColor, { onPill: string; offPill: string }> = {
  default:   { onPill: 'text-foreground',                         offPill: 'text-foreground' },
  primary:   { onPill: 'text-white',                             offPill: 'text-primary-500' },
  secondary: { onPill: 'text-white',                             offPill: 'text-secondary-500' },
  success:   { onPill: 'text-white',                             offPill: 'text-success-600 dark:text-success-400' },
  warning:   { onPill: 'text-white',                             offPill: 'text-warning-600 dark:text-warning-400' },
  danger:    { onPill: 'text-white',                             offPill: 'text-danger-500' },
};

/* ── List styles ──────────────────────────────────────────── */

const LIST_BASE: Record<TabVariant, string> = {
  solid:      'inline-flex items-center gap-1 rounded-xl bg-default-100 p-1 dark:bg-default-800/60',
  light:      'inline-flex items-center gap-1',
  underlined: 'inline-flex items-center gap-0 border-b border-border',
  bordered:   'inline-flex items-center gap-1 rounded-xl border border-border p-1',
};

const LIST_SIZE: Record<TabSize, string> = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
};

/* ── Trigger styles ───────────────────────────────────────── */

const TRIGGER_BASE =
  'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-none transition-colors select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring';

const TRIGGER_SIZE: Record<TabSize, string> = {
  sm: 'px-2.5 text-xs h-full',
  md: 'px-3.5 text-sm h-full',
  lg: 'px-4 text-base h-full',
};

const TRIGGER_RADIUS: Record<TabVariant, string> = {
  solid:      'rounded-lg',
  light:      'rounded-lg',
  underlined: 'rounded-none',
  bordered:   'rounded-lg',
};

/* ── Root ─────────────────────────────────────────────────── */

export interface TabsProps extends Omit<TabsPrimitive.TabsProps, 'color'> {
  variant?: TabVariant;
  color?:   TabColor;
  size?:    TabSize;
}

function Tabs({
  defaultValue,
  value:          valueProp,
  onValueChange,
  variant  = 'solid',
  color    = 'default',
  size     = 'md',
  className,
  children,
  ...props
}: TabsProps) {
  const indicatorId          = useId();
  const [local, setLocal]    = useState(valueProp ?? defaultValue ?? '');
  const activeValue          = valueProp !== undefined ? valueProp : local;

  function handleChange(v: string) {
    setLocal(v);
    onValueChange?.(v);
  }

  return (
    <TabsCtx.Provider value={{ activeValue, indicatorId, variant, color, size }}>
      <TabsPrimitive.Root
        defaultValue={defaultValue}
        value={valueProp}
        onValueChange={handleChange}
        className={cn('flex flex-col gap-3', className)}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsCtx.Provider>
  );
}

/* ── List ─────────────────────────────────────────────────── */

const TabsList = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const { variant, size } = useContext(TabsCtx);
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(LIST_BASE[variant], LIST_SIZE[size], className)}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

/* ── Trigger ──────────────────────────────────────────────── */

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode;
}

const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, value, icon, children, ...props }, ref) => {
  const { activeValue, indicatorId, variant, color, size } = useContext(TabsCtx);
  const isActive = value === activeValue;
  const hasPill  = variant === 'solid' || variant === 'bordered' || variant === 'light';
  const hasLine  = variant === 'underlined';
  const text     = ACTIVE_TEXT[color];

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        TRIGGER_BASE,
        TRIGGER_SIZE[size],
        TRIGGER_RADIUS[variant],
        /* inactive */
        'text-muted-foreground hover:text-foreground',
        /* active text */
        isActive && (hasPill && color !== 'default' ? text.onPill : text.offPill),
        /* underlined extra padding */
        variant === 'underlined' && 'pb-0.5',
        className
      )}
      {...props}
    >
      {/* Sliding pill / bordered indicator */}
      {isActive && hasPill && (
        <motion.span
          layoutId={indicatorId}
          className={cn('absolute inset-0', TRIGGER_RADIUS[variant], PILL_BG[color])}
          transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.5 }}
          style={{ zIndex: 0 }}
        />
      )}

      {/* Sliding underline indicator */}
      {isActive && hasLine && (
        <motion.span
          layoutId={`${indicatorId}-line`}
          className={cn('absolute bottom-0 left-0 right-0 h-0.5', LINE_BG[color])}
          transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.5 }}
          style={{ zIndex: 0 }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

/* ── Content ──────────────────────────────────────────────── */

const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'outline-none',
      'data-[state=inactive]:hidden',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
