"use client"

/**
 * DropdownMenu — Reimplementation using native HTML + Radix-free.
 * Provides the same shadcn API (DropdownMenu, Trigger, Content, Item, Separator, Label)
 * but built with React state + portal instead of Radix UI.
 */

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

// ── Context ──────────────────────────────────────────────
interface DropdownCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  setTriggerNode: (node: HTMLButtonElement | null) => void;
  setContentNode: (node: HTMLDivElement | null) => void;
}
const Ctx = React.createContext<DropdownCtx>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  contentRef: { current: null },
  setTriggerNode: () => {},
  setContentNode: () => {},
});

// ── Root ─────────────────────────────────────────────────
function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const setTriggerNode = React.useCallback((node: HTMLButtonElement | null) => {
    triggerRef.current = node;
  }, []);
  const setContentNode = React.useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
  }, []);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return <Ctx.Provider value={{ open, setOpen, triggerRef, contentRef, setTriggerNode, setContentNode }}>{children}</Ctx.Provider>;
}

// ── Trigger ──────────────────────────────────────────────
const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, onClick, ...props }, ref) => {
  const { open, setOpen, setTriggerNode } = React.useContext(Ctx);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTriggerNode(e.currentTarget);
    setOpen(!open);
    onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: handleClick,
    });
  }

  return (
    <button
      type="button"
      ref={(node) => {
        setTriggerNode(node);
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

// ── Content ──────────────────────────────────────────────
const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end"; side?: "top" | "bottom" | "left" | "right"; sideOffset?: number }
>(({ className, children, align = "end", sideOffset = 4, ...props }, ref) => {
  const { open, setOpen, triggerRef, setContentNode } = React.useContext(Ctx);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const top = rect.bottom + sideOffset;
    let left = rect.left;
    if (align === "end") left = rect.right;
    if (align === "center") left = rect.left + rect.width / 2;
    setPos({ top, left });
  }, [open, align, sideOffset, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={(node) => {
        setContentNode(node);
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        "fixed z-50 min-w-[8rem] overflow-visible rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        top: pos.top,
        left: align === "end" ? undefined : pos.left,
        right: align === "end" ? `calc(100vw - ${pos.left}px)` : undefined,
      }}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

// ── Item ─────────────────────────────────────────────────
const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean; disabled?: boolean; asChild?: boolean }
>(({ className, inset, disabled, asChild, onClick, children, ...props }, ref) => {
  const cls = cn(
    "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
    disabled && "pointer-events-none opacity-50",
    inset && "pl-8",
    className
  );

  // asChild: render child directly with merged className
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      className: cn(cls, (children as React.ReactElement<{ className?: string }>).props.className),
    });
  }

  return (
    <div
      ref={ref}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={cls}
      onClick={(e) => { if (!disabled) onClick?.(e); }}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

// ── Separator ────────────────────────────────────────────
function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />;
}

// ── Label ────────────────────────────────────────────────
const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// ── Shortcut ─────────────────────────────────────────────
function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
}

// ── Stubs (for compat, not commonly used) ────────────────
function DropdownMenuGroup({ children }: { children: React.ReactNode }) {
  return <div role="group">{children}</div>;
}

// ── Sub menu stubs ───────────────────────────────────────
function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <div className="relative group/sub">{children}</div>;
}

function DropdownMenuSubTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuSubContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "invisible opacity-0 group-hover/sub:visible group-hover/sub:opacity-100",
        "absolute left-full top-0 ml-1 z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md transition-opacity",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Portal stub ──────────────────────────────────────────
function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
}
