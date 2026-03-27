"use client";

/**
 * Sheet — stub mínimo para sidebar.tsx.
 * TODO: migrar sidebar.tsx a HeroUI Drawer y eliminar este archivo.
 */

import * as React from "react";
import { Modal, ModalDialog } from "@heroui/react";
import { cn } from "@/lib/utils/cn";

function Sheet({
  open,
  onOpenChange,
  children,
  ...props
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <Modal isOpen={open} onOpenChange={onOpenChange} placement="center" {...props}>
      {children}
    </Modal>
  );
}

function SheetTrigger({ children, ...props }: { children: React.ReactNode; asChild?: boolean; [key: string]: unknown }) {
  return <Modal.Trigger {...props}>{children}</Modal.Trigger>;
}

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" | "top" | "bottom" }
>(({ className, children, side = "right", ...props }, ref) => (
  <ModalDialog ref={ref} className={cn("fixed inset-y-0 z-50 flex flex-col bg-sidebar", side === "left" ? "left-0" : "right-0", className)} {...props}>
    {children}
  </ModalDialog>
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
