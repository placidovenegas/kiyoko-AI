"use client";

/**
 * Switch — Wrapper sobre HeroUI v3 Switch.
 * Mantiene la API: checked, onCheckedChange, disabled.
 */

import * as React from "react";
import { Switch as HeroSwitch } from "@heroui/react";
import { cn } from "@/lib/utils/cn";

const Switch = React.forwardRef<
  HTMLInputElement,
  {
    className?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    name?: string;
    id?: string;
    'aria-label'?: string;
  }
>(({ className, checked, defaultChecked, onCheckedChange, disabled, ...props }, ref) => (
  <HeroSwitch
    ref={ref}
    isSelected={checked}
    defaultSelected={defaultChecked}
    onValueChange={onCheckedChange}
    disabled={disabled}
    className={cn(className)}
    {...props}
  />
));
Switch.displayName = "Switch";

export { Switch };
