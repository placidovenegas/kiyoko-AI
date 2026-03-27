"use client";

/**
 * Popover — Wrapper sobre HeroUI v3 Popover.
 * Mantiene la API: Popover (root), PopoverTrigger, PopoverContent.
 * Los archivos que importan no necesitan cambiar.
 */

import * as React from "react";
import { Popover as HeroPopover } from "@heroui/react";
import { cn } from "@/lib/utils/cn";

/* Re-export compound components with same names */

function Popover({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <HeroPopover
      isOpen={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </HeroPopover>
  );
}

function PopoverTrigger({
  asChild,
  children,
  ...props
}: {
  asChild?: boolean;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <HeroPopover.Trigger>
      {children}
    </HeroPopover.Trigger>
  );
}

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    sideOffset?: number;
  }
>(({ className, children, side, align, sideOffset, ...props }, ref) => (
  <HeroPopover.Content
    ref={ref}
    className={cn(
      "z-50 rounded-md border border-border bg-popover text-foreground shadow-md outline-none",
      className
    )}
    {...props}
  >
    {children}
  </HeroPopover.Content>
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
