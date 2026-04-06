"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Avatar = React.forwardRef<
  HTMLSpanElement,
  {
    className?: string;
    children?: React.ReactNode;
    src?: string;
    alt?: string;
    name?: string;
  }
>(({ className, children, src, alt, name }, ref) => {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <span
      ref={ref}
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full bg-muted',
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt ?? name ?? ''} className="aspect-square size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
          {children ?? initials}
        </span>
      )}
    </span>
  );
});
Avatar.displayName = "Avatar";

function AvatarImage({ src, alt }: { src?: string; alt?: string; className?: string }) {
  return null;
}

function AvatarFallback({ children, className }: { children?: React.ReactNode; className?: string; delayMs?: number }) {
  return null;
}

export { Avatar, AvatarImage, AvatarFallback };
