"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => onOpenChange?.(false)} />
      {children}
    </>
  );
}

function SheetTrigger({ children, ...props }: { children: React.ReactNode; asChild?: boolean; [key: string]: unknown }) {
  return <>{children}</>;
}

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" | "top" | "bottom" }
>(({ className, children, side = "right", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-y-0 z-50 flex flex-col bg-sidebar border-border shadow-xl",
      side === "left" ? "left-0 border-r w-72" : "right-0 border-l w-72",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SheetContent.displayName = "SheetContent";

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function SheetClose({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props}>{children}</button>;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose };
