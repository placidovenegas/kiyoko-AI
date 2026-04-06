'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({ value: '', onValueChange: () => {} });

function Tabs({
  className,
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  children,
}: {
  className?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  variant?: string;
  color?: string;
  size?: string;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = controlledValue ?? internalValue;

  const handleChange = React.useCallback((v: string) => {
    setInternalValue(v);
    onValueChange?.(v);
  }, [onValueChange]);

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="tablist" className={cn('inline-flex items-center gap-1 border-b border-border', className)}>
      {children}
    </div>
  );
}

function TabsTrigger({
  className,
  value,
  children,
  disabled,
}: {
  className?: string;
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
        isActive
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

function TabsContent({
  className,
  value,
  children,
}: {
  className?: string;
  value: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div role="tabpanel" className={cn('mt-2', className)}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
