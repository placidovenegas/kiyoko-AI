"use client";

/**
 * Avatar — Wrapper sobre HeroUI v3 Avatar.
 * Mantiene la API: Avatar, AvatarImage, AvatarFallback.
 */

import * as React from "react";
import { Avatar as HeroAvatar } from "@heroui/react";
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
>(({ className, children, src, alt, name, ...props }, ref) => (
  <HeroAvatar
    ref={ref}
    src={src}
    alt={alt}
    name={name}
    className={cn(className)}
    {...props}
  />
));
Avatar.displayName = "Avatar";

// Compat shims — HeroUI handles image/fallback internally via src/name props
function AvatarImage({ src, alt }: { src?: string; alt?: string; className?: string }) {
  return null;
}

function AvatarFallback({ children, className }: { children?: React.ReactNode; className?: string; delayMs?: number }) {
  return null;
}

export { Avatar, AvatarImage, AvatarFallback };
