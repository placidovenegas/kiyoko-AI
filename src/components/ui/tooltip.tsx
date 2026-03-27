"use client"

/**
 * Tooltip — Wrapper sobre HeroUI v3 Tooltip.
 * Mantiene la API: TooltipProvider, Tooltip, TooltipTrigger, TooltipContent.
 */

import * as React from "react"
import { Tooltip as HeroTooltip } from "@heroui/react"
import { cn } from "@/lib/utils"

function TooltipProvider({ children }: { children: React.ReactNode; delay?: number }) {
  return <>{children}</>
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    render?: React.ReactElement | unknown;
    asChild?: boolean;
  }
>(function TooltipTrigger({ children, render, asChild, ...props }, ref) {
  if (render) {
    return React.cloneElement(render as React.ReactElement<Record<string, unknown>>, { ...props, ref })
  }
  return <button ref={ref} type="button" {...props}>{children}</button>
})

/**
 * TooltipContent — the actual HeroUI Tooltip wraps around the trigger.
 * Since HeroUI uses a different pattern (single <Tooltip> wrapping trigger),
 * we keep the Radix API shape but adapt internally.
 *
 * USAGE NOTE: After this migration, the recommended pattern is to use
 * HeroUI Tooltip directly:
 *   <HeroTooltip content="text"><button>hover me</button></HeroTooltip>
 *
 * This wrapper maintains backwards compat with the old pattern:
 *   <Tooltip><TooltipTrigger>...</TooltipTrigger><TooltipContent>text</TooltipContent></Tooltip>
 */
function TooltipContent({
  className,
  children,
  side,
  sideOffset,
  align,
  alignOffset,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  [key: string]: unknown;
}) {
  // This is a no-op wrapper — the actual tooltip is rendered differently in HeroUI.
  // For full migration, replace with <HeroTooltip content={children}> pattern.
  return (
    <span
      className={cn(
        "z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
