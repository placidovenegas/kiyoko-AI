'use client';

import { Modal, useOverlayState } from '@heroui/react';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface WorkspaceSettingsNavGroup {
  group: string;
  items: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
  }>;
}

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  activeSection: string;
  title: string;
  nav: WorkspaceSettingsNavGroup[];
  onClose: () => void;
  onSelectSection: (section: string) => void;
  children: React.ReactNode;
}

export function WorkspaceSettingsModal({
  isOpen,
  activeSection,
  title,
  nav,
  onClose,
  onSelectSection,
  children,
}: WorkspaceSettingsModalProps) {
  const modalState = useOverlayState({
    isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  return (
    <Modal state={modalState}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="center">
          <Modal.Dialog className="p-0! bg-transparent! shadow-none! max-w-none! w-auto!">
            <div className="flex h-[85vh] w-[80vw] max-w-5xl flex-row overflow-hidden rounded-xl border border-border bg-background shadow-xl">
              <aside className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
                <div className="px-4 pt-5 pb-2">
                  <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{title}</p>
                </div>

                <nav className="flex-1 px-2 pb-4">
                  {nav.map((group) => (
                    <div key={group.group} className="mb-2.5">
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{group.group}</p>
                      {group.items.map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onSelectSection(id)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-colors',
                            activeSection === id
                              ? 'bg-accent font-medium text-foreground'
                              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                  ))}
                </nav>
              </aside>

              <main className="flex-1 overflow-y-auto bg-background">
                <div className="mx-auto max-w-2xl px-8 py-8">{children}</div>
              </main>

              <Modal.CloseTrigger className="absolute top-3 right-3 z-10 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Modal.CloseTrigger>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
