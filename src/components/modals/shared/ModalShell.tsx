'use client';

import { Drawer, useOverlayState } from '@heroui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  dialogClassName?: string;
}

export function ModalShell({ open, onOpenChange, title, description, children, footer, dialogClassName }: ModalShellProps) {
  const state = useOverlayState({ isOpen: open, onOpenChange });

  return (
    <Drawer state={state}>
      <Drawer.Backdrop isDismissable>
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn('kiyoko-panel-dialog flex h-dvh w-full max-w-none flex-col overflow-hidden border-l border-border sm:max-w-180', dialogClassName)}>
            <Drawer.Header className="kiyoko-panel-header relative px-6 py-4">
              <div className="max-w-xl pr-12">
                <Drawer.Heading className="text-xl font-semibold tracking-tight text-foreground">{title}</Drawer.Heading>
                {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
              </div>
              <Drawer.CloseTrigger className="absolute right-4 top-4 inline-flex size-9 items-center justify-center border border-border bg-background/90 text-muted-foreground transition hover:bg-accent hover:text-foreground">
                <X className="size-4" />
                <span className="sr-only">Cerrar</span>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body className="kiyoko-panel-body min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {children}
            </Drawer.Body>
            {footer && (
              <Drawer.Footer className="kiyoko-panel-footer px-6 py-4">
                {footer}
              </Drawer.Footer>
            )}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
