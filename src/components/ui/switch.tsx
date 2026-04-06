"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface SwitchProps {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  'aria-label'?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, disabled, id, name, ...props }, ref) => {
    const [isOn, setIsOn] = React.useState(defaultChecked ?? false);
    const active = checked ?? isOn;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={props['aria-label']}
        id={id}
        disabled={disabled}
        onClick={() => {
          const next = !active;
          setIsOn(next);
          onCheckedChange?.(next);
        }}
        className={cn(
          'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          active ? 'bg-primary' : 'bg-muted',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <span
          className={cn(
            'pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform',
            active ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
