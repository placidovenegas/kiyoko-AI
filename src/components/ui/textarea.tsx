"use client";

/**
 * Textarea — Wrapper sobre HeroUI v3 Textarea.
 * Mantiene la misma API (className, placeholder, rows, etc.).
 */

import * as React from "react";
import { TextArea as HeroTextarea } from "@heroui/react";
import { cn } from "@/lib/utils/cn";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    description?: string;
    errorMessage?: string;
  }
>(({ className, label, description, errorMessage, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <HeroTextarea
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      />
      {description && !errorMessage && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      )}
    </div>
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
