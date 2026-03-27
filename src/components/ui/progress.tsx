"use client";

/**
 * Progress — Wrapper sobre HeroUI v3 Progress.
 */

import * as React from "react";
import { ProgressBar as HeroProgress } from "@heroui/react";
import { cn } from "@/lib/utils/cn";

const Progress = React.forwardRef<
  HTMLDivElement,
  {
    className?: string;
    value?: number;
    max?: number;
    label?: string;
    color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
    size?: "sm" | "md" | "lg";
  }
>(({ className, value = 0, max = 100, label, color = "primary", size = "md", ...props }, ref) => (
  <HeroProgress
    ref={ref}
    value={value}
    maxValue={max}
    label={label}
    color={color}
    size={size}
    className={cn(className)}
    {...props}
  />
));
Progress.displayName = "Progress";

export { Progress };
