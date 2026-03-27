'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Check, Plus, Settings, UserPlus, LogOut, ChevronsLeft, MoreHorizontal, Monitor,
} from 'lucide-react';
import { useSidebar, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { KiyokoIcon } from '@/components/ui/logo';
import { useOrganizations, ORG_TYPE_LABELS } from '@/hooks/useOrganizations';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';

const ORG_TYPE_COLORS: Record<string, string> = {
  personal:  'bg-primary/15 text-primary',
  freelance: 'bg-blue-500/15 text-blue-500',
  team:      'bg-purple-500/15 text-purple-500',
  agency:    'bg-orange-500/15 text-orange-500',
};

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function OrgBadge({ name, orgType, size = 'md' }: { name: string; orgType?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const colors = ORG_TYPE_COLORS[orgType ?? 'team'] ?? ORG_TYPE_COLORS.team;
  const cls = size === 'lg' ? 'h-9 w-9 rounded-md text-xs'
    : size === 'sm' ? 'h-6 w-6 rounded text-[9px]'
    : 'h-7 w-7 rounded text-[10px]';
  return (
    <span className={cn('flex shrink-0 items-center justify-center font-bold', cls, colors)}>
      {initials(name)}
    </span>
  );
}

export function SidebarHeaderSection() {
  const { state, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { user, signOut } = useAuth();
  const { organizations, currentOrg, currentOrgId, switchOrg } = useOrganizations();
  const { openWorkspaceModal, openSettingsModal } = useUIStore();

  const isExpanded = state === 'expanded';
  const userEmail = user?.email ?? '';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <div
            className="group/header relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer',
                  'hover:bg-sidebar-accent',
                  open && 'bg-sidebar-accent',
                  !isExpanded && 'justify-center px-0',
                )}
              >
                {/* Logo por defecto, OrgBadge en hover */}
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                  <KiyokoIcon size={18} className="text-foreground transition-opacity group-hover/header:opacity-0" />
                  {currentOrg && (
                    <span className="absolute inset-0 opacity-0 transition-opacity group-hover/header:opacity-100">
                      <OrgBadge name={currentOrg.name} orgType={currentOrg.org_type} />
                    </span>
                  )}
                </span>
                {isExpanded && currentOrg && (
                  <div className="min-w-0 flex-1 transition-[padding] duration-200 ease-out group-hover/header:pr-8 pr-1">
                    <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
                      {currentOrg.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground leading-tight">
                      {ORG_TYPE_LABELS[currentOrg.org_type ?? 'team']}
                    </p>
                  </div>
                )}
              </button>
            </PopoverTrigger>

            {isExpanded && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                className={cn(
                  'absolute right-1 top-1/2 z-10 flex items-center justify-center size-7 -translate-y-1/2 rounded-md text-muted-foreground transition-opacity cursor-pointer',
                  'hover:bg-sidebar-accent hover:text-foreground',
                  hovered && !open ? 'opacity-100' : 'opacity-0',
                )}
                title="Colapsar menú"
              >
                <ChevronsLeft size={16} />
              </button>
            )}
          </div>

          {/* ── Popover estilo Notion ──────────────────────────────── */}
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={4}
            className="w-80 p-0 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
          >
            {/* Email + dots */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              <button
                type="button"
                className="flex items-center justify-center size-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Org activa */}
            {currentOrg && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-3 px-1 py-2">
                  <OrgBadge name={currentOrg.name} orgType={currentOrg.org_type} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{currentOrg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Plan Gratis · {ORG_TYPE_LABELS[currentOrg.org_type ?? 'team']}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); openSettingsModal('perfil'); }}
                    className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    Ajustes
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); openSettingsModal('org-miembros'); }}
                    className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    Invitar
                  </button>
                </div>
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Lista de organizaciones */}
            <div className="py-1 px-1.5">
              {organizations.map((org) => {
                const isActive = org.id === currentOrgId;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => { switchOrg(org.id); router.push('/dashboard'); setOpen(false); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer',
                      'hover:bg-accent',
                      isActive && 'bg-accent/60',
                    )}
                  >
                    <OrgBadge name={org.name} orgType={org.org_type} size="sm" />
                    <p className={cn('flex-1 min-w-0 truncate text-[13px]', isActive && 'font-semibold')}>
                      {org.name}
                    </p>
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => { openWorkspaceModal(); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer mt-0.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-[13px]">Añadir organización</span>
              </button>
            </div>

            <div className="h-px bg-border" />

            {/* Actions */}
            <div className="py-1 px-1.5">
              <button
                type="button"
                onClick={() => { setOpen(false); window.open('https://kiyoko.ai/download', '_blank'); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[13px]">Obtener app de escritorio</span>
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); signOut(); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[13px]">Cerrar sesión</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
