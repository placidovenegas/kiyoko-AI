'use client';

/**
 * Tabs — Wrapper sobre HeroUI v3 Tabs.
 * Mantiene la API: Tabs, TabsList, TabsTrigger, TabsContent.
 */

import * as React from 'react';
import { Tabs as HeroTabs } from '@heroui/react';
import { cn } from '@/lib/utils/cn';

interface TabsProps {
  className?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  variant?: string;
  color?: string;
  size?: string;
}

function Tabs({ className, defaultValue, value, onValueChange, children }: TabsProps) {
  return (
    <HeroTabs
      selectedKey={value}
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => onValueChange?.(String(key))}
      className={cn(className)}
    >
      {children}
    </HeroTabs>
  );
}

function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <HeroTabs.List className={cn(className)}>
      {children}
    </HeroTabs.List>
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
  return (
    <HeroTabs.Tab
      id={value}
      className={cn(className)}
      disabled={disabled}
    >
      {children}
    </HeroTabs.Tab>
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
  return (
    <HeroTabs.Panel id={value} className={cn(className)}>
      {children}
    </HeroTabs.Panel>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
