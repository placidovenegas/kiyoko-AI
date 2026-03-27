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
    <HeroTextarea
      ref={ref}
      label={label}
      description={description}
      errorMessage={errorMessage}
      className={cn("w-full", className)}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
