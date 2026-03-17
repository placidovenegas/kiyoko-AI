'use client';

import { useState, useEffect } from 'react';
import { IconMenu2, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils/cn';
import { SidebarNav } from './SidebarNav';
import { SidebarProjectNav } from './SidebarProjectNav';

interface MobileNavProps {
  activeProjectId?: string;
  activeProjectName?: string;
  isAdmin?: boolean;
}

export function MobileNav({
  activeProjectId,
  activeProjectName,
  isAdmin = false,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center size-10 rounded-md text-foreground-secondary hover:text-foreground hover:bg-surface-tertiary transition-colors"
        aria-label="Abrir menú"
      >
        <IconMenu2 className="size-6" />
      </button>

      {/* Backdrop + Sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Sheet */}
          <div
            className={cn(
              'relative z-10 flex flex-col w-[280px] h-full bg-surface-secondary',
              'animate-[slideInLeft_200ms_ease-out]',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-foreground/10">
              <span className="text-lg font-bold tracking-tight text-foreground">
                KIYOKO AI
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center size-8 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-tertiary transition-colors"
                aria-label="Cerrar menú"
              >
                <IconX className="size-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-4" onClick={() => setOpen(false)}>
              <SidebarNav isAdmin={isAdmin} />

              {activeProjectId && (
                <>
                  <div className="mx-4 my-3 border-t border-foreground/10" />
                  <SidebarProjectNav
                    projectId={activeProjectId}
                    projectName={activeProjectName}
                  />
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
