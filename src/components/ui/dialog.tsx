"use client";

/**
 * Dialog — Wrapper sobre HeroUI v3 Modal.
 * Mantiene la API shadcn: Dialog, DialogTrigger, DialogContent,
 * DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose.
 */

import * as React from "react";
import { Modal } from "@heroui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Modal isOpen={open} onOpenChange={onOpenChange}>
      {children}
    </Modal>
  );
}

function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  return <Modal.Trigger>{children}</Modal.Trigger>;
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function DialogOverlay({ className }: { className?: string }) {
  return null; // HeroUI Modal handles overlay internally
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { showCloseButton?: boolean }
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <Modal.Content ref={ref} className={cn(className)} {...props}>
    {showCloseButton && (
      <Modal.CloseButton className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Modal.CloseButton>
    )}
    {children}
  </Modal.Content>
));
DialogContent.displayName = "DialogContent";

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Modal.Header
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Modal.Footer
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

function DialogDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

function DialogClose({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  return <Modal.CloseButton {...props}>{children}</Modal.CloseButton>;
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
