'use client';

import { useState } from 'react';
import { ChevronDown, ChevronsLeft, LogOut, Settings } from 'lucide-react';
import { Popover, Separator } from '@heroui/react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';

type SidebarLevel = 'dashboard' | 'project' | 'video';

interface WorkspaceSwitcherProps {
  isExpanded: boolean;
  level: SidebarLevel;
  onToggleSidebar: () => void;
}

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
}

function PersonalBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-9 w-9 rounded-lg text-xs'
    : size === 'sm' ? 'h-6 w-6 rounded text-[9px]'
    : 'h-7 w-7 rounded-md text-[10px]';

  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-md bg-primary/15 font-bold text-primary', sizeClass)}>
      {initials(name)}
    </span>
  );
}

export function WorkspaceSwitcher({ isExpanded, onToggleSidebar }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { user, signOut } = useAuth();
  const { openSettingsModal } = useUIStore();

  const userEmail = user?.email ?? '';
  const displayName = user?.full_name ?? userEmail;

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Popover.Trigger>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
              'hover:bg-sidebar-accent',
              open && 'bg-sidebar-accent',
              !isExpanded && 'justify-center px-0',
            )}
          >
            <PersonalBadge name={displayName} />

            {isExpanded ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
                    Kiyoko AI
                  </p>
                </div>
                <ChevronDown className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
              </>
            ) : null}
          </button>
        </Popover.Trigger>

        {isExpanded ? (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onToggleSidebar(); }}
            className={cn(
              'absolute right-0.5 top-1/2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-opacity',
              'hover:bg-sidebar-accent hover:text-foreground',
              hovered && !open ? 'opacity-100' : 'opacity-0',
            )}
            aria-label="Colapsar menú"
          >
            <ChevronsLeft size={12} />
          </button>
        ) : null}
      </div>

      <Popover.Content className="w-72 overflow-hidden rounded-lg border border-border bg-popover p-0 shadow-lg">
        <div className="p-2">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <PersonalBadge name={displayName} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">Workspace personal</p>
              <p className="truncate text-[11px] text-muted-foreground">Todo el contenido se asocia a tu cuenta</p>
            </div>
          </div>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => { setOpen(false); openSettingsModal('perfil'); }}
              className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Settings className="h-3 w-3 text-muted-foreground" />
              Ajustes
            </button>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="p-1">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/15 text-[8px] font-bold text-primary">
              {initials(user?.full_name)}
            </span>
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); signOut(); }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[13px]">Cerrar sesión</span>
          </button>
        </div>
      </Popover.Content>
    </Popover>
  );
}
