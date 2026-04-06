"use client";

import * as React from "react";
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
>(({ className, value = 0, max = 100, label, color = "primary", size = "md" }, ref) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const h = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2';

  const barColor: Record<string, string> = {
    default: 'bg-default-500',
    primary: 'bg-primary',
    secondary: 'bg-secondary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };

  return (
    <div ref={ref} className={cn('w-full', className)}>
      {label && <span className="text-xs text-muted-foreground mb-1 block">{label}</span>}
      <div className={cn('w-full overflow-hidden rounded-full bg-muted', h)}>
        <div
          className={cn('h-full rounded-full transition-all', barColor[color] ?? barColor.primary)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
Progress.displayName = "Progress";

export { Progress };
