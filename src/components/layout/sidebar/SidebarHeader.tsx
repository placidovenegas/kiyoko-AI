'use client';

import { useState } from 'react';
import {
  Settings, LogOut, ChevronsLeft, MoreHorizontal, Monitor,
} from 'lucide-react';
import { Popover } from '@heroui/react';
import { useSidebar, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { KiyokoIcon } from '@/components/ui/logo';
import { useDashboard } from '@/providers/DashboardBootstrap';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
}

function PersonalBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-9 w-9 rounded-md text-xs'
    : size === 'sm' ? 'h-6 w-6 rounded text-[9px]'
    : 'h-7 w-7 rounded text-[10px]';

  return (
    <span className={cn('flex shrink-0 items-center justify-center bg-primary/15 font-bold text-primary', cls)}>
      {initials(name)}
    </span>
  );
}

export function SidebarHeaderSection() {
  const { state, toggleSidebar } = useSidebar();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { user } = useDashboard();
  const { openSettingsModal } = useUIStore();
  const supabase = createClient();
  const t = useTranslations();

  const isExpanded = state === 'expanded';
  const userEmail = user.email;
  const displayName = user.full_name ?? user.email;

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover isOpen={open} onOpenChange={setOpen}>
          <div
            className="group/header relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Popover.Trigger>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer',
                  'hover:bg-sidebar-accent',
                  open && 'bg-sidebar-accent',
                  !isExpanded && 'justify-center px-0',
                )}
              >
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                  <KiyokoIcon size={18} className="text-foreground transition-opacity group-hover/header:opacity-0" />
                  <span className="absolute inset-0 opacity-0 transition-opacity group-hover/header:opacity-100">
                    <PersonalBadge name={displayName} />
                  </span>
                </span>
                {isExpanded ? (
                  <div className="min-w-0 flex-1 transition-[padding] duration-200 ease-out group-hover/header:pr-8 pr-1">
                    <p className="truncate text-[13px] font-semibold leading-tight text-foreground">Kiyoko AI</p>
                    <p className="truncate text-[11px] text-muted-foreground leading-tight">Workspace personal</p>
                  </div>
                ) : null}
              </button>
            </Popover.Trigger>

            {isExpanded ? (
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); toggleSidebar(); }}
                className={cn(
                  'absolute right-1 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-opacity cursor-pointer',
                  'hover:bg-sidebar-accent hover:text-foreground',
                  hovered && !open ? 'opacity-100' : 'opacity-0',
                )}
                title="Colapsar menú"
              >
                <ChevronsLeft size={16} />
              </button>
            ) : null}
          </div>

          <Popover.Content className="w-80 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-xl">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors cursor-pointer hover:bg-accent hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="px-3 pb-3">
              <div className="flex items-center gap-3 px-1 py-2">
                <PersonalBadge name={displayName} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">Workspace personal</p>
                  <p className="text-xs text-muted-foreground">Todo el contenido se asocia a tu cuenta</p>
                </div>
              </div>

              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); openSettingsModal('perfil'); }}
                  className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-medium text-foreground transition-colors cursor-pointer hover:bg-accent"
                >
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('settings.title')}
                </button>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="py-1 px-1.5">
              <button
                type="button"
                onClick={() => { setOpen(false); window.open('https://kiyoko.ai/download', '_blank'); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-foreground transition-colors cursor-pointer hover:bg-accent"
              >
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[13px]">{t('common.download')}</span>
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); signOut(); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-foreground transition-colors cursor-pointer hover:bg-accent"
              >
                <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[13px]">{t('auth.logout')}</span>
              </button>
            </div>
          </Popover.Content>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
