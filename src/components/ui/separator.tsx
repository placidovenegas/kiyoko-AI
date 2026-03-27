"use client"

/**
 * Separator — Wrapper sobre HeroUI v3 Divider.
 * Mantiene la API: <Separator orientation="horizontal|vertical" />.
 */

import { Separator as HeroSeparator } from "@heroui/react"
import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
  [key: string]: unknown;
}) {
  return (
    <HeroSeparator
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
